import express from "express";
import {
    generateWeekData,
    generateWeeks,
    clearCache,
} from "../../services/weekDataService.js";
import {
    getYearlyData,
    getAvailableYears,
} from "../../services/yearDataService.js";
import {
    getCacheStats,
    invalidateWeek,
} from "../../services/cache/cacheService.js";

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Get multiple weeks of data
router.get("/weeks", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        // Validate parameters
        if (limit < 1 || limit > 52) {
            return res.status(400).json({
                error: "limit must be between 1 and 52",
            });
        }

        if (offset < 0 || offset > 52) {
            return res.status(400).json({
                error: "offset must be between 0 and 52",
            });
        }

        const weeks = await generateWeeks(limit, offset);

        res.json({
            weeks,
            meta: {
                limit,
                offset,
                count: weeks.length,
            },
        });
    } catch (error) {
        console.error("Error generating weeks:", error);
        res.status(500).json({
            error: "Failed to generate week data",
            message: error.message,
        });
    }
});

// Get single week data
router.get("/weeks/:weekNumber", async (req, res) => {
    try {
        const weekNumber = parseInt(req.params.weekNumber);

        if (isNaN(weekNumber) || weekNumber < 0 || weekNumber > 52) {
            return res.status(400).json({
                error: "weekNumber must be between 0 and 52",
            });
        }

        const weekData = await generateWeekData(weekNumber);

        res.json(weekData);
    } catch (error) {
        console.error(`Error generating week ${req.params.weekNumber}:`, error);
        res.status(500).json({
            error: "Failed to generate week data",
            message: error.message,
        });
    }
});

// Get available years
router.get("/years", (req, res) => {
    try {
        const years = getAvailableYears();
        res.json({
            years,
            meta: {
                count: years.length,
            },
        });
    } catch (error) {
        console.error("Error getting available years:", error);
        res.status(500).json({
            error: "Failed to get available years",
            message: error.message,
        });
    }
});

// Get yearly data
router.get("/years/:yearNumber", async (req, res) => {
    try {
        const requestedYear = parseInt(req.params.yearNumber);
        const currentYear = new Date().getFullYear();

        if (isNaN(requestedYear)) {
            return res.status(400).json({
                error: "yearNumber must be a valid number",
            });
        }

        if (requestedYear < currentYear - 5 || requestedYear > currentYear) {
            return res.status(400).json({
                error: `yearNumber must be between ${currentYear - 5} and ${currentYear}`,
            });
        }

        const yearOffset = currentYear - requestedYear;
        const yearData = await getYearlyData(yearOffset);

        res.json(yearData);
    } catch (error) {
        console.error(`Error generating year ${req.params.yearNumber}:`, error);
        res.status(500).json({
            error: "Failed to generate year data",
            message: error.message,
        });
    }
});

// Get cache statistics
router.get("/cache/stats", (req, res) => {
    try {
        const stats = getCacheStats();
        res.json(stats);
    } catch (error) {
        console.error("Error getting cache stats:", error);
        res.status(500).json({
            error: "Failed to get cache stats",
            message: error.message,
        });
    }
});

// Clear cache endpoint (useful for development)
router.post("/cache/clear", async (req, res) => {
    try {
        await clearCache();
        res.json({
            message: "Cache cleared successfully",
        });
    } catch (error) {
        console.error("Error clearing cache:", error);
        res.status(500).json({
            error: "Failed to clear cache",
            message: error.message,
        });
    }
});

// Invalidate specific week cache
router.post("/cache/invalidate/:weekNumber", async (req, res) => {
    try {
        const weekNumber = parseInt(req.params.weekNumber);

        if (isNaN(weekNumber) || weekNumber < 0 || weekNumber > 260) {
            return res.status(400).json({
                error: "weekNumber must be between 0 and 260",
            });
        }

        await invalidateWeek(weekNumber);
        res.json({
            message: `Cache invalidated for week ${weekNumber}`,
        });
    } catch (error) {
        console.error(
            `Error invalidating cache for week ${req.params.weekNumber}:`,
            error
        );
        res.status(500).json({
            error: "Failed to invalidate cache",
            message: error.message,
        });
    }
});

export default router;
