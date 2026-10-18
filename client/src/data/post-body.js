/**
 * The prose under each piece's `key: value` head. Imported only by the piece's own page, so
 * the bodies travel in that chunk rather than in front of everyone who opens the list.
 */
const files = import.meta.glob("../content/posts/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
});

const bySlug = Object.fromEntries(
    Object.entries(files).map(([path, raw]) => [
        path.split("/").pop().replace(/\.md$/, ""),
        raw,
    ])
);

export function bodyFor(slug) {
    const raw = bySlug[slug];
    if (!raw) return "";
    // the head is everything before the first blank line; the body is the rest
    const [, ...rest] = raw.split("\n\n");
    return rest.join("\n\n");
}
