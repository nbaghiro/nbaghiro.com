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

function Projects({ root, onLock }) {
    const [index, setIndex] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
        fetchJson(`${root}/index.json`)
            .then(setIndex)
            .catch((e) => setError(String(e.message)));
    }, [root]);
    const cover = (p, file) =>
        `${root}/${p.id}/${file}?v=${encodeURIComponent(p.publishedAt || "")}`;
    return (
        <>
            <header className="topbar">
                <h1>Ad studio</h1>
                <button type="button" className="btn quiet" onClick={onLock}>
                    Forget this device
                </button>
            </header>
            <div className="body">
                {error && <p className="error">{error}</p>}
                {index && index.projects.length === 0 && (
                    <p className="lede">
                        Nothing is published yet. Run a project&apos;s publish
                        script and reload.
                    </p>
                )}
                {index && (
                    <div className="projects">
                        {index.projects.map((p) => (
                            <Link
                                key={p.id}
                                to={`/ads/${p.id}`}
                                className="tile"
                            >
                                {p.covers?.length > 0 && (
                                    <div className="covers">
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
    const navigate = useNavigate();
    const [root, setRoot] = useState(() => {
        const fromHash = rootFrom(
            decodeURIComponent(window.location.hash.slice(1))
        );
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
