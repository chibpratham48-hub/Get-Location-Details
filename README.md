# Landmark API

A Node.js Express backend project that generates location insights (landmarks, food/shopping places, and transport facilities) with approximate distances using the Gemini API.

## Project Architecture

This project follows a clean, modular architecture:
- `server.js`: Application entry point and global middleware/error handlers.
- `routes/`: Express routes mapping API endpoints to controller logic.
- `controllers/`: Handles HTTP requests, validations, and responses.
- `services/`: Core business logic, such as integrating with the Gemini API.

## Getting Started

### 1. Installation

Make sure you have [Node.js](https://nodejs.org/) installed, then run the following command to install the project dependencies:

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory (you can copy from `.env.example`) and add your Gemini API Key:

```env
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Start the Server

Start the application in development mode (which uses `nodemon` for hot-reloading):

```bash
npm run dev
```

The server should now be running on `http://localhost:3000`.

Open **`http://localhost:3000/`** for the bundled tester UI. API map: **`GET /meta`** · **`GET /health`** (also used as a Render health check).

---

## API reference

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/location-insights` | JSON body `{ "location": "…" }` → insights payload below |
| `GET` | `/health` | Liveness `{ "ok": true, "service": "landmark-api" }` |
| `GET` | `/meta` | Lists public endpoints |

Error responses share the shape **`{ "error": "…", "code": "VALIDATION_ERROR" | "UPSTREAM" | … }`** (never stack traces).

### Stable success body

Each category is capped at four items; every object exposes the fields below even when a value is an empty string.

```json
{
  "location": "Bellandur, Bangalore",
  "landmarks": [
    { "name": "…", "distance": "…", "description": "…" }
  ],
  "food_and_shopping": [
    { "name": "…", "type": "…", "distance": "…" }
  ],
  "transport": [
    { "name": "…", "type": "…", "distance": "…" }
  ]
}
```

---

## Deploy on [Render](https://render.com)

1. Push the repo to GitHub (omit `.env`; use `.env.example` as reference).
2. On Render: **New → Blueprint** or **Web Service**, connect the repo.
3. **Build**: `npm install` · **Start**: `npm start` · **Health check path**: `/health`
4. In **Environment**, set **`GEMINI_API_KEY`** (required) and **`NODE_ENV=production`**.
5. Optional: **`ALLOWED_ORIGINS`** with your frontend origin(s), comma-separated (`https://your-app.onrender.com`). Leave empty or use `*` for permissive reflected CORS on a public demo.

You can also import **`render.yaml`** as a blueprint and add `GEMINI_API_KEY` when prompted.

---

## Testing the API

### Using cURL

Run the following command in your terminal to test the API endpoint:

```bash
curl -X POST http://localhost:3000/location-insights \
  -H "Content-Type: application/json" \
  -d '{"location": "Whitefield Bangalore"}'
```

### Using Postman

1. Open Postman and create a new request.
2. Set the method to **POST**.
3. Set the URL to `http://localhost:3000/location-insights`.
4. Go to the **Body** tab, select **raw**, and choose **JSON** from the dropdown.
5. Paste the following payload:
   ```json
   {
     "location": "Whitefield Bangalore"
   }
   ```
6. Click **Send**.

---

## Sample API Response

```json
{
  "location": "Whitefield Bangalore",
  "landmarks": [
    {
      "name": "Phoenix Marketcity",
      "distance": "3 km",
      "description": "One of the largest shopping malls in Bangalore with numerous retail brands and entertainment options."
    },
    {
      "name": "Sri Sathya Sai Super Speciality Hospital",
      "distance": "1.5 km",
      "description": "A well-known hospital offering medical services, recognized for its architecture."
    },
    {
      "name": "Inorbit Mall",
      "distance": "2 km",
      "description": "Another prominent mall offering a variety of shopping and dining experiences."
    },
    {
      "name": "International Tech Park Bangalore (ITPB)",
      "distance": "1 km",
      "description": "A major tech park housing numerous IT companies and corporate offices."
    }
  ],
  "food_and_shopping": [
    {
      "name": "Windmills Craftworks",
      "type": "Microbrewery & Restaurant",
      "distance": "4 km"
    },
    {
      "name": "Forum Shantiniketan Mall",
      "type": "Mall",
      "distance": "2.5 km"
    }
  ],
  "transport": [
    {
      "name": "Whitefield Railway Station",
      "type": "Railway Station",
      "distance": "5 km"
    },
    {
      "name": "Kadugodi Metro Station",
      "type": "Metro Station",
      "distance": "1 km"
    }
  ]
}
```

---

## Upgrading to Google Places API

Currently, this API relies completely on the Gemini LLM for location insights. While Gemini is excellent for approximations and general knowledge, it is not a real-time mapping service. Distances and precise availability can sometimes be generalized.

**To improve accuracy and fetch live data, you can integrate the Google Places API in the future:**

1. **Obtain Google Maps API Key**: Go to the Google Cloud Console, enable the "Places API" and "Distance Matrix API", and get an API key.
2. **Install Axios**: (Already included in `package.json`).
3. **Update `services/`**:
   - Create a `googlePlacesService.js`.
   - Use the Text Search or Nearby Search API to fetch real `places` for landmarks, restaurants, and transit stations based on the location's coordinates.
   - Use the Distance Matrix API to calculate exact distances from the target location center to the places.
4. **Combine with Gemini (Optional)**:
   - You can fetch live structured data from Google Places API and then feed it into Gemini to generate a beautifully curated summary or description for each landmark.
5. **Update Controller**: Modify `locationController.js` to call the new service instead of (or alongside) `geminiService`.
