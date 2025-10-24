/**
 * Year Data Service - Aggregates weekly data into yearly summaries
 */

import { getWeekDates } from "../utils/dateUtils.js";
import { getWeeklyMusic } from "./spotify/spotifyService.js";
import { getWeeklyPlaces } from "./places/placesService.js";
import { getWeeklyBooks } from "./books/booksService.js";
import { getWeeklyActivity } from "./activity/activityService.js";
import {
    getYearFromCache,
    setYearInCache,
} from "./cache/cacheService.js";

/**
 * Get yearly data by aggregating 52 weeks
 * @param {number} yearOffset - Year offset (0 = current year, 1 = last year, etc.)
 * @returns {Promise<Object>}
 */
export async function getYearlyData(yearOffset = 0) {
    const now = new Date();
    const targetYear = now.getFullYear() - yearOffset;

    // Check cache first
    const cached = await getYearFromCache(targetYear);
    if (cached) {
        return cached;
    }

    console.log(`\n[Year Data] Aggregating data for year ${targetYear}...`);

    // Calculate week offset for the start of the target year
    const startOfYear = new Date(targetYear, 0, 1);
    const weeksSinceStart = Math.floor(
        (now - startOfYear) / (7 * 24 * 60 * 60 * 1000)
    );

    // For past years, use all 52 weeks. For current year, use weeks up to now
    const weeksToAggregate =
        yearOffset === 0 ? Math.min(weeksSinceStart, 52) : 52;

    const weekOffset = yearOffset * 52;

    console.log(
        `[Year Data] Aggregating ${weeksToAggregate} weeks starting from week offset ${weekOffset}`
    );

    // Aggregate data
    const aggregatedMusic = {
        totalSongs: 0,
        totalArtists: 0,
        totalSessions: 0,
        totalMinutes: 0,
        topAlbums: [],
    };

    const aggregatedActivity = {
        totalSteps: 0,
        totalDistance: 0,
        totalRuns: 0,
        totalRunDistance: 0,
        totalBikes: 0,
        totalBikeDistance: 0,
        totalWalks: 0,
        totalWalkDistance: 0,
    };

    const aggregatedPlaces = {
        totalUniquePlaces: 0,
        totalVisits: 0,
        placesByNeighborhood: {},
    };

    const aggregatedBooks = {
        totalBooksFinished: 0,
        totalBooksStarted: 0,
        genres: {},
    };

    // Fetch and aggregate a sample of weeks (not all 52 for performance)
    const sampleWeeks = Math.min(weeksToAggregate, 12);
    const sampleInterval = Math.floor(weeksToAggregate / sampleWeeks);

    for (let i = 0; i < sampleWeeks; i++) {
        const weekNum = weekOffset + i * sampleInterval;
        const weekDates = getWeekDates(weekNum);

        console.log(
            `[Year Data] Sampling week ${i + 1}/${sampleWeeks} (week #${weekNum})`
        );

        try {
            // Fetch weekly data
            const [music, places, books, activity] = await Promise.all([
                getWeeklyMusic(weekNum),
                getWeeklyPlaces(weekNum),
                getWeeklyBooks(weekNum),
                getWeeklyActivity(weekNum, weekDates.start),
            ]);

            // Aggregate music
            aggregatedMusic.totalSongs += music.songs || 0;
            aggregatedMusic.totalArtists += music.artists || 0;
            aggregatedMusic.totalSessions += music.sessions || 0;

            // Parse time string (e.g., "2h 15m" or "45m")
            const timeStr = music.totalTime || "0m";
            const hourMatch = timeStr.match(/(\d+)h/);
            const minMatch = timeStr.match(/(\d+)m/);
            const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
            const minutes = minMatch ? parseInt(minMatch[1]) : 0;
            aggregatedMusic.totalMinutes += hours * 60 + minutes;

            // Collect unique albums
            if (music.topAlbums && music.topAlbums.length > 0) {
                aggregatedMusic.topAlbums.push(...music.topAlbums.slice(0, 2));
            }

            // Aggregate activity
            aggregatedActivity.totalSteps += activity.steps || 0;
            aggregatedActivity.totalDistance += activity.distance || 0;
            aggregatedActivity.totalRuns += activity.summary?.runs || 0;
            aggregatedActivity.totalRunDistance +=
                activity.summary?.runDistance || 0;
            aggregatedActivity.totalBikes += activity.summary?.bikes || 0;
            aggregatedActivity.totalBikeDistance +=
                activity.summary?.bikeDistance || 0;
            aggregatedActivity.totalWalks += activity.summary?.walks || 0;
            aggregatedActivity.totalWalkDistance +=
                activity.summary?.walkDistance || 0;

            // Aggregate places
            aggregatedPlaces.totalUniquePlaces += places.uniquePlaces || 0;
            aggregatedPlaces.totalVisits += places.totalVisits || 0;
            if (places.location) {
                aggregatedPlaces.placesByNeighborhood[places.location] =
                    (aggregatedPlaces.placesByNeighborhood[places.location] ||
                        0) + (places.uniquePlaces || 0);
            }

            // Aggregate books
            aggregatedBooks.totalBooksFinished += books.finished?.length || 0;
            aggregatedBooks.totalBooksStarted += books.started?.length || 0;
        } catch (error) {
            console.error(`[Year Data] Error fetching week ${weekNum}:`, error);
        }
    }

    // Extrapolate to full year
    const extrapolationFactor = weeksToAggregate / sampleWeeks;

    aggregatedMusic.totalSongs = Math.round(
        aggregatedMusic.totalSongs * extrapolationFactor
    );
    aggregatedMusic.totalArtists = Math.round(
        aggregatedMusic.totalArtists * extrapolationFactor
    );
    aggregatedMusic.totalSessions = Math.round(
        aggregatedMusic.totalSessions * extrapolationFactor
    );
    aggregatedMusic.totalMinutes = Math.round(
        aggregatedMusic.totalMinutes * extrapolationFactor
    );

    aggregatedActivity.totalSteps = Math.round(
        aggregatedActivity.totalSteps * extrapolationFactor
    );
    aggregatedActivity.totalDistance = parseFloat(
        (aggregatedActivity.totalDistance * extrapolationFactor).toFixed(2)
    );
    aggregatedActivity.totalRuns = Math.round(
        aggregatedActivity.totalRuns * extrapolationFactor
    );
    aggregatedActivity.totalRunDistance = parseFloat(
        (aggregatedActivity.totalRunDistance * extrapolationFactor).toFixed(2)
    );
    aggregatedActivity.totalBikes = Math.round(
        aggregatedActivity.totalBikes * extrapolationFactor
    );
    aggregatedActivity.totalBikeDistance = parseFloat(
        (aggregatedActivity.totalBikeDistance * extrapolationFactor).toFixed(2)
    );
    aggregatedActivity.totalWalks = Math.round(
        aggregatedActivity.totalWalks * extrapolationFactor
    );
    aggregatedActivity.totalWalkDistance = parseFloat(
        (aggregatedActivity.totalWalkDistance * extrapolationFactor).toFixed(2)
    );

    aggregatedPlaces.totalUniquePlaces = Math.round(
        aggregatedPlaces.totalUniquePlaces * extrapolationFactor
    );
    aggregatedPlaces.totalVisits = Math.round(
        aggregatedPlaces.totalVisits * extrapolationFactor
    );

    aggregatedBooks.totalBooksFinished = Math.round(
        aggregatedBooks.totalBooksFinished * extrapolationFactor
    );
    aggregatedBooks.totalBooksStarted = Math.round(
        aggregatedBooks.totalBooksStarted * extrapolationFactor
    );

    // Format music time
    const totalHours = Math.floor(aggregatedMusic.totalMinutes / 60);
    const formattedTime = `${totalHours}h ${aggregatedMusic.totalMinutes % 60}m`;

    // Get unique top albums
    const uniqueAlbums = aggregatedMusic.topAlbums
        .filter(
            (album, index, self) =>
                index === self.findIndex((a) => a.title === album.title)
        )
        .slice(0, 24);

    console.log(`[Year Data] Completed aggregation for year ${targetYear}`);

    const yearData = {
        year: targetYear,
        weeksIncluded: weeksToAggregate,
        music: {
            songs: aggregatedMusic.totalSongs,
            artists: aggregatedMusic.totalArtists,
            sessions: aggregatedMusic.totalSessions,
            totalTime: formattedTime,
            topAlbums: uniqueAlbums,
        },
        activity: {
            steps: aggregatedActivity.totalSteps,
            distance: aggregatedActivity.totalDistance,
            runs: aggregatedActivity.totalRuns,
            runDistance: aggregatedActivity.totalRunDistance,
            bikes: aggregatedActivity.totalBikes,
            bikeDistance: aggregatedActivity.totalBikeDistance,
            walks: aggregatedActivity.totalWalks,
            walkDistance: aggregatedActivity.totalWalkDistance,
        },
        places: {
            uniquePlaces: aggregatedPlaces.totalUniquePlaces,
            visits: aggregatedPlaces.totalVisits,
            neighborhoods: aggregatedPlaces.placesByNeighborhood,
        },
        books: {
            finished: aggregatedBooks.totalBooksFinished,
            started: aggregatedBooks.totalBooksStarted,
        },
    };

    // Store in cache
    await setYearInCache(targetYear, yearData);

    return yearData;
}

/**
 * Get list of available years
 * @returns {Array}
 */
export function getAvailableYears() {
    const currentYear = new Date().getFullYear();
    // Return last 3 years
    return [currentYear, currentYear - 1, currentYear - 2];
}
