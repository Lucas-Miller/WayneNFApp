// scripts/update-forest-snapshot.mjs
//
// Refreshes shared/wayne-forest-boundary.esrijson, the boundary snapshot bundled into
// both apps as a last-resort fallback. Run occasionally (npm run update-forest-snapshot)
// and commit the result. Query must match ODNR_BOUNDARY_PARAMS in shared/forestBoundary.ts.

import { writeFileSync } from 'node:fs';

const URL_BASE =
  'https://gis.ohiodnr.gov/arcgis/rest/services/DOW_Services/HuntingRegulations_AGOL_3/MapServer/18/query';
const params = new URLSearchParams({
  where: "LANDS_NAME LIKE '%Wayne%'",
  outFields: 'OBJECTID,CNTY_FIPS,HUNTING_STATUS',
  returnGeometry: 'true',
  outSR: '4326',
  geometryPrecision: '6',
  f: 'json',
});

const response = await fetch(`${URL_BASE}?${params}`);
if (!response.ok) throw new Error(`ODNR returned ${response.status}`);
const data = await response.json();

const features = data.features ?? [];
const pointCount = features.reduce(
  (sum, f) => sum + (f.geometry?.rings ?? []).reduce((s, r) => s + r.length, 0),
  0
);
if (features.length === 0 || pointCount === 0) {
  throw new Error(`Unexpected response: ${JSON.stringify(data).slice(0, 300)}`);
}

const snapshot = {
  fetched_at: new Date().toISOString(),
  features: features.map((f) => ({ attributes: f.attributes, geometry: { rings: f.geometry.rings } })),
};
const out = new URL('../shared/wayne-forest-boundary.esrijson', import.meta.url);
writeFileSync(out, JSON.stringify(snapshot));
console.log(`Wrote ${features.length} features, ${pointCount} points to shared/wayne-forest-boundary.esrijson`);
