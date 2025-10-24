/**
 * Spotify Web API Client
 * Uses Client Credentials Flow (no user authentication)
 */

const AUTH_URL = "https://accounts.spotify.com/api/token";
const API_BASE_URL = "https://api.spotify.com/v1";

// Token cache
let accessToken = null;
let tokenExpiry = null;

// API response cache (for playlists, searches, etc.)
const apiCache = new Map();
const API_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
 * Get access token using Client Credentials flow
 * @returns {Promise<string>}
 */
async function getAccessToken() {
    // Return cached token if still valid
    if (accessToken && Date.now() < tokenExpiry) {
        return accessToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            "Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env"
        );
    }

    // Create Basic auth header
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(AUTH_URL, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Spotify auth error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Cache the token
    accessToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // Expire 1 min early

    return accessToken;
}

/**
 * Make an authenticated request to Spotify API
 * @param {string} endpoint - API endpoint (e.g., '/playlists/xxx')
 * @returns {Promise<Object>}
 */
async function spotifyRequest(endpoint) {
    const token = await getAccessToken();
    const url = `${API_BASE_URL}${endpoint}`;

    console.log(`[Spotify API] Request: ${url}`);

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`[Spotify API] Error ${response.status} for ${url}`);
        console.error(`[Spotify API] Response: ${error}`);
        throw new Error(`Spotify API error: ${response.status} - ${error}`);
    }

    return await response.json();
}

/**
 * Get playlist tracks
 * @param {string} playlistId - Spotify playlist ID
 * @param {number} limit - Number of tracks to fetch
 * @returns {Promise<Object>}
 */
export async function getPlaylistTracks(playlistId, limit = 50) {
    return await spotifyRequest(
        `/playlists/${playlistId}/tracks?limit=${limit}`
    );
}

/**
 * Get featured playlists
 * @param {number} limit - Number of playlists
 * @returns {Promise<Object>}
 */
export async function getFeaturedPlaylists(limit = 20) {
    return await spotifyRequest(`/browse/featured-playlists?limit=${limit}`);
}

/**
 * Get new releases
 * @param {number} limit - Number of albums
 * @returns {Promise<Object>}
 */
export async function getNewReleases(limit = 20) {
    return await spotifyRequest(`/browse/new-releases?limit=${limit}`);
}

/**
 * Get category playlists
 * @param {string} categoryId - Category ID
 * @param {number} limit - Number of playlists
 * @returns {Promise<Object>}
 */
export async function getCategoryPlaylists(categoryId, limit = 20) {
    return await spotifyRequest(
        `/browse/categories/${categoryId}/playlists?limit=${limit}`
    );
}

/**
 * Search for playlists by query (with caching)
 * @param {string} query - Search query
 * @param {number} limit - Number of results
 * @returns {Promise<Object>}
 */
export async function searchPlaylists(query, limit = 20) {
    // Check cache first
    const cacheKey = `search:${query}:${limit}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
        console.log(`[Spotify Cache] HIT for search "${query}"`);
        return cached;
    }

    // Cache miss - fetch from API
    console.log(`[Spotify Cache] MISS for search "${query}"`);
    const encodedQuery = encodeURIComponent(query);
    const result = await spotifyRequest(
        `/search?q=${encodedQuery}&type=playlist&limit=${limit}`
    );

    // Store in cache
    setInCache(cacheKey, result);

    return result;
}
