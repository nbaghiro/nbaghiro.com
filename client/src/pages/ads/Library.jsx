import { useEffect, useMemo, useRef, useState } from "react";
import { DownloadButton, Field, ShareButton } from "./actions";
import { Lightbox } from "./Lightbox";

// A kit whose posts are a library rather than a sequence. The rail-and-scroll layout was
// built for a set you read top to bottom, and stopped working once the set passed a
// screenful: finding one post meant scrolling past thirty. Here the set is filtered instead,
// and each post carries both directions of its copy side by side, because the two are
// written against each other and are only judged as a pair.
export function Library({ manifest, url }) {
    const li = manifest.linkedin || {};
    const posts = useMemo(() => li.posts || [], [li.posts]);
    const facets = useMemo(() => li.facets || [], [li.facets]);
    const [q, setQ] = useState("");
    const [chosen, setChosen] = useState({});
    // which image a post is showing: its own, or the same post shot at another business
    const [shot, setShot] = useState({});
    const [lb, setLb] = useState(null);
    // Three rows of facets push the first post most of a phone screen down, so they start
    // folded where that matters and open where there is room for them.
    const [showFacets, setShowFacets] = useState(
        () =>
            typeof window === "undefined" ||
            window.matchMedia("(min-width: 721px)").matches
    );
    const search = useRef(null);

    // "/" focuses the search the way it does in every list people already use, but not while
    // they are typing into a field somewhere else on the page.
    useEffect(() => {
        const onKey = (e) => {
            const tag = document.activeElement?.tagName;
            if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
                e.preventDefault();
                search.current?.focus();
            }
            if (e.key === "Escape" && document.activeElement === search.current)
                setQ("");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const toggle = (facet, id) =>
        setChosen((c) => ({ ...c, [facet]: c[facet] === id ? "" : id }));

    const biz = (id) =>
        (facets.find((f) => f.id === "business")?.options || []).find(
            (o) => o.id === id
        )?.label || "As posted";
    // the post's own image first, then the alternates, as one list the thumbnail, the
    // lightbox and both save buttons all read from
    const imagesOf = (p) => [
        ...(p.pages?.default || []).map((file) => ({
            file,
            label: biz(p.business),
        })),
        ...(p.variants || []),
    ];

    const needle = q.trim().toLowerCase();
    const shown = posts.filter((p) => {
        for (const f of facets) {
            const want = chosen[f.id];
            if (want && p[f.id] !== want) return false;
        }
        if (!needle) return true;
        const hay = [
            p.title,
            p.text,
            p.founderCaption,
            p.firstComment,
            ...(p.variants || []).map((v) => v.label),
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return hay.includes(needle);
    });

    const picked = Object.values(chosen).filter(Boolean).length;
    const active = needle || picked > 0;
    const clear = () => {
        setQ("");
        setChosen({});
    };

    // A facet whose options all sit on the posts currently passing the other filters: an
    // option that would return nothing is worse than no option, because it reads as a bug.
    const liveOptions = (f) =>
        (f.options || []).filter((o) =>
            posts.some(
                (p) =>
                    p[f.id] === o.id &&
                    facets.every(
                        (g) =>
                            g.id === f.id ||
                            !chosen[g.id] ||
                            p[g.id] === chosen[g.id]
                    )
            )
        );

    return (
        <>
            <div className="lib-bar">
                <div className="lib-search">
                    <input
                        ref={search}
                        type="search"
                        value={q}
                        placeholder="Search the posts"
                        aria-label="Search the posts"
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <span className="lib-count">
                        {shown.length === posts.length
                            ? `${posts.length} posts`
                            : `${shown.length} of ${posts.length}`}
                    </span>
                    {active && (
                        <button type="button" className="btn" onClick={clear}>
                            Clear
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn lib-toggle"
                        aria-expanded={showFacets}
                        onClick={() => setShowFacets((v) => !v)}
                    >
                        Filters{picked ? ` · ${picked}` : ""}
                    </button>
                </div>
                {showFacets &&
                    facets.map((f) => {
                        const options = liveOptions(f);
                        if (options.length < 2) return null;
                        return (
                            <div className="lib-facet" key={f.id}>
                                <span className="lib-label">{f.label}</span>
                                <div className="lib-chips">
                                    {options.map((o) => (
                                        <button
                                            key={o.id}
                                            type="button"
                                            aria-pressed={chosen[f.id] === o.id}
                                            onClick={() => toggle(f.id, o.id)}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
            </div>

            {!shown.length && (
                <p className="lede">
                    Nothing matches that.{" "}
                    <button type="button" className="linkish" onClick={clear}>
                        Clear the filters
                    </button>{" "}
                    to see all {posts.length}.
                </p>
            )}

            <div className="lib-list">
                {shown.map((post) => {
                    const images = imagesOf(post);
                    const at = Math.min(
                        shot[post.slug] ?? 0,
                        images.length - 1
                    );
                    const pick = images[at];
                    const fileName = (i) =>
                        `${post.slug}${i ? `-${images[i].label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : ""}.png`;
                    return (
                        <section
                            className="lib-post"
                            key={post.slug}
                            id={`post-${post.slug}`}
                        >
                            <div className="lib-aside">
                                {pick && (
                                    <button
                                        type="button"
                                        className="lib-thumb"
                                        onClick={() =>
                                            setLb({
                                                title: post.title,
                                                items: images.map((im, i) => ({
                                                    url: url(im.file),
                                                    alt: im.label,
                                                    name: fileName(i),
                                                })),
                                                index: at,
                                            })
                                        }
                                    >
                                        <img
                                            crossOrigin="anonymous"
                                            src={url(pick.file)}
                                            alt={post.title}
                                            loading="lazy"
                                        />
                                    </button>
                                )}
                                {images.length > 1 && (
                                    <div className="lib-shots">
                                        <span className="lib-label">
                                            Shot at
                                        </span>
                                        <div className="lib-chips">
                                            {images.map((im, i) => (
                                                <button
                                                    key={im.file}
                                                    type="button"
                                                    aria-pressed={i === at}
                                                    onClick={() =>
                                                        setShot((c) => ({
                                                            ...c,
                                                            [post.slug]: i,
                                                        }))
                                                    }
                                                >
                                                    {im.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {pick && (
                                    <div className="actions">
                                        <ShareButton
                                            label="Save image"
                                            items={() => [
                                                {
                                                    url: url(pick.file),
                                                    name: fileName(at),
                                                },
                                            ]}
                                        />
                                        <DownloadButton
                                            url={url(pick.file)}
                                            name={fileName(at)}
                                            label="Image"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="lib-body">
                                <div className="post-head">
                                    <h2>{post.title}</h2>
                                    <p className="meta">
                                        {facets
                                            .map((f) =>
                                                f.id === "business"
                                                    ? pick?.label
                                                    : (f.options || []).find(
                                                          (o) =>
                                                              o.id ===
                                                              post[f.id]
                                                      )?.label
                                            )
                                            .filter(Boolean)
                                            .join("  ·  ")}
                                    </p>
                                </div>
                                <div className="lib-copies">
                                    <Field
                                        label="Clientbridge page"
                                        note="Posted from the company page."
                                        text={pick?.text ?? post.text}
                                        count
                                    />
                                    <Field
                                        label="Personal profile"
                                        note="The same subject in the first person, from the founder."
                                        text={post.founderCaption}
                                        count
                                    />
                                </div>
                                <Field
                                    label="Repost comment"
                                    note="What you add on top when you reshare the company post to your profile."
                                    text={post.repost}
                                    count
                                />
                                <Field
                                    label="First comment"
                                    text={post.firstComment}
                                />
                                {post.notes && (
                                    <details className="details">
                                        <summary>Notes &amp; checks</summary>
                                        <Field
                                            label="Publishing notes"
                                            text={post.notes}
                                        />
                                    </details>
                                )}
                            </div>
                        </section>
                    );
                })}
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
