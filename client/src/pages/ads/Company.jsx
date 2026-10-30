import { useEffect, useState } from "react";
import { CopyButton, DownloadButton, ShareButton } from "./actions";
import { Lightbox } from "./Lightbox";
import { fileName } from "./store";

// A company being applied to, rather than a product being advertised: its roles, the document
// written for each one, a snapshot of the job description, and where the application stands.
// Published by .local/founder/companies/publish.mjs.

const STATES = {
    drafted: ["Drafted", "The document is built and nothing has gone out."],
    open: ["Open in a tab", "The form is filled and waiting to be sent."],
    submitted: ["Submitted", ""],
    handfill: [
        "To fill by hand",
        "This board scores the session, so the form is typed.",
    ],
    closed: ["Closed", "The posting has come down."],
};

function State({ state, sentOn }) {
    const [label, note] = STATES[state] ?? [state, ""];
    return (
        <span className={`co-state is-${state}`} title={note}>
            {label}
            {sentOn && <small> {sentOn}</small>}
        </span>
    );
}

function RoleHead({ role }) {
    const facts = [role.team, role.where, role.comp].filter(Boolean);
    return (
        <div className="post-head">
            <h2>{role.title}</h2>
            <p className="meta">{facts.join(" · ")}</p>
        </div>
    );
}

