// Fetch the picked photographs at the size a cover needs and write them as webp, one per
// article, named by slug. Credit for each is kept in client/src/data/photo-credits.json so the
// page can show it and so a photograph can be traced back to its author.
//
//   node scripts/photos/fetch.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { PICKS } from "./assign.mjs";

const meta = JSON.parse(readFileSync("client/src/data/photo-candidates.json", "utf8"));
const OUT = "client/public/img/photo";
mkdirSync(OUT, { recursive: true });
const credits = {};
let fetched = 0;

for (const [slug, index] of Object.entries(PICKS)) {
    const p = meta[index];
    credits[slug] = { id: p.id, by: p.by, byLink: p.byLink, link: p.link, group: p.group };
    const out = `${OUT}/${slug}.webp`;
    if (existsSync(out)) continue;
    // 1800 wide is enough for the header strip at two times, and keeps each file small
    const url = `${p.full}&w=1800&q=80&fm=jpg&fit=max`;
    const res = await fetch(url);
    if (!res.ok) {
        console.log(`  ${slug}: ${res.status}`);
        continue;
    }
    const tmp = `/tmp/ph-${p.id}.jpg`;
    writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
    execFileSync("magick", [tmp, "-resize", "1800x>", "-quality", "82", out]);
    fetched += 1;
    if (fetched % 10 === 0) console.log(`  ${fetched}…`);
}
writeFileSync("client/src/data/photo-credits.json", `${JSON.stringify(credits, null, 1)}\n`);
console.log(`${fetched} fetched, ${Object.keys(credits).length} credited`);
