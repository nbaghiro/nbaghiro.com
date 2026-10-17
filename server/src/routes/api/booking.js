import express from "express";
import { record, under } from "../../services/limits.js";
import { BOOKING, bookingConfigured } from "../../services/booking/config.js";
import { busyBetween, createMeeting } from "../../services/booking/google.js";
import { freeSlots, horizon, isOffered } from "../../services/booking/slots.js";

const router = express.Router();

// Booking's own allowances. Attempts and bookings are counted apart, so a mistyped email
// never spends the day's allowance: only an event that reached the calendar does.
const SLOT_READS_PER_HOUR = 60;
const ATTEMPTS_PER_HOUR = 20;
const BOOKINGS_PER_DAY = 3;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The free slots, with the rules the visitor needs to read them */
router.get("/booking/slots", async (req, res) => {
    if (!bookingConfigured()) {
        return res
            .status(503)
            .json({ error: "Online booking is currently unavailable." });
    }
    if (!under(req.ip, "slots", SLOT_READS_PER_HOUR, 3600_000)) {
        return res
            .status(429)
            .json({ error: "Too many requests. Try again shortly." });
    }
    record(req.ip, "slots", 3600_000);
    try {
        const now = Date.now();
        const { from, to } = horizon(now);
        const busy = await busyBetween(from, to);
        res.json({
            timezone: BOOKING.timezone,
            zoneLabel: BOOKING.zoneLabel,
            slotMinutes: BOOKING.slotMinutes,
            slots: freeSlots({ now, busy }),
        });
    } catch (error) {
        console.error("[Booking] Could not read the calendar:", error.message);
        res.status(502).json({ error: "The calendar could not be reached" });
    }
});

/** Take one of them */
router.post("/booking", async (req, res) => {
    if (!bookingConfigured()) {
        return res
            .status(503)
            .json({ error: "Online booking is currently unavailable." });
    }
    if (!under(req.ip, "attempt", ATTEMPTS_PER_HOUR, 3600_000)) {
        return res
            .status(429)
            .json({
                error: "The hourly booking attempt limit has been reached. Please try again in an hour.",
            });
    }
    record(req.ip, "attempt", 3600_000);
    if (!under(req.ip, "book", BOOKINGS_PER_DAY, 24 * 3600_000)) {
        return res
            .status(429)
            .json({
                error: "The daily booking limit has been reached. Please try again tomorrow or email me.",
            });
    }

    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim();
    const note = String(req.body?.note ?? "").trim();
    const start = String(req.body?.start ?? "").trim();

    if (name.length < 2 || name.length > BOOKING.maxNameChars) {
        return res.status(400).json({ error: "Please enter your name." });
    }
    if (!EMAIL.test(email) || email.length > 200) {
        return res
            .status(400)
            .json({ error: "Please enter a valid email address." });
    }
    if (note.length > BOOKING.maxNoteChars) {
        return res.status(400).json({
            error: `Please keep your note under ${BOOKING.maxNoteChars} characters.`,
        });
    }
    if (!Number.isFinite(Date.parse(start))) {
        return res.status(400).json({ error: "Please choose a time." });
    }

    try {
        // rebuild the list at this instant and check the slot is still in it, so two people
        // clicking the same time cannot both be given it
        const now = Date.now();
        const { from, to } = horizon(now);
        const busy = await busyBetween(from, to);
        const slots = freeSlots({ now, busy });
        const iso = new Date(start).toISOString();
        if (!isOffered(slots, iso)) {
            return res
                .status(409)
                .json({
                    error: "That time is no longer available. Please choose another.",
                });
        }
        const slot = slots.find((s) => s.start === iso);
        const meeting = await createMeeting({ ...slot, name, email, note });
        record(req.ip, "book", 24 * 3600_000);
        res.json({
            start: meeting.start,
            end: meeting.end,
            meet: meeting.meet,
            synced: meeting.synced,
            timezone: BOOKING.timezone,
            zoneLabel: BOOKING.zoneLabel,
        });
    } catch (error) {
        console.error("[Booking] Could not write the event:", error.message);
        res.status(502).json({
            error: "The booking could not be completed. Please try again or email me.",
        });
    }
});

export default router;