export function Roles({ manifest, url }) {
    const roles = manifest.roles ?? [];
    const co = manifest.company ?? {};
    return (
        <>
            <p className="lede">
                {roles.length === 1 ? "One role" : `${roles.length} roles`} at{" "}
                {co.name}. {co.note}
            </p>
            {roles.map((role) => (
                <section className="post co-role" key={role.id}>
                    <RoleHead role={role} />
                    <div className="co-line">
                        <State state={role.state} sentOn={role.sentOn} />
                        {role.url && (
                            <a href={role.url} target="_blank" rel="noreferrer">
                                The posting
                            </a>
                        )}
                        {role.jd && (
                            <a
                                href={url(role.jd.file)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Description, {role.jd.words} words
                            </a>
                        )}
                        {role.docs?.map((d) => (
                            <a
                                key={d.id}
                                href={url(d.pdf)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {d.label}
                            </a>
                        ))}
                    </div>
                    {role.fit?.length > 0 && (
                        <div className="field">
                            <h3>Against what it asks for</h3>
                            <ul className="co-fit">
                                {role.fit.map((f) => (
                                    <li
                                        key={f.line}
                                        className={f.ok ? "has" : "gap"}
                                    >
                                        <i aria-hidden="true">
                                            {f.ok ? "✓" : "—"}
                                        </i>
                                        <span>{f.line}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="doc-note">
                                A dash is a gap, said out loud rather than
                                written around.
                            </p>
                        </div>
                    )}
                    {role.notes?.length > 0 && (
                        <div className="field">
                            <h3>Notes</h3>
                            <ul className="co-notes">
                                {role.notes.map((n) => (
                                    <li key={n}>{n}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            ))}
        </>
    );
}

export function CompanyDocs({ manifest, url }) {
    const [lb, setLb] = useState(null);
    const roles = (manifest.roles ?? []).filter((r) => r.docs?.length);
    const total = roles.reduce((n, r) => n + r.docs.length, 0);
    return (
        <>
            <p className="lede">
                {total === 1 ? "One document" : `${total} documents`}, built by
                .local/founder/apply-doc. Send the PDF; the page images are for
                reading it here.
            </p>
            {roles.map((role) =>
                role.docs.map((doc) => {
                    const items = (doc.pages ?? []).map((p, i) => ({
                        url: url(p),
                        name: fileName(p),
                        alt: `${doc.label}, page ${i + 1}`,
                    }));
                    return (
                        <section className="post co-doc" key={role.id + doc.id}>
                            <div className="post-head">
                                <h2>{doc.label}</h2>
                                <p className="meta">
                                    {[
                                        role.title,
                                        `${doc.pages?.length ?? 0} pages`,
                                        `${doc.kb} KB`,
                                        doc.builtOn && `built ${doc.builtOn}`,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </p>
                            </div>
                            {items.length > 0 && (
                                <div className="co-pages">
                                    {items.map((it, i) => (
                                        <button
                                            type="button"
                                            key={it.url}
                                            onClick={() =>
                                                setLb({
                                                    items,
                                                    index: i,
                                                    title: doc.label,
                                                })
                                            }
                                        >
                                            <img
                                                crossOrigin="anonymous"
                                                src={it.url}
                                                alt={it.alt}
                                                loading="lazy"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="actions">
                                <ShareButton
                                    label="Send"
                                    items={() => [
                                        {
                                            url: url(doc.pdf),
                                            name: fileName(doc.pdf),
                                        },
                                    ]}
                                />
                                <DownloadButton
                                    url={url(doc.pdf)}
                                    name={fileName(doc.pdf)}
                                    label="PDF"
                                />
                                <CopyButton
                                    text={url(doc.pdf)}
                                    label="Copy link"
                                />
                            </div>
                            {doc.note && <p className="doc-note">{doc.note}</p>}
                        </section>
                    );
                })
            )}
            {lb && (
                <Lightbox
                    items={lb.items}
                    index={lb.index}
                    title={lb.title}
                    onIndex={(i) => setLb({ ...lb, index: i })}
                    onClose={() => setLb(null)}
                />
            )}
        </>
    );
}

// The snapshot is markdown with nothing in it but headings, bullets and paragraphs, which is
// all the boards produce, so it is rendered here rather than pulling in a parser.
function Snapshot({ text }) {
    const blocks = [];
    for (const line of text.split("\n")) {
        const l = line.trim();
        if (!l || l === "---") continue;
        if (l.startsWith("## ")) blocks.push({ k: "h", t: l.slice(3) });
        else if (l.startsWith("# ")) continue;
        else if (l.startsWith("- ")) {
            const last = blocks[blocks.length - 1];
            if (last?.k === "ul") last.items.push(l.slice(2));
            else blocks.push({ k: "ul", items: [l.slice(2)] });
        } else blocks.push({ k: "p", t: l.replace(/^<|>$/g, "") });
    }
    return (
        <div className="co-jd">
            {blocks.map((b, i) =>
                b.k === "h" ? (
                    <h3 key={i}>{b.t}</h3>
                ) : b.k === "ul" ? (
                    <ul key={i}>
                        {b.items.map((it) => (
                            <li key={it}>{it}</li>
                        ))}
                    </ul>
                ) : (
                    <p key={i}>{b.t}</p>
                )
            )}
        </div>
    );
}

function Description({ role, url }) {
    const [text, setText] = useState(null);
    const [error, setError] = useState("");
    const src = url(role.jd.file);
    useEffect(() => {
        let live = true;
        fetch(src, { cache: "no-store" })
            .then((r) =>
                r.ok ? r.text() : Promise.reject(new Error(`${r.status}`))
            )
            .then((t) => live && setText(t))
            .catch((e) => live && setError(String(e.message)));
        return () => {
            live = false;
        };
    }, [src]);
    return (
        <section className="post co-desc">
            <RoleHead role={role} />
            <div className="co-line">
                <span className="meta">
                    {role.jd.words} words
                    {role.jd.readOn && `, read ${role.jd.readOn}`}
                </span>
                {role.url && (
                    <a href={role.url} target="_blank" rel="noreferrer">
                        The posting
                    </a>
                )}
                <a href={src} target="_blank" rel="noreferrer">
                    The snapshot
                </a>
            </div>
            {error && <p className="error">{error}</p>}
            {!text && !error && <p className="meta">Loading…</p>}
            {text && <Snapshot text={text} />}
        </section>
    );
}

export function JobDescriptions({ manifest, url }) {
    const roles = (manifest.roles ?? []).filter((r) => r.jd);
    return (
        <>
            <p className="lede">
                Read off {manifest.company?.board} and kept here, because a
                posting takes its description with it when it comes down.
            </p>
            {roles.map((role) => (
                <Description key={role.id} role={role} url={url} />
            ))}
        </>
    );
}

export function Applications({ manifest, url }) {
    const roles = manifest.roles ?? [];
    const sent = roles.filter((r) => r.sentOn).length;
    return (
        <>
            <p className="lede">
                {sent} of {roles.length} sent. A role's state comes from the job
                kit's ledger when there is a row for it, so this cannot say
                drafted about something that has gone out.
            </p>
            {roles.map((role) => (
                <section className="post co-app" key={role.id}>
                    <RoleHead role={role} />
                    <div className="co-line">
                        <State state={role.state} sentOn={role.sentOn} />
                        {role.batch && (
                            <span className="meta">Batch {role.batch}</span>
                        )}
                        {role.url && (
                            <a href={role.url} target="_blank" rel="noreferrer">
                                The form
                            </a>
                        )}
                    </div>
                    {role.asks?.length > 0 && (
                        <div className="field">
                            <h3>What it asks to be attached</h3>
                            <ul className="co-asks">
                                {role.asks.map((a) => (
                                    <li key={a.label}>
                                        <b>{a.label}</b>
                                        <span>{a.have || "Nothing yet"}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {role.docs?.length > 0 && (
                        <div className="actions">
                            {role.docs.map((d) => (
                                <DownloadButton
                                    key={d.id}
                                    url={url(d.pdf)}
                                    name={fileName(d.pdf)}
                                    label={d.label}
                                />
                            ))}
                        </div>
                    )}
                </section>
            ))}
        </>
    );
}
