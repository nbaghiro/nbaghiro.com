// Publishes one project's ad studio to the R2 bucket that nbaghiro.com/ads reads, and the two
// one-off commands around it. Each project keeps its own publish script next to its renders
// (galleo: .local/ads-publish.mjs, lumischool: .scratchpad/social/ads-publish.mjs); those build
// the manifest from the project's own data and call `publish` from here, so the manifest shape
// and the upload live in one place, beside the page that reads them.
//
//   node scripts/ads-publish.mjs setup       create the bucket and its CORS rule, print the root
//   node scripts/ads-publish.mjs serve       serve ADS_LOCAL_DIR as a stand-in bucket (ADS_LOCAL_PORT, 8200)
//
// Credentials come from .env.ads at the repo root (see .env.ads.example). The layout in the
// bucket is <key>/index.json plus <key>/<project>/manifest.json and the files the manifest
// names, all relative to the project folder. The key is the only thing standing between the
// public bucket and a reader, so it is long and random and never written into client/src.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, stat, symlink, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
    const file = join(ROOT, ".env.ads");
    if (!existsSync(file)) return;
    for (const line of readFileSync(file, "utf8").split("\n")) {
        const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
        if (m && !(m[1] in process.env))
            process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
}
loadEnv();

const env = {
    account: process.env.ADS_R2_ACCOUNT_ID,
    keyId: process.env.ADS_R2_ACCESS_KEY_ID,
    secret: process.env.ADS_R2_SECRET_ACCESS_KEY,
    bucket: process.env.ADS_R2_BUCKET || "ads",
    key: process.env.ADS_KEY,
    publicBase: (process.env.ADS_PUBLIC_BASE || "").replace(/\/$/, ""),
    localDir: process.env.ADS_LOCAL_DIR,
    localPort: Number(process.env.ADS_LOCAL_PORT || 8200),
};

function need(...names) {
    const missing = names.filter((n) => !env[n]);
    if (missing.length) {
        throw new Error(
            `.env.ads is missing ${missing.join(", ")} (see .env.ads.example)`
        );
    }
}

function aws(args, input) {
    need("account", "keyId", "secret");
    const endpoint = `https://${env.account}.r2.cloudflarestorage.com`;
    return new Promise((res, rej) => {
        const child = spawn(
            "aws",
            [...args, "--endpoint-url", endpoint, "--region", "auto"],
            {
                env: {
                    ...process.env,
                    AWS_ACCESS_KEY_ID: env.keyId,
                    AWS_SECRET_ACCESS_KEY: env.secret,
                    AWS_EC2_METADATA_DISABLED: "true",
                },
                stdio: [
                    input === undefined ? "ignore" : "pipe",
                    "pipe",
                    "pipe",
                ],
            }
        );
        let out = "";
        let err = "";
        child.stdout.on("data", (d) => (out += d));
        child.stderr.on("data", (d) => (err += d));
        child.on("error", rej);
        child.on("close", (code) => {
            if (code === 0) res(out);
            else
                rej(
                    new Error(
                        `aws ${args[0]} ${args[1] ?? ""} failed: ${err || out}`
                    )
                );
        });
        if (input !== undefined) child.stdin.end(input);
    });
}

