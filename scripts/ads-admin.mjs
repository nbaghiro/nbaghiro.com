// Housekeeping on the ads bucket that publishing itself does not cover: taking a project
// off the hub, and renaming one without republishing it.
//
//   node scripts/ads-admin.mjs remove founder-x
//   node scripts/ads-admin.mjs rename founder-x-codex "Naib on X"
//
// Reads the same .env.ads as ads-publish.mjs and shells out to the aws CLI the same way.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const file = join(ROOT, ".env.ads");
if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
        const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
        if (m && !(m[1] in process.env)) {
            process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
    }
}
const env = {
    account: process.env.ADS_R2_ACCOUNT_ID,
    keyId: process.env.ADS_R2_ACCESS_KEY_ID,
    secret: process.env.ADS_R2_SECRET_ACCESS_KEY,
    bucket: process.env.ADS_R2_BUCKET || "ads",
    key: process.env.ADS_KEY,
};
for (const k of ["account", "keyId", "secret", "key"]) {
    if (!env[k]) throw new Error(`.env.ads is missing ${k}`);
}

function aws(args, input) {
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
                stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
            }
        );
        let out = "";
        let err = "";
        child.stdout.on("data", (d) => (out += d));
        child.stderr.on("data", (d) => (err += d));
        child.on("error", rej);
        child.on("close", (code) =>
            code === 0 ? res(out) : rej(new Error(err || out))
        );
        if (input !== undefined) child.stdin.end(input);
    });
}

const s3 = (p) => `s3://${env.bucket}/${env.key}/${p}`;

async function readIndex() {
    const out = await aws(["s3", "cp", s3("index.json"), "-"]);
    return JSON.parse(out);
}

async function writeIndex(index) {
    index.projects.sort((a, b) => a.name.localeCompare(b.name));
    await aws(
        [
            "s3", "cp", "-", s3("index.json"),
            "--content-type", "application/json",
            "--cache-control", "no-cache",
        ],
        JSON.stringify(index, null, 2)
    );
}

const [cmd, id, name] = process.argv.slice(2);
const index = await readIndex();
const row = index.projects.find((p) => p.id === id);
if (!row) throw new Error(`no project "${id}" on the hub`);

if (cmd === "remove") {
    await aws(["s3", "rm", s3(`${id}/`), "--recursive"]);
    index.projects = index.projects.filter((p) => p.id !== id);
    await writeIndex(index);
    console.log(`removed ${id} (${row.name}) and its files`);
} else if (cmd === "rename") {
    if (!name) throw new Error("rename needs a new name");
    row.name = name;
    await writeIndex(index);
    // the project's own manifest carries the name too, so the studio header matches
    const manifest = JSON.parse(await aws(["s3", "cp", s3(`${id}/manifest.json`), "-"]));
    manifest.project = { ...manifest.project, name };
    await aws(
        ["s3", "cp", "-", s3(`${id}/manifest.json`), "--content-type", "application/json", "--cache-control", "no-cache"],
        JSON.stringify(manifest)
    );
    console.log(`renamed ${id} to "${name}"`);
} else {
    throw new Error("usage: ads-admin.mjs remove <id> | rename <id> <name>");
}
