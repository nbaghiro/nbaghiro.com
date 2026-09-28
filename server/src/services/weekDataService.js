/**
 * Week Data Service - Orchestrates all data sources
 * Combines music, activity, places, and reading data
 */

import { getWeeklyMusic } from "./spotify/spotifyService.js";
import { getWeeklyActivity } from "./activity/activityService.js";
import { getWeeklyPlaces } from "./places/placesService.js";
import { getWeeklyBooks } from "./books/booksService.js";
import { getWeekDates } from "../utils/dateUtils.js";
import {
    getWeekFromCache,
    setWeekInCache,
    setWeekInCacheWithShortTTL,
} from "./cache/cacheService.js";

/**
 * Check if week data is complete enough for long-term caching
 * Incomplete data gets cached with a short TTL for automatic retry
 * @param {Object} weekData - Week data to validate
 * @returns {boolean}
 */
function isDataComplete(weekData) {
    // Music data should have at least 6 album covers
    const albumCount = weekData.listening?.topAlbums?.length || 0;
    const hasEnoughAlbums = albumCount >= 6;

    if (!hasEnoughAlbums) {
        console.log(
            `[WeekData] Week ${weekData.weekNumber} incomplete: only ${albumCount} albums (need 6+)`
        );
        return false;
    }

    // Check if any book section has a book with a cover
    const hasBookWithCover =
        weekData.reading?.currently?.some((b) => b.coverUrl) ||
        weekData.reading?.started?.some((b) => b.coverUrl) ||
        weekData.reading?.finished?.some((b) => b.coverUrl);

    // Books are optional but log if missing
    if (!hasBookWithCover) {
        console.log(
            `[WeekData] Week ${weekData.weekNumber} has no book covers (books are optional)`
        );
    }

    return true;
}

/**
 * Check which weeks are cached
 * @param {number[]} weekNumbers - Array of week numbers to check
 * @returns {Promise<{cached: number[], uncached: number[]}>}
 */
async function checkCacheStatus(weekNumbers) {
    const cached = [];
    const uncached = [];

    await Promise.all(
        weekNumbers.map(async (weekNum) => {
            const cachedData = await getWeekFromCache(weekNum);
            if (cachedData) {
                cached.push(weekNum);
            } else {
                uncached.push(weekNum);
            }
        })
    );

    return { cached, uncached };
}

/**
 * Generate data for a single week
 * @param {number} weekNumber - Week number (0 = current week)
 * @returns {Promise<Object>}
 */
export async function generateWeekData(weekNumber) {
    // Check cache first (two-tier: memory + Firestore)
    const cached = await getWeekFromCache(weekNumber);
    if (cached) {
        return cached;
    }

    // Cache miss - generate fresh data
    const weekDates = getWeekDates(weekNumber);

    console.log(`[WeekData] Generating data for week ${weekNumber}...`);

    // Fetch all data in parallel
    const [listening, activity, places, reading] = await Promise.all([
        getWeeklyMusic(weekNumber),
        getWeeklyActivity(weekNumber, weekDates.start),
        getWeeklyPlaces(weekNumber),
        getWeeklyBooks(weekNumber),
    ]);

    const weekData = {
        weekNumber,
        startDate: weekDates.start,
        endDate: weekDates.end,
        listening,
        activity,
        places,
        reading,
    };

    // Store in cache - use short TTL for incomplete data so it retries automatically
    if (isDataComplete(weekData)) {
        await setWeekInCache(weekNumber, weekData);
    } else {
        await setWeekInCacheWithShortTTL(weekNumber, weekData);
    }

    return weekData;
}

/**
 * Generate multiple weeks of data
 * Smart parallel/sequential generation based on cache status
 * @param {number} count - Number of weeks to generate
 * @param {number} offset - Starting week number
 * @returns {Promise<Array>}
 */
export async function generateWeeks(count = 10, offset = 0) {
    const weekNumbers = Array.from({ length: count }, (_, i) => offset + i);

    // Check which weeks are cached
    const { cached, uncached } = await checkCacheStatus(weekNumbers);

    console.log(
        `[WeekData] Generating ${count} weeks: ${cached.length} cached, ${uncached.length} uncached`
    );

    const weeks = [];

    // Generate cached weeks in parallel (fast, no rate limit concerns)
    if (cached.length > 0) {
        console.log(`[WeekData] Fetching ${cached.length} cached weeks in parallel...`);
        const cachedWeeks = await Promise.all(
            cached.map(async (weekNum) => {
                try {
                    return await generateWeekData(weekNum);
                } catch (error) {
                    console.error(`Error generating cached week ${weekNum}:`, error);
                    return null;
                }
            })
        );
        weeks.push(...cachedWeeks.filter(Boolean));
    }

    // Generate uncached weeks sequentially (avoid rate limiting)
    if (uncached.length > 0) {
        console.log(`[WeekData] Generating ${uncached.length} uncached weeks sequentially...`);
        for (const weekNum of uncached) {
            try {
                const weekData = await generateWeekData(weekNum);
                weeks.push(weekData);
            } catch (error) {
                console.error(`Error generating uncached week ${weekNum}:`, error);
            }
        }
    }

    // Sort weeks by weekNumber to maintain order
    weeks.sort((a, b) => a.weekNumber - b.weekNumber);

    return weeks;
}

/**
 * Clear the cache (useful for development/testing)
 */
export async function clearCache() {
    const { clearAllCache } = await import("./cache/cacheService.js");
    await clearAllCache();
}
