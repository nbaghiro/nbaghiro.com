/**
 * Per-visitor limits, held in this process.
 *
 * Counters are kept in memory rather than in Redis: these endpoints are low volume, and a
 * restart losing them costs nothing. Each kind is counted separately, so a booking and a
 * message do not draw on the same allowance, and attempts are counted apart from successes
 * so a mistyped field never uses up what a real submission needs.
 */

const seen = new Map();

function recent(ip, kind, windowMs) {
    const now = Date.now();
    return (seen.get(`${kind}:${ip}`) ?? []).filter((t) => now - t < windowMs);
}

/** Whether this address is still inside the limit for that kind */
export function under(ip, kind, limit, windowMs) {
    return recent(ip, kind, windowMs).length < limit;
}

/** Count one against it */
export function record(ip, kind, windowMs) {
    seen.set(`${kind}:${ip}`, [...recent(ip, kind, windowMs), Date.now()]);
    if (seen.size > 5000) {
        const now = Date.now();
        for (const [key, times] of seen) {
            if (!times.some((t) => now - t < 24 * 3600_000)) seen.delete(key);
        }
    }
}
