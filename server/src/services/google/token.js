/**
 * One Google grant, shared by the calendar and by sending mail.
 *
 * The refresh token comes from the environment and is exchanged for a short-lived access
 * token, cached until a minute before it expires. `server/scripts/google-auth.mjs` prints
 * the refresh token; one consent covers both scopes.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";

let cached = { value: "", expires: 0 };

/** True when the three variables the exchange needs are set */
export function googleConfigured() {
    return Boolean(
        process.env.GOOGLE_CLIENT_ID &&
            process.env.GOOGLE_CLIENT_SECRET &&
            process.env.GOOGLE_REFRESH_TOKEN
    );
}

export async function accessToken() {
    if (cached.value && Date.now() < cached.expires) return cached.value;
    const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
            grant_type: "refresh_token",
        }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        // usually a revoked grant, which no retry will fix
        throw new Error(
            `Google refused the refresh token: ${json.error || res.status}`
        );
    }
    cached = {
        value: json.access_token,
        expires: Date.now() + (json.expires_in - 60) * 1000,
    };
    return cached.value;
}
