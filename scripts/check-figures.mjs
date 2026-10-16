// Every figure in a post has to fit the plate it is drawn on: a shape that reaches past the
// viewBox is cut by it, which is what happened to the site frame in the formats figure.
// Point this at a running preview and it reports any figure whose drawing spills.
//
//   node scripts/check-figures.mjs [url] [...paths]
//
// Playwright is not a dependency of this repo, so it is taken from wherever it is
// installed; PLAYWRIGHT overrides the path.
import path from "node:path";

const PW =
    process.env.PLAYWRIGHT ??
    path.join(process.env.HOME, "Documents/code/galleo/node_modules/playwright/index.mjs");
const { chromium } = await import(PW);

const [url = "http://127.0.0.1:8207", ...rest] = process.argv.slice(2);
const paths = rest.length ? rest : ["/blogs/one-layout-engine"];
const WIDTHS = [1440, 900, 390];

const b = await chromium.launch({ channel: "chrome" });
let bad = 0;
for (const p of paths) {
    for (const width of WIDTHS) {
        const page = await b.newPage({ viewport: { width, height: 1000 } });
        await page.goto(url + p, { waitUntil: "networkidle" });
        await page.waitForTimeout(1200);
        const figs = await page.evaluate(() =>
            [...document.querySelectorAll("svg.fig")].map((s) => {
                const v = s.viewBox.baseVal;
                const b = s.getBBox();
                return {
                    label: (s.getAttribute("aria-label") || "").slice(0, 40),
                    over: {
                        left: Math.round(v.x - b.x),
                        right: Math.round(b.x + b.width - (v.x + v.width)),
                        top: Math.round(v.y - b.y),
                        bottom: Math.round(b.y + b.height - (v.y + v.height)),
                    },
                };
            })
        );
        for (const f of figs) {
            const spill = Object.entries(f.over).filter(([, n]) => n > 0);
            if (spill.length) {
                bad += 1;
                const how = spill.map(([side, n]) => `${side} by ${n}`).join(", ");
                console.log(`${p} at ${width}: "${f.label}" spills ${how}`);
            }
        }
        await page.close();
    }
}
await b.close();
console.log(bad ? `${bad} figure(s) spill their plate` : "every figure fits its plate");
process.exit(bad ? 1 : 0);
