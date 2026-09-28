// Writes each project's git history to server/data/history/<id>.json for the site agent.
// Reads the local clones next to this repo (../<id>), so run it on a machine that has them:
//   npm run snapshot --workspace=server
// Author names only; email addresses are never written.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROJECTS } from "../src/data/projects.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const codeDir = path.resolve(here, "../../..");
const outDir = path.resolve(here, "../data/history");
mkdirSync(outDir, { recursive: true });

const SEP = "\u001f";
const START = "@@commit@@";

for (const [id] of Object.entries(PROJECTS)) {
    const repoDir = path.join(codeDir, id);
    if (!existsSync(path.join(repoDir, ".git"))) {
        console.warn(`skip ${id}: no clone at ${repoDir}`);
        continue;
    }
    const raw = execFileSync(
        "git",
        ["-C", repoDir, "log", "--no-merges", "--date=short", "--shortstat", `--format=${START}%h${SEP}%ad${SEP}%an${SEP}%s${SEP}%(trailers:key=Co-authored-by,valueonly,separator=;)`],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
    const commits = raw
        .split(START)
        .filter((chunk) => chunk.trim())
        .map((chunk) => {
            const [head, ...rest] = chunk.split("\n");
            const [sha, date, author, subject, trailers] = head.split(SEP);
            const stat = rest.join(" ");
            const num = (re) => Number((stat.match(re) || [])[1] || 0);
            const coAuthors = (trailers || "")
                .split(";")
                .map((t) => t.replace(/<[^>]*>/g, "").trim())
                .filter(Boolean);
            return {
                sha,
                date,
                author,
                subject,
                files: num(/(\d+) files? changed/),
                added: num(/(\d+) insertions?/),
                removed: num(/(\d+) deletions?/),
                ...(coAuthors.length ? { coAuthors } : {}),
            };
        });
    writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify({ project: id, generated: new Date().toISOString().slice(0, 10), commits }));
    console.log(`${id}: ${commits.length} commits`);
}
