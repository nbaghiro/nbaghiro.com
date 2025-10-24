/**
 * Date utility functions for week calculations
 */

/**
 * Get the start of the week (Monday) for a given date
 * Uses UTC to avoid timezone issues
 * @param {Date} date - Input date
 * @returns {Date}
 */
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

/**
 * Get the end of the week (Sunday) for a given date
 * Uses UTC to avoid timezone issues
 * @param {Date} date - Input date
 * @returns {Date}
 */
function getWeekEnd(date) {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);
    return end;
}

/**
 * Calculate week dates based on week number
 * Week 0 = current week, Week 1 = last week, etc.
 * @param {number} weekNumber - Week number (0 = current week, 1 = last week, etc.)
 * @returns {Object}
 */
export function getWeekDates(weekNumber) {
    const today = new Date();
    const currentWeekStart = getWeekStart(today);

    // Calculate the target week start
    const targetWeekStart = new Date(currentWeekStart);
    targetWeekStart.setDate(targetWeekStart.getDate() - weekNumber * 7);

    const targetWeekEnd = getWeekEnd(targetWeekStart);

    return {
        start: targetWeekStart.toISOString().split("T")[0],
        end: targetWeekEnd.toISOString().split("T")[0],
        startDate: targetWeekStart,
        endDate: targetWeekEnd,
    };
}

/**
 * Format date range for display
 * @param {string} start - Start date (ISO string)
 * @param {string} end - End date (ISO string)
 * @returns {string}
 */
export function formatDateRange(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const options = {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    };

    return `${startDate.toLocaleDateString("en-US", options)} to ${endDate.toLocaleDateString("en-US", options)}`;
}

/**
 * Check if a date is in the current week
 * @param {string} dateStr - Date string (ISO format)
 * @returns {boolean}
 */
export function isCurrentWeek(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);

    return date >= weekStart && date <= weekEnd;
}
