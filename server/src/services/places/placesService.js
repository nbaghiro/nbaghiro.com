/**
 * Places Service - Generates weekly places visited data
 * Uses real place data from Google Places API
 */

import { searchNearbyPlaces } from "./placesClient.js";

// Toronto neighborhoods to rotate through
const LOCATIONS = [
    { lat: 43.6532, lng: -79.3832, name: "Downtown Toronto" },
    { lat: 43.6503, lng: -79.3596, name: "Distillery District" },
    { lat: 43.6708, lng: -79.3933, name: "Yorkville" },
    { lat: 43.6547, lng: -79.4005, name: "Kensington Market" },
    { lat: 43.6471, lng: -79.4147, name: "Queen West" },
    { lat: 43.6393, lng: -79.4197, name: "Liberty Village" },
    { lat: 43.6684, lng: -79.2956, name: "The Beaches" },
    { lat: 43.6465, lng: -79.4637, name: "High Park Area" },
];

// Place types to search for
const PLACE_TYPES = [
    { type: "cafe", weight: 40 },
    { type: "restaurant", weight: 25 },
    { type: "park", weight: 15 },
    { type: "gym", weight: 10 },
    { type: "museum", weight: 5 },
    { type: "library", weight: 5 },
];

/**
 * Select place types for a week based on weights
 * @param {number} seed - Random seed
 * @returns {Array}
 */
function selectPlaceTypes(seed) {
    // Deterministic selection based on seed
    const types = [];

    // Always include cafe
    types.push("cafe");

    // Add 1-2 more types based on seed
    const typeCount = 2 + (seed % 2);

    for (let i = 1; i < typeCount; i++) {
        const index = (seed + i) % PLACE_TYPES.length;
        const placeType = PLACE_TYPES[index].type;
        if (!types.includes(placeType)) {
            types.push(placeType);
        }
    }

    return types;
}

/**
 * Format place from Google Places API
 * @param {Object} place - Place object from API
 * @returns {Object}
 */
function formatPlace(place) {
    return {
        name: place.name,
        type: place.types?.[0] || "establishment",
        vicinity: place.vicinity,
        rating: place.rating,
    };
}

/**
 * Get weekly places data
 * @param {number} weekNumber - Week number (0 = current week)
 * @returns {Promise<Object>}
 */
export async function getWeeklyPlaces(weekNumber) {
    try {
        // Rotate through locations
        const locationIndex = weekNumber % LOCATIONS.length;
        const location = LOCATIONS[locationIndex];

        // Select place types for this week
        const types = selectPlaceTypes(weekNumber);

        const allPlaces = [];

        // Fetch places for each type
        for (const type of types) {
            try {
                const result = await searchNearbyPlaces(
                    location.lat,
                    location.lng,
                    type,
                    5000,
                    5
                );

                if (result.results && result.results.length > 0) {
                    // Take 2-3 places from each type
                    const count = 2 + (weekNumber % 2);
                    allPlaces.push(
                        ...result.results.slice(0, count).map(formatPlace)
                    );
                }
            } catch (error) {
                console.error(`Error fetching ${type} places:`, error.message);
            }
        }

        // Calculate stats
        const uniquePlaces = allPlaces.length;
        const totalVisits = uniquePlaces + Math.floor(weekNumber % 5);

        return {
            places: allPlaces,
            uniquePlaces,
            totalVisits,
            location: location.name,
        };
    } catch (error) {
        console.error("Error in getWeeklyPlaces:", error);

        // Return fallback data
        return {
            places: [],
            uniquePlaces: 0,
            totalVisits: 0,
            error: error.message,
        };
    }
}
