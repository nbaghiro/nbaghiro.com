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

The site runs on [Render](https://render.com) and is defined in `render.yaml` as a Blueprint with two resources:

- `nbaghiro`: a Node web service. Express serves the built React app from `client/dist` and the API under `/api` on the same origin.
- `nbaghiro-kv`: a Key Value instance. The web service reads it through `REDIS_URL` and stores the project chat's daily spend and per-visitor question counts there, so the counters survive restarts of the web service.

Render builds with `npm ci --include=dev && npm run build` and starts with `npm start`. The Node version comes from `engines.node` in the root `package.json` (24.x). The health check path is `/api/health`.

Deploys are automatic. Every push to `main` runs the GitHub Actions workflow in `.github/workflows/ci.yml` (`npm ci`, `npm run lint`, `npm run build`). Render deploys the commit only after that workflow passes (`autoDeployTrigger: checksPass`). A commit whose checks fail is not deployed, and the previous deploy keeps serving.

Environment variables on the web service:

- `NODE_ENV=production`, `CHAT_DAILY_CAP_USD=5` and `CHAT_QUESTIONS_PER_VISITOR=10` are set in `render.yaml`.
- `REDIS_URL` is filled in by Render from the Key Value instance.
- `ANTHROPIC_API_KEY` is a secret. It is marked `sync: false`, so it is entered in the Render dashboard and never committed.

Both resources are on the free plan. The web service sleeps after 15 minutes without traffic, so the first request after that waits for a cold start. The free Key Value instance keeps data in memory only, so a restart of it resets the day's counters.

To check the Blueprint after editing it:

```bash
render blueprints validate ./render.yaml
```

## Local Development

Requires Node 24.

```bash
# Install
npm install

# Configure
cp server/.env.example server/.env   # then set ANTHROPIC_API_KEY

# Run the server and the client together
npm run dev
```

- The Vite dev server runs on http://localhost:5283 and proxies `/api` to the Express server.
- The Express server runs on http://localhost:3100.

To run the production build locally, the same way Render runs it:

```bash
npm run build
NODE_ENV=production npm start   # serves the app and /api on http://localhost:3100
```

`npm run lint` and `npm run build` are the same checks CI runs.

### Environment Variables

Set in `server/.env` for local development, or in Render for production.

```env
ANTHROPIC_API_KEY=...            # required for the project chat
PORT=3100                        # optional, Render sets its own
CHAT_MODEL=...                   # optional, overrides the default Claude model
CHAT_DAILY_CAP_USD=5             # optional, daily spend cap for the chat
CHAT_QUESTIONS_PER_VISITOR=10    # optional, per-visitor question limit
REDIS_URL=...                    # optional, without it the chat counters are kept in memory
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
