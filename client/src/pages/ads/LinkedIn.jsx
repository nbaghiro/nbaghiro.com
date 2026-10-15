import { useEffect, useState } from "react";
import { Field, Fields, ShareButton } from "./actions";
import { Lightbox } from "./Lightbox";
import { Strip } from "./Strip";
import { Ring } from "./Studio";
import { chooseTheme, fileName, themeName } from "./store";

// Document posts: the PDF to upload, the title typed into the upload dialog, the post, and
// the first comment that carries the link. The pages are there so a rejected PDF can go up
// as images instead.
// `set` is one voice of a profile kit: the same posts with that voice's text and a note on it.
// A profile kit (kind "profile") is laid out to be read on a desk: a sticky rail with the
// jump list, the profile's art beside its copy, and each post's media beside its voices.
export function LinkedIn({ manifest, url, theme, sel, setSel, themes, set }) {
    const [lb, setLb] = useState(null);
    const [open, setOpen] = useState("");
    const [here, setHere] = useState("");
    const li = manifest.linkedin || {};
    const posts = set?.posts || li.posts || [];
    const kit = li.kind === "profile";
    // with layout "compare", each post shows its text in every voice, side by side
    const voices =
        li.layout === "compare" && li.sets?.length > 1 ? li.sets : null;

    // the jump list follows the section under the top of the screen
    useEffect(() => {
        if (!kit || typeof IntersectionObserver === "undefined")
            return undefined;
        const els = [...document.querySelectorAll(".kit .main > section[id]")];
        const io = new IntersectionObserver(
            (entries) => {
                const seen = entries
                    .filter((e) => e.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top - b.boundingClientRect.top
                    );
                if (seen.length) setHere(seen[0].target.id);
            },
            { rootMargin: "-18% 0px -62% 0px" }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [kit, posts.length]);

    const intro = (
        <>
            <p className="lede">
                {kit
                    ? `${posts.length} posts for the personal profile. Copy the post, attach what it uses, add the first comment an hour or two later.`
                    : `${posts.length} document posts. Upload the PDF, type the title, paste the post, then the first comment.`}
            </p>
            {set?.note && (
                <p className="lede">
                    <b>{set.label}.</b> {set.note}
                </p>
            )}
            {voices && (
                <p className="lede">
                    {voices.map((v, i) => (
                        <span key={v.id}>
                            {i > 0 && " "}
                            <b>{v.label}.</b> {v.note}
                        </span>
                    ))}
                </p>
            )}
        </>
    );

    const jump = kit && (
        <nav className="jump" aria-label="On this page">
            {li.page && (
                <a
                    href="#profile"
                    aria-current={here === "profile" ? "true" : undefined}
                >
                    The profile
                </a>
            )}
            {posts.map((p) => {
                const [when, ...rest] = p.title.split(" · ");
                const id = `post-${p.slug}`;
                return (
                    <a
                        key={p.slug}
                        href={`#${id}`}
                        aria-current={here === id ? "true" : undefined}
                    >
                        {rest.length > 0 && <small>{when}</small>}
                        <span>
                            {rest.length > 0 ? rest.join(" · ") : p.title}
                        </span>
                    </a>
                );
            })}
        </nav>
    );

    const art = li.page && (
        <>
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
        </>
    );
    const profile = li.page?.profile || [];
    const field = (f) => (
        <Field key={f.label} label={f.label} note={f.note} text={f.text} />
    );
    // in the kit the art, the headline and the About sit in three columns, the rest under the art
    const copy = li.page && (
        <>
            <Fields fields={li.page.fields} />
            {profile.map(field)}
        </>
    );
    const page = li.page && (
        <section className="post" id="profile">
            <div className="post-head">
                <h2>{kit ? "The profile" : "The company page"}</h2>
            </div>
            {kit ? (
                <div className="page-grid">
                    <div>
                        {art}
                        {profile.slice(1).map(field)}
                    </div>
                    <div>
                        <Fields fields={li.page.fields} />
                    </div>
                    <div>{profile.slice(0, 1).map(field)}</div>
                </div>
            ) : (
                <>
                    {art}
                    {copy}
                </>
            )}
        </section>
    );

    const items = posts.map((post) => {
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
        const media = (
            <>
                {post.reel && (
                    <div className="reel inline">
                        <video
                            crossOrigin="anonymous"
                            src={url(post.reel.file)}
                            poster={
                                post.reel.poster
                                    ? url(post.reel.poster)
                                    : undefined
                            }
                            controls
                            loop
                            playsInline
                            preload="metadata"
                        />
                        <div className="actions">
                            <ShareButton
                                label="Save video"
                                items={() => [
                                    {
                                        url: url(post.reel.file),
                                        name: `${post.slug}.mp4`,
                                    },
                                ]}
                            />
                            <a
                                className="btn"
                                href={url(post.reel.file)}
                                download={`${post.slug}.mp4`}
                            >
                                File
                            </a>
                        </div>
                    </div>
                )}
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
                            items={() => [{ url: url(pdf), name: pdfName }]}
                        />
                    )}
                    {pdf && (
                        <a className="btn" href={url(pdf)} download={pdfName}>
                            PDF
                        </a>
                    )}
                    {themes.length > 1 && have.length > 1 && (
                        <button
                            type="button"
                            className="btn quiet"
                            aria-expanded={more}
                            onClick={() => setOpen(more ? "" : post.slug)}
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
            </>
        );
        const text = voices ? (
            <div className="compare">
                {voices.map((v) => (
                    <Field
                        key={v.id}
                        label={v.label}
                        text={
                            v.posts.find((p) => p.slug === post.slug)?.text ??
                            post.text
                        }
                    />
                ))}
            </div>
        ) : (
            <Field label="Post" text={post.text} />
        );
        const after = (
            <>
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
                {post.notes && <Field label="Notes" text={post.notes} />}
            </>
        );
        return (
            <section key={post.slug} className="post" id={`post-${post.slug}`}>
                <div className="post-head">
                    <h2>{post.title}</h2>
                    <p className="meta">
                        {pages.length > 0 && `${pages.length} pages`}
                        {!pages.length && !kit && "document"}
                        {themes.length > 1 && t
                            ? ` in ${themeName(manifest, t)}`
                            : ""}
                    </p>
                </div>
                {kit ? (
                    <div className="spread">
                        <div className="side">
                            {media}
                            {after}
                        </div>
                        <div>{text}</div>
                    </div>
                ) : (
                    <>
                        {media}
                        {text}
                        {after}
                    </>
                )}
            </section>
        );
    });

    const box = lb && (
        <Lightbox
            title={lb.title}
            items={lb.items}
            index={lb.index}
            onIndex={(i) => setLb({ ...lb, index: i })}
            onClose={() => setLb(null)}
        />
    );

    if (kit) {
        return (
            <div className="kit">
                <aside className="rail">
                    {intro}
                    {jump}
                </aside>
                <div className="main">
                    {page}
                    {items}
                </div>
                {box}
            </div>
        );
    }
    return (
        <>
            {intro}
            {page}
            {items}
            {box}
        </>
    );
}
