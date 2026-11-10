import { homedir } from "node:os";
const { chromium } = await import(
    process.env.PLAYWRIGHT ??
        `${homedir()}/Documents/code/galleo/node_modules/playwright/index.mjs`
);
import sharp from "sharp";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const out = "client/public/img/posts/stock-movements-and-repeated-events";
const browser = await chromium.launch({ channel: "chrome" });
try {
    for (const [width, height, kind] of [
        [2000, 769, "wide"],
        [1000, 1000, "card"],
    ]) {
        const page = await browser.newPage({
            viewport: { width, height },
            deviceScaleFactor: 1,
        });
        await page.goto(
            pathToFileURL(
                resolve(
                    "scripts/covers/stock-movements-and-repeated-events.html"
                )
            ).href + `#${width}x${height}`
        );
        await page.evaluate(() => document.fonts.ready);
        await sharp(await page.screenshot())
            .webp({ quality: 94 })
            .toFile(`${out}-${kind}.webp`);
        if (kind === "wide") {
            await page.addStyleTag({ content: "svg { visibility:hidden }" });
            await sharp(await page.screenshot())
                .webp({ quality: 92 })
                .toFile(out + "-bg.webp");
            await page.addStyleTag({
                content:
                    "svg { visibility:visible } html,body,.sheet { background:transparent } .sheet img,.wash { visibility:hidden }",
            });
            await sharp(await page.screenshot({ omitBackground: true }))
                .webp({ quality: 95 })
                .toFile(out + "-art.webp");
        }
        await page.close();
    }
} finally {
    await browser.close();
}
