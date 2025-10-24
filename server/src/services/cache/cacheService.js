/**
 * Two-Tier Cache Service
 * L1: In-Memory LRU (10 most recent weeks)
 * L2: Firestore (all weeks, persistent across restarts)
 */

import { LRUCache } from "lru-cache";
import { getWeeksCollection, getYearsCollection } from "./firestoreClient.js";

// L1: In-memory LRU cache for hot data
const memoryCache = new LRUCache({
    max: 10, // Store 10 most recent weeks
    ttl: 1000 * 60 * 60, // 1 hour TTL
    updateAgeOnGet: true,
});

// Cache statistics
const stats = {
    l1Hits: 0,
    l2Hits: 0,
    misses: 0,
    writes: 0,
};

/**
 * Calculate TTL based on week number
 * @param {number} weekNumber - Week number (0 = current week)
 * @returns {number|null} TTL in milliseconds, null for no expiry
 */
function getTTL(weekNumber) {
    if (weekNumber === 0) return 3600 * 1000; // 1 hour (current week changes)
    if (weekNumber <= 4) return 24 * 3600 * 1000; // 24 hours (recent)
    if (weekNumber <= 52) return 7 * 24 * 3600 * 1000; // 7 days (this year)
    return null; // Never expires (historical data is immutable)
}

/**
 * Check if cached data is expired
 * @param {Object} cachedData - Cached data with expiresAt field
 * @returns {boolean}
 */
function isExpired(cachedData) {
    if (!cachedData.expiresAt) return false; // No expiry
    return Date.now() > cachedData.expiresAt;
}

/**
 * Get week data from cache (two-tier lookup)
 * @param {number} weekNumber - Week number
 * @returns {Promise<Object|null>}
 */
export async function getWeekFromCache(weekNumber) {
    const cacheKey = `week-${weekNumber}`;

    // L1: Check in-memory cache
    if (memoryCache.has(cacheKey)) {
        stats.l1Hits++;
        console.log(`[Cache] L1 HIT for week ${weekNumber}`);
        return memoryCache.get(cacheKey);
    }

    // L2: Check Firestore
    const weeksCollection = getWeeksCollection();
    if (!weeksCollection) {
        console.log("[Cache] Firestore not available, skipping L2");
        stats.misses++;
        return null;
    }

    try {
        const docRef = weeksCollection.doc(cacheKey);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();

            // Check if expired
            if (isExpired(data)) {
                console.log(`[Cache] L2 EXPIRED for week ${weekNumber}`);
                stats.misses++;
                return null;
            }

            stats.l2Hits++;
            console.log(`[Cache] L2 HIT for week ${weekNumber}`);

            // Promote to L1
            memoryCache.set(cacheKey, data);

            return data;
        }
    } catch (error) {
        console.error(
            `[Cache] Error reading from Firestore for week ${weekNumber}:`,
            error.message
        );
    }

    stats.misses++;
    console.log(`[Cache] MISS for week ${weekNumber}`);
    return null;
}

/**
 * Set week data in cache (write to both tiers)
 * @param {number} weekNumber - Week number
 * @param {Object} data - Week data
 * @returns {Promise<void>}
 */
export async function setWeekInCache(weekNumber, data) {
    const cacheKey = `week-${weekNumber}`;
    const ttl = getTTL(weekNumber);

    // Add metadata
    const cachedData = {
        ...data,
        cachedAt: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : null,
    };

    // Write to L1
    memoryCache.set(cacheKey, cachedData, { ttl });

    // Write to L2 (Firestore)
    const weeksCollection = getWeeksCollection();
    if (weeksCollection) {
        try {
            await weeksCollection.doc(cacheKey).set(cachedData);
            stats.writes++;
            console.log(`[Cache] Wrote week ${weekNumber} to Firestore`);
        } catch (error) {
            console.error(
                `[Cache] Error writing to Firestore for week ${weekNumber}:`,
                error.message
            );
        }
    }
}

/**
 * Get year data from cache
 * @param {number} year - Year (e.g., 2025)
 * @returns {Promise<Object|null>}
 */
export async function getYearFromCache(year) {
    const cacheKey = `year-${year}`;

    // Check in-memory first
    if (memoryCache.has(cacheKey)) {
        stats.l1Hits++;
        return memoryCache.get(cacheKey);
    }

    // Check Firestore
    const yearsCollection = getYearsCollection();
    if (!yearsCollection) {
        stats.misses++;
        return null;
    }

    try {
        const docRef = yearsCollection.doc(cacheKey);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();

            // Years expire after 24 hours (current year changes, past years don't)
            const currentYear = new Date().getFullYear();
            const ttl = year === currentYear ? 24 * 3600 * 1000 : null;

            if (data.expiresAt && Date.now() > data.expiresAt) {
                stats.misses++;
                return null;
            }

            stats.l2Hits++;

            // Promote to L1
            memoryCache.set(cacheKey, data, { ttl });

            return data;
        }
    } catch (error) {
        console.error(
            `[Cache] Error reading year ${year} from Firestore:`,
            error.message
        );
    }

    stats.misses++;
    return null;
}

