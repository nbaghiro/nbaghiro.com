/**
 * Activity Service - Generates realistic fitness/activity data
 * No external API - uses algorithmic generation
 */

// Activity types and their characteristics
const ACTIVITY_TYPES = {
    run: {
        weight: 50,
        minDistance: 5,
        maxDistance: 15,
        avgPaceMin: 6.0, // min/km (jogging pace)
        avgPaceMax: 8.0,
    },
    bike: {
        weight: 30,
        minDistance: 20,
        maxDistance: 40,
        avgSpeedMin: 18, // km/h
        avgSpeedMax: 25,
    },
    walk: {
        weight: 20,
        minDistance: 2,
        maxDistance: 8,
        avgPaceMin: 10.0,
        avgPaceMax: 15.0,
    },
};

/**
 * Seeded random number generator for consistency
 * @param {number} seed - Seed value
 * @returns {Function}
 */
function seededRandom(seed) {
    return function () {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}

/**
 * Get random value in range using seeded random
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {Function} random - Random function
 * @returns {number}
 */
function randomInRange(min, max, random) {
    return min + random() * (max - min);
}

/**
 * Select activity type based on weights
 * @param {Function} random - Random function
 * @returns {string}
 */
function selectActivityType(random) {
    const rand = random() * 100;
    let cumulative = 0;

    for (const [type, config] of Object.entries(ACTIVITY_TYPES)) {
        cumulative += config.weight;
        if (rand <= cumulative) {
            return type;
        }
    }

    return "run"; // Fallback
}

/**
 * Format duration in minutes to readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string}
 */
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    } else if (mins > 0 && secs > 0) {
        return `${mins}m ${secs}s`;
    } else {
        return `${mins}m`;
    }
}

/**
 * Generate a single activity
 * @param {string} type - Activity type
 * @param {number} weekNumber - Week number for seeding
 * @param {number} activityIndex - Activity index for seeding
 * @param {string} date - Activity date
 * @returns {Object}
 */
function generateActivity(type, weekNumber, activityIndex, date) {
    const random = seededRandom(weekNumber * 1000 + activityIndex * 10);
    const config = ACTIVITY_TYPES[type];

    const distance = randomInRange(
        config.minDistance,
        config.maxDistance,
        random
    );

    let duration, pace, speed;

    if (type === "run" || type === "walk") {
        // Calculate based on pace
        pace = randomInRange(config.avgPaceMin, config.avgPaceMax, random);
        duration = distance * pace; // total minutes
        speed = 60 / pace; // km/h

        return {
            id: `${weekNumber}-${activityIndex}`,
            type,
            distance: parseFloat(distance.toFixed(2)),
            duration: formatDuration(duration),
            date,
            pace: `${pace.toFixed(2)}/km`,
            avgSpeed: `${speed.toFixed(1)} km/h`,
        };
    } else {
        // Bike - calculate based on speed
        speed = randomInRange(config.avgSpeedMin, config.avgSpeedMax, random);
        duration = (distance / speed) * 60; // minutes

        return {
            id: `${weekNumber}-${activityIndex}`,
            type,
            distance: parseFloat(distance.toFixed(2)),
            duration: formatDuration(duration),
            date,
            avgSpeed: `${speed.toFixed(1)} km/h`,
        };
    }
}

/**
 * Get date for activity within a week
 * @param {string} weekStart - Week start date (ISO string)
 * @param {number} dayOffset - Day offset (0-6)
 * @returns {string}
 */
function getActivityDate(weekStart, dayOffset) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().split("T")[0];
}

/**
 * Generate weekly activity data
 * Max 1 run, max 1 bike per week for realism
 * @param {number} weekNumber - Week number (0 = current week)
 * @param {string} weekStart - Week start date (ISO string)
 * @returns {Object}
 */
export function getWeeklyActivity(weekNumber, weekStart) {
    const random = seededRandom(weekNumber * 100);

    const activities = [];
    const usedDays = new Set();
    const activityCounts = { run: 0, bike: 0, walk: 0 };
    let activityIndex = 0;

    // 50% chance of a run
    if (random() < 0.5) {
        const dayOffset = Math.floor(randomInRange(0, 7, random));
        usedDays.add(dayOffset);
        const date = getActivityDate(weekStart, dayOffset);
        activities.push(generateActivity("run", weekNumber, activityIndex++, date));
        activityCounts.run = 1;
    }

    // 30% chance of a bike ride (if not same day as run)
    if (random() < 0.3) {
        let dayOffset;
        let attempts = 0;
        do {
            dayOffset = Math.floor(randomInRange(0, 7, random));
            attempts++;
        } while (usedDays.has(dayOffset) && attempts < 10);

        if (!usedDays.has(dayOffset)) {
            usedDays.add(dayOffset);
            const date = getActivityDate(weekStart, dayOffset);
            activities.push(generateActivity("bike", weekNumber, activityIndex++, date));
            activityCounts.bike = 1;
        }
    }

    // Add 1-3 walks
    const walkCount = Math.floor(randomInRange(1, 4, random));
    for (let i = 0; i < walkCount; i++) {
        let dayOffset;
        let attempts = 0;
        do {
            dayOffset = Math.floor(randomInRange(0, 7, random));
            attempts++;
        } while (usedDays.has(dayOffset) && attempts < 10);

        if (attempts < 10) {
            usedDays.add(dayOffset);
            const date = getActivityDate(weekStart, dayOffset);
            activities.push(generateActivity("walk", weekNumber, activityIndex++, date));
            activityCounts.walk++;
        }
    }

    // Sort activities by date
    activities.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate totals
    const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
    const runs = activities.filter((a) => a.type === "run");
    const bikes = activities.filter((a) => a.type === "bike");
    const walks = activities.filter((a) => a.type === "walk");

    // Generate realistic step count
    const baseSteps = 45000 + weekNumber * 100;
    const steps = Math.floor(baseSteps + randomInRange(-5000, 10000, random));

    return {
        steps,
        distance: parseFloat(totalDistance.toFixed(2)),
        activities,
        summary: {
            runs: runs.length,
            runDistance: parseFloat(
                runs.reduce((sum, a) => sum + a.distance, 0).toFixed(2)
            ),
            bikes: bikes.length,
            bikeDistance: parseFloat(
                bikes.reduce((sum, a) => sum + a.distance, 0).toFixed(2)
            ),
            walks: walks.length,
            walkDistance: parseFloat(
                walks.reduce((sum, a) => sum + a.distance, 0).toFixed(2)
            ),
        },
    };
}
