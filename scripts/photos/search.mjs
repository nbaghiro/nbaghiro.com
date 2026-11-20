// Candidate photographs for article grounds, by search rather than by hand.
//
// The register is the site's own: cool, quiet, northern, atmospheric, natural light. Each search
// carries a tone modifier, because a bare subject word returns staged commercial stock. Nothing
// is downloaded here: this writes the candidates, with their author and link, and the picker
// loads the thumbnails from Unsplash itself. The ones Naib picks get fetched at full size after.
//
//   UNSPLASH_ACCESS_KEY=... node scripts/photos/search.mjs
import { writeFileSync } from "node:fs";

const KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!KEY) throw new Error("UNSPLASH_ACCESS_KEY is not set");

const SEARCHES = [
    ["lake", "fog lake forest morning muted"],
    ["ridge", "mist mountain ridge layers natural light"],
    ["birch", "birch forest fog winter muted"],
    ["water", "still water reflection fog minimal"],
    ["reeds", "reeds marsh fog morning grey"],
    ["coast", "coastal fog sea cliffs muted"],
    ["snow", "snow field fog quiet landscape"],
    ["pine", "pine trees mist overcast documentary"],
    ["river", "river valley fog soft light"],
    ["island", "island fog calm water distant"],
];

const out = [];
for (const [group, query] of SEARCHES) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape&content_filter=high`;
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}` } });
    if (!res.ok) {
        console.log(`  ${group}: ${res.status}`);
        continue;
    }
    const data = await res.json();
    for (const p of data.results) {
        out.push({
            id: p.id,
            group,
            query,
            thumb: p.urls.small,
            view: p.urls.regular,
            full: p.urls.raw,
            w: p.width,
            h: p.height,
            colour: p.color,
            alt: p.alt_description ?? "",
            by: p.user?.name ?? "",
            byLink: p.user?.links?.html ?? "",
            link: p.links?.html ?? "",
        });
    }
    console.log(`  ${group}: ${data.results.length}`);
}
writeFileSync("client/src/data/photo-candidates.json", `${JSON.stringify(out, null, 1)}\n`);
console.log(`${out.length} candidates written`);