/**
 * Set year data in cache
 * @param {number} year - Year
 * @param {Object} data - Year data
 * @returns {Promise<void>}
 */
export async function setYearInCache(year, data) {
    const cacheKey = `year-${year}`;
    const currentYear = new Date().getFullYear();
    const ttl = year === currentYear ? 24 * 3600 * 1000 : null;

    const cachedData = {
        ...data,
        cachedAt: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : null,
    };

    // Write to L1
    memoryCache.set(cacheKey, cachedData, { ttl });

    // Write to L2
    const yearsCollection = getYearsCollection();
    if (yearsCollection) {
        try {
            await yearsCollection.doc(cacheKey).set(cachedData);
            stats.writes++;
        } catch (error) {
            console.error(
                `[Cache] Error writing year ${year} to Firestore:`,
                error.message
            );
        }
    }
}

/**
 * Invalidate cache for specific week
 * @param {number} weekNumber - Week number
 * @returns {Promise<void>}
 */
export async function invalidateWeek(weekNumber) {
    const cacheKey = `week-${weekNumber}`;

    // Remove from L1
    memoryCache.delete(cacheKey);

    // Remove from L2
    const weeksCollection = getWeeksCollection();
    if (weeksCollection) {
        try {
            await weeksCollection.doc(cacheKey).delete();
            console.log(`[Cache] Invalidated week ${weekNumber}`);
        } catch (error) {
            console.error(
                `[Cache] Error invalidating week ${weekNumber}:`,
                error.message
            );
        }
    }
}

/**
 * Clear all cache
 * @returns {Promise<void>}
 */
export async function clearAllCache() {
    // Clear L1
    memoryCache.clear();
    console.log("[Cache] Cleared in-memory cache");

    // Clear L2 (Firestore)
    const weeksCollection = getWeeksCollection();
    if (weeksCollection) {
        try {
            const snapshot = await weeksCollection.get();
            const batch = weeksCollection.firestore.batch();

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(
                `[Cache] Cleared ${snapshot.size} documents from Firestore`
            );
        } catch (error) {
            console.error("[Cache] Error clearing Firestore:", error.message);
        }
    }
}

/**
 * Warm cache with specific weeks (parallel execution for speed)
 * @param {Function} fetchWeekFn - Function to fetch week data
 * @param {number[]} weekNumbers - Array of week numbers to warm
 * @returns {Promise<void>}
 */
export async function warmCache(fetchWeekFn, weekNumbers) {
    console.log(`[Cache] Warming cache for ${weekNumbers.length} weeks in parallel: ${weekNumbers.join(", ")}`);

    const startTime = Date.now();

    // Warm all weeks in parallel for maximum speed
    const results = await Promise.allSettled(
        weekNumbers.map(async (weekNumber) => {
            try {
                // Check if already cached
                const cached = await getWeekFromCache(weekNumber);
                if (cached) {
                    console.log(`[Cache] Week ${weekNumber} already cached (skipped)`);
                    return { weekNumber, status: 'cached' };
                }

                // Fetch and cache
                const data = await fetchWeekFn(weekNumber);
                await setWeekInCache(weekNumber, data);
                console.log(`[Cache] ✓ Warmed week ${weekNumber}`);
                return { weekNumber, status: 'warmed' };
            } catch (error) {
                console.error(
                    `[Cache] ✗ Error warming week ${weekNumber}:`,
                    error.message
                );
                return { weekNumber, status: 'error', error: error.message };
            }
        })
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[Cache] Warming complete in ${elapsed}s (${successful} successful, ${failed} failed)`);
}

/**
 * Get cache statistics
 * @returns {Object}
 */
export function getCacheStats() {
    const total = stats.l1Hits + stats.l2Hits + stats.misses;
    const hitRate = total > 0 ? ((stats.l1Hits + stats.l2Hits) / total) * 100 : 0;

    return {
        ...stats,
        total,
        hitRate: hitRate.toFixed(2) + "%",
        l1Size: memoryCache.size,
    };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats() {
    stats.l1Hits = 0;
    stats.l2Hits = 0;
    stats.misses = 0;
    stats.writes = 0;
}
