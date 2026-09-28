/**
 * Books Service - Generates weekly reading data
 * Uses Open Library API to fetch real books
 */

import { fetchSubjectBooks, getCoverUrl } from "./openLibraryClient.js";
import { isValidImageUrl } from "../../utils/imageValidator.js";

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
 * Format a book and validate its cover URL
 * Returns null if cover is invalid (placeholder or 404)
 * @param {Object} work - Work object from Open Library
 * @returns {Promise<Object|null>}
 */
async function formatBookWithValidation(work) {
    const coverUrl = getCoverUrl(work.cover_id);

    // Validate the cover URL actually returns a real image
    const isValid = await isValidImageUrl(coverUrl);

    if (!isValid) {
        console.log(
            `[Books] Rejected cover for "${work.title}" - invalid or placeholder`
        );
        return null;
    }

    return {
        title: work.title,
        author: work.authors?.[0]?.name || "Unknown Author",
        coverUrl,
        key: work.key,
    };
}

/**
 * Find a book with a valid cover from a list of candidates
 * @param {Array} books - Array of book works
 * @param {number} startIndex - Index to start searching from
 * @returns {Promise<Object|null>}
 */
async function findBookWithValidCover(books, startIndex = 0) {
    // Try books starting from startIndex, wrapping around if needed
    for (let i = 0; i < books.length; i++) {
        const index = (startIndex + i) % books.length;
        const book = await formatBookWithValidation(books[index]);
        if (book) {
            return book;
        }
    }
    return null;
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

        // Filter out books without cover_id
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

        // Find a book with a valid cover (not a placeholder)
        const primaryBook = await findBookWithValidCover(booksWithCovers, bookIndex);

        if (!primaryBook) {
            console.log(
                `[Books] No valid cover found for week ${weekNumber} in subject "${subject}"`
            );
            return {
                currently: [],
                started: [],
                finished: [],
            };
        }

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
