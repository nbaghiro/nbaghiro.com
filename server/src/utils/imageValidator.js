/**
 * Image URL Validation
 * Validates that image URLs return actual images, not placeholders
 */

import { fetchWithTimeout } from "./httpClient.js";

// Cache validation results for 1 hour to avoid repeated HEAD requests
const validationCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Check if an image URL returns a valid image (not a 1x1 placeholder)
 * @param {string} url - Image URL to validate
 * @returns {Promise<boolean>}
 */
export async function isValidImageUrl(url) {
    if (!url) return false;

    // Check cache first
    const cached = validationCache.get(url);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.isValid;
    }

    try {
        // Use HEAD request to check image without downloading full content
        const response = await fetchWithTimeout(url, { method: "HEAD" }, 5000);

        if (!response.ok) {
            cacheResult(url, false);
            return false;
        }

        // Check content type is an image
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.startsWith("image/")) {
            cacheResult(url, false);
            return false;
        }

        // Check content length - reject tiny images (1x1 placeholders are ~43-100 bytes)
        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength) < 200) {
            console.log(
                `[ImageValidator] Rejected ${url} - too small (${contentLength} bytes)`
            );
            cacheResult(url, false);
            return false;
        }

        cacheResult(url, true);
        return true;
    } catch (error) {
        console.log(`[ImageValidator] Failed to validate ${url}: ${error.message}`);
        cacheResult(url, false);
        return false;
    }
}

/**
 * Cache validation result
 * @param {string} url - URL that was validated
 * @param {boolean} isValid - Validation result
 */
function cacheResult(url, isValid) {
    validationCache.set(url, {
        isValid,
        expiresAt: Date.now() + CACHE_TTL,
    });
}

/**
 * Clear validation cache (useful for testing)
 */
export function clearValidationCache() {
    validationCache.clear();
}
