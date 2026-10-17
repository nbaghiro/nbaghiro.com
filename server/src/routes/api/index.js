import express from "express";
import bookingRoutes from "./booking.js";
import chatRoutes from "./chat.js";
import contactRoutes from "./contact.js";

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
router.use(bookingRoutes);
router.use(contactRoutes);

export default router;
