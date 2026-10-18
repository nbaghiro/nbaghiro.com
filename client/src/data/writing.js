import { META } from "virtual:posts";

/**
 * The written pieces, as the list pages need them. Each `.md` file in content/posts opens
 * with a few `key: value` lines, a blank line, then the body; the build reads those heads
 * (client/vite-posts.js) so there is no fetch and no CMS. The body is not here on purpose:
 * it loads with the piece itself, from ./post-body. Newest first.
 */
export const POSTS = META.map((meta) => ({
    slug: meta.slug,
    title: meta.title ?? "Untitled",
    date: meta.date ?? "",
    summary: meta.summary ?? "",
    about: meta.about ?? "",
    category: meta.category ?? "Product notes",
    cover: meta.cover ?? "",
    // the header shows the plate as two layers, named after the composed one
    coverBg: (meta.cover ?? "").replace("-wide.", "-bg."),
    coverArt: (meta.cover ?? "").replace("-wide.", "-art."),
    card: meta.card ?? "",
})).sort((a, b) => (a.date < b.date ? 1 : -1));

export const postBySlug = (slug) => POSTS.find((p) => p.slug === slug);

export function readableDate(iso) {
    if (!iso) return "";
    const opts = { day: "numeric", month: "long", year: "numeric" };
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", opts);
}
