// shared/forestBoundary.ts
//
// Wayne NF boundary data: loading, validation, and geometry. Used by both the
// mobile app ('@/shared/forestBoundary') and web app ('@shared/forestBoundary').
// Dependency-free so it bundles in Metro and Vite alike.
//
// The data originates from Ohio DNR's ArcGIS REST service (layer 18, ODNR_LANDS).
// Clients get it, in order of preference, from:
//   1. our API's /forest-boundary mirror (wayne-nf-api refreshes it daily and keeps
//      the last good copy if ODNR is down or returns something broken)
//   2. ODNR directly
//   3. a local copy (device cache on mobile, bundled snapshot everywhere)
// The Go mirror and scripts/update-forest-snapshot.mjs use the same ODNR query;
// keep them in sync with ODNR_BOUNDARY_PARAMS below.

export type BoundaryFeature = {
  attributes: Record<string, unknown>;
  // Esri polygon rings of [longitude, latitude]. Outer rings are clockwise,
  // holes (private inholdings) counter-clockwise, in no particular order.
  geometry: { rings: number[][][] };
};

export type ForestBoundary = {
  fetched_at?: string; // set by our API mirror
  features: BoundaryFeature[];
};

// One parcel: an outer ring and the holes inside it, as [longitude, latitude]
export type ParcelPolygon = {
  outer: number[][];
  holes: number[][][];
};

export const ODNR_BOUNDARY_URL =
  'https://gis.ohiodnr.gov/arcgis/rest/services/DOW_Services/HuntingRegulations_AGOL_3/MapServer/18/query';

export const ODNR_BOUNDARY_PARAMS: Record<string, string> = {
  where: "LANDS_NAME LIKE '%Wayne%'",
  outFields: 'OBJECTID,CNTY_FIPS,HUNTING_STATUS',
  returnGeometry: 'true',
  outSR: '4326',
  geometryPrecision: '6',
  f: 'json',
};

// Generous box around southeast Ohio; anything outside means the data changed shape
// (e.g. coordinates came back in a projected system instead of lat/lng)
const BOUNDS = { minLng: -85, maxLng: -80, minLat: 38, maxLat: 42.5 };

/**
 * Validate untrusted boundary JSON. Returns null if it isn't usable.
 */
export function parseBoundary(data: unknown): ForestBoundary | null {
  if (!data || typeof data !== 'object') return null;
  const { features, fetched_at } = data as { features?: unknown; fetched_at?: unknown };
  if (!Array.isArray(features) || features.length === 0) return null;

  for (const feature of features) {
    const rings = feature?.geometry?.rings;
    if (!Array.isArray(rings) || rings.length === 0) return null;
    for (const ring of rings) {
      if (!Array.isArray(ring) || ring.length < 4) return null;
      for (const point of ring) {
        const [lng, lat] = point ?? [];
        if (
          typeof lng !== 'number' ||
          typeof lat !== 'number' ||
          lng < BOUNDS.minLng ||
          lng > BOUNDS.maxLng ||
          lat < BOUNDS.minLat ||
          lat > BOUNDS.maxLat
        ) {
          return null;
        }
      }
    }
  }

  return {
    fetched_at: typeof fetched_at === 'string' ? fetched_at : undefined,
    features: (features as BoundaryFeature[]).map((f) => ({
      attributes: f.attributes ?? {},
      geometry: { rings: f.geometry.rings },
    })),
  };
}

/**
 * Even-odd ray cast across all of a feature's rings: inside an outer ring and not
 * inside one of its holes. Correct for Esri multi-part polygons.
 */
function pointInRings(lng: number, lat: number, rings: number[][][]): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}

/**
 * The feature (one county's piece of the forest) containing a point, or null
 */
export function findFeatureAt(
  boundary: ForestBoundary,
  latitude: number,
  longitude: number
): BoundaryFeature | null {
  return (
    boundary.features.find((feature) => pointInRings(longitude, latitude, feature.geometry.rings)) ??
    null
  );
}

// Shoelace formula; negative means clockwise in lng/lat space
const signedArea = (ring: number[][]) => {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return sum / 2;
};

type BBox = [number, number, number, number];
const bbox = (ring: number[][]): BBox => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
};

/**
 * Split Esri rings into separate parcels, each with its own holes. Map SDKs need
 * this: a feature's rings are many separate parcels, not one outline plus holes.
 */
export function toParcelPolygons(boundary: ForestBoundary): ParcelPolygon[] {
  const parcels: (ParcelPolygon & { box: BBox; area: number })[] = [];

  for (const feature of boundary.features) {
    const rings = feature.geometry.rings;
    const outers = rings.filter((ring) => signedArea(ring) < 0);
    // Data without Esri winding: treat every ring as its own parcel
    const holes = outers.length > 0 ? rings.filter((ring) => signedArea(ring) > 0) : [];
    const featureParcels = (outers.length > 0 ? outers : rings).map((outer) => ({
      outer,
      holes: [] as number[][][],
      box: bbox(outer),
      area: Math.abs(signedArea(outer)),
    }));

    for (const hole of holes) {
      const [x, y] = hole[0];
      // Smallest parcel containing the hole's first vertex
      let owner: (typeof featureParcels)[number] | null = null;
      for (const parcel of featureParcels) {
        const [minX, minY, maxX, maxY] = parcel.box;
        if (x < minX || x > maxX || y < minY || y > maxY) continue;
        if ((!owner || parcel.area < owner.area) && pointInRings(x, y, [parcel.outer])) {
          owner = parcel;
        }
      }
      owner?.holes.push(hole);
    }

    parcels.push(...featureParcels);
  }

  return parcels.map(({ outer, holes }) => ({ outer, holes }));
}

export type BoundaryFetchResult =
  | { status: 'updated'; boundary: ForestBoundary; etag: string | null; source: 'api' | 'odnr' }
  | { status: 'not-modified' };

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch the newest boundary: our API mirror first, then ODNR directly.
 * Throws if neither source returns valid data.
 */
export async function fetchLatestBoundary(
  apiBaseUrl: string,
  { etag, timeoutMs = 20000 }: { etag?: string | null; timeoutMs?: number } = {}
): Promise<BoundaryFetchResult> {
  try {
    const response = await fetchWithTimeout(
      `${apiBaseUrl}/forest-boundary`,
      { headers: etag ? { 'If-None-Match': etag } : {} },
      timeoutMs
    );
    if (response.status === 304) return { status: 'not-modified' };
    if (response.ok) {
      const boundary = parseBoundary(await response.json());
      if (boundary) {
        return { status: 'updated', boundary, etag: response.headers.get('etag'), source: 'api' };
      }
    }
  } catch {
    // fall through to ODNR
  }

  const query = new URLSearchParams(ODNR_BOUNDARY_PARAMS).toString();
  const response = await fetchWithTimeout(`${ODNR_BOUNDARY_URL}?${query}`, {}, timeoutMs * 2);
  if (!response.ok) throw new Error(`ODNR returned ${response.status}`);
  const boundary = parseBoundary(await response.json());
  if (!boundary) throw new Error('ODNR returned unusable boundary data');
  return { status: 'updated', boundary, etag: null, source: 'odnr' };
}
