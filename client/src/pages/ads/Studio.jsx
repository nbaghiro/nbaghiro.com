import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    fetchJson,
    mediaUrl,
    pref,
    themeIds,
    themeName,
    themeOf,
} from "./store";
import { Posts } from "./Posts";
import { AdUnits } from "./AdUnits";
import { Stories } from "./Stories";
import { Reels } from "./Reels";
import { LinkedIn } from "./LinkedIn";
import { XPosts } from "./XPosts";
import { Profile } from "./Profile";
import { Combos } from "./Combos";
import { Docs } from "./Docs";
import { Strategy } from "./Strategy";
import { Library } from "./Library";
import { Quotes } from "./Quotes";
import { Industry } from "./Industry";
import { Account } from "./Account";

const countIn = (doc) =>
    (doc?.groups ?? []).reduce((n, g) => n + g.items.length, 0);
const quoteCount = (m) => countIn(m.quotes);
const industryCount = (m) => countIn(m.industry);

const TABS = [
    ["posts", "Posts", (m) => m.posts?.length],
    ["ads", "Ads", (m) => m.ads?.items?.length],
    ["stories", "Stories", (m) => m.stories?.length],
    ["reels", "Reels", (m) => m.reels?.length],
    ["linkedin", "LinkedIn", (m) => m.linkedin?.posts?.length || ""],
    ["x", "X", (m) => m.x?.posts?.length],
    [
        "profile",
        "Profile",
        (m) => m.profile?.pictures?.length || m.profile?.fields?.length,
    ],
    ["combos", "Combos", (m) => m.combos?.avatars?.length],
    ["docs", "One-pagers", (m) => m.docs?.items?.length],
    ["notes", "Strategy", (m) => m.notes?.sections?.length],
];

