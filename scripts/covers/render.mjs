// Render a post's cover: one HTML plate, drawn at the wide size the post header uses and
// again at the card size the home page and the index use.
//
//   node scripts/covers/render.mjs layout-engine
//
// Writes client/public/img/posts/<name>-{wide,card}.png. Playwright is not a dependency of
// this repo, so it is taken from wherever it is installed; PLAYWRIGHT overrides the path.
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
        await page.close();
        console.log(`${name}-${size.name}: ${size.w}x${size.h}`);
    }
}
await b.close();
