import { useState } from "react";
import { CopyButton, DownloadButton, ShareButton } from "./actions";
import { Lightbox } from "./Lightbox";
import { Strip } from "./Strip";
import { fileName } from "./store";

// X posts: the text, and the image where the post has one. A post with nothing to show is
// text alone, which is most of what an account actually posts. A thread is a list of items,
// posted in order as replies, and the alt text goes into the ALT field.
export function XPosts({ manifest, url }) {
    const [lb, setLb] = useState(null);
    const posts = manifest.x?.posts || [];
    const titleOf = (slug) => {
        const words = slug.replace(/^x\d+-/, "").replace(/-/g, " ");
        return words.charAt(0).toUpperCase() + words.slice(1);
    };
    const shotOf = (item) => item.png || item.jpg;
    return (
        <>
            <p className="lede">
                {posts.length} posts. An image where there is one to show; a
                thread is posted as replies in order.
            </p>
            {posts.map((post) => {
                const shots = post.items.filter(shotOf).length;
                let kind = "Text only";
                if (post.items.length > 1)
                    kind = `Thread of ${post.items.length}`;
                else if (shots) kind = "Single image";
                const strip =
                    post.items.length > 1 && shots === post.items.length;
                const open = (i) => () =>
                    setLb({
                        title: titleOf(post.slug),
                        index: i,
                        items: post.items.map((x) => ({
                            url: url(shotOf(x)),
                            name: fileName(shotOf(x)),
                            alt: x.alt,
                        })),
                    });
                return (
                    <section key={post.slug} className="post">
                        <div className="post-head">
                            <h2>{titleOf(post.slug)}</h2>
                            <p className="meta">{kind}</p>
                        </div>
                        {post.note && <p className="meta">{post.note}</p>}
                        {strip && (
                            <Strip
                                small
                                items={post.items.map((x, i) => ({
                                    url: url(shotOf(x)),
                                    alt:
                                        x.alt ||
                                        `${titleOf(post.slug)}, ${i + 1}`,
                                }))}
                                onOpen={(i) => open(i)()}
                            />
                        )}
                        <ol className="xitems">
                            {post.items.map((it, i) => {
                                const img = shotOf(it);
                                return (
                                    <li
                                        key={i}
                                        className={img ? "xitem" : "xitem bare"}
                                    >
                                        {img && (
                                            <img
                                                crossOrigin="anonymous"
                                                src={url(img)}
                                                alt={it.alt || ""}
                                                loading="lazy"
                                                onClick={open(i)}
                                            />
                                        )}
                                        <div>
                                            <pre className="text">
                                                {it.text}
                                            </pre>
                                            <div
                                                className="actions"
                                                style={{ marginTop: 10 }}
                                            >
                                                {img && (
                                                    <ShareButton
                                                        label="Save image"
                                                        items={() => [
                                                            {
                                                                url: url(img),
                                                                name: fileName(
                                                                    img
                                                                ),
                                                            },
                                                        ]}
                                                    />
                                                )}
                                                <CopyButton
                                                    text={it.text}
                                                    label="Copy text"
                                                />
                                                {it.alt && (
                                                    <CopyButton
                                                        text={it.alt}
                                                        label="Copy alt"
                                                    />
                                                )}
                                                {img && (
                                                    <DownloadButton
                                                        url={url(img)}
                                                        name={fileName(img)}
                                                    />
                                                )}
                                            </div>
                                            {it.alt && (
                                                <p className="alt">
                                                    Alt: {it.alt}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>
                );
            })}
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
