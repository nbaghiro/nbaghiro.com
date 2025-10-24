/**
 * Google Places API Client
 * Requires API key authentication
 */

const API_BASE_URL = "https://maps.googleapis.com/maps/api/place";

/**
 * Search for nearby places
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} type - Place type (e.g., 'cafe', 'restaurant', 'park')
 * @param {number} radius - Search radius in meters
 * @param {number} maxResults - Maximum results to return
 * @returns {Promise<Object>}
 */
export async function searchNearbyPlaces(
    latitude,
    longitude,
    type,
    radius = 5000,
    maxResults = 10
) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        throw new Error(
            "Google Places API key not configured. Set GOOGLE_PLACES_API_KEY in .env"
        );
    }

    const url = new URL(`${API_BASE_URL}/nearbysearch/json`);
    url.searchParams.append("location", `${latitude},${longitude}`);
    url.searchParams.append("radius", radius);
    url.searchParams.append("type", type);
    url.searchParams.append("key", apiKey);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Google Places API error: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google Places API error: ${data.status}`);
    }

    // Limit results
    return {
        ...data,
        results: data.results.slice(0, maxResults),
    };
}

/**
 * Text search for places
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum results
 * @returns {Promise<Object>}
 */
export async function textSearch(query, maxResults = 10) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        throw new Error(
            "Google Places API key not configured. Set GOOGLE_PLACES_API_KEY in .env"
        );
    }

    const url = new URL(`${API_BASE_URL}/textsearch/json`);
    url.searchParams.append("query", query);
    url.searchParams.append("key", apiKey);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Google Places API error: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google Places API error: ${data.status}`);
    }

    // Limit results
    return {
        ...data,
        results: data.results.slice(0, maxResults),
    };
}
