# Personal Dashboard

A modern web application that aggregates and visualizes my weekly and yearly activities, showcasing data from Spotify, Google Places, Strava, and Goodreads in an elegant, interactive interface.

**Live Site**: [nbaghiro.com](https://www.nbaghiro.com)

## Overview

This project serves as both a personal data dashboard and a demonstration of full-stack development capabilities, cloud infrastructure, and API integration expertise. The application aggregates data from multiple sources to provide insights into my listening habits, physical activities, places visited, and reading progress.

## Features

- **Weekly View**: Detailed breakdown of activities for each week (Mon-Sun)
  - Music listening sessions from Spotify
  - Physical activities tracked via Strava (running, cycling, walking)
  - Places visited with Google Places check-ins
  - Reading progress from Goodreads

- **Yearly View**: Aggregated annual statistics and trends

- **Random Week**: Explore any random week from the past 5 years

- **Smart Caching**: Three-tier caching strategy for optimal performance
  - L1: In-memory LRU cache (10 weeks, 1-hour TTL)
  - L2: Firestore persistent cache (260 weeks, smart age-based TTL)
  - L3: API-level response caching (24hr-7day TTL)

- **Responsive Design**: Beautiful UI with particle background effects and smooth animations

## Architecture

### Frontend
- **React 18** with React Router for SPA navigation
- **Vite** for blazing-fast development and optimized production builds
- Custom particle animation system for visual effects
- Responsive grid layout with CSS Grid and Flexbox

### Backend
- **Node.js 22** with Express.js
- ES Modules throughout for modern JavaScript
- RESTful API design with clean separation of concerns
- Service-oriented architecture for each data source

### Caching Strategy
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
┌──────▼──────────────────────────────┐
│  Express API Server                 │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ L1: LRU Memory Cache         │  │
│  │ (10 weeks, 1hr TTL)          │  │
│  └────────┬─────────────────────┘  │
│           │ miss                    │
│  ┌────────▼─────────────────────┐  │
│  │ L2: Firestore Cache          │  │
│  │ (260 weeks, smart TTL)       │  │
│  └────────┬─────────────────────┘  │
│           │ miss                    │
│  ┌────────▼─────────────────────┐  │
│  │ L3: API Response Cache       │  │
│  │ (Spotify/Books, 24hr-7d TTL) │  │
│  └────────┬─────────────────────┘  │
│           │ miss                    │
│  ┌────────▼─────────────────────┐  │
│  │ External APIs                │  │
│  │ • Spotify                    │  │
│  │ • Google Places              │  │
│  │ • Strava                     │  │
│  │ • Goodreads                  │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Infrastructure
- **Google Cloud Run**: Serverless container deployment
- **Google Cloud Load Balancer**: HTTPS traffic routing with SSL/TLS
- **Google Container Registry**: Docker image storage
- **Google Firestore**: NoSQL database for persistent caching
- **Docker**: Multi-stage builds for optimized production images

## Tech Stack

### Core Technologies
- **Runtime**: Node.js 22 (ES Modules)
- **Frontend Framework**: React 18
- **Backend Framework**: Express.js
- **Build Tool**: Vite
- **Database**: Google Firestore
- **Containerization**: Docker (multi-stage builds)

### Libraries & Tools
- **Routing**: React Router v6
- **HTTP Client**: Native Fetch API (Node 22)
- **Caching**: lru-cache
- **Security**: Helmet (CSP configuration)
- **Compression**: compression middleware
- **CORS**: cors middleware

### APIs Integrated
- **Spotify Web API**: Music listening data
- **Google Places API**: Location check-ins
- **Open Library API**: Book information and covers
- **Strava API**: Activity tracking
- **Goodreads API**: Reading lists

## Google Cloud Services

### Cloud Run
- **Serverless deployment** with automatic scaling (0-10 instances)
- **512Mi memory** allocation
- **1 CPU** per instance
- **Port 8080** HTTP server
- Environment variables for API keys and configuration

### Cloud Load Balancer
- Global HTTPS load balancing
- Managed SSL certificates (auto-renewal)
- Static IP address: `34.110.182.231`
- Backend: Serverless NEG (Network Endpoint Group)

### Firestore
- NoSQL document database
- Collection structure: `cache/data/weeks/{weekNumber}`
- Smart TTL based on week age:
  - Current week (0): 1 hour
  - Recent weeks (1-4): 24 hours
  - Past month (5-52): 7 days
  - Historical (53+): No expiration

### Container Registry
- Docker image storage: `gcr.io/nbaghiro/nbaghiro-web`
- Multi-stage build optimization
- Platform-specific builds (linux/amd64)

### IAM & Authentication
- Service account for Firestore access
- Application Default Credentials in Cloud Run
- Local development with service account key

## Deployment

The project uses a single Bash script for complete deployment automation:

```bash
./deploy.sh           # Full deployment pipeline
./deploy.sh build     # Build Docker image only
./deploy.sh push      # Push to GCR only
./deploy.sh deploy    # Deploy to Cloud Run only
```

### Deployment Pipeline

1. **Load Configuration**: Reads environment variables from `server/.env`
2. **Build Docker Image**: Multi-stage build for client + server
   - Stage 1: Build React app with Vite
   - Stage 2: Install production Node.js dependencies
   - Stage 3: Combine into minimal runtime image
3. **Push to GCR**: Upload to Google Container Registry
4. **Deploy to Cloud Run**: Update service with new image
   - Set environment variables (Spotify, Google Places API keys)
   - Configure memory, CPU, scaling limits
   - Enable unauthenticated access

### Environment Variables

**Production** (Cloud Run):
- `NODE_ENV=production`
- `PORT=8080`
- `GCP_PROJECT_ID`: Google Cloud project ID
- `SPOTIFY_CLIENT_ID`: Spotify API credentials
- `SPOTIFY_CLIENT_SECRET`: Spotify API credentials
- `GOOGLE_PLACES_API_KEY`: Google Places API key

**Development**:
- `NODE_ENV=development`
- `PORT=3000`
- `CLIENT_URL=http://localhost:5173`
- `FIRESTORE_KEY_PATH=./firestore-key.json`

## Local Development

### Prerequisites
- Node.js 22+
- npm (comes with Node.js)
- Google Cloud account (for Firestore)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/nbaghiro/personal-dashboard.git
   cd personal-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create `server/.env`:
   ```env
   NODE_ENV=development
   PORT=3000
   CLIENT_URL=http://localhost:5173

   # API Keys
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   GOOGLE_PLACES_API_KEY=your_google_places_key

   # Google Cloud
   GCP_PROJECT_ID=your_project_id
   GCP_REGION=us-central1
   CLOUD_RUN_SERVICE=nbaghiro-web
   FIRESTORE_KEY_PATH=./firestore-key.json
   ```

4. **Set up Firestore**
   - Create a Firestore database in Google Cloud Console
   - Download service account key as `server/firestore-key.json`

5. **Start development servers**

   Terminal 1 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

   Terminal 2 (Backend):
   ```bash
   cd server
   npm run dev
   ```

6. **Open in browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Main app component
│   ├── public/            # Static assets
│   └── package.json
│
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   │   ├── cache/     # Caching layer
│   │   │   ├── spotify/   # Spotify integration
│   │   │   ├── places/    # Google Places integration
│   │   │   └── books/     # Books integration
│   │   ├── middleware/    # Express middleware
│   │   ├── app.js         # Express app setup
│   │   └── server.js      # Server entry point
│   └── package.json
│
├── Dockerfile             # Multi-stage production build
├── deploy.sh              # Deployment automation script
├── package.json           # Root workspace config
└── README.md              # This file
```

## Performance Optimizations

1. **Parallel Cache Warming**: Server startup warms 12 weeks of cache in parallel (3-5s vs 36-60s sequential)

2. **Background Cache Warming**: Non-blocking - server accepts requests immediately

3. **API Response Caching**: Spotify searches and book queries cached for 24hrs-7days

4. **Smart Pagination**: Initial load of 3 weeks, infinite scroll loads more

5. **Multi-stage Docker Build**: Minimal production image size

6. **Compression Middleware**: Gzip compression for all responses

7. **Static Asset Caching**: Immutable builds with content hashing

## Security

- **Helmet.js**: Security headers with custom CSP for external images
- **CORS**: Restricted to production domain only
- **HTTPS Only**: SSL/TLS via Google-managed certificates
- **Environment Variables**: Secrets managed via Cloud Run environment
- **No Client Secrets**: API keys never exposed to frontend
- **Rate Limiting**: Future enhancement planned

## API Endpoints

| Endpoint                  | Method | Description                    |
| ------------------------- | ------ | ------------------------------ |
| `/api/health`             | GET    | Health check                   |
| `/api/weeks`              | GET    | Get weekly data (paginated)    |
| `/api/weeks/:weekNumber`  | GET    | Get specific week data         |
| `/api/years`              | GET    | Get yearly aggregated data     |
| `/api/years/:year`        | GET    | Get specific year data         |
| `/api/cache/stats`        | GET    | Cache statistics               |
| `/api/cache/clear`        | POST   | Clear all caches               |
| `/api/cache/warm`         | POST   | Warm cache for recent weeks    |

## Future Enhancements

- [ ] Enhanced Strava integration for detailed activity metrics
- [ ] Goodreads API for comprehensive reading analytics
- [ ] Year-over-year comparisons and trends
- [ ] Monthly and quarterly views
- [ ] Data export functionality (CSV, JSON)
- [ ] Social sharing features
- [ ] Mobile app (React Native)
- [ ] Real-time data updates via WebSockets
- [ ] Dark mode support
- [ ] User preferences and customization

## License

This project is private and proprietary.

## Contact

**Naib Baghirov**
- Website: [nbaghiro.com](https://www.nbaghiro.com)
- GitHub: [@nbaghiro](https://github.com/nbaghiro)

---

Built with ❤️ using React, Node.js, and Google Cloud Platform
