import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchJson } from "./store";
import { Field, DownloadButton } from "./actions";
import { Lightbox } from "./Lightbox";

export function TechnicalPosts({ root }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [params, setParams] = useSearchParams();
    const [lightbox, setLightbox] = useState(null);
    const product = params.get("product") || "";
    const query = params.get("q") || "";
    const update = (key, value) =>
        setParams(
            (previous) => {
                const next = new URLSearchParams(previous);
                if (value) next.set(key, value);
                else next.delete(key);
                return next;
            },
            { replace: true }
        );
    useEffect(() => {
        fetchJson(`${root}/technical-posts/manifest.json`)
            .then(setData)
            .catch((e) => setError(e.message));
    }, [root]);
    const posts = data?.technical?.posts ?? [];
    const products = [...new Set(posts.flatMap((p) => p.products))].sort();
    const shown = posts.filter(
        (p) =>
            (!product || p.products.includes(product)) &&
            (!query ||
                `${p.title} ${p.summary} ${p.text}`
                    .toLowerCase()
                    .includes(query.toLowerCase()))
    );
    const mediaUrl = (m) => `${root}/${m.project}/${m.file}?v=${encodeURIComponent(data?.publishedAt || "")}`;
    const leadUrl = (post) => post.productVisual ? mediaUrl(post.productVisual) : post.cover;
    const leadName = (post) => `${post.id}.${post.productVisual ? "png" : "webp"}`;
    return (
        <>
            <header className="topbar">
                <Link className="back" to="/ads" aria-label="Ad Studio">
                    ‹
                </Link>
                <h1>Technical posts</h1>
                <span className="meta">{posts.length} prepared posts</span>
            </header>
            <main className="body technical-library">
                <p className="lede">
                    Technical posts paired with real product views in each product’s
                    own style. Copy the post, download its image, and use the
                    article link in the first comment.
                </p>
                {error && <p className="error">{error}</p>}
                {!data && !error && <p className="meta">Loading posts…</p>}
                <div className="lib-bar">
                    <div className="lib-search">
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => update("q", e.target.value)}
                            placeholder="Search technical posts"
                            aria-label="Search technical posts"
                        />
                        <span className="lib-count">{shown.length} posts</span>
                    </div>
                    <div className="lib-chips">
                        <button
                            aria-pressed={!product}
                            onClick={() => update("product", "")}
                        >
                            All products
                        </button>
                        {products.map((name) => (
                            <button
                                key={name}
                                aria-pressed={name === product}
                                onClick={() => update("product", name)}
                            >
                                {name} ·{" "}
                                {
                                    posts.filter((p) =>
                                        p.products.includes(name)
                                    ).length
                                }
                            </button>
                        ))}
                    </div>
                </div>
                {data && !shown.length && (
                    <p className="lede">No posts match these filters.</p>
                )}
                {shown.map((post) => (
                    <article
                        className="campaign-post"
                        id={post.id}
                        key={post.id}
                    >
                        <div>
                            <button
                                className="campaign-image"
                                aria-label={`Enlarge ${post.title}`}
                                onClick={() =>
                                    setLightbox({
                                        items: [
                                            {
                                                url: leadUrl(post),
                                                alt: post.title,
                                                name: leadName(post),
                                            },
                                        ],
                                        index: 0,
                                    })
                                }
                            >
                                <img
                                    src={leadUrl(post)}
                                    alt={post.title}
                                    loading="lazy"
                                />
                            </button>
                            <p className="meta">
                                {post.productVisual ? "Product views · Ready to use" : "General engineering · Article diagram"}
                            </p>
                            <div className="actions">
                                <DownloadButton
                                    url={leadUrl(post)}
                                    name={leadName(post)}
                                    label={post.productVisual ? "Download product image" : "Download article visual"}
                                />
                                <a
                                    className="btn"
                                    href={post.url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Read article
                                </a>
                                <a className="btn" href={`#${post.id}`}>
                                    Link to this post
                                </a>
                            </div>
                            {!!post.media?.length && (
                                <details>
                                    <summary>
                                        Earlier carousel ·{" "}
                                        {post.media.length} pages
                                    </summary>
                                    <p className="meta">
                                        Check the captions and screenshots
                                        against the current article before
                                        posting.
                                    </p>
                                    <div className="technical-thumbnails">
                                        {post.media.map((m, i) => (
                                            <button
                                                key={m.file}
                                                aria-label={m.label}
                                                onClick={() =>
                                                    setLightbox({
                                                        items: post.media.map(
                                                            (a) => ({
                                                                url: mediaUrl(
                                                                    a
                                                                ),
                                                                alt: a.label,
                                                                name: a.file
                                                                    .split("/")
                                                                    .pop(),
                                                            })
                                                        ),
                                                        index: i,
                                                    })
                                                }
                                            >
                                                <img
                                                    src={mediaUrl(m)}
                                                    alt={m.label}
                                                    loading="lazy"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <Link
                                        className="btn"
                                        to="/ads/founder-series"
                                    >
                                        Open original carousel collection
                                    </Link>
                                </details>
                            )}
                        </div>
                        <div>
                            <p className="meta">
                                {post.products.join(" · ")} · Personal profile
                            </p>
                            <h2>{post.title}</h2>
                            <Field
                                label="LinkedIn post"
                                text={post.text}
                                count
                            />
                            <Field
                                label="First comment"
                                text={post.firstComment}
                            />
                        </div>
                    </article>
                ))}
            </main>
            {lightbox && (
                <Lightbox
                    title="Technical post media"
                    items={lightbox.items}
                    index={lightbox.index}
                    onIndex={(index) => setLightbox({ ...lightbox, index })}
                    onClose={() => setLightbox(null)}
                />
            )}
        </>
    );
}
