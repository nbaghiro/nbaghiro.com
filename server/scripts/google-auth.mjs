/**
 * One-time consent for the booking calendar.
 *
 *   node server/scripts/google-auth.mjs
 *
 * It prints a URL, you approve it in a browser as the Google account whose calendar the
 * meetings should land in, and it prints a refresh token to paste into the environment.
 * The token is long-lived; this is run once, and again only if the grant is revoked.
 *
 * Before running it, in Google Cloud Console:
 *   1. Make a project, or reuse one.
 *   2. APIs and services, Library: enable the Google Calendar API and the Gmail API.
 *   3. OAuth consent screen: External, your own email as the test user. It can stay in
 *      Testing; a refresh token issued to a test user of an unverified app expires after
 *      seven days, so publish the app when the booking page goes live.
 *   4. Credentials: create an OAuth client ID of type Web application, and add
 *      http://localhost:5311/callback as an authorised redirect URI.
 *   5. Put the client id and secret in server/.env as GOOGLE_CLIENT_ID and
 *      GOOGLE_CLIENT_SECRET, then run this script.
 *
 * Scopes asked for, and why each one:
 *   calendar.events   write the meeting and invite the visitor
 *   calendar.readonly read free and busy time so a taken slot is never offered
 *   gmail.send        send the contact form's message from your own address
 *
 * gmail.send can only send; it cannot read or delete anything in the mailbox.
 */

import http from "node:http";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const PORT = 5311;
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/gmail.send",
];

const id = process.env.GOOGLE_CLIENT_ID;
const secret = process.env.GOOGLE_CLIENT_SECRET;
if (!id || !secret) {
    console.error(
        "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env first. The header of this file says where they come from."
    );
    process.exit(1);
}

const consent =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
        client_id: id,
        redirect_uri: REDIRECT,
        response_type: "code",
        scope: SCOPES.join(" "),
        access_type: "offline",
        // without this an account that has approved before is handed no refresh token
        prompt: "consent",
    });

console.log("\nOpen this and approve it as the calendar's owner:\n");
console.log(consent);
console.log(`\nWaiting on ${REDIRECT}\n`);

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname !== "/callback") {
        res.writeHead(404).end();
        return;
    }
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    if (error || !code) {
        res.writeHead(400, { "Content-Type": "text/plain" }).end(
            `Google said: ${error || "no code"}`
        );
        console.error(`\nGoogle said: ${error || "no code"}`);
        server.close();
        process.exitCode = 1;
        return;
    }
    const token = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: id,
            client_secret: secret,
            redirect_uri: REDIRECT,
            grant_type: "authorization_code",
        }),
    }).then((r) => r.json());

    if (!token.refresh_token) {
        res.writeHead(400, { "Content-Type": "text/plain" }).end(
            "No refresh token came back. Remove this app at myaccount.google.com/permissions and run it again."
        );
        console.error("\nNo refresh token came back:", token);
        server.close();
        process.exitCode = 1;
        return;
    }

    res.writeHead(200, { "Content-Type": "text/plain" }).end(
        "Done. The refresh token is in the terminal; this tab can be closed."
    );
    console.log("\nPaste these into server/.env for local work:\n");
    console.log(`GOOGLE_CLIENT_ID=${id}`);
    console.log(`GOOGLE_CLIENT_SECRET=${secret}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${token.refresh_token}`);
    console.log("BOOKING_CALENDAR_ID=primary");
    console.log("CONTACT_TO=naib.baghirov@gmail.com");
    console.log(
        "\nAnd the same four as environment variables on the Render service, which is what makes it live.\n"
    );
    server.close();
});

server.listen(PORT);
