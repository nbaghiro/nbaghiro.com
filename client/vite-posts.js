import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * `virtual:posts` — the `key: value` head of every piece in content/posts, and nothing else.
 *
 * The index, the landing page and a piece's own header all need that head; only the piece
 * itself needs the prose under it. Reading the files with `?raw` put both in whichever chunk
 * asked, so the landing page carried the full text of every article to print a list of
 * titles. This reads the heads at build time instead, and the bodies stay behind the one
 * import that wants them (data/post-body.js). Derived from the directory on every build, so
 * there is nothing to keep in sync.
 *
 * The same heads are written to the build as posts.json, because the server needs them too:
 * it injects a piece's title, summary and cover into the HTML so a link to /blogs/<slug>
 * previews as that piece rather than as the site shell. Writing them here keeps one parser.
 */
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src/content/posts");
const ID = "virtual:posts";
const RESOLVED = `\0${ID}`;

// the same split data/post-body.js makes: head, blank line, body
function headOf(raw) {
    return raw.split("\n\n")[0];
}

function metaOf(file) {
    const raw = fs.readFileSync(path.join(DIR, file), "utf8");
    const fields = Object.fromEntries(
        headOf(raw)
            .split("\n")
            .filter((line) => line.includes(":"))
            .map((line) => {
                const at = line.indexOf(":");
                return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
            })
    );
    return { ...fields, slug: file.replace(/\.md$/, "") };
}

export default function posts() {
    return {
        name: "posts-index",
        resolveId: (id) => (id === ID ? RESOLVED : null),
        load(id) {
            if (id !== RESOLVED) return null;
            const all = fs
                .readdirSync(DIR)
                .filter((f) => f.endsWith(".md"))
                .sort()
                .map(metaOf);
            return `export const META = ${JSON.stringify(all)};`;
        },
        // the heads again as a plain file in the build output, for the server's link previews
        generateBundle() {
            this.emitFile({
                type: "asset",
                fileName: "posts.json",
                source: JSON.stringify(
                    fs
                        .readdirSync(DIR)
                        .filter((f) => f.endsWith(".md"))
                        .sort()
                        .map(metaOf),
                ),
            });
        },

        // a virtual module has no file to watch, so an edited piece has to invalidate it
        handleHotUpdate({ file, server }) {
            if (!file.startsWith(DIR) || !file.endsWith(".md")) return undefined;
            const mod = server.moduleGraph.getModuleById(RESOLVED);
            if (mod) server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: "full-reload" });
            return [];
        },
    };
}
