/**
 * Booking - the calendar itself
 *
 * Google over plain fetch rather than the SDK: two calls are needed (free time, one
 * event) and the SDK is a large dependency for that. The access token comes from
 * services/google/token.js, which the contact form shares.
 *
 * With BOOKING_DRY_RUN=1 the whole flow runs against a calendar held in memory, so the
 * dialog can be exercised end to end on a machine with no Google credentials at all.
 */

import { sendMessage } from "../contact/send.js";
import { accessToken, googleConfigured } from "../google/token.js";
import { BOOKING } from "./config.js";
import { partsIn, zonedToUtc } from "./time.js";

const API = "https://www.googleapis.com/calendar/v3";

const dryRun = () => process.env.BOOKING_DRY_RUN === "1";

// what the fake calendar has in it: two standing blocks a week, plus anything booked
// during this process's life, so a slot taken in the dialog stops being offered
const booked = [];

function fakeBusy(fromMs, toMs) {
    const tz = BOOKING.timezone;
    const out = booked.map((b) => ({ start: b.start, end: b.end }));
    let index = 0;
    for (
        let day = new Date(fromMs);
        day.getTime() < toMs;
        day.setUTCDate(day.getUTCDate() + 1), index += 1
    ) {
        const date = partsIn(day.getTime(), tz);
        const weekday = new Date(
            Date.UTC(date.year, date.month - 1, date.day)
        ).getUTCDay();
        if (weekday === 2) {
            // a standing Tuesday morning
            out.push({
                start: zonedToUtc({ ...date, hour: 10, minute: 0 }, tz),
                end: zonedToUtc({ ...date, hour: 11, minute: 30 }, tz),
            });
        }
        if (weekday === 4) {
            // and a Thursday late afternoon
            out.push({
                start: zonedToUtc({ ...date, hour: 16, minute: 30 }, tz),
                end: zonedToUtc({ ...date, hour: 17, minute: 30 }, tz),
            });
        }
        // one weekday gone entirely, so the dimmed state has something to show
        if (weekday === 3 && index >= 7 && index < 14) {
            out.push({
                start: zonedToUtc({ ...date, hour: 8, minute: 0 }, tz),
                end: zonedToUtc({ ...date, hour: 20, minute: 0 }, tz),
            });
        }
    }
    return out;
}

async function call(path, init = {}) {
    const res = await fetch(`${API}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${await accessToken()}`,
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const error = new Error(
            json.error?.message || `Google returned ${res.status}`
        );
        error.status = res.status;
        throw error;
    }
    return json;
}

/**
 * Busy blocks between two instants
 * @returns {Promise<{start: number, end: number}[]>}
 */
export async function busyBetween(fromIso, toIso) {
    if (dryRun()) return fakeBusy(Date.parse(fromIso), Date.parse(toIso));
    // Without the grant there is no calendar to read, so nothing is known to be busy and the
    // whole grid is offered. A request taken this way is confirmed by hand, not synced.
    if (!googleConfigured()) return [];
    const id = BOOKING.calendarId;
    try {
        const json = await call("/freeBusy", {
            method: "POST",
            body: JSON.stringify({
                timeMin: fromIso,
                timeMax: toIso,
                timeZone: BOOKING.timezone,
                items: [{ id }],
            }),
        });
        const blocks = json.calendars?.[id]?.busy ?? [];
        return blocks.map((b) => ({
            start: Date.parse(b.start),
            end: Date.parse(b.end),
        }));
    } catch (error) {
        // freeBusy needs a read scope; a grant with only calendar.events can still list
        if (error.status !== 403) throw error;
        const query = new URLSearchParams({
            timeMin: fromIso,
            timeMax: toIso,
            singleEvents: "true",
            maxResults: "2500",
        });
        const json = await call(
            `/calendars/${encodeURIComponent(id)}/events?${query}`
        );
        return (json.items ?? [])
            .filter(
                (e) =>
                    e.status !== "cancelled" &&
                    e.start?.dateTime &&
                    e.transparency !== "transparent"
            )
            .map((e) => ({
                start: Date.parse(e.start.dateTime),
                end: Date.parse(e.end.dateTime),
            }));
    }
}

/**
 * Put the meeting in the calendar and invite the visitor
 * @returns {Promise<{id: string, meet: string, start: string, end: string}>}
 */
export async function createMeeting({ start, end, name, email, note }) {
    const summary = `${name} and Naib`;
    const description = note
        ? `${note}\n\nBooked from nbaghiro.com by ${name} (${email}).`
        : `Booked from nbaghiro.com by ${name} (${email}).`;
    if (dryRun()) {
        booked.push({ start: Date.parse(start), end: Date.parse(end) });
        return {
            id: `dry-${booked.length}`,
            meet: "https://meet.google.com/dry-run-only",
            start,
            end,
            synced: true,
        };
    }
    // No grant, no event. The request still reaches me as mail, and `synced: false` is what
    // stops the dialog telling someone a call is in a calendar it was never written to.
    if (!googleConfigured()) {
        await sendMessage({
            name,
            email,
            message: `A call was requested for ${start} to ${end}.\n\n${note || "No note."}`,
        });
        return { id: null, meet: null, start, end, synced: false };
    }
    const event = await call(
        `/calendars/${encodeURIComponent(BOOKING.calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
        {
            method: "POST",
            body: JSON.stringify({
                summary,
                description,
                start: { dateTime: start, timeZone: BOOKING.timezone },
                end: { dateTime: end, timeZone: BOOKING.timezone },
                attendees: [{ email, displayName: name }],
                reminders: { useDefault: true },
                conferenceData: {
                    createRequest: {
                        requestId: `nbaghiro-${Date.parse(start)}`,
                        conferenceSolutionKey: { type: "hangoutsMeet" },
                    },
                },
            }),
        }
    );
    return {
        id: event.id,
        meet:
            event.hangoutLink ||
            event.conferenceData?.entryPoints?.[0]?.uri ||
            "",
        start: event.start?.dateTime || start,
        end: event.end?.dateTime || end,
    };
}
