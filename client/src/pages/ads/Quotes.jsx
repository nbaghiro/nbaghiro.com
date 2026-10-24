import { useMemo, useState } from "react";
import { CopyButton } from "./actions";

// Quotes from the industry, filed by theme, each with where it came from and a line of Naib's
// to run under it. The source sits on the card rather than in a note somewhere, because the
// decision this tab exists to support is whether a quote can be posted at all.
//
// A quote post is the quote and the attribution on their own, so that is what the first button
// copies. The second adds the take, which is what turns a repost into a post.
const asPost = (q) => `${q.text}\n\n— ${q.who}`;
const withTake = (q) => `${asPost(q)}\n\n${q.take}`;

export function Quotes({ manifest }) {
    const doc = manifest.quotes;
    const groups = useMemo(() => doc?.groups ?? [], [doc]);
    const [only, setOnly] = useState("");
    if (!groups.length) return null;

    const shown = only ? groups.filter((g) => g.id === only) : groups;
    const total = groups.reduce((n, g) => n + g.items.length, 0);

    return (
        <>
            {doc.lede && <p className="lede">{doc.lede}</p>}
            <div className="lib-bar">
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
                                onClick={() => setOnly(only === g.id ? "" : g.id)}
                            >
                                {g.label} {g.items.length}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {shown.map((group) => (
                <section className="quote-group" key={group.id}>
                    <h2>{group.label}</h2>
                    <div className="quote-list">
                        {group.items.map((q) => (
                            <article className="quote" key={q.text}>
                                <blockquote>{q.text}</blockquote>
                                <p className="quote-who">— {q.who}</p>
                                <p className="note">{q.source}</p>
                                <p className="quote-take">{q.take}</p>
                                <div className="actions">
                                    <CopyButton text={asPost(q)} label="Copy" />
                                    <CopyButton
                                        text={withTake(q)}
                                        label="Copy with your line"
                                    />
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            ))}
        </>
    );
}