const CORS = {
    CORSRules: [
        {
            AllowedOrigins: [
                "https://www.nbaghiro.com",
                "https://nbaghiro.com",
                "http://localhost:5283",
            ],
            AllowedMethods: ["GET", "HEAD"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["Content-Length", "Content-Range", "ETag"],
            MaxAgeSeconds: 86400,
        },
    ],
};

async function setup() {
    need("key");
    // a token scoped to one bucket cannot list buckets; then the bucket was made in the
    // dashboard and only the CORS rule is left to set
    let names = null;
    try {
        const have = await aws(["s3api", "list-buckets", "--output", "json"]);
        names = JSON.parse(have).Buckets.map((b) => b.Name);
    } catch {
        console.log("token cannot list buckets; assuming the bucket exists");
    }
    if (names && !names.includes(env.bucket)) {
        await aws(["s3api", "create-bucket", "--bucket", env.bucket]);
        console.log(`created bucket ${env.bucket}`);
    } else if (names) {
        console.log(`bucket ${env.bucket} exists`);
    }
    try {
        await aws([
            "s3api",
            "put-bucket-cors",
            "--bucket",
            env.bucket,
            "--cors-configuration",
            JSON.stringify(CORS),
        ]);
        console.log("CORS set for nbaghiro.com and the Vite dev server");
    } catch {
        console.log(
            "this token may not edit bucket settings; set CORS with wrangler (r2 bucket cors set) or in the dashboard"
        );
    }
    console.log(
        "\nPublic access is a dashboard setting: R2 > " +
            env.bucket +
            " > Settings > Public access > " +
            "r2.dev subdomain > Allow. Put the URL it shows into ADS_PUBLIC_BASE."
    );
    if (env.publicBase)
        console.log(
            `\nThe root to enter on a device once: ${env.publicBase}/${env.key}`
        );
}

// A manifest's file paths are relative to <key>/<project>/; a sync copies a folder from the
// project into one of those paths, limited to the patterns the manifest can name.
export async function publish({ project, manifest, syncs, dryRun = false }) {
    need("key");
    const id = project.id;
    const built = {
        version: 1,
        project,
        publishedAt: new Date().toISOString(),
        ...manifest,
    };
    const summary = counts(built);
    console.log(
        `${id}: ${Object.entries(summary)
            .map(([k, v]) => `${v} ${k}`)
            .join(", ")}`
    );
    if (env.localDir) return publishLocal(id, built, syncs, summary);

    for (const s of syncs) {
        const dest = `s3://${env.bucket}/${env.key}/${id}/${s.to}`;
        const args = [
            "s3",
            "sync",
            s.from,
            dest,
            "--no-progress",
            "--exclude",
            "*",
        ];
        for (const inc of s.include) args.push("--include", inc);
        for (const exc of s.exclude ?? []) args.push("--exclude", exc);
        // the page appends ?v=<publishedAt> to every media URL, so a long cache is safe
        args.push("--cache-control", "public, max-age=31536000, immutable");
        if (dryRun) args.push("--dryrun");
        console.log(`sync ${s.from} -> ${s.to}`);
        const out = await aws(args);
        const lines = out
            .split("\n")
            .filter((l) => l.startsWith("upload") || l.startsWith("(dryrun)"));
        console.log(
            `  ${lines.length} file(s) ${dryRun ? "would be " : ""}uploaded`
        );
    }
    if (dryRun) return built;

    await put(`${id}/manifest.json`, JSON.stringify(built));
    const index = await readIndex();
    index.projects = index.projects.filter((p) => p.id !== id);
    index.projects.push({
        ...project,
        manifest: `${id}/manifest.json`,
        publishedAt: built.publishedAt,
        counts: summary,
        covers: covers(built),
    });
    index.projects.sort((a, b) => a.name.localeCompare(b.name));
    await put("index.json", JSON.stringify(index));
    if (env.publicBase)
        console.log(
            `\nlive: ${env.publicBase}/${env.key}  (open nbaghiro.com/ads and enter that once)`
        );
    return built;
}

// the first frame of the first three posts, in their default theme, for the project tile
function covers(m) {
    return (m.posts ?? [])
        .slice(0, 3)
        .map((p) => {
            const set =
                p.slides?.[p.defaultTheme] ?? Object.values(p.slides ?? {})[0];
            return set?.feed?.[0];
        })
        .filter(Boolean);
}

function counts(m) {
    return {
        posts: m.posts?.length ?? 0,
        stories: m.stories?.length ?? 0,
        reels: m.reels?.length ?? 0,
        linkedin: m.linkedin?.posts?.length ?? 0,
        x: m.x?.posts?.length ?? 0,
    };
}

async function put(path, body) {
    await aws(
        [
            "s3",
            "cp",
            "-",
            `s3://${env.bucket}/${env.key}/${path}`,
            "--content-type",
            "application/json",
            "--cache-control",
            "no-cache",
        ],
        body
    );
}

async function readIndex() {
    try {
        const out = await aws([
            "s3",
            "cp",
            `s3://${env.bucket}/${env.key}/index.json`,
            "-",
        ]);
        return JSON.parse(out);
    } catch {
        return { version: 1, projects: [] };
    }
}

// ADS_LOCAL_DIR stands in for the bucket during development: the manifests are written there and
// each synced folder is linked rather than copied, so `serve` below can hand the same files to a
// local client without uploading gigabytes to check a layout.
async function publishLocal(id, built, syncs, summary) {
    const base = join(env.localDir, env.key, id);
    await mkdir(base, { recursive: true });
    for (const s of syncs) {
        const link = join(base, s.to);
        await mkdir(dirname(link), { recursive: true });
        if (!existsSync(link)) await symlink(resolve(s.from), link);
    }
    await writeFile(join(base, "manifest.json"), JSON.stringify(built));
    const indexFile = join(env.localDir, env.key, "index.json");
    let index = { version: 1, projects: [] };
    try {
        index = JSON.parse(await readFile(indexFile, "utf8"));
    } catch {
        // first project
    }
    index.projects = index.projects.filter((p) => p.id !== id);
    index.projects.push({
        ...built.project,
        manifest: `${id}/manifest.json`,
        publishedAt: built.publishedAt,
        counts: summary,
        covers: covers(built),
    });
    index.projects.sort((a, b) => a.name.localeCompare(b.name));
    await writeFile(indexFile, JSON.stringify(index));
    console.log(
        `local: ${env.localDir}/${env.key}  (node scripts/ads-publish.mjs serve, then enter http://localhost:${env.localPort}/${env.key})`
    );
    return built;
}

const TYPES = {
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".mp4": "video/mp4",
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8",
};

function serve() {
    if (!env.localDir) throw new Error("ADS_LOCAL_DIR is not set");
    const root = resolve(env.localDir);
    const server = createServer(async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader(
            "Access-Control-Expose-Headers",
            "Content-Length, Content-Range"
        );
        const path = normalize(
            decodeURIComponent((req.url ?? "/").split("?")[0])
        );
        const file = join(root, path);
        let size;
        try {
            const st = await stat(file);
            if (!st.isFile() || !file.startsWith(root))
                throw new Error("not a file");
            size = st.size;
        } catch {
            res.statusCode = 404;
            return res.end();
        }
        res.setHeader(
            "Content-Type",
            TYPES[extname(file)] ?? "application/octet-stream"
        );
        res.setHeader("Accept-Ranges", "bytes");
        const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
        if (m && (m[1] || m[2])) {
            const start = m[1]
                ? Number(m[1])
                : Math.max(0, size - Number(m[2]));
            const end =
                m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
            res.statusCode = 206;
            res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
            res.setHeader("Content-Length", end - start + 1);
            return createReadStream(file, { start, end }).pipe(res);
        }
        res.setHeader("Content-Length", size);
        createReadStream(file).pipe(res);
    });
    server.listen(env.localPort, () =>
        console.log(
            `serving ${root} on http://localhost:${env.localPort}/ with CORS and ranges`
        )
    );
}

const cmd = process.argv[2];
if (
    process.argv[1] &&
    resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
    if (cmd === "setup") await setup();
    else if (cmd === "serve") serve();
    else {
        console.log("usage: node scripts/ads-publish.mjs setup | serve");
        process.exit(1);
    }
}
