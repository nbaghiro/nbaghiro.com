// Every article has its three images, checked without a browser so the deploy build can run it.
//
// The covers are committed artifacts rather than build output: rendering them needs Chrome, and
// Render's build image has none. This is the guard that keeps "committed" from meaning
// "forgotten". It names the command rather than only reporting the gap.
import { readdirSync, existsSync } from "node:fs";

const POSTS = "client/src/content/posts";
const IMG = "client/public/img/posts";
const WANTED = [["card", "webp"], ["wide", "webp"], ["og", "jpg"]];

const missing = [];
for (const file of readdirSync(POSTS).filter((f) => f.endsWith(".md"))) {
    const slug = file.replace(/\.md$/, "");
    for (const [suffix, ext] of WANTED) {
        if (!existsSync(`${IMG}/${slug}-${suffix}.${ext}`)) missing.push(`${slug}-${suffix}.${ext}`);
    }
}

if (missing.length > 0) {
    const slugs = [...new Set(missing.map((m) => m.replace(/-(card|wide|og)\.(webp|jpg)$/, "")))];
    console.error(`${missing.length} cover image(s) missing:`);
    for (const m of missing) console.error(`  ${m}`);
    console.error(`\nRender them with:  npm run covers -- ${slugs.join(" ")}`);
    process.exit(1);
}
console.log(`covers present for ${readdirSync(POSTS).filter((f) => f.endsWith(".md")).length} article(s)`);
