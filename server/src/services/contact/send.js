/**
 * Contact - sending the message as mail
 *
 * Over Resend, which is all this needs: the Google grant exists for the calendar, and a
 * message from the site is not calendar work. The mail is sent from the site's own address
 * with the visitor's address as Reply-To, so a reply goes to them.
 *
 * BOOKING_DRY_RUN=1 keeps the mail in memory instead of sending it, so the form can be
 * exercised locally without credentials. It is the same flag the booking flow uses.
 */

const SEND_URL = "https://api.resend.com/emails";

// The apex rather than a subdomain, so a DKIM key published for nbaghiro.com aligns with it.
const FROM = process.env.CONTACT_FROM || "nbaghiro.com <hello@nbaghiro.com>";

export const CONTACT = {
    to: process.env.CONTACT_TO || "naib.baghirov@gmail.com",
    maxNameChars: 80,
    maxEmailChars: 200,
    maxMessageChars: 4000,
    minMessageChars: 10,
};

export function contactConfigured() {
    return process.env.BOOKING_DRY_RUN === "1" || Boolean(process.env.RESEND_API_KEY);
}

// what has been "sent" in dry run, so a test can read it back
const outbox = [];
export const dryRunOutbox = outbox;

/** Header values are single-line by definition; a newline in one would let a sender add headers */
const oneLine = (value) => value.replace(/[\r\n]+/g, " ").trim();

/**
 * Send the message
 * @returns {Promise<{id: string, to: string}>}
 */
export async function sendMessage({ name, email, message }) {
    const from = oneLine(name);
    const reply = oneLine(email);
    if (process.env.BOOKING_DRY_RUN === "1") {
        outbox.push({ name, email, message, at: new Date().toISOString() });
        return { id: `dry-${outbox.length}`, to: CONTACT.to };
    }
    const res = await fetch(SEND_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: FROM,
            reply_to: reply,
            to: CONTACT.to,
            subject: `Message from ${from} via nbaghiro.com`,
            text: `${from} <${reply}>\n\n${message}\n`,
        }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json.message || json.error?.message || `Resend returned ${res.status}`);
    }
    return { id: json.id, to: CONTACT.to };
}
