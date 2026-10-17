import { contactConfigured } from "../contact/send.js";

/**
 * Booking - the one place the rules live
 *
 * Everything the slot maths needs is here, so moving the hours or the slot length is a
 * single edit rather than a hunt. Times are local to `timezone`; the API itself only ever
 * hands out instants in UTC.
 */

export const BOOKING = {
    timezone: "America/Toronto",
    // what the visitor is told the hours are in; most of them are not in Toronto
    zoneLabel: "ET",
    // 1 is Monday, 5 is Friday
    days: [1, 2, 3, 4, 5],
    windows: [
        ["09:00", "12:00"],
        ["16:00", "19:00"],
    ],
    slotMinutes: 30,
    // kept clear either side of anything already in the calendar
    bufferMinutes: 15,
    // nothing bookable sooner than this, so a morning is never ambushed
    noticeHours: 24,
    horizonDays: 21,
    calendarId: process.env.BOOKING_CALENDAR_ID || "primary",
    maxNoteChars: 600,
    maxNameChars: 80,
};

/**
 * True when a call can be requested at all. The calendar is not part of that: without the
 * Google grant the request arrives as mail and is confirmed by hand, which is why this asks
 * whether mail works rather than whether Google does.
 */
export function bookingConfigured() {
    return contactConfigured();
}
