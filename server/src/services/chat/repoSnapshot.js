/**
 * Repo Snapshot - an in-memory copy of a public GitHub repo's text files
 * Downloads the repo once as a tarball from codeload (not rate limited like
 * the REST API) and keeps the most recently used repos in an LRU.
 */

import { LRUCache } from "lru-cache";
import { Readable } from "stream";
import { createGunzip } from "zlib";

const MAX_FILE_BYTES = 200 * 1024;
const SNAPSHOT_TTL = 6 * 60 * 60 * 1000; // 6 hours

const SKIPPED_DIRS = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "coverage",
    ".venv",
    "venv",
    "__pycache__",
    ".scratchpad",
    "vendor",
]);

const SKIPPED_FILES = new Set([
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "poetry.lock",
    "uv.lock",
    "Cargo.lock",
]);

const BINARY_EXTENSIONS =
    /\.(png|jpe?g|gif|webp|ico|icns|pdf|zip|gz|tgz|woff2?|ttf|otf|eot|mp3|mp4|mov|wav|webm|sqlite|db|bin|wasm|jar|so|dylib|dll|exe|ktx2|glb|gltf|psd|min\.js|map)$/i;

// Two repos in memory at most; the largest is ~40MB of text
const snapshots = new LRUCache({ max: 2, ttl: SNAPSHOT_TTL });
const inflight = new Map();

function isSkipped(path) {
    const parts = path.split("/");
    if (parts.some((p) => SKIPPED_DIRS.has(p))) return true;
    const file = parts[parts.length - 1];
    return SKIPPED_FILES.has(file) || BINARY_EXTENSIONS.test(file);
}

function readString(header, offset, length) {
    const raw = header.subarray(offset, offset + length);
    const nul = raw.indexOf(0);
    return raw.subarray(0, nul === -1 ? length : nul).toString("utf8");
}

// A pax record is "<len> key=value\n"; only the path matters here
function paxPath(data) {
    const match = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(data.toString("utf8"));
    return match ? match[1] : null;
}

/**
 * Stream a .tar.gz and call onFile(path, buffer) for each regular file that
 * `want(path, size)` accepts. Other entries are skipped without buffering.
 */
async function readTarball(body, want, onFile) {
    const gunzip = createGunzip();
    Readable.fromWeb(body).pipe(gunzip);

    let buf = Buffer.alloc(0);
    let entry = null; // { path, type, size, padded, keep, chunks, got }
    let nextPath = null;

    for await (const chunk of gunzip) {
        buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;
        while (true) {
            if (!entry) {
                if (buf.length < 512) break;
                const header = buf.subarray(0, 512);
                buf = buf.subarray(512);
                if (header.every((b) => b === 0)) continue; // end-of-archive padding
                const size = parseInt(readString(header, 124, 12).trim() || "0", 8);
                const type = String.fromCharCode(header[156] || 48);
                const prefix = readString(header, 345, 155);
                const name = readString(header, 0, 100);
                const path = nextPath || (prefix ? `${prefix}/${name}` : name);
                nextPath = null;
                const isMeta = type === "x" || type === "g" || type === "L";
                const isFile = type === "0" || type === "\0";
                entry = {
                    path,
                    type,
                    size,
                    padded: Math.ceil(size / 512) * 512,
                    keep: isMeta || (isFile && want(path, size)),
                    chunks: [],
                    got: 0,
                };
            }
            if (entry.padded > 0 && buf.length === 0) break;
            const take = Math.min(entry.padded, buf.length);
            if (entry.keep && entry.got < entry.size) {
                entry.chunks.push(buf.subarray(0, Math.min(take, entry.size - entry.got)));
            }
            entry.got += take;
            entry.padded -= take;
            buf = buf.subarray(take);
            if (entry.padded > 0) break;

            const data = entry.keep ? Buffer.concat(entry.chunks) : null;
            if (entry.type === "x") nextPath = paxPath(data);
            else if (entry.type === "L") nextPath = readString(data, 0, data.length);
            else if (data && entry.type !== "g") onFile(entry.path, data);
            entry = null;
        }
    }
}

async function download(repo) {
    const url = `https://codeload.github.com/${repo}/tar.gz/HEAD`;
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) {
        throw new Error(`Failed to download ${repo}: ${response.status}`);
    }

    const files = new Map();
    // Tarball paths start with "<repo>-<sha>/"; drop that prefix
    const strip = (path) => path.split("/").slice(1).join("/");
    await readTarball(
        response.body,
        (path, size) => size <= MAX_FILE_BYTES && strip(path) !== "" && !isSkipped(strip(path)),
        (path, data) => {
            if (!data.includes(0)) files.set(strip(path), data.toString("utf8")); // skip unmarked binaries
        }
    );

    console.log(`[RepoSnapshot] Loaded ${repo}: ${files.size} text files`);
    return { repo, files, paths: [...files.keys()].sort() };
}

/**
 * Get a snapshot of a repo, downloading it on first use
 * @param {string} repo - "owner/name"
 * @returns {Promise<{repo: string, files: Map<string, string>, paths: string[]}>}
 */
export async function getSnapshot(repo) {
    const cached = snapshots.get(repo);
    if (cached) return cached;

    // Concurrent questions about the same repo share one download
    if (!inflight.has(repo)) {
        inflight.set(
            repo,
            download(repo)
                .then((snapshot) => {
                    snapshots.set(repo, snapshot);
                    return snapshot;
                })
                .finally(() => inflight.delete(repo))
        );
    }
    return inflight.get(repo);
}
