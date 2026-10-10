// What the ad studio remembers on a device and how it reaches the bucket.
//
// The root is `<public bucket base>/<key>`, entered once per device. The key is the only
// thing between the public bucket and a reader, which is why it is typed in rather than
// built in: nothing in this bundle can be used to find the studios without it.

// Set once the bucket has a public URL, so a device can enter the key alone. Not secret.
export const DEFAULT_BASE = "https://pub-306ef928c38942dc8c24f94481360a5d.r2.dev";

const ROOT_KEY = "ads.root";

export function readRoot() {
    try {
        return localStorage.getItem(ROOT_KEY) || "";
    } catch {
        return "";
    }
}

// Accepts the full root URL or, when DEFAULT_BASE is set, the key alone.
export function rootFrom(input) {
    const v = input.trim().replace(/\/+$/, "");
    if (!v) return "";
    if (/^https?:\/\//.test(v)) return v;
    return DEFAULT_BASE ? `${DEFAULT_BASE}/${v}` : "";
}

export function storeRoot(root) {
    try {
        if (root) localStorage.setItem(ROOT_KEY, root);
        else localStorage.removeItem(ROOT_KEY);
    } catch {
        // private mode: the key lasts for the page only
    }
}

export const pref = {
    get(name, fallback) {
        try {
            const v = localStorage.getItem(`ads.${name}`);
            return v === null ? fallback : JSON.parse(v);
        } catch {
            return fallback;
        }
    },
    set(name, value) {
        try {
            localStorage.setItem(`ads.${name}`, JSON.stringify(value));
        } catch {
            // private mode
        }
    },
};

export async function fetchJson(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok)
        throw new Error(
            `${r.status} for ${url.replace(/^https?:\/\/[^/]+/, "")}`
        );
    return r.json();
}

// Every media URL carries the publish time, so a re-render that writes the same path
// is a new URL to the browser and to the bucket's cache.
export function mediaUrl(root, manifest, file) {
    const v = encodeURIComponent(manifest.publishedAt || "");
    return `${root}/${manifest.project.id}/${file}?v=${v}`;
}

export function themeIds(manifest) {
    const ids = (manifest.themes || []).map((t) => t.id);
    return ids.length ? ids : ["default"];
}

export function themeOf(manifest, id) {
    return (manifest.themes || []).find((t) => t.id === id);
}

export function themeName(manifest, id) {
    return themeOf(manifest, id)?.name ?? id;
}

// The first of the preferred themes that was actually rendered, else the first rendered.
export function chooseTheme(have, ...preferred) {
    for (const id of preferred) if (id && have.includes(id)) return id;
    return have[0];
}

// A post's slides in the theme the device picked, or the first theme it was rendered in.
export function slidesFor(post, theme) {
    const have = Object.keys(post.slides || {});
    const id = chooseTheme(have, theme, post.defaultTheme);
    return { theme: id, slides: post.slides?.[id] ?? {} };
}

export function fileName(file) {
    return file.split("/").slice(-3).join("-");
}

export function whenText(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

const COUNT_WORDS = {
    posts: ["post", "posts"],
    stories: ["story set", "story sets"],
    reels: ["reel", "reels"],
    linkedin: ["LinkedIn document", "LinkedIn documents"],
    x: ["X post", "X posts"],
};

// "57 posts, 28 reels, 47 LinkedIn documents and 26 X posts"
export function countsText(counts = {}) {
    const parts = Object.entries(counts)
        .filter(([k, n]) => n > 0 && COUNT_WORDS[k])
        .map(([k, n]) => `${n} ${COUNT_WORDS[k][n === 1 ? 0 : 1]}`);
    if (parts.length <= 1) return parts.join("");
    return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
