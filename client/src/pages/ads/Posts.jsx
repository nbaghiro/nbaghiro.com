import { useState } from "react";
import { CopyButton, ShareButton, ZipButton } from "./actions";
import { Lightbox } from "./Lightbox";
import { Strip } from "./Strip";
import { Ring } from "./Studio";
import { fileName, slidesFor, themeName } from "./store";

// Carousels: a title, the frames in the picked theme and size, and what a thumb needs
// (save the set to Photos, copy the caption); everything else waits under "More".
export function Posts({ manifest, url, theme, sel, setSel, format, themes }) {
    const [lb, setLb] = useState(null);
    const [open, setOpen] = useState("");
    const posts = manifest.posts || [];

    const framesOf = (post) => {
        const { theme: t, slides } = slidesFor(post, sel[post.slug] || theme);
        const files = slides[format]?.length
            ? slides[format]
            : slides.feed || [];
        return { t, slides, files };
    };
    const openLb = (post, i) => {
        const { files } = framesOf(post);
        setLb({
            title: post.title,
            index: i,
            items: files.map((f, k) => ({
                url: url(f),
                name: fileName(f),
                alt: post.alt?.[k],
            })),
        });
    };

    return (
        <>
            <p className="lede">
                {posts.length} carousels
                {themes.length > 1 ? `, each in ${themes.length} themes` : ""}.
                Posts are options, not a sequence.
            </p>
            {posts.map((post) => {
                const { t, slides, files } = framesOf(post);
                const items = () =>
                    files.map((f) => ({ url: url(f), name: fileName(f) }));
                const zipFiles = () =>
                    Object.entries(slides).flatMap(([f, list]) =>
                        list.map((file, i) => ({
                            url: url(file),
                            path: `${f}/${String(i + 1).padStart(2, "0")}.png`,
                        }))
                    );
                const more = open === post.slug;
                const rendered = Object.keys(post.slides || {});
                return (
                    <section key={post.slug} className="post">
                        <div className="post-head">
                            <h2>{post.title}</h2>
                            <p className="meta">
                                {files.length}{" "}
                                {files.length === 1 ? "frame" : "frames"}
                                {themes.length > 1
                                    ? ` in ${themeName(manifest, t)}`
                                    : ""}
                            </p>
                        </div>
                        <Strip
                            story={format === "story"}
                            items={files.map((f, i) => ({
                                url: url(f),
                                alt:
                                    post.alt?.[i] ||
                                    `${post.title}, frame ${i + 1}`,
                                label: post.labels?.[i],
                            }))}
                            onOpen={(i) => openLb(post, i)}
                        />
                        <div className="actions">
                            <ShareButton
                                label={`Save ${files.length} to Photos`}
                                items={items}
                            />
                            <CopyButton
                                text={post.caption}
                                label="Copy caption"
                            />
                            <button
                                type="button"
                                className="btn quiet"
                                aria-expanded={more}
                                onClick={() => setOpen(more ? "" : post.slug)}
                            >
                                {more ? "Less" : "More"}
                            </button>
                        </div>
                        {more && (
                            <div className="more">
                                {themes.length > 1 && rendered.length > 1 && (
                                    <div
                                        className="rings"
                                        aria-label="Theme for this post"
                                    >
                                        {rendered.map((id) => (
                                            <Ring
                                                key={id}
                                                manifest={manifest}
                                                id={id}
                                                pressed={id === t}
                                                onClick={() =>
                                                    setSel(post.slug, id)
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                                <div className="actions">
                                    <ZipButton
                                        name={`${post.slug}-${t}`}
                                        files={zipFiles}
                                        texts={{
                                            "caption.txt": post.caption,
                                            "alt.txt": (post.alt || []).join(
                                                "\n\n"
                                            ),
                                        }}
                                    />
                                </div>
                                <pre className="text">{post.caption}</pre>
                                {post.alt?.length > 0 && (
                                    <ol className="alts">
                                        {post.alt.map((a, i) => (
                                            <li key={i}>
                                                <span>{a}</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>
                        )}
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
