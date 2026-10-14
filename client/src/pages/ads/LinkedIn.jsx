import { useState } from "react";
import { Field, Fields, ShareButton } from "./actions";
import { Lightbox } from "./Lightbox";
import { Strip } from "./Strip";
import { Ring } from "./Studio";
import { chooseTheme, fileName, themeName } from "./store";

// Document posts: the PDF to upload, the title typed into the upload dialog, the post, and
// the first comment that carries the link. The pages are there so a rejected PDF can go up
// as images instead.
export function LinkedIn({ manifest, url, theme, sel, setSel, themes }) {
    const [lb, setLb] = useState(null);
    const [open, setOpen] = useState("");
    const li = manifest.linkedin || {};
    const posts = li.posts || [];

    return (
        <>
            <p className="lede">
                {li.kind === "profile"
                    ? `${posts.length} posts for the personal profile. Copy the post, attach what it uses, add the first comment an hour or two later.`
                    : `${posts.length} document posts. Upload the PDF, type the title, paste the post, then the first comment.`}
            </p>
            {li.page && (
                <section className="post">
                    <div className="post-head">
                        <h2>The company page</h2>
                    </div>
                    <div className="pics">
                        {li.page.logo && (
                            <figure>
                                <img
                                    crossOrigin="anonymous"
                                    className="square"
                                    src={url(li.page.logo)}
                                    alt="Page logo"
                                />
                                <figcaption>Logo</figcaption>
                                <div className="actions">
                                    <ShareButton
                                        label="Save"
                                        items={() => [
                                            {
                                                url: url(li.page.logo),
                                                name: fileName(li.page.logo),
                                            },
                                        ]}
                                    />
                                    <a
                                        className="btn"
                                        href={url(li.page.logo)}
                                        download={fileName(li.page.logo)}
                                    >
                                        File
                                    </a>
                                </div>
                            </figure>
                        )}
                    </div>
                    {li.page.banner && (
                        <>
                            <img
                                crossOrigin="anonymous"
                                className="banner"
                                src={url(li.page.banner)}
                                alt="Page banner"
                            />
                            <div className="actions">
                                <ShareButton
                                    label="Save banner"
                                    items={() => [
                                        {
                                            url: url(li.page.banner),
                                            name: fileName(li.page.banner),
                                        },
                                    ]}
                                />
                                <a
                                    className="btn"
                                    href={url(li.page.banner)}
                                    download={fileName(li.page.banner)}
                                >
                                    File
                                </a>
                            </div>
                        </>
                    )}
                    <Fields fields={li.page.fields} />
                </section>
            )}
            {posts.map((post) => {
                const have = Object.keys(post.pdf || {});
                const t = chooseTheme(
                    have,
                    sel[`li:${post.slug}`] || theme,
                    post.defaultTheme
                );
                const pdf = post.pdf?.[t];
                const pages = post.pages?.[t] || post.pages?.default || [];
                const pdfName = `${post.slug}${themes.length > 1 ? `-${t}` : ""}.pdf`;
                const more = open === post.slug;
                return (
                    <section key={post.slug} className="post">
                        <div className="post-head">
                            <h2>{post.title}</h2>
                            <p className="meta">
                                {pages.length > 0 && `${pages.length} pages`}
                                {!pages.length && li.kind !== "profile" && "document"}
                                {themes.length > 1 && t
                                    ? ` in ${themeName(manifest, t)}`
                                    : ""}
                            </p>
                        </div>
                        {pages.length > 0 && (
                            <Strip
                                items={pages.map((f, i) => ({
                                    url: url(f),
                                    alt: `${post.title}, page ${i + 1}`,
                                }))}
                                onOpen={(i) =>
                                    setLb({
                                        title: post.title,
                                        index: i,
                                        items: pages.map((x) => ({
                                            url: url(x),
                                            name: fileName(x),
                                        })),
                                    })
                                }
                            />
                        )}
                        <div className="actions">
                            {pdf && (
                                <ShareButton
                                    label="Save PDF"
                                    items={() => [
                                        { url: url(pdf), name: pdfName },
                                    ]}
                                />
                            )}
                            {pdf && (
                                <a
                                    className="btn"
                                    href={url(pdf)}
                                    download={pdfName}
                                >
                                    PDF
                                </a>
                            )}
                            {themes.length > 1 && have.length > 1 && (
                                <button
                                    type="button"
                                    className="btn quiet"
                                    aria-expanded={more}
                                    onClick={() =>
                                        setOpen(more ? "" : post.slug)
                                    }
                                >
                                    {more ? "Less" : "Theme"}
                                </button>
                            )}
                        </div>
                        {more && (
                            <div className="more">
                                <div
                                    className="rings"
                                    aria-label="Theme for this document"
                                >
                                    {have.map((id) => (
                                        <Ring
                                            key={id}
                                            manifest={manifest}
                                            id={id}
                                            pressed={id === t}
                                            onClick={() =>
                                                setSel(`li:${post.slug}`, id)
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        <Field
                            label="Document title"
                            note="Typed into the upload dialog, which otherwise shows the file name."
                            text={post.documentTitle}
                        />
                        <Field label="Post" text={post.text} />
                        <Field
                            label="First comment"
                            note="Posted right after, with the link."
                            text={post.firstComment}
                        />
                        <Field
                            label="From a personal profile"
                            note="A native post a day or two later."
                            text={post.founderCaption}
                        />
                        {post.notes && (
                            <Field label="Notes" text={post.notes} />
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
