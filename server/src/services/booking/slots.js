/**
 * Booking - the free slots, which are the rules minus whatever the calendar already holds
 *
 * Pure: hand it the busy blocks and the clock, get back instants. That is what makes it
 * testable without Google and what lets the booking path re-check the same way the list
 * was built, so the two can never disagree about what "free" meant.
 */

import { BOOKING } from "./config.js";
import { addDays, minutesOf, partsIn, weekdayOf, zonedToUtc } from "./time.js";

/**
 * @param {Object} options
 * @param {number} options.now - milliseconds
 * @param {{start: number, end: number}[]} options.busy - instants, in milliseconds
 * @param {Object} [options.config]
 * @returns {{start: string, end: string}[]} ISO instants, in order
 */
export function freeSlots({ now, busy = [], config = BOOKING }) {
    const tz = config.timezone;
    const earliest = now + config.noticeHours * 3600_000;
    const buffer = config.bufferMinutes * 60_000;
    const length = config.slotMinutes * 60_000;
    const today = partsIn(now, tz);
    const out = [];

    for (let i = 0; i <= config.horizonDays; i += 1) {
        const date = addDays(today, i);
        if (!config.days.includes(weekdayOf(date))) continue;
        for (const [from, to] of config.windows) {
            const opens = minutesOf(from);
            const closes = minutesOf(to);
            for (
                let m = opens;
                m + config.slotMinutes <= closes;
                m += config.slotMinutes
            ) {
                const start = zonedToUtc(
                    { ...date, hour: Math.floor(m / 60), minute: m % 60 },
                    tz
                );
                const end = start + length;
                if (start < earliest) continue;
                const clashes = busy.some(
                    (b) => start < b.end + buffer && end > b.start - buffer
                );
                if (clashes) continue;
                out.push({
                    start: new Date(start).toISOString(),
                    end: new Date(end).toISOString(),
                });
            }
        }
    }
    return out;
}

/** The window the slot list covers, which is also what to ask the calendar about */
export function horizon(now, config = BOOKING) {
    const tz = config.timezone;
    const today = partsIn(now, tz);
    const last = addDays(today, config.horizonDays + 1);
    return {
        from: new Date(now).toISOString(),
        to: new Date(
            zonedToUtc({ ...last, hour: 0, minute: 0 }, tz)
        ).toISOString(),
    };
}

/** Whether an instant is one of the slots on offer, which is what a booking must be */
export function isOffered(slots, startIso) {
    return slots.some((s) => s.start === startIso);
}
