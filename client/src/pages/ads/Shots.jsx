import { useMemo, useState } from "react";
import { DownloadButton, ShareButton } from "./actions";
import { Lightbox } from "./Lightbox";

// Every image the kit has, in one grid, with no post copy anywhere near it. The tab exists so
// a shot can be found and reused under different words, which is the opposite of the Posts tab,
// where an image belongs to the text beside it. A shot no post currently uses is not an error
// here, it is the point, so those are filterable rather than hidden.
export function Shots({ manifest, url }) {
    const doc = manifest.shots;
    const items = useMemo(() => doc?.items ?? [], [doc]);
    const [only, setOnly] = useState("");
    const [lb, setLb] = useState(null);
    if (!items.length) return null;

    const used = items.filter((i) => i.from).length;
    const shown =
        only === "spare"
            ? items.filter((i) => !i.from)
            : only
              ? items.filter((i) => i.surface === only)
              : items;

    const surfaces = [...new Set(items.map((i) => i.surface).filter(Boolean))];
    const nameOf = (i) =>
        `${(i.label || "shot").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.png`;

    return (
        <>
            {doc.lede && <p className="lede">{doc.lede}</p>}
            <div className="lib-bar">
                <div className="lib-facet">
                    <span className="lib-label">Show</span>
                    <div className="lib-chips">
                        <button
                            type="button"
                            aria-pressed={!only}
                            onClick={() => setOnly("")}
                        >
                            All {items.length}
                        </button>
                        {surfaces.map((s) => (
                            <button
                                key={s}
                                type="button"
                                aria-pressed={only === s}
                                onClick={() => setOnly(s)}
                            >
                                {s}
                            </button>
                        ))}
                        {used < items.length && (
                            <button
                                type="button"
                                aria-pressed={only === "spare"}
                                onClick={() => setOnly("spare")}
                            >
                                On no post {items.length - used}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="shot-grid">
                {shown.map((it, i) => (
                    <figure className="shot-cell" key={it.file}>
                        <button
                            type="button"
                            onClick={() =>
                                setLb({
                                    title: "Product shots",
                                    items: shown.map((s) => ({
                                        url: url(s.file),
                                        alt: s.label,
                                        name: nameOf(s),
                                    })),
                                    index: i,
                                })
                            }
                        >
                            <img
                                crossOrigin="anonymous"
                                src={url(it.file)}
                                alt={it.label}
                                loading="lazy"
                            />
                        </button>
                        <figcaption>
                            <span className="shot-name">{it.label}</span>
                            {it.from && it.from !== it.label && (
                                <span className="shot-from">{it.from}</span>
                            )}
                        </figcaption>
                        <div className="actions">
                            <ShareButton
                                label="Save"
                                items={() => [
                                    { url: url(it.file), name: nameOf(it) },
                                ]}
                            />
                            <DownloadButton
                                url={url(it.file)}
                                name={nameOf(it)}
                                label="Image"
                            />
                        </div>
                    </figure>
                ))}
            </div>

            {lb && (
                <Lightbox
                    title={lb.title}
                    items={lb.items}
                    index={lb.index}
                    onIndex={(i) => setLb({ ...lb, index: i })}
                    onClose={() => setLb(null)}
                />
            )}
        </>
    );
}
