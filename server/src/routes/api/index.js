import express from "express";
import chatRoutes from "./chat.js";

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

router.use(chatRoutes);

export default router;
