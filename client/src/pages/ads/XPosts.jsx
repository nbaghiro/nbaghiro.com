import { useState } from "react";
import { CopyButton, ShareButton } from "./actions";
import { Lightbox } from "./Lightbox";
import { Strip } from "./Strip";
import { fileName } from "./store";

// X posts: one image per post with the text above it; a thread is a list of those, posted
// in order as replies, and the alt text goes into the ALT field.
export function XPosts({ manifest, url }) {
    const [lb, setLb] = useState(null);
    const posts = manifest.x?.posts || [];
    const titleOf = (slug) => {
        const words = slug.replace(/^x\d+-/, "").replace(/-/g, " ");
        return words.charAt(0).toUpperCase() + words.slice(1);
    };
    return (
        <>
            <p className="lede">
                {posts.length} posts. One image each; a thread is posted as
                replies in order.
            </p>
            {posts.map((post) => (
                <section key={post.slug} className="post">
                    <div className="post-head">
                        <h2>{titleOf(post.slug)}</h2>
                        <p className="meta">
                            {post.items.length > 1
                                ? `Thread of ${post.items.length}`
                                : "Single image"}
                        </p>
                    </div>
                    {post.note && <p className="meta">{post.note}</p>}
                    {post.items.length > 1 && (
                        <Strip
                            small
                            items={post.items.map((x, i) => ({
                                url: url(x.png || x.jpg),
                                alt: x.alt || `${titleOf(post.slug)}, ${i + 1}`,
                            }))}
                            onOpen={(i) =>
                                setLb({
                                    title: titleOf(post.slug),
                                    index: i,
                                    items: post.items.map((x) => ({
                                        url: url(x.png || x.jpg),
                                        name: fileName(x.png || x.jpg),
                                        alt: x.alt,
                                    })),
                                })
                            }
                        />
                    )}
                    <ol className="xitems">
                        {post.items.map((it, i) => {
                            const img = it.jpg || it.png;
                            return (
                                <li key={i} className="xitem">
                                    <img
                                        crossOrigin="anonymous"
                                        src={url(it.png || it.jpg)}
                                        alt={it.alt || ""}
                                        loading="lazy"
                                        onClick={() =>
                                            setLb({
                                                title: titleOf(post.slug),
                                                index: i,
                                                items: post.items.map((x) => ({
                                                    url: url(x.png || x.jpg),
                                                    name: fileName(
                                                        x.png || x.jpg
                                                    ),
                                                    alt: x.alt,
                                                })),
                                            })
                                        }
                                    />
                                    <div>
                                        <pre className="text">{it.text}</pre>
                                        <div
                                            className="actions"
                                            style={{ marginTop: 10 }}
                                        >
                                            <ShareButton
                                                label="Save image"
                                                items={() => [
                                                    {
                                                        url: url(img),
                                                        name: fileName(img),
                                                    },
                                                ]}
                                            />
                                            <CopyButton
                                                text={it.text}
                                                label="Copy text"
                                            />
                                            <CopyButton
                                                text={it.alt}
                                                label="Copy alt"
                                            />
                                            <a
                                                className="btn"
                                                href={url(img)}
                                                download={fileName(img)}
                                            >
                                                File
                                            </a>
                                        </div>
                                        {it.alt && (
                                            <p className="alt">Alt: {it.alt}</p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </section>
            ))}
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