// One project's studio over its manifest. The theme applies to every post at once and any
// post can be overridden; theme, overrides, size and tab are kept per device.
export function Studio({ root }) {
    const { project } = useParams();
    const [manifest, setManifest] = useState(null);
    const [error, setError] = useState("");
    const [tab, setTab] = useState(() => pref.get(`${project}.tab`, "posts"));
    const [theme, setThemeState] = useState(() =>
        pref.get(`${project}.theme`, "")
    );
    const [sel, setSelState] = useState(() => pref.get(`${project}.sel`, {}));
    const [fmt, setFmtState] = useState(() =>
        pref.get(`${project}.fmt`, "feed")
    );
    const [sheet, setSheet] = useState(false);

    useEffect(() => {
        setManifest(null);
        setError("");
        fetchJson(`${root}/${project}/manifest.json`)
            .then(setManifest)
            .catch((e) => setError(String(e.message)));
    }, [root, project]);

    const themes = useMemo(
        () => (manifest ? themeIds(manifest) : []),
        [manifest]
    );
    const current = themes.includes(theme) ? theme : themes[0];
    const hasStory = useMemo(
        () =>
            !!manifest?.posts?.some((p) =>
                Object.values(p.slides || {}).some((s) => s.story?.length)
            ),
        [manifest]
    );
    const format = hasStory ? fmt : "feed";

    if (error) {
        return (
            <div className="body">
                <p className="error">{error}</p>
            </div>
        );
    }
    if (!manifest) {
        return (
            <div className="body">
                <p className="meta">Loading…</p>
            </div>
        );
    }

    const url = (file) => mediaUrl(root, manifest, file);
    const setTheme = (id) => {
        setThemeState(id);
        setSelState({});
        pref.set(`${project}.theme`, id);
        pref.set(`${project}.sel`, {});
    };
    const setSel = (slug, id) => {
        const next = { ...sel, [slug]: id };
        setSelState(next);
        pref.set(`${project}.sel`, next);
    };
    const setFmt = (f) => {
        setFmtState(f);
        pref.set(`${project}.fmt`, f);
    };
    const pick = (id) => {
        setTab(id);
        pref.set(`${project}.tab`, id);
        window.scrollTo({ top: 0 });
    };
    // a profile kit may carry the same posts in several voices: a tab per voice, or, with
    // layout "compare", one tab with the voices side by side on each post
    const sets =
        manifest.linkedin?.layout === "compare"
            ? []
            : (manifest.linkedin?.sets ?? []);
    // A library kit is its own shape: one filtered list of posts and the account behind
    // them. It declares that itself rather than being inferred, so every other kit keeps
    // the tabs its manifest earns.
    const library = manifest.linkedin?.layout === "library";
    const tabs = library
        ? [
              ["library", "Posts", (m) => m.linkedin?.posts?.length],
              ...(quoteCount(manifest)
                  ? [["quotes", "Quotes", quoteCount]]
                  : []),
              ...(industryCount(manifest)
                  ? [["industry", "Industry", industryCount]]
                  : []),
              ["account", "Profile", () => ""],
          ]
        : [
              ...TABS.filter(
                  ([id, , count]) =>
                      (count(manifest) ||
                          (id === "linkedin" && manifest.linkedin?.page)) &&
                      !(id === "linkedin" && sets.length)
              ),
              ...sets.map((s) => [`li:${s.id}`, s.label, () => ""]),
          ];
    const active = tabs.some(([id]) => id === tab) ? tab : tabs[0]?.[0];
    const activeSet = sets.find((s) => `li:${s.id}` === active);
    const manyThemes = themes.length > 1;
    const showSize = hasStory && active === "posts";
    const ctx = { manifest, url, theme: current, sel, setSel, format, themes };

    const sizeSwitch = (
        <div className="seg" role="group" aria-label="Size">
            <button
                type="button"
                aria-pressed={format === "feed"}
                onClick={() => setFmt("feed")}
            >
                Feed
            </button>
            <button
                type="button"
                aria-pressed={format === "story"}
                onClick={() => setFmt("story")}
            >
                Story
            </button>
        </div>
    );

    return (
        <>
            <header className="topbar">
                <Link to="/ads" className="back" aria-label="All projects">
                    ‹
                </Link>
                <h1>{manifest.project.name}</h1>
                {tabs.length > 1 && (
                    <nav className="tabs desk" aria-label="Sections">
                        {tabs.map(([id, label, count]) => (
                            <button
                                key={id}
                                type="button"
                                aria-pressed={id === active}
                                onClick={() => pick(id)}
                            >
                                {label} <small>{count(manifest)}</small>
                            </button>
                        ))}
                    </nav>
                )}
                {manyThemes && active !== "profile" && active !== "account" && (
                    <div className="rings bare desk" aria-label="Theme">
                        {themes.map((id) => (
                            <Ring
                                key={id}
                                manifest={manifest}
                                id={id}
                                pressed={id === current}
                                onClick={() => setTheme(id)}
                            />
                        ))}
                    </div>
                )}
                {showSize && <div className="desk">{sizeSwitch}</div>}
                {(manyThemes || showSize) &&
                    active !== "profile" &&
                    active !== "account" && (
                        <button
                            type="button"
                            className="ringbtn"
                            aria-label="Theme and size"
                            onClick={() => setSheet(true)}
                            style={ringStyle(themeOf(manifest, current))}
                        >
                            <span className="disc">
                                <i />
                            </span>
                        </button>
                    )}
            </header>
            <main className="body">
                {active === "posts" && <Posts {...ctx} />}
                {active === "ads" && <AdUnits {...ctx} />}
                {active === "stories" && <Stories {...ctx} />}
                {active === "reels" && <Reels {...ctx} />}
                {active === "linkedin" && <LinkedIn {...ctx} />}
                {activeSet && <LinkedIn {...ctx} set={activeSet} />}
                {active === "x" && <XPosts {...ctx} />}
                {active === "profile" && <Profile {...ctx} />}
                {active === "combos" && <Combos {...ctx} />}
                {active === "docs" && <Docs {...ctx} />}
                {active === "notes" && <Strategy {...ctx} />}
                {active === "library" && <Library {...ctx} />}
                {active === "quotes" && <Quotes {...ctx} />}
                {active === "industry" && <Industry {...ctx} />}
                {active === "account" && <Account {...ctx} />}
            </main>
            {tabs.length > 1 && (
                <nav className="tabbar" aria-label="Sections">
                    {tabs.map(([id, label, count]) => (
                        <button
                            key={id}
                            type="button"
                            aria-pressed={id === active}
                            onClick={() => pick(id)}
                        >
                            <b>{label}</b>
                            <span>{count(manifest)}</span>
                        </button>
                    ))}
                </nav>
            )}
            {sheet && (
                <>
                    <button
                        type="button"
                        className="scrim"
                        aria-label="Close"
                        onClick={() => setSheet(false)}
                    />
                    <div
                        className="sheet"
                        role="dialog"
                        aria-label="Theme and size"
                    >
                        {manyThemes && (
                            <>
                                <h2>Theme for every post</h2>
                                <div className="rings">
                                    {themes.map((id) => (
                                        <Ring
                                            key={id}
                                            manifest={manifest}
                                            id={id}
                                            pressed={id === current}
                                            onClick={() => setTheme(id)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                        {showSize && (
                            <>
                                <h2>Size</h2>
                                {sizeSwitch}
                            </>
                        )}
                        <button
                            type="button"
                            className="btn"
                            onClick={() => setSheet(false)}
                        >
                            Done
                        </button>
                    </div>
                </>
            )}
        </>
    );
}

export function ringStyle(t) {
    if (!t) return undefined;
    return { "--t-bg": t.bg, "--t-ink": t.ink, "--t-accent": t.accent };
}

export function Ring({ manifest, id, pressed, onClick }) {
    const t = themeOf(manifest, id);
    return (
        <button
            type="button"
            className="ring"
            aria-pressed={pressed}
            onClick={onClick}
            style={ringStyle(t)}
        >
            <span className="disc">
                <i />
            </span>
            <span className="name">{themeName(manifest, id)}</span>
        </button>
    );
}
