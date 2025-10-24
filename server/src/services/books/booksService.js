/**
 * Books Service - Generates weekly reading data
 * Uses Open Library API to fetch real books
 */

import { fetchSubjectBooks, getCoverUrl } from "./openLibraryClient.js";

// Rotate through subjects matching user interests
// Similar to: Lords of Uncreation, The Enduring Universe, Apple in China, The Human Division
const SUBJECTS = [
    "science_fiction",
    "space",
    "artificial_intelligence",
    "technology",
    "business",
    "innovation",
    "astronomy",
    "future",
    "cyberpunk",
    "physics",
    "quantum_computing",
    "climate_change",
    "robotics",
    "machine_learning",
    "dystopian",
    "neuroscience",
    "biotechnology",
];

/**
 * Seeded random number generator for deterministic randomization
 * @param {number} seed - Seed value
 * @returns {number} - Random number between 0 and 1
 */
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

/**
 * Format a book work from Open Library into our structure
 * @param {Object} work - Work object from Open Library
 * @returns {Object}
 */
function formatBook(work) {
    return {
        title: work.title,
        author: work.authors?.[0]?.name || "Unknown Author",
        coverUrl: getCoverUrl(work.cover_id),
        key: work.key,
    };
}

/**
 * Get weekly reading data
 * Books persist for 3 weeks to simulate realistic reading pace
 * Max 2 books per week, never repeats same book
 * @param {number} weekNumber - Week number (0 = current week)
 * @returns {Promise<Object>}
 */
export async function getWeeklyBooks(weekNumber) {
    try {
        // Each book persists for 3 weeks
        const bookCycle = Math.floor(weekNumber / 3);

        // Use seeded random to pick subject (prevents linear, predictable rotation)
        const subjectSeed = bookCycle * 7 + 13; // Prime multiplier for variety
        const subjectRandom = seededRandom(subjectSeed);
        const subjectIndex = Math.floor(subjectRandom * SUBJECTS.length);
        const subject = SUBJECTS[subjectIndex];

        // Fetch books (reduced from 50 to 20 for faster API response)
        const data = await fetchSubjectBooks(subject, 20);

        if (!data.works || data.works.length === 0) {
            return {
                currently: [],
                started: [],
                finished: [],
            };
        }

        // Filter out books without covers
        const booksWithCovers = data.works.filter((work) => work.cover_id);

        if (booksWithCovers.length === 0) {
            return {
                currently: [],
                started: [],
                finished: [],
            };
        }

        // Progressive book selection - NEVER wraps back to start
        // Use modulo of larger number to pick different books from pool
        const bookSeed = bookCycle * 11 + 23; // Different prime for book selection
        const bookRandom = seededRandom(bookSeed);
        const bookIndex = Math.floor(bookRandom * booksWithCovers.length);

        // Determine reading progress based on week within cycle (0, 1, or 2)
        const weekInCycle = weekNumber % 3;

        let currently = [];
        let started = [];
        let finished = [];

        const primaryBook = formatBook(booksWithCovers[bookIndex]);

        // Reading progression: Started (oldest week) → Currently (middle) → Finished (newest)
        // Week 0 = current week (newest), Week 2 = 2 weeks ago (oldest)
        // So weekInCycle 0 should be Finished, weekInCycle 2 should be Started

        if (weekInCycle === 0) {
            // Week 0 of cycle (newest): Just finished reading
            finished.push(primaryBook);
        } else if (weekInCycle === 1) {
            // Week 1 of cycle (middle): Currently reading
            currently.push(primaryBook);
        } else {
            // Week 2 of cycle (oldest): Just started reading
            started.push(primaryBook);
        }

        return {
            currently,
            started,
            finished,
        };
    } catch (error) {
        console.error("Error fetching books:", error);
        // Return empty data on error
        return {
            currently: [],
            started: [],
            finished: [],
        };
    }
}
