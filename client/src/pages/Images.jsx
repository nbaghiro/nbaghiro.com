import { useState } from "react";
import { Link } from "react-router-dom";
import candidates from "../data/photo-candidates.json";
import "./Images.css";

/**
 * Every photograph that can sit behind an article, in one place.
 *
 * The site owns fourteen: the eight the covers are built from and the six it runs at full bleed.
 * That is not enough for fifty-five pieces, so the rest of the page is candidates, searched in
 * the site's own register and shown at the size a cover is actually used at. Nothing here is
 * downloaded: the thumbnails come from Unsplash, and only the ones picked get fetched.
 *
 * Internal. Nothing in the navigation points at it.
 */

const OWNED = [
    ["callers", "used by 26 covers"],
    ["engine", "used by 5"],
    ["offline", "used by 5"],
    ["variants", "used by 4"],
    ["slot", "used by 4"],
    ["map", "used by 4"],
    ["anchor", "used by 3"],
    ["ledger", "used by 2"],
    ["site-hero", "the home page"],
    ["site-band", "a page band"],
    ["site-foot", "the footer"],
    ["site-book", "the books page"],
    ["site-ask", "the ask panel"],
    ["site-contact", "the contact panel"],
];

const GROUPS = [...new Set(candidates.map((c) => c.group))];

function Tile({ src, label, note, title, dark }) {
    return (
        <li>
            <div className={dark ? "shot dark" : "shot"}>
                <img src={src} alt="" loading="lazy" />
                {title && <span className="over">{title}</span>}
            </div>
            <p className="id">{label}</p>
            {note && <p className="meta">{note}</p>}
        </li>
    );
}

export default function Images() {
    const [group, setGroup] = useState("all");
    const [withTitle, setWithTitle] = useState(true);
    const [toned, setToned] = useState(true);
    const shown = group === "all" ? candidates : candidates.filter((c) => c.group === group);
    const sample = "Sharing datasets between backtests";
    return (
        <main className="images">
            <header>
                <p className="eyebrow">Internal</p>
                <h1>The grounds</h1>
                <p className="lede">
                    What can sit behind an article. The site owns fourteen photographs, one of
                    which carries twenty-six covers, so the index repeats itself. Below them are{" "}
                    {candidates.length} candidates searched in the same register, each shown at the
                    size a cover is given, with the title over it so you are judging the thing you
                    would actually ship.
                </p>
                <p className="note">
                    Nothing here is downloaded. The thumbnails load from Unsplash and only the ones
                    you pick get fetched at full size. <Link to="/art">The plates</Link> ·{" "}
                    <Link to="/blogs">the index</Link>
                </p>
                <div className="switch">
                    <button type="button" aria-pressed={withTitle} onClick={() => setWithTitle((t) => !t)}>
                        {withTitle ? "Title on" : "Title off"}
                    </button>
                    <button type="button" aria-pressed={toned} onClick={() => setToned((t) => !t)}>
                        {toned ? "Toned" : "As shot"}
                    </button>
                    <button type="button" aria-pressed={group === "all"} onClick={() => setGroup("all")}>
                        All {candidates.length}
                    </button>
                    {GROUPS.map((g) => (
                        <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(g)}>
                            {g}
                        </button>
                    ))}
                </div>
            </header>

            <section>
                <h2>What the site owns</h2>
                <p className="note">
                    Fourteen, and the count beside each is how many covers lean on it today.
                    Toned pulls most of the colour out and tints what is left toward the green
                    the interface already uses, which is the version the covers ship.
                </p>
                <ul className="grid">
                    {OWNED.map(([id, note]) => (
                        <Tile
                            key={id}
                            src={toned ? `/img/photo/toned/${id}.webp` : `/img/photo/${id}.webp`}
                            label={id}
                            note={note}
                            title={withTitle ? sample : null}
                            dark
                        />
                    ))}
                </ul>
            </section>

            <section>
                <h2>{group === "all" ? "Candidates" : `Candidates · ${group}`}</h2>
                <p className="note">
                    Searched with a tone modifier rather than a bare subject, which is what keeps
                    staged commercial stock out. Credit travels with each one.
                </p>
                <ul className="grid">
                    {shown.map((c) => (
                        <Tile
                            key={c.id}
                            src={c.thumb}
                            label={c.group}
                            note={c.by}
                            title={withTitle ? sample : null}
                            dark
                        />
                    ))}
                </ul>
            </section>
        </main>
    );
}
