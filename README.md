# Bengaluru Location Insights API

A production-ready Node.js + Express backend API that provides geographical location insights (landmarks, food/shopping places, and transport facilities) for Bengaluru locations. 

The API resolves any target query coordinate to the nearest Bengaluru location category center using the **Haversine formula** and calculates custom distance representations for all sub-items.

## Project Architecture

This project follows a clean, modular structure:
- `server.js`: Web server entry point, Global middlewares (CORS, Helmet), and global error handlers.
- `routes/`: Express routes mapping API endpoints to controller logic.
- `controllers/`: Handles HTTP query parsing, validation, and status responses.
- `services/`: Core logic layer. `locationService.js` loads the compiled database in memory on startup and computes closest categories.
- `utils/`: Reusable math functions. `haversine.js` calculates absolute coordinates difference and formats distances.
- `data/`: Holds the unified dataset in `locations.json`.
- `scripts/`: Compile script (`compileData.js`) to merge raw datasets.
- `location insights/`: Folder containing raw source databases divided by zone.

---

## Getting Started

### 1. Installation

Install Node.js dependencies:
```bash
npm install
```

### 2. Compile Database

Compile the zonewise JavaScript files into a single, normalized JSON file inside the `data/` folder:
```bash
npm run compile-data
```

### 3. Environment Variables

Create a `.env` file in the root directory (you can copy from `.env.example`):
```env
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=*
MAX_DISTANCE_THRESHOLD_KM=50
```

### 4. Start the Server

Start the application in development mode (with hot-reloading):
```bash
npm run dev
```
Or start in production mode:
```bash
npm start
```

The server runs on `http://localhost:3000`.

---

## API Reference

| Method | Path | Query Params | Purpose |
|--------|------|--------------|---------|
| `GET` | `/location-insights` | `location`, `latlon` | Fetches nearby insights with Haversine distance mapping. |
| `GET` | `/health` | — | Liveness health check. |
| `GET` | `/meta` | — | Lists public API endpoints metadata. |

### GET `/location-insights` Query Parameters:
- `location`: Place name query (e.g. `ecospace techpark, Bellandur, Bengaluru`)
- `latlon`: Coordinates string in `latitude,longitude` format (e.g. `12.9221,77.6799`)

#### Success Payload Example:
```json
{
  "location": "ecospace techpark, Bellandur, Bengaluru",
  "location_category": "sarjapur road",
  "landmarks": [
    {
      "name": "Wipro Flagship Corporate Office Campus",
      "description": "The sprawling primary green headquarters campus building representing tech expansion icons along the road.",
      "distance": "Approx. 1-2 km"
    },
    {
      "name": "Sarjapur Road Fire Station Roundabout",
      "distance": "0.5 km",
      "description": "A key spatial intersection and safety landmark guiding civic traffic vectors securely."
    }
  ],
  "food_and_shopping": [
    {
      "name": "Sarjapur Road Social",
      "type": "Urban Workspace, Bar & Diner Lounge",
      "distance": "0.6 km"
    }
  ],
  "transport": [
    {
      "name": "Carmelaram Suburban Railway Station",
      "type": "Suburban Rail Commuter Transit Station",
      "distance": "Approx. 2-3 km"
    }
  ]
}
```

---

## Deploying on Render

1. Commit all files (including the compiled `data/locations.json`, or let Render compile it).
2. Create a new **Web Service** on Render.
3. Configure the following parameters:
   - **Build Command**: `npm install && npm run compile-data`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `ALLOWED_ORIGINS`: `*` (or your frontend domain)
   - `MAX_DISTANCE_THRESHOLD_KM`: `50` (or your desired coverage boundary radius)
