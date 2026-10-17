import express from "express";
import {
    CONTACT,
    contactConfigured,
    sendMessage,
} from "../../services/contact/send.js";
import { record, under } from "../../services/limits.js";

const router = express.Router();

// Tighter than booking's, because this one puts mail in an inbox. Attempts are counted
// apart from sent messages, so a failed validation does not use up an allowance.
const ATTEMPTS_PER_HOUR = 12;
const SENT_PER_HOUR = 3;
const SENT_PER_DAY = 8;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Send one message to the owner's inbox */
router.post("/contact", async (req, res) => {
    if (!contactConfigured()) {
        return res.status(503).json({
            error: `Sending is not set up on this server. Email ${CONTACT.to} instead.`,
        });
    }
    if (!under(req.ip, "mail-attempt", ATTEMPTS_PER_HOUR, 3600_000)) {
        return res.status(429).json({
            error: `Too many tries from here. Try again in an hour, or email ${CONTACT.to}.`,
        });
    }
    record(req.ip, "mail-attempt", 3600_000);

    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim();
    const message = String(req.body?.message ?? "").trim();

    if (name.length < 2 || name.length > CONTACT.maxNameChars) {
        return res
            .status(400)
            .json({ error: "Add your name so I know who is writing." });
    }
    if (!EMAIL.test(email) || email.length > CONTACT.maxEmailChars) {
        return res.status(400).json({
            error: "Check the email address. I reply to the address you leave here.",
        });
    }
    if (message.length < CONTACT.minMessageChars) {
        return res
            .status(400)
            .json({ error: "Add a line or two about what you need." });
    }
    if (message.length > CONTACT.maxMessageChars) {
        return res.status(400).json({
            error: `Keep the message under ${CONTACT.maxMessageChars} characters, or email it instead.`,
        });
    }

    if (
        !under(req.ip, "mail", SENT_PER_HOUR, 3600_000) ||
        !under(req.ip, "mail-day", SENT_PER_DAY, 24 * 3600_000)
    ) {
        return res.status(429).json({
            error: `That is a few messages already. Try again later, or email ${CONTACT.to}.`,
        });
    }

    try {
        const sent = await sendMessage({ name, email, message });
        record(req.ip, "mail", 3600_000);
        record(req.ip, "mail-day", 24 * 3600_000);
        res.json({ to: sent.to, name, email, message });
    } catch (error) {
        console.error("[Contact] Could not send the message:", error.message);
        res.status(502).json({
            error: `The message could not be sent. Please try again, or email ${CONTACT.to}.`,
        });
    }
});

export default router;
