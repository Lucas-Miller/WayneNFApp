# Wayne NF App

Find out whether you're standing in Wayne National Forest (southeast Ohio), see which county and whether it's open to hunting, and save camping spots. Built to keep working with no cell signal.

| Folder | What it is |
| --- | --- |
| `/` (app, components, hooks, services) | Mobile app: Expo / React Native with Google Maps |
| `web/` | Browser app: Vite, React, TanStack Router and Query (see [web/README.md](web/README.md)) |
| `wayne-nf-api/` | Go API: accounts, saved spots, and a mirror of the forest boundary |
| `shared/` | Code and data both apps use, including the bundled boundary snapshot |

Forest boundaries come from Ohio DNR's public ArcGIS service (ODNR lands layer). The apps try the API's mirror first, then ODNR, then the snapshot shipped in the app. The phone keeps the last copy it downloaded.

## Mobile app

```sh
cp .env.example .env.local   # add your Google Maps API key
npm install
npx expo run:android         # or build a development client with EAS
```

For EAS builds, set the key as an EAS environment variable (`.env.local` isn't uploaded):

```sh
eas env:create --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value <key> \
  --environment development --environment preview --environment production --visibility sensitive
```

Offline behavior has to be tested on a preview or release build. In a development build the bundled snapshot is served by Metro.

## API

```sh
cd wayne-nf-api
cp .env.example .env         # Postgres URL, JWT secret, CORS origins
go run .
```

The API creates its `forest_boundary` table on startup and refreshes it from ODNR daily. It keeps the last good copy if ODNR is down or returns suspicious data.

## Refreshing the bundled boundary snapshot

```sh
npm run update-forest-snapshot
```
