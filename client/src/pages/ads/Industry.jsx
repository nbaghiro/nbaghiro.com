import { useMemo, useState } from "react";
import { Field } from "./actions";

// Posts with no product shot behind them, filed by theme. One column rather than the Quotes
// grid, because these are whole posts and a post is read down a column, not across a card.
export function Industry({ manifest }) {
    const doc = manifest.industry;
    const groups = useMemo(() => doc?.groups ?? [], [doc]);
    const [only, setOnly] = useState("");
    const [q, setQ] = useState("");
    if (!groups.length) return null;

    const needle = q.trim().toLowerCase();
    const match = (p) =>
        !needle || `${p.title} ${p.text}`.toLowerCase().includes(needle);
    const shown = groups
        .filter((g) => !only || g.id === only)
        .map((g) => ({ ...g, items: g.items.filter(match) }))
        .filter((g) => g.items.length);
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    const found = shown.reduce((n, g) => n + g.items.length, 0);

    return (
        <>
            {doc.lede && <p className="lede">{doc.lede}</p>}
            <div className="lib-bar">
                <div className="lib-search">
                    <input
                        type="search"
                        value={q}
                        placeholder="Search the posts"
                        aria-label="Search the posts"
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <span className="lib-count">
                        {found === total
                            ? `${total} posts`
                            : `${found} of ${total}`}
                    </span>
                </div>
                <div className="lib-facet">
                    <span className="lib-label">Theme</span>
                    <div className="lib-chips">
                        <button
                            type="button"
                            aria-pressed={!only}
                            onClick={() => setOnly("")}
                        >
                            All {total}
                        </button>
                        {groups.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                aria-pressed={only === g.id}
                                onClick={() =>
                                    setOnly(only === g.id ? "" : g.id)
                                }
                            >
                                {g.label} {g.items.length}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {!shown.length && <p className="lede">Nothing matches that.</p>}

            {shown.map((group) => (
                <section className="ind-group" key={group.id}>
                    <h2>{group.label}</h2>
                    {group.items.map((p) => (
                        <article className="ind-post" key={p.id}>
                            <Field label={p.title} text={p.text} count />
                        </article>
                    ))}
                </section>
            ))}
        </>
    );
}
