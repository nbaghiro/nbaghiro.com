import { useMemo, useState } from "react";
import { CopyButton, DownloadButton, ShareButton } from "./actions";
import { Lightbox } from "./Lightbox";

// The two app store submissions, with each field's own limit counted live beside the value, so
// a field that is over shows here rather than when the console refuses it. Keywords count in
// bytes, not characters, because Apple's 100 is a byte budget and an accented character spends
// two of it.
const measure = (f) =>
    f.bytes
        ? new TextEncoder().encode(f.value ?? "").length
        : (f.value ?? "").length;

function StoreField({ field }) {
    const n = measure(field);
    const over = field.limit ? n > field.limit : false;
    return (
        <div className="field">
            <div className="row">
                <h3>{field.label}</h3>
                {field.limit ? (
                    <span className={over ? "char-count over" : "char-count"}>
                        {n.toLocaleString()} / {field.limit.toLocaleString()}
                        {field.bytes ? " bytes" : ""}
                    </span>
                ) : null}
                {field.value ? (
                    <CopyButton text={field.value} label="Copy" />
                ) : null}
            </div>
            {field.note && <p className="note">{field.note}</p>}
            {field.value ? (
                <pre className="text">{field.value}</pre>
            ) : (
                <p className="note store-todo">Still to write.</p>
            )}
        </div>
    );
}

const nameOf = (shot) => shot.file.split("/").pop();

export function AppStores({ manifest, url }) {
    const doc = manifest.store;
    const [pane, setPane] = useState("apple");
    const [lb, setLb] = useState(null);
    const shots = useMemo(() => doc?.media?.shots ?? [], [doc]);
    if (!doc) return null;

    const panes = [
        ["apple", doc.apple.label],
        ["play", doc.play.label],
        ["media", doc.media.label],
    ];
    const side = pane === "play" ? doc.play : doc.apple;

    return (
        <>
            {doc.lede && <p className="lede">{doc.lede}</p>}
            <div className="lib-bar">
                <div className="lib-facet">
                    <span className="lib-label">Console</span>
                    <div className="lib-chips">
                        {panes.map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                aria-pressed={pane === id}
                                onClick={() => setPane(id)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {pane === "media" ? (
                <>
                    {doc.media.lede && <p className="lede">{doc.media.lede}</p>}
                    <div className="scroller">
                        <table className="store-specs">
                            <thead>
                                <tr>
                                    <th scope="col">Store</th>
                                    <th scope="col">Slot</th>
                                    <th scope="col">Size</th>
                                    <th scope="col">Needed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doc.media.specs.map((s) => (
                                    <tr key={`${s.store} ${s.slot}`}>
                                        <th scope="row">{s.store}</th>
                                        <td>
                                            {s.slot}
                                            {s.note && (
                                                <span className="note">
                                                    {s.note}
                                                </span>
                                            )}
                                        </td>
                                        <td className="store-size">{s.size}</td>
                                        <td>{s.need}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="shot-grid store-shots">
                        {shots.map((it, i) => (
                            <figure className="shot-cell" key={it.file}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setLb({
                                            title: "Store media",
                                            items: shots.map((s) => ({
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
                                    <span className="shot-name">
                                        {it.label}
                                    </span>
                                    <span className="shot-from">
                                        {it.device} · {it.size}
                                    </span>
                                </figcaption>
                                <div className="actions">
                                    <ShareButton
                                        label="Save"
                                        items={() => [
                                            {
                                                url: url(it.file),
                                                name: nameOf(it),
                                            },
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
                </>
            ) : (
                <article className="strategy">
                    {side.groups.map((g) => (
                        <section key={g.title}>
                            <h2>{g.title}</h2>
                            {g.note && <p>{g.note}</p>}
                            {g.fields.map((f) => (
                                <StoreField key={f.label} field={f} />
                            ))}
                        </section>
                    ))}
                </article>
            )}

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
