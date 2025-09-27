# Zoomverse – Cosmoscope

Zoomverse is a full-stack exploration platform for massive NASA and partner imagery. It blends live Earth observation layers with planetary mosaics and deep-space archives, providing zoomable maps, side-by-side comparisons, rich annotations, and export tools backed exclusively by production APIs.

## Features

- 🌍 **Global mosaics** – MODIS & VIIRS daily imagery via NASA GIBS, with live date availability checks and overlays for day-night views.
- 🪐 **Planetary atlases** – Mars MARCI global mosaic and Moon LROC WAC coverage streamed from NASA/JPL/ASU tile services.
- 🛰️ **Deep space queries** – Search Hubble/JWST/TESS observations through the MAST archive, plus planetary product discovery via the NASA PDS Search API.
- 🧭 **Exploration UX** – Fluid pan/zoom maps, synchronized comparison maps with temporal offsets, timeline scrubbing, and overlay toggles.
- 📝 **Annotations** – Draw points/polygons on any dataset, persist to the backend, export/import GeoJSON, and capture geo-tagged notes.
- 🖼️ **Worldview exports** – Request georeferenced PNG snapshots for the current extent using NASA Worldview Snapshots.

## Project layout

```text
.
├── backend/              # Express API gateway and annotation persistence
│   ├── data/annotations.json
│   └── src/server.js
├── frontend/             # Vite + React + OpenLayers experience
│   ├── src/components/
│   ├── src/state/
│   └── src/utils/
├── .env.example          # Required environment variables
└── README.md
```

## Getting started

### 1. Configure environment

Create a `.env` file at the repository root (copy from `.env.example`) and provide:

- `NASA_API_KEY` – issued at [api.nasa.gov](https://api.nasa.gov/).
- `EDL_TOKEN` – Earthdata Login token for authenticated CMR queries.
- `PORT` – optional backend port (defaults to `4000`).

> ⚠️ Never expose the `.env` file publicly. The frontend only talks to the backend proxy, keeping keys server-side.

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Run the stack locally

```bash
# Terminal 1 – backend
cd backend
npm run dev

# Terminal 2 – frontend
cd frontend
npm run dev
```

The frontend will proxy `/api/*` requests to the Express backend.

### 4. Production build

```bash
cd frontend
npm run build
```

Deploy the backend to your preferred Node host (Render, Fly.io, AWS, etc.) and the `frontend/dist` bundle to Vercel/Netlify. Remember to configure the proxy base URL for production (e.g. environment variable + reverse proxy).

## API integrations

- **NASA GIBS** – WMTS/XYZ tile delivery for MODIS & VIIRS collections.
- **NASA Worldview** – Snapshot exports based on current extent.
- **NASA CMR** – Granule discovery (requires EDL token).
- **MAST** – Space telescope observation search.
- **NASA PDS** – Planetary data repository products.
- **Solar System tiles** – Mars MARCI mosaic (`mars.nasa.gov`) and LROC WAC mosaic (`trek.nasa.gov`).

## Notes

- The annotation store persists to `backend/data/annotations.json`; replace with a database for multi-user deployments.
- The comparison viewer shares a live view state across twin OpenLayers maps for synchronized navigation.
- Tile servers listed above must remain reachable from the client network; some may require HTTPS referrer headers in locked-down environments.
