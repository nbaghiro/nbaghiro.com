import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import {
    countsText,
    fetchJson,
    readRoot,
    rootFrom,
    storeRoot,
    whenText,
    DEFAULT_BASE,
} from "./store";
import { Studio } from "./Studio";
import { useFavicon } from "../../favicon";
import "./ads.css";

// The ad studios, one per project, published from each project's own repo into one bucket
// (scripts/ads-publish.mjs). Reachable only by URL: nothing links here and the page asks
// for the bucket root once per device. A link of the form /ads#<root> fills it in.

function Gate({ onOpen }) {
    const [value, setValue] = useState("");
    const [error, setError] = useState("");
    const submit = async (e) => {
        e.preventDefault();
        const root = rootFrom(value);
        if (!root) {
            setError(
                DEFAULT_BASE ? "Enter the key." : "Enter the full address."
            );
            return;
        }
        try {
            await fetchJson(`${root}/index.json`);
            storeRoot(root);
            onOpen(root);
        } catch {
            setError(
                "Nothing is published at that address. Check it and try again."
            );
        }
    };
    return (
        <div className="gate">
            <form onSubmit={submit}>
                <h1>Ad studio</h1>
                <p className="meta">
                    {DEFAULT_BASE
                        ? "Enter the key once on this device."
                        : "Enter the studio address once on this device."}
                </p>
                <input
                    type="text"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={DEFAULT_BASE ? "key" : "https://…/key"}
                    aria-label="Studio address"
                />
                {error && <p className="error">{error}</p>}
                <button type="submit" className="btn primary">
                    Open
                </button>
            </form>
        </div>
    );
}

// Two kinds of kit share the bucket: a product's ads, and a personal profile's posts (the
// publisher marks those with kind "profile"). They sit under separate tabs here.
const SHELVES = [
    ["products", "Products", (p) => p.kind !== "profile"],
    ["linkedin", "LinkedIn", (p) => p.kind === "profile"],
];
const SHELF_KEY = "ads:shelf";

function readShelf() {
    try {
        const v = localStorage.getItem(SHELF_KEY);
        return SHELVES.some(([id]) => id === v) ? v : "products";
    } catch {
        return "products";
    }
}

function Projects({ root, onLock }) {
    const [index, setIndex] = useState(null);
    const [error, setError] = useState("");
    const [shelf, setShelf] = useState(readShelf);
    useEffect(() => {
        fetchJson(`${root}/index.json`)
            .then(setIndex)
            .catch((e) => setError(String(e.message)));
    }, [root]);
    const pick = (id) => {
        setShelf(id);
        try {
            localStorage.setItem(SHELF_KEY, id);
        } catch {
            // a private window; the choice lasts for the page
        }
    };
    const cover = (p, file) =>
        `${root}/${p.id}/${file}?v=${encodeURIComponent(p.publishedAt || "")}`;
    const keep = SHELVES.find(([id]) => id === shelf)?.[2] ?? (() => true);
    const shown = index ? index.projects.filter(keep) : [];
    // in the top bar on a desk, on its own row above the tiles on a phone
    const seg = (
        <div className="seg" role="tablist" aria-label="Kind of kit">
            {SHELVES.map(([id, label, test]) => (
                <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-pressed={id === shelf}
                    aria-selected={id === shelf}
                    onClick={() => pick(id)}
                >
                    {label}
                    {index && (
                        <small> {index.projects.filter(test).length}</small>
                    )}
                </button>
            ))}
        </div>
    );
    return (
        <>
            <header className="topbar">
                <h1>Ad studio</h1>
                <div className="desk">{seg}</div>
                <button type="button" className="btn quiet" onClick={onLock}>
                    Forget this device
                </button>
            </header>
            <div className="body">
                <div className="shelf">{seg}</div>
                {error && <p className="error">{error}</p>}
                {index && shown.length === 0 && (
                    <p className="lede">
                        {shelf === "linkedin"
                            ? "No profile kit is published yet. Run the founder publish script and reload."
                            : "Nothing is published yet. Run a project's publish script and reload."}
                    </p>
                )}
                {index && (
                    <div className="projects">
                        {shown.map((p) => (
                            <Link
                                key={p.id}
                                to={`/ads/${p.id}`}
                                className="tile"
                            >
                                {p.preview?.banner ? (
                                    <div className="tile-profile">
                                        <img
                                            className="tile-banner"
                                            src={cover(p, p.preview.banner)}
                                            alt=""
                                            loading="lazy"
                                        />
                                        {p.preview.avatar && (
                                            <img
                                                className="tile-avatar"
                                                src={cover(p, p.preview.avatar)}
                                                alt=""
                                                loading="lazy"
                                            />
                                        )}
                                        <span>{p.preview.name}</span>
                                    </div>
                                ) : p.covers?.length > 0 ? (
                                    <div
                                        className={`covers covers-${Math.min(p.covers.length, 3)}`}
                                    >
                                        {p.covers.slice(0, 3).map((f) => (
                                            <img
                                                crossOrigin="anonymous"
                                                key={f}
                                                src={cover(p, f)}
                                                alt=""
                                                loading="lazy"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="tile-empty">{p.name}</div>
                                )}
                                <h2>{p.name}</h2>
                                <p className="meta">{countsText(p.counts)}</p>
                                <p className="when">
                                    Published {whenText(p.publishedAt)}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function Ads() {
    useFavicon("mark");
    const navigate = useNavigate();
    const [root, setRoot] = useState(() => {
        const hash = window.location.hash.slice(1);
        const sectionLink = hash === "profile" || hash.startsWith("post-");
        let fromHash = "";
        try {
            if (!sectionLink) fromHash = rootFrom(decodeURIComponent(hash));
        } catch {
            // A malformed fragment must not replace the saved studio address.
        }
        if (fromHash) {
            storeRoot(fromHash);
            window.history.replaceState(null, "", window.location.pathname);
            return fromHash;
        }
        return readRoot();
    });

    useEffect(() => {
        document.title = "Ad studio";
        const meta = document.createElement("meta");
        meta.name = "robots";
        meta.content = "noindex, nofollow";
        document.head.appendChild(meta);
        return () => {
            meta.remove();
            document.title = "Naib Baghirov";
        };
    }, []);

    const lock = () => {
        storeRoot("");
        setRoot("");
        navigate("/ads");
    };

    if (!root) {
        return (
            <div className="ads">
                <Gate onOpen={setRoot} />
            </div>
        );
    }
    return (
        <div className="ads">
            <Routes>
                <Route index element={<Projects root={root} onLock={lock} />} />
                <Route path=":project" element={<Studio root={root} />} />
            </Routes>
        </div>
    );
}

export default Ads;
