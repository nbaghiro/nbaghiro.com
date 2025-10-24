/**
 * Open Library API Client
 * No authentication required!
 */

const BASE_URL = "https://openlibrary.org";
const COVERS_URL = "https://covers.openlibrary.org";

// API response cache
const apiCache = new Map();
const API_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days (book data rarely changes)

/**
 * Get data from API cache
 * @param {string} key - Cache key
 * @returns {Object|null}
 */
function getFromCache(key) {
    const cached = apiCache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() > cached.expiresAt) {
        apiCache.delete(key);
        return null;
    }

    return cached.data;
}

/**
 * Set data in API cache
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds
 */
function setInCache(key, data, ttl = API_CACHE_TTL) {
    apiCache.set(key, {
        data,
        expiresAt: Date.now() + ttl,
    });
}

/**
 * Fetch books from a specific subject (with caching)
 * @param {string} subject - Subject name (e.g., 'science_fiction', 'bestseller')
 * @param {number} limit - Number of books to fetch
 * @returns {Promise<Object>}
 */
export async function fetchSubjectBooks(subject, limit = 10) {
    // Check cache first
    const cacheKey = `subject:${subject}:${limit}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
        console.log(`[OpenLibrary Cache] HIT for subject "${subject}"`);
        return cached;
    }

    // Cache miss - fetch from API
    console.log(`[OpenLibrary Cache] MISS for subject "${subject}"`);
    const url = `${BASE_URL}/subjects/${subject}.json?limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Open Library API error: ${response.status} ${response.statusText}`
        );
    }

    const result = await response.json();

    // Store in cache
    setInCache(cacheKey, result);

    return result;
}

/**
 * Get book cover URL by cover ID
 * @param {number} coverId - Cover ID from Open Library
 * @param {string} size - Size: S, M, or L
 * @returns {string}
 */
export function getCoverUrl(coverId, size = "M") {
    if (!coverId) {
        return null;
    }
    return `${COVERS_URL}/b/id/${coverId}-${size}.jpg`;
}

/**
 * Get book cover URL by ISBN
 * @param {string} isbn - ISBN number
 * @param {string} size - Size: S, M, or L
 * @returns {string}
 */
export function getCoverUrlByISBN(isbn, size = "M") {
    if (!isbn) {
        return null;
    }
    return `${COVERS_URL}/b/isbn/${isbn}-${size}.jpg`;
}

/**
 * Search for books
 * @param {string} query - Search query
 * @param {number} limit - Number of results
 * @returns {Promise<Object>}
 */
export async function searchBooks(query, limit = 10) {
    const url = `${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Open Library search error: ${response.status} ${response.statusText}`
        );
    }

    return await response.json();
}

/**
 * Get book details by ISBN
 * @param {string} isbn - ISBN number
 * @returns {Promise<Object>}
 */
export async function getBookByISBN(isbn) {
    const url = `${BASE_URL}/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Open Library book details error: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();
    return data[`ISBN:${isbn}`];
}
