import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/api/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware with CSP configured for external images
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "img-src": [
                    "'self'",
                    "data:",
                    "https://i.scdn.co", // Spotify album covers
                    "https://covers.openlibrary.org", // Book covers
                ],
            },
        },
    })
);

// CORS configuration
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// API routes
app.use("/api", apiRoutes);

// Serve static files from React app in production
if (process.env.NODE_ENV === "production") {
    const clientBuildPath = path.join(__dirname, "../../client/dist");
    app.use(express.static(clientBuildPath));

    // Handle React routing - return all requests to React app
    app.get("*", (req, res) => {
        res.sendFile(path.join(clientBuildPath, "index.html"));
    });
}

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
