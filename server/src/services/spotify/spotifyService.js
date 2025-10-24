/**
 * Spotify Service - Generates weekly music listening data
 * Uses genre-specific playlists matching user preferences
 */

import {
    getPlaylistTracks,
    searchPlaylists,
    getNewReleases,
} from "./spotifyClient.js";

// User's music preferences
const GENRES = [
    "lo-fi beats",
    "chillhop electronic",
    "hardcore metal",
    "metalcore",
    "jazz classics",
    "japanese electronic",
    "ambient electronic",
    "progressive metal",
];

/**
 * Extract unique albums from playlist tracks
 * @param {Array} items - Playlist track items
 * @param {number} count - Number of albums to extract
 * @returns {Array}
 */
function extractUniqueAlbums(items, count = 12) {
    const albums = new Map();

    for (const item of items) {
        if (!item.track || !item.track.album) continue;

        const album = item.track.album;
        const albumId = album.id;

        if (!albums.has(albumId) && albums.size < count) {
            albums.set(albumId, {
                title: album.name,
                artist: album.artists[0]?.name || "Unknown Artist",
                coverUrl: album.images[0]?.url || null,
                releaseDate: album.release_date,
            });
        }

        if (albums.size >= count) break;
    }

    return Array.from(albums.values());
}

/**
 * Calculate realistic listening stats based on album count
 * @param {number} albumCount - Number of albums
 * @param {number} seed - Random seed for consistency
 * @returns {Object}
 */
function calculateStats(albumCount, seed) {
    // Use seed for deterministic "randomness"
    const random = (min, max) => {
        const x = Math.sin(seed) * 10000;
        const rand = x - Math.floor(x);
        return Math.floor(min + rand * (max - min + 1));
    };

    const songs = random(30, 65);
    const artists = Math.min(random(20, 40), songs);
    const sessions = random(5, 12);
    const minutes = random(90, 240);

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const totalTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return {
        songs,
        artists,
        sessions,
        totalTime,
    };
}

/**
 * Get weekly music data
 * @param {number} weekNumber - Week number (0 = current week)
 * @returns {Promise<Object>}
 */
export async function getWeeklyMusic(weekNumber) {
    try {
        // Rotate through genres based on week number
        const genreIndex = weekNumber % GENRES.length;
        const genre = GENRES[genreIndex];

        console.log(`[Spotify] Searching for "${genre}" playlists...`);

        // Search for playlists in this genre
        const searchData = await searchPlaylists(genre, 20);

        if (
            !searchData.playlists ||
            !searchData.playlists.items ||
            searchData.playlists.items.length === 0
        ) {
            console.log(
                `[Spotify] No playlists found for "${genre}", falling back to new releases`
            );
            // Fallback to new releases if search fails (reduced from 50 to 20 for faster response)
            const releasesData = await getNewReleases(20);
            const allAlbums = releasesData.albums?.items || [];
            const startIndex =
                (weekNumber * 3) % Math.max(1, allAlbums.length - 12);
            const selectedAlbums = allAlbums.slice(startIndex, startIndex + 12);

            const albums = selectedAlbums.map((album) => ({
                title: album.name,
                artist: album.artists[0]?.name || "Unknown Artist",
                coverUrl: album.images[0]?.url || null,
                releaseDate: album.release_date,
            }));

            const stats = calculateStats(albums.length, weekNumber + 42);
            return { ...stats, topAlbums: albums, genre };
        }

        // Select a playlist from search results
        const playlists = searchData.playlists.items;
        const playlistIndex = weekNumber % playlists.length;
        const playlist = playlists[playlistIndex];

        // Additional safety check - playlist might be null/undefined
        if (!playlist || !playlist.id) {
            console.log(
                `[Spotify] Selected playlist is invalid, falling back to new releases`
            );
            const releasesData = await getNewReleases(20);
            const allAlbums = releasesData.albums?.items || [];
            const startIndex =
                (weekNumber * 3) % Math.max(1, allAlbums.length - 12);
            const selectedAlbums = allAlbums.slice(startIndex, startIndex + 12);

            const albums = selectedAlbums.map((album) => ({
                title: album.name,
                artist: album.artists[0]?.name || "Unknown Artist",
                coverUrl: album.images[0]?.url || null,
                releaseDate: album.release_date,
            }));

            const stats = calculateStats(albums.length, weekNumber + 42);
            return { ...stats, topAlbums: albums, genre };
        }

        console.log(
            `[Spotify] Selected playlist: "${playlist.name}" (ID: ${playlist.id})`
        );

        // Fetch tracks from the playlist (reduced from 50 to 20 for faster API response)
        const tracksData = await getPlaylistTracks(playlist.id, 20);

        if (!tracksData.items || tracksData.items.length === 0) {
            throw new Error("No tracks found in playlist");
        }

        console.log(`[Spotify] Got ${tracksData.items.length} tracks`);

        // Extract albums
        const albums = extractUniqueAlbums(tracksData.items, 12);

        // Calculate stats
        const stats = calculateStats(albums.length, weekNumber + 42);

        return {
            ...stats,
            topAlbums: albums,
            playlist: playlist.name,
            genre,
        };
    } catch (error) {
        console.error("Error fetching Spotify data:", error);

        // Return fallback data on error
        return {
            songs: 45,
            artists: 32,
            sessions: 7,
            totalTime: "2h 15m",
            topAlbums: [],
            error: error.message,
        };
    }
}
