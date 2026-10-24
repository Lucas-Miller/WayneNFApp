// main.go

package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func init() {
	godotenv.Load()
}

var (
	db        *sql.DB
	jwtSecret []byte
)

type user struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

type spot struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	CreatedAt time.Time `json:"created_at"`
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

// ----------------- Handlers -----------------

// POST /signup
func signupHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var creds struct{ Email, Password string }
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "server error", http.StatusInternalServerError)
		return
	}
	var id int
	err = db.QueryRow(
		`INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id`,
		creds.Email, string(hash),
	).Scan(&id)
	if err != nil {
		if pgErr, ok := err.(*pq.Error); ok && pgErr.Code == "23505" {
			http.Error(w, "email already in use", http.StatusConflict)
			return
		}
		http.Error(w, "server error", http.StatusInternalServerError)
		return
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   fmt.Sprint(id),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
	})
	ss, err := token.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, "token error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]string{"token": ss})
}

// POST /login
func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var creds struct{ Email, Password string }
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}
	var u user
	var hash string
	err := db.QueryRow(
		`SELECT id,password_hash FROM users WHERE email=$1`, creds.Email,
	).Scan(&u.ID, &hash)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(creds.Password)) != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   fmt.Sprint(u.ID),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
	})
	ss, err := token.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, "token error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]string{"token": ss})
}

// GET /me
func meHandler(w http.ResponseWriter, r *http.Request) {
	uid := r.Header.Get("X-User-ID")
	var u user
	err := db.QueryRow(
		`SELECT id,email,created_at FROM users WHERE id=$1`, uid,
	).Scan(&u.ID, &u.Email, &u.CreatedAt)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	writeJSON(w, u)
}

// GET /spots and POST /spots
func spotsHandler(w http.ResponseWriter, r *http.Request) {
	uidStr := r.Header.Get("X-User-ID")
	uid, _ := strconv.Atoi(uidStr)

	switch r.Method {
	case http.MethodGet:
		rows, err := db.Query(
			`SELECT id,name,latitude,longitude,created_at
			 FROM scout_spots WHERE user_id=$1
			 ORDER BY created_at DESC`, uid)
		if err != nil {
			http.Error(w, "db error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var spots []spot
		for rows.Next() {
			var s spot
			if err := rows.Scan(&s.ID, &s.Name, &s.Latitude, &s.Longitude, &s.CreatedAt); err != nil {
				continue
			}
			spots = append(spots, s)
		}
		writeJSON(w, spots)

	case http.MethodPost:
		var input struct {
			Name      string  `json:"name"`
			Latitude  float64 `json:"latitude"`
			Longitude float64 `json:"longitude"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "invalid payload", http.StatusBadRequest)
			return
		}
		var s spot
		err := db.QueryRow(
			`INSERT INTO scout_spots (user_id,name,latitude,longitude)
			 VALUES ($1,$2,$3,$4)
			 RETURNING id,name,latitude,longitude,created_at`,
			uid, input.Name, input.Latitude, input.Longitude,
		).Scan(&s.ID, &s.Name, &s.Latitude, &s.Longitude, &s.CreatedAt)
		if err != nil {
			http.Error(w, "db error", http.StatusInternalServerError)
			return
		}
		writeJSON(w, s)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// DELETE /spots/{id}
func spotDeleteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	uid, _ := strconv.Atoi(r.Header.Get("X-User-ID"))
	// URL: /spots/<id>
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) != 3 {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	id, err := strconv.Atoi(parts[2])
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	res, err := db.Exec(
		`DELETE FROM scout_spots WHERE id=$1 AND user_id=$2`, id, uid)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ----------------- Auth Middleware -----------------

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		var tokstr string
		fmt.Sscanf(h, "Bearer %s", &tokstr)
		t, err := jwt.ParseWithClaims(tokstr, &jwt.RegisteredClaims{}, func(t *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		if err != nil || !t.Valid {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		claims := t.Claims.(*jwt.RegisteredClaims)
		r.Header.Set("X-User-ID", claims.Subject)
		next(w, r)
	}
}

// ----------------- CORS Middleware -----------------

// corsMiddleware lets the browser app call the API from the origins listed in
// CORS_ORIGINS (comma-separated, e.g. "https://wayne.lucasmiller.dev"). The
// mobile app doesn't send an Origin header, so it is unaffected.
func corsMiddleware(next http.Handler) http.Handler {
	allowed := map[string]bool{}
	for _, o := range strings.Split(os.Getenv("CORS_ORIGINS"), ",") {
		if o = strings.TrimSpace(o); o != "" {
			allowed[o] = true
		}
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, If-None-Match")
			w.Header().Set("Access-Control-Max-Age", "86400")
		}
		w.Header().Add("Vary", "Origin")
		// Preflights carry no Authorization header, so answer them before authMiddleware runs
		if r.Method == http.MethodOptions && origin != "" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ----------------- Main -----------------

func main() {
	var err error
	dbURL := os.Getenv("DATABASE_URL")
	jwtSecret = []byte(os.Getenv("JWT_SECRET"))
	if dbURL == "" || len(jwtSecret) == 0 {
		log.Fatal("set DATABASE_URL and JWT_SECRET")
	}
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal(err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal(err)
	}

	http.HandleFunc("/signup", signupHandler)
	http.HandleFunc("/login", loginHandler)
	http.HandleFunc("/me", authMiddleware(meHandler))
	http.HandleFunc("/spots", authMiddleware(spotsHandler))
	http.HandleFunc("/spots/", authMiddleware(spotDeleteHandler))
	http.HandleFunc("/forest-boundary", forestBoundaryHandler)

	initBoundary()

	port := os.Getenv("PORT")

	if port == "" {
		port = "8080"
	}

	log.Printf("listening on :%s…", port)
	log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(http.DefaultServeMux)))
}
