/**
 * Resilient HTTP Client
 * Adds timeout and retry capabilities to fetch requests
 */

/**
 * Fetch with timeout - prevents requests from hanging indefinitely
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds (default 15s)
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeout = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Fetch with automatic retry on transient failures
 * Retries on network errors and 5xx status codes
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} retries - Number of retry attempts (default 2)
 * @param {number} timeout - Timeout per request in ms (default 15s)
 * @returns {Promise<Response>}
 */
export async function resilientFetch(url, options = {}, retries = 2, timeout = 15000) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetchWithTimeout(url, options, timeout);

            // Don't retry client errors (4xx) or success
            if (response.ok || response.status < 500) {
                return response;
            }

            // Server error (5xx) - will retry
            console.log(
                `[HTTP] Attempt ${attempt + 1}/${retries + 1} failed with ${response.status}, retrying...`
            );
            lastError = new Error(`HTTP ${response.status}`);
        } catch (error) {
            lastError = error;

            // Don't retry on abort (timeout) or last attempt
            if (error.name === "AbortError") {
                console.log(
                    `[HTTP] Attempt ${attempt + 1}/${retries + 1} timed out after ${timeout}ms`
                );
            } else {
                console.log(
                    `[HTTP] Attempt ${attempt + 1}/${retries + 1} failed: ${error.message}`
                );
            }

            if (attempt === retries) {
                throw lastError;
            }
        }

        // Exponential backoff: 1s, 2s, 4s...
        const backoffMs = 1000 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoffMs));
    }

    throw lastError;
}
