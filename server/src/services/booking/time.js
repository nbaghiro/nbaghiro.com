/**
 * Booking - clock arithmetic in a named zone, with no date library
 *
 * The rules are wall-clock times in one city and the calendar speaks UTC, so the only
 * thing needed is the zone's offset at a given instant. Intl knows that, including the
 * two days a year it changes, which is why this is twenty lines rather than a dependency.
 */

const cache = new Map();

function formatter(timeZone) {
    let f = cache.get(timeZone);
    if (!f) {
        f = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        cache.set(timeZone, f);
    }
    return f;
}

/** Calendar parts of an instant, read in `timeZone` */
export function partsIn(utcMs, timeZone) {
    const parts = Object.fromEntries(
        formatter(timeZone)
            .formatToParts(new Date(utcMs))
            .filter((p) => p.type !== "literal")
            .map((p) => [p.type, Number(p.value)])
    );
    // hour12:false still says 24 for midnight in some runtimes
    if (parts.hour === 24) parts.hour = 0;
    return parts;
}

/** Offset of `timeZone` from UTC at that instant, in milliseconds */
export function offsetAt(utcMs, timeZone) {
    const p = partsIn(utcMs, timeZone);
    const asUtc = Date.UTC(
        p.year,
        p.month - 1,
        p.day,
        p.hour,
        p.minute,
        p.second
    );
    return asUtc - utcMs;
}

/**
 * The instant a wall-clock time in `timeZone` corresponds to.
 * Guess, correct by the offset at the guess, then correct again, which settles the hour
 * either side of a daylight-saving change.
 */
export function zonedToUtc(
    { year, month, day, hour = 0, minute = 0 },
    timeZone
) {
    const guess = Date.UTC(year, month - 1, day, hour, minute);
    const first = guess - offsetAt(guess, timeZone);
    return guess - offsetAt(first, timeZone);
}

/** 0 is Sunday, as with Date#getUTCDay, for a plain calendar date */
export function weekdayOf({ year, month, day }) {
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** The calendar date `n` days after a plain calendar date */
export function addDays({ year, month, day }, n) {
    const d = new Date(Date.UTC(year, month - 1, day + n));
    return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
    };
}

/** "09:30" to minutes past midnight */
export function minutesOf(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}
