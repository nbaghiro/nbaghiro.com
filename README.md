# nbaghiro.com

Personal dashboard aggregating activity data from multiple APIs with multi-tier caching and serverless deployment.

**Live**: [nbaghiro.com](https://www.nbaghiro.com)

## Tech Stack

**Frontend**: React 18, Vite, React Router
**Backend**: Node.js 22, Express
**Infrastructure**: Google Cloud Run, Firestore, Container Registry
**APIs**: Spotify, Google Places, Strava, Goodreads, Open Library

## Architecture

### Caching Strategy
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
┌──────▼─────────────────────────────┐
│  Express API Server                │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ L1: LRU Memory Cache         │  │
│  │ (10 weeks, 1hr TTL)          │  │
│  └────────┬─────────────────────┘  │
│           │ miss                   │
│  ┌────────▼─────────────────────┐  │
│  │ L2: Firestore Cache          │  │
│  │ (260 weeks, smart TTL)       │  │
│  └────────┬─────────────────────┘  │
│           │ miss                   │
│  ┌────────▼─────────────────────┐  │
│  │ L3: API Response Cache       │  │
│  │ (Spotify/Books, 24hr-7d TTL) │  │
│  └────────┬─────────────────────┘  │
│           │ miss                   │
│  ┌────────▼─────────────────────┐  │
│  │ External APIs                │  │
│  │ • Spotify                    │  │
│  │ • Google Places              │  │
│  │ • Strava                     │  │
│  │ • Goodreads                  │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

**L1**: In-memory LRU (10 weeks, 1hr TTL)
**L2**: Firestore (260 weeks, age-based TTL: 1hr→24hr→7d→∞)
**L3**: API response cache (24hr-7d TTL for Spotify/Books)

## Deployment

```bash
./deploy.sh           # Build → Push to GCR → Deploy to Cloud Run
./deploy.sh build     # Build multi-stage Docker image only
./deploy.sh push      # Push to Container Registry only
./deploy.sh deploy    # Deploy to Cloud Run only
```

Multi-stage Dockerfile: Vite build → npm install → runtime image

## Local Development

```bash
# Install
npm install

# Configure
# Add API keys to server/.env
# Add Firestore service account key: server/firestore-key.json

# Run (separate terminals)
cd client && npm run dev   # http://localhost:5173
cd server && npm run dev   # http://localhost:3000
```

### Required Environment Variables

```env
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
GOOGLE_PLACES_API_KEY=...
GCP_PROJECT_ID=...
FIRESTORE_KEY_PATH=./firestore-key.json
```

## Project Structure

```
client/          # React + Vite frontend
server/          # Express API + services
  src/
    routes/      # API endpoints
    services/    # Spotify, Places, Books, Cache
    middleware/  # Express middleware
Dockerfile       # Multi-stage build
deploy.sh        # GCP deployment
```

## API Endpoints

```
GET  /api/health
GET  /api/weeks?page=1&limit=3
GET  /api/weeks/:weekNumber
GET  /api/years
GET  /api/years/:year
GET  /api/cache/stats
POST /api/cache/clear
POST /api/cache/warm
```

## Performance Notes

- Parallel cache warming on startup (12 weeks in 3-5s)
- Background warming (non-blocking)
- Infinite scroll pagination (initial load: 3 weeks)
- Gzip compression
- Multi-stage Docker build for minimal image size

## Contact

**Naib Baghirov** | [nbaghiro.com](https://www.nbaghiro.com) | [@nbaghiro](https://github.com/nbaghiro)
