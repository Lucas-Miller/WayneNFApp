# Wayne NF — Web

Desktop/browser version of the Wayne NF app. Vite + React + TanStack Router (file-based, `src/routes/`) + TanStack Query, with Google Maps via `@vis.gl/react-google-maps`. Talks to the same Go API in `../wayne-nf-api`.

## Run

```sh
cp .env.example .env.local   # then fill in VITE_GOOGLE_MAPS_API_KEY
npm install
npm run dev                  # http://localhost:5173
```

In dev, requests to `/api/*` are proxied to `API_PROXY_TARGET` (the production API by default), so no CORS setup is needed locally.

## Forest boundary data

Loaded via `../shared/forestBoundary.ts`: the API's `/forest-boundary` mirror first, then Ohio DNR directly, then the snapshot in `../shared/wayne-forest-boundary.esrijson` (refresh it from the repo root with `npm run update-forest-snapshot`).

## Deploy

1. Build with the API's real URL: `VITE_API_BASE_URL=https://wayneapi.lucasmiller.dev npm run build` and host `dist/` on any static host. Configure the host to serve `index.html` for unknown paths so `/account` works on reload.
2. On the API, set `CORS_ORIGINS=https://your-web-domain` and redeploy.
3. In Google Cloud Console, enable **Maps JavaScript API** and **Directions API** for the key, and restrict it to your web domain's HTTP referrers.
