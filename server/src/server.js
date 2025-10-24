import dotenv from "dotenv";
import app from "./app.js";
import { warmCache } from "./services/cache/cacheService.js";
import { generateWeekData } from "./services/weekDataService.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`✅ Server ready to accept requests\n`);

    // Warm cache in background (non-blocking for instant server startup)
    console.log("⚡ Starting background cache warming for 12 weeks...");
    warmCache(generateWeekData, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
        .then(() => {
            console.log("✅ Background cache warming finished - all weeks are now cached!\n");
        })
        .catch((error) => {
            console.error("❌ Background cache warming failed:", error.message);
        });
});
