/**
 * The written pieces. Each `.md` file in content/posts opens with a few `key: value` lines,
 * a blank line, then the body; Vite inlines them at build time, so there is no fetch and no
 * CMS. Newest first.
 */
const files = import.meta.glob("../content/posts/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
});

function parse(path, raw) {
    const [head, ...rest] = raw.split("\n\n");
    const meta = Object.fromEntries(
        head
            .split("\n")
            .filter((line) => line.includes(":"))
            .map((line) => {
                const at = line.indexOf(":");
                return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
            })
    );
    return {
        slug: path.split("/").pop().replace(/\.md$/, ""),
        title: meta.title ?? "Untitled",
        date: meta.date ?? "",
        summary: meta.summary ?? "",
        about: meta.about ?? "",
        cover: meta.cover ?? "",
        card: meta.card ?? "",
        body: rest.join("\n\n"),
    };
}

export const POSTS = Object.entries(files)
    .map(([path, raw]) => parse(path, raw))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

export const postBySlug = (slug) => POSTS.find((p) => p.slug === slug);

export function readableDate(iso) {
    if (!iso) return "";
    const opts = { day: "numeric", month: "long", year: "numeric" };
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", opts);
}
