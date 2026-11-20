import { useState } from "react";
import { Link } from "react-router-dom";
import { COMPOSITIONS, PLATES, compositionsFor } from "../art/plates";
import PlateArt from "../art/PlateArt";
import "./Art.css";

/**
 * The art catalogue, kept so the set can be looked at whole rather than one cover at a time.
 * Internal: nothing links to it from the site's own navigation.
 */

const W = 600;
const H = 400;

function Frame({ comp, label }) {
    const id = `clip-${comp.id}`;
    return (
        <li>
            <div className="frame">
                <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
                    <defs>
                        <clipPath id={id}>
                            <rect width={W} height={H} />
                        </clipPath>
                    </defs>
                    <rect width={W} height={H} fill="hsl(44 20% 93%)" />
                    <PlateArt comp={comp} w={W} h={H} clipId={id} />
                    <line className="art-hair" x1="40" y1={H - 52} x2={W - 40} y2={H - 52} />
                </svg>
            </div>
            <p className="id">{comp.id}</p>
            <p className="meta">
                {[comp.flip && "mirrored", comp.turn && `turned ${comp.turn}°`, comp.ghost && "ghosted", comp.detail && "detail", comp.corner !== "tr" && comp.corner]
                    .filter(Boolean)
                    .join(" · ") || "as drawn"}
            </p>
        </li>
    );
}

export default function Art() {
    const [plate, setPlate] = useState("all");
    const shown = plate === "all" ? COMPOSITIONS : compositionsFor(plate);
    return (
        <main className="art">
            <header>
                <p className="eyebrow">Internal</p>
                <h1>The plates</h1>
                <p className="lede">
                    Nine botanical drawings, and {COMPOSITIONS.length} compositions made from them.
                    No new specimen appears by writing code, so the variation is in the
                    composition: which corner a plate hangs from, whether it is mirrored, how far
                    it is turned, how much of the frame it takes, whether a pale second copy sits
                    behind it, and whether it is shown whole or as a detail.
                </p>
                <p className="note">
                    The site's own drawings, used in the page margins. <Link to="/images">The photographs</Link>.
                </p>
                <div className="switch">
                    <button type="button" aria-pressed={plate === "all"} onClick={() => setPlate("all")}>
                        All {COMPOSITIONS.length}
                    </button>
                    {PLATES.map((p) => (
                        <button key={p.id} type="button" aria-pressed={plate === p.id} onClick={() => setPlate(p.id)}>
                            {p.name}
                        </button>
                    ))}
                </div>
            </header>

            <section>
                <h2>The nine</h2>
                <ul className="plates">
                    {PLATES.map((p) => (
                        <li key={p.id}>
                            <img src={`/img/edge-${p.id}.webp`} alt={p.name} />
                            <p className="id">{p.id}</p>
                            <p className="meta">
                                {p.shape} · {compositionsFor(p.id).length} compositions
                            </p>
                            <p className="used">{p.note}</p>
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <h2>{plate === "all" ? "Every composition" : PLATES.find((p) => p.id === plate)?.name}</h2>
                <p className="note">
                    Each one in the box an article cover gets, with its hairline, so the set can be
                    judged at the size it is used.
                </p>
                <ul className="grid">
                    {shown.map((c) => (
                        <Frame key={c.id} comp={c} label={`${c.plate}, ${c.id}`} />
                    ))}
                </ul>
            </section>
        </main>
    );
}
