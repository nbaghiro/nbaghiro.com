import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import fs from "node:fs";
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
// /ads shows images and video straight from the R2 bucket and fetches them for the
// share sheet, so the bucket's origin is allowed in the three directives that cover
// that (helmet's default for each is 'self' only). ADS_MEDIA_ORIGINS adds more.
const mediaOrigins = (
    process.env.ADS_MEDIA_ORIGINS || "https://*.r2.dev"
).split(/\s+/);
const directives = helmet.contentSecurityPolicy.getDefaultDirectives();
directives["img-src"] = ["'self'", "data:", "blob:", ...mediaOrigins];
directives["media-src"] = ["'self'", "blob:", ...mediaOrigins];
directives["connect-src"] = ["'self'", ...mediaOrigins];
const pageHeaders = helmet({ contentSecurityPolicy: { directives } });
const pdfHeaders = helmet({ contentSecurityPolicy: false });
app.use((req, res, next) =>
    (req.path.endsWith(".pdf") ? pdfHeaders : pageHeaders)(req, res, next)
);

// /ads is reachable only by its URL and must stay out of search results
app.use((req, res, next) => {
    if (req.path === "/ads" || req.path.startsWith("/ads/")) {
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }
    next();
});

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

    // A link preview is built by a crawler that does not run JavaScript, so everything it
    // needs has to be in the HTML this route returns. Sending index.html unchanged gave every
    // URL the shell's own title and no image, which is why a shared article previewed as
    // "Naib Baghirov" with a blank thumbnail. The piece's head is read from the build's
    // posts.json and written into the markup before the page goes out.
    const shell = fs.readFileSync(path.join(clientBuildPath, "index.html"), "utf8");
    const postsFile = path.join(clientBuildPath, "posts.json");
    const posts = fs.existsSync(postsFile)
        ? new Map(JSON.parse(fs.readFileSync(postsFile, "utf8")).map((m) => [m.slug, m]))
        : new Map();

    const ORIGIN = (process.env.SITE_ORIGIN || "https://nbaghiro.com").replace(/\/$/, "");
    const esc = (v) =>
        String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    function cardFor(urlPath) {
        const m = /^\/blogs\/([a-z0-9-]+)\/?$/.exec(urlPath);
        const post = m && posts.get(m[1]);
        if (!post) return null;
        // the og image is a JPEG built by scripts/og-images.mjs at LinkedIn's 1200x627, because
        // the covers are WebP and LinkedIn does not document WebP as a format it will fetch
        return {
            title: post.title || "Naib Baghirov",
            description: post.summary || "",
            image: `${ORIGIN}/img/posts/${m[1]}-og.jpg`,
            url: `${ORIGIN}/blogs/${m[1]}`,
        };
    }

    // Handle React routing - return all requests to React app
    app.get("*", (req, res) => {
        const card = cardFor(req.path);
        if (!card) return res.sendFile(path.join(clientBuildPath, "index.html"));
        const tags = [
            `<title>${esc(card.title)}</title>`,
            `<meta name="description" content="${esc(card.description)}" />`,
            `<meta property="og:type" content="article" />`,
            `<meta property="og:site_name" content="Naib Baghirov" />`,
            `<meta property="og:title" content="${esc(card.title)}" />`,
            `<meta property="og:description" content="${esc(card.description)}" />`,
            `<meta property="og:url" content="${esc(card.url)}" />`,
            `<meta property="og:image" content="${esc(card.image)}" />`,
            `<meta property="og:image:width" content="1200" />`,
            `<meta property="og:image:height" content="627" />`,
            `<meta name="twitter:card" content="summary_large_image" />`,
        ].join("\n        ");
        // the shell's own title and description describe the site, so they come out rather
        // than sitting alongside the piece's and leaving the crawler to choose
        const body = shell
            .replace(/<title>[\s\S]*?<\/title>\s*/, "")
            .replace(/<meta\s+name="description"[\s\S]*?\/>\s*/, "")
            .replace("</head>", `    ${tags}\n    </head>`);
        res.type("html").send(body);
    });
}

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
