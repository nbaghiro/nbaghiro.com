// The link-preview image for each written piece: client/public/img/posts/<slug>-og.jpg.
//
//   node scripts/og-images.mjs
//
// Two reasons it is not just the cover. The covers are WebP, and LinkedIn documents JPG, PNG
// and GIF without saying it will fetch WebP. And they are 2.6:1, where a preview is 1.91:1, so
// a crawler cropping to its own ratio would cut the sides off a composition that uses the full
// width. The cover is fitted whole into 1200x627 and the band above and below is filled with
// the colour sampled from that edge of the cover, which on these plates is invisible.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTS = path.join(ROOT, "client/src/content/posts");
const IMG = path.join(ROOT, "client/public/img/posts");
const W = 1200;
const H = 627;

const headOf = (raw) => raw.split("\n\n")[0];
const metaOf = (file) =>
    Object.fromEntries(
        headOf(fs.readFileSync(path.join(POSTS, file), "utf8"))
            .split("\n")
            .filter((l) => l.includes(":"))
            .map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()]),
    );

// The band above and below is the cover's own edge row stretched, not a flat colour. These
// plates run a photograph across the top that is dark at one end and pale at the other, so a
// single sampled colour met the cover with a visible seam; stretching the row matches it
// column by column and the join disappears.
async function band(buf, width, height, fromTop) {
    if (height <= 0) return null;
    const meta = await sharp(buf).metadata();
    return sharp(buf)
        .extract({ left: 0, top: fromTop ? 0 : meta.height - 1, width: meta.width, height: 1 })
        .resize({ width, height, fit: "fill" })
        // a stretched row of photograph becomes vertical stripes; the blur mixes neighbouring
        // columns back together and leaves the band reading as a soft continuation
        .blur(14)
        .png()
        .toBuffer();
}

let made = 0;
for (const file of fs.readdirSync(POSTS).filter((f) => f.endsWith(".md")).sort()) {
    const slug = file.replace(/\.md$/, "");
    const meta = metaOf(file);
    const cover = meta.cover && path.join(ROOT, "client/public", meta.cover.replace(/^\//, ""));
    if (!cover || !fs.existsSync(cover)) {
        console.log(`  ${slug}: no cover, skipped`);
        continue;
    }
    const fitted = await sharp(cover).resize({ width: W, fit: "inside" }).toBuffer();
    const { height } = await sharp(fitted).metadata();
    const top = Math.floor(Math.max(0, H - height) / 2);
    const bottom = H - top - height;
    const layers = [{ input: fitted, top, left: 0 }];
    const above = await band(fitted, W, top, true);
    const below = await band(fitted, W, bottom, false);
    if (above) layers.unshift({ input: above, top: 0, left: 0 });
    if (below) layers.unshift({ input: below, top: top + height, left: 0 });
    await sharp({ create: { width: W, height: H, channels: 3, background: "#ffffff" } })
        .composite(layers)
        .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
        .toFile(path.join(IMG, `${slug}-og.jpg`));
    made++;
}
console.log(`${made} preview image(s) at ${W}x${H} in client/public/img/posts`);
