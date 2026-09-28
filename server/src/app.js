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

// Render terminates TLS in front of the app; trust that one proxy hop so
// req.ip is the visitor's address (used by the chat's per-visitor limit)
app.set("trust proxy", 1);

// Security headers. PDFs skip the page CSP: its object-src 'none' stops Chrome's
// built-in PDF viewer from rendering the résumé inside the About page's frame.
const pageHeaders = helmet();
const pdfHeaders = helmet({ contentSecurityPolicy: false });
app.use((req, res, next) => (req.path.endsWith(".pdf") ? pdfHeaders : pageHeaders)(req, res, next));

// CORS configuration
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5283",
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

// Unknown API paths are a JSON 404, not the web page
app.use("/api", (req, res) => {
    res.status(404).json({ error: "Not found" });
});

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
