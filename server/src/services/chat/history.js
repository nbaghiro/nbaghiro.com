/**
 * Commit history for the site agent: the committed snapshot as a baseline, with the commits
 * GitHub has seen since fetched at request time and merged in.
 *
 * server/data/history/<id>.json (written by scripts/snapshot-history.mjs from the local
 * clones) carries line counts per commit, which the GitHub list endpoint does not, so it stays
 * as the baseline. Everything newer than its last commit comes from
 * GET /repos/{owner}/{repo}/commits?since=..., cached for ten minutes per project. A fetch
 * that fails keeps serving the last merged list, and a rate-limit answer pauses every project
 * until the window GitHub names. GITHUB_TOKEN lifts the limit from 60 to 5,000 requests an hour.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROJECTS } from "../../data/projects.js";

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../data");
const LIVE_TTL_MS = 10 * 60 * 1000;
const PAGE_SIZE = 100;
const MAX_PAGES = 5; // 500 commits past the baseline is more than a snapshot ever lags

// id -> { commits, generated }, read once; the snapshot script rewrites the files, not the server
const baseline = Object.fromEntries(
    Object.keys(PROJECTS).map((id) => {
        const file = path.join(dataDir, "history", `${id}.json`);
        if (!existsSync(file)) return [id, { commits: [], generated: null }];
        const { commits, generated } = JSON.parse(readFileSync(file, "utf8"));
        return [id, { commits, generated }];
    })
);

// id -> { commits, fetchedAt, inflight }
const live = new Map();
let rateLimitedUntil = 0;

/** The committed snapshot alone: stable between deploys, so safe inside a cached prompt prefix */
export function getBaseline(id) {
    return baseline[id] || { commits: [], generated: null };
}

function subjectOf(message) {
    return (message || "").split("\n")[0].trim();
}

function coAuthorsOf(message) {
    const names = [];
    for (const line of (message || "").split("\n")) {
        const m = /^Co-authored-by:\s*(.+?)\s*(?:<[^>]*>)?\s*$/i.exec(line.trim());
        if (m) names.push(m[1]);
    }
    return names;
}

/** One list-endpoint commit in the snapshot's shape; line counts are unknown here */
function fromApi(c) {
    const when = c.commit?.author?.date || c.commit?.committer?.date || "";
    return {
        sha: c.sha.slice(0, 7),
        date: when.slice(0, 10),
        author: c.commit?.author?.name || c.author?.login || "unknown",
        subject: subjectOf(c.commit?.message),
        files: null,
        added: null,
        removed: null,
        ...(coAuthorsOf(c.commit?.message).length ? { coAuthors: coAuthorsOf(c.commit?.message) } : {}),
    };
}

async function fetchSince(repo, sinceDate) {
    const headers = { Accept: "application/vnd.github+json", "User-Agent": "nbaghiro.com site agent" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const commits = [];
    let url = `https://api.github.com/repos/${repo}/commits?since=${sinceDate}T00:00:00Z&per_page=${PAGE_SIZE}`;
    for (let page = 0; url && page < MAX_PAGES; page++) {
        const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
        // A limit is per token or IP, so it pauses every project; any other 403 (a token without
        // access to this one repo, say) fails only this project through the caller's catch
        const retryAfter = Number(response.headers.get("retry-after") || 0) * 1000;
        const exhausted = response.headers.get("x-ratelimit-remaining") === "0";
        if (response.status === 429 || (response.status === 403 && (exhausted || retryAfter))) {
            const reset = Number(response.headers.get("x-ratelimit-reset") || 0) * 1000;
            rateLimitedUntil =
                reset > Date.now() ? reset : Date.now() + (retryAfter || 15 * 60 * 1000);
            throw new Error(`GitHub rate limit for ${repo}, until ${new Date(rateLimitedUntil).toISOString()}`);
        }
        if (!response.ok) throw new Error(`GitHub ${response.status} for ${repo}`);
        for (const c of await response.json()) commits.push(fromApi(c));
        const link = response.headers.get("link") || "";
        url = /<([^>]+)>;\s*rel="next"/.exec(link)?.[1] || null;
    }
    return commits;
}

// git abbreviates %h to 7 characters or more as the repo grows; compare on the 7 both sides share
function merge(base, fresh) {
    const known = new Set(base.map((c) => c.sha.slice(0, 7)));
    const newer = fresh.filter((c) => !known.has(c.sha.slice(0, 7)));
    return [...newer, ...base].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/**
 * The project's commits, newest first, with whatever GitHub has added since the snapshot.
 * Never throws: on any failure the baseline (or the last good merge) is returned.
 */
export async function getHistory(id) {
    const base = getBaseline(id).commits;
    const entry = live.get(id) || { commits: base, fetchedAt: 0, inflight: null };
    live.set(id, entry);
    if (Date.now() - entry.fetchedAt < LIVE_TTL_MS) return entry.commits;
    if (Date.now() < rateLimitedUntil) return entry.commits;
    if (!entry.inflight) {
        // from the newest baseline day itself, so a same-day commit the snapshot missed is caught
        const since = base[0]?.date || "2020-01-01";
        entry.inflight = fetchSince(PROJECTS[id].repo, since)
            .then((fresh) => {
                entry.commits = merge(base, fresh);
                entry.fetchedAt = Date.now();
                if (fresh.length) console.log(`[History] ${id}: ${fresh.length} commits since ${since} from GitHub`);
                return entry.commits;
            })
            .catch((error) => {
                console.error(`[History] ${id}: ${error.message}; serving the last known list`);
                entry.fetchedAt = Date.now(); // do not retry on every question
                return entry.commits;
            })
            .finally(() => {
                entry.inflight = null;
            });
    }
    return entry.inflight;
}

/** Whether a commit carries line counts (only snapshot commits do) */
export function hasCounts(commit) {
    return typeof commit.added === "number";
}
