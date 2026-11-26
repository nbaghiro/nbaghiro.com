// Every article's cover, rendered from the component the index draws with.
//
// Two files per piece: the wide one the article header shows, and the 3:2 card the index and
// the phone header use. Both are screenshots of client/src/pages/Shot.jsx at an exact size, so
// the cover in the file and the cover in the page cannot drift apart.
//
// The crop is the point: the photograph fills the frame at whichever shape is asked for, so the
// wide header and the 3:2 card are two crops of one picture rather than one letterboxed.
//
// Nothing needs to be running: if no server answers on ORIGIN, this starts `vite preview` over
// the built client and stops it again afterwards.
//
//   npm run covers                  every piece
//   npm run covers -- <slug>…       just these
//   npm run covers -- --missing     only the ones with an image absent
import { readdirSync, existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { chromium } from "playwright-core";
import sharp from "sharp";

const ORIGIN = process.env.ORIGIN ?? "http://localhost:5284";
const OUT = "client/public/img/posts";
mkdirSync(OUT, { recursive: true });

// The social preview is rendered here rather than fitted from the wide cover afterwards. Fitting
// letterboxed a 2.6:1 crop into 1.91:1 and filled the rest with the stretched edge row, so a
// photograph whose edges are pale arrived in a chat window as mostly empty sky, with none of the
// scrim or the line the page draws over it. It is the one crop that carries the line in its
// pixels, because it travels without the page.
const SIZES = [
    { suffix: "wide", w: 2000, h: 769 },
    { suffix: "card", w: 1200, h: 800 },
    { suffix: "og", w: 1200, h: 627, words: true, jpeg: true },
];

const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith("-"));
const onlyMissing = args.includes("--missing");
const lacks = (slug) =>
    SIZES.some(({ suffix, jpeg }) => !existsSync(`${OUT}/${slug}-${suffix}.${jpeg ? "jpg" : "webp"}`));
const slugs = readdirSync("client/src/content/posts")
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .filter((s) => (only.length === 0 || only.includes(s)) && (!onlyMissing || lacks(s)));

if (slugs.length === 0) {
    console.log("every cover is already drawn");
    process.exit(0);
}

const reachable = async (url) => {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
        return res.ok;
    } catch {
        return false;
    }
};

// reuse a dev server if one is up, otherwise serve the build for the length of the run
let origin = ORIGIN;
let server = null;
if (!(await reachable(origin))) {
    if (!existsSync("client/dist/index.html")) {
        console.error("no server on " + origin + " and no build to serve: run npm run build first");
        process.exit(1);
    }
    const port = 5399;
    origin = `http://localhost:${port}`;
    server = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort"], {
        cwd: "client",
        stdio: "ignore",
    });
    const until = Date.now() + 20000;
    while (!(await reachable(origin))) {
        if (Date.now() > until) {
            server.kill();
            throw new Error("the preview server did not come up");
        }
        await new Promise((r) => setTimeout(r, 300));
    }
    console.log(`serving the build on ${origin}`);
}

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ deviceScaleFactor: 1 });
let written = 0;
for (const slug of slugs) {
    for (const { suffix, w, h, words, jpeg } of SIZES) {
        await page.setViewportSize({ width: w, height: h });
        const url = `${origin}/art/shot?slug=${slug}&w=${w}&h=${h}${words ? "&words=1" : ""}`;
        await page.goto(url, { waitUntil: "networkidle" });
        const state = await page.getAttribute("main", "data-shot");
        if (state !== "ready") throw new Error(`${slug}: the shot page has no such piece`);
        // Photo covers fetch images; original vector covers declare that they are self-contained.
        await page.waitForFunction(() => {
            if (document.querySelector('[data-cover-kind="vector"]')) return true;
            const imgs = [...document.querySelectorAll("image")];
            return imgs.length > 0 && imgs.every((i) => i.getAttribute("href"));
        });
        await page.waitForTimeout(260);
        const png = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: h } });
        // jpeg for the preview: LinkedIn documents JPG, PNG and GIF, never WebP
        await (jpeg
            ? sharp(png).jpeg({ quality: 88, chromaSubsampling: "4:4:4" }).toFile(`${OUT}/${slug}-og.jpg`)
            : sharp(png).webp({ quality: 88 }).toFile(`${OUT}/${slug}-${suffix}.webp`));
        written += 1;
    }
}
await browser.close();
server?.kill();
console.log(`${written} covers written for ${slugs.length} piece(s)`);
