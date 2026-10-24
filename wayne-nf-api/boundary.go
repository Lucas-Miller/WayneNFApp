// boundary.go
//
// GET /forest-boundary: a mirror of the Wayne NF boundary from Ohio DNR's ArcGIS
// service. We refresh it daily and keep the last good copy in Postgres, so clients
// keep working if ODNR is down, slow, renamed, or returns broken data.
// The ODNR query must match ODNR_BOUNDARY_PARAMS in shared/forestBoundary.ts.

package main

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const (
	odnrBoundaryURL  = "https://gis.ohiodnr.gov/arcgis/rest/services/DOW_Services/HuntingRegulations_AGOL_3/MapServer/18/query"
	boundaryMaxAge   = 24 * time.Hour
	boundaryCheckGap = time.Hour
)

type boundaryFeature struct {
	Attributes map[string]interface{} `json:"attributes"`
	Geometry   struct {
		Rings [][][]float64 `json:"rings"`
	} `json:"geometry"`
}

type boundaryCache struct {
	mu        sync.RWMutex
	body      []byte // JSON response
	gzipped   []byte
	etag      string
	fetchedAt time.Time
	features  int
}

var boundary boundaryCache

func (c *boundaryCache) set(body []byte, fetchedAt time.Time, features int) {
	var gz bytes.Buffer
	zw := gzip.NewWriter(&gz)
	zw.Write(body)
	zw.Close()

	c.mu.Lock()
	defer c.mu.Unlock()
	c.body = body
	c.gzipped = gz.Bytes()
	c.etag = fmt.Sprintf(`"%x"`, sha256.Sum256(body))
	c.fetchedAt = fetchedAt
	c.features = features
}

// initBoundary loads the stored copy and starts the background refresher
func initBoundary() {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS forest_boundary (
		id         INT PRIMARY KEY,
		data       TEXT NOT NULL,
		fetched_at TIMESTAMPTZ NOT NULL
	)`)
	if err != nil {
		log.Printf("forest boundary: create table: %v", err)
	}

	var data string
	var fetchedAt time.Time
	err = db.QueryRow(`SELECT data, fetched_at FROM forest_boundary WHERE id = 1`).Scan(&data, &fetchedAt)
	if err == nil {
		var parsed struct {
			Features []boundaryFeature `json:"features"`
		}
		if json.Unmarshal([]byte(data), &parsed) == nil {
			boundary.set([]byte(data), fetchedAt, len(parsed.Features))
			log.Printf("forest boundary: loaded stored copy from %s", fetchedAt.Format(time.RFC3339))
		}
	}

	go func() {
		for {
			boundary.mu.RLock()
			stale := time.Since(boundary.fetchedAt) > boundaryMaxAge
			boundary.mu.RUnlock()
			if stale {
				if err := refreshBoundary(); err != nil {
					// Keep serving the old copy; try again next tick
					log.Printf("forest boundary: refresh failed, keeping previous copy: %v", err)
				}
			}
			time.Sleep(boundaryCheckGap)
		}
	}()
}

func refreshBoundary() error {
	features, err := fetchODNRBoundary()
	if err != nil {
		return err
	}

	boundary.mu.RLock()
	previous := boundary.features
	boundary.mu.RUnlock()
	// A big drop usually means the query matched less than it should (renamed lands, etc.)
	if previous > 0 && len(features) < previous/2 {
		return fmt.Errorf("feature count dropped from %d to %d", previous, len(features))
	}

	now := time.Now().UTC()
	body, err := json.Marshal(map[string]interface{}{
		"fetched_at": now.Format(time.RFC3339),
		"source":     "Ohio DNR ODNR_LANDS",
		"features":   features,
	})
	if err != nil {
		return err
	}
	_, err = db.Exec(`INSERT INTO forest_boundary (id, data, fetched_at) VALUES (1, $1, $2)
		ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, fetched_at = EXCLUDED.fetched_at`,
		string(body), now)
	if err != nil {
		log.Printf("forest boundary: store failed (serving from memory): %v", err)
	}
	boundary.set(body, now, len(features))
	log.Printf("forest boundary: refreshed, %d features", len(features))
	return nil
}

// fetchODNRBoundary downloads and validates the boundary from ODNR
func fetchODNRBoundary() ([]boundaryFeature, error) {
	params := url.Values{
		"where":             {"LANDS_NAME LIKE '%Wayne%'"},
		"outFields":         {"OBJECTID,CNTY_FIPS,HUNTING_STATUS"},
		"returnGeometry":    {"true"},
		"outSR":             {"4326"},
		"geometryPrecision": {"6"},
		"f":                 {"json"},
	}
	client := http.Client{Timeout: 90 * time.Second}
	resp, err := client.Get(odnrBoundaryURL + "?" + params.Encode())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ODNR status %d", resp.StatusCode)
	}

	var parsed struct {
		Features []boundaryFeature `json:"features"`
		Error    *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, fmt.Errorf("decode: %w", err)
	}
	// ArcGIS reports errors with HTTP 200 and an error object
	if parsed.Error != nil {
		return nil, fmt.Errorf("ODNR error: %s", parsed.Error.Message)
	}
	if err := validateBoundary(parsed.Features); err != nil {
		return nil, err
	}
	return parsed.Features, nil
}

// validateBoundary rejects data that would break clients, e.g. coordinates in the
// wrong spatial reference or empty geometry
func validateBoundary(features []boundaryFeature) error {
	if len(features) == 0 {
		return fmt.Errorf("no features")
	}
	for _, f := range features {
		if len(f.Geometry.Rings) == 0 {
			return fmt.Errorf("feature without geometry")
		}
		for _, ring := range f.Geometry.Rings {
			if len(ring) < 4 {
				return fmt.Errorf("ring with %d points", len(ring))
			}
			for _, p := range ring {
				if len(p) < 2 || p[0] < -85 || p[0] > -80 || p[1] < 38 || p[1] > 42.5 {
					return fmt.Errorf("coordinate outside southeast Ohio: %v", p)
				}
			}
		}
	}
	return nil
}

// GET /forest-boundary
func forestBoundaryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	boundary.mu.RLock()
	body, gzipped, etag := boundary.body, boundary.gzipped, boundary.etag
	boundary.mu.RUnlock()

	if body == nil {
		http.Error(w, "boundary not available yet", http.StatusServiceUnavailable)
		return
	}

	w.Header().Set("ETag", etag)
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Header().Add("Vary", "Accept-Encoding")
	if r.Header.Get("If-None-Match") == etag {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
		w.Header().Set("Content-Encoding", "gzip")
		w.Write(gzipped)
		return
	}
	w.Write(body)
}
