// Render a post's cover from one HTML plate.
//
//   node scripts/covers/render.mjs layout-engine
//
// Writes four files to client/public/img/posts:
//   <name>-card  the composed plate at 3:2, for the home page, the index and sharing
//   <name>-wide  the composed plate at 2.6:1, kept for anything that wants one file
//   <name>-bg    the photograph and its wash alone, which the page may crop freely
//   <name>-art   the drawing alone, on transparency, which the page must never crop
// The header shows bg and art as two layers, because a plate baked into one bitmap can
// only fill a viewport by stretching the photograph or letterboxing the drawing.
// Playwright is not a dependency of this repo, so it is taken from wherever it is
// installed; PLAYWRIGHT overrides the path.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PW =
    process.env.PLAYWRIGHT ??
    path.join(process.env.HOME, "Documents/code/galleo/node_modules/playwright/index.mjs");
const { chromium } = await import(PW);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.resolve(HERE, "../../client/public/img/posts");
const SIZES = [
    { name: "wide", w: 2000, h: 769 },
    { name: "card", w: 900, h: 600 },
];

const names = process.argv.slice(2);
if (!names.length) throw new Error("name the plate, e.g. layout-engine");

fs.mkdirSync(IMG, { recursive: true });
const b = await chromium.launch({ channel: "chrome" });
for (const name of names) {
    const file = path.join(HERE, `${name}.html`);
    if (!fs.existsSync(file)) throw new Error(`no plate at ${file}`);
    for (const size of SIZES) {
        const page = await b.newPage({
            viewport: { width: size.w, height: size.h },
            deviceScaleFactor: 1,
        });
        await page.goto(`file://${file}#${size.w}x${size.h}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        const out = path.join(IMG, `${name}-${size.name}.png`);
        await page.locator(".sheet").screenshot({ path: out });
        if (size.name === "wide") {
            // the photograph on its own, which the page is free to crop to any width
            await page.addStyleTag({ content: "svg#plate { display: none }" });
            await page.locator(".sheet").screenshot({
                path: path.join(IMG, `${name}-bg.png`),
            });
            // the drawing on its own, on transparency, at the plate's own proportions
            await page.addStyleTag({
                content: `svg#plate { display: block }
                    .sheet img, .wash { display: none }
                    html, body, .sheet { background: transparent }`,
            });
            await page.locator(".sheet").screenshot({
                path: path.join(IMG, `${name}-art.png`),
                omitBackground: true,
            });
        }
        await page.close();
        console.log(`${name}-${size.name}: ${size.w}x${size.h}`);
    }
}
await b.close();
