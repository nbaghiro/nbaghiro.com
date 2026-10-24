import { useEffect, useState } from "react";
import { DownloadButton, Field, Fields, ShareButton } from "./actions";
import { ProfileHeader } from "./Header";
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
    const [editionId, setEditionId] = useState("codex");
    const [styleIds, setStyleIds] = useState({});
    const source = manifest.linkedin || {};
    const editions = source.editions || [];
    const comparing = editionId === "compare" && editions.length > 1;
    const edition = editions.find((e) => e.id === editionId) || editions[0];
    const selectedSet = (e) =>
        e.sets?.find((s) => s.id === styleIds[e.id]) || e.sets?.[0];
    const li = edition ? { ...source, ...edition } : source;
    const chosen = edition ? selectedSet(edition) : set;
    const posts = chosen?.posts || li.posts || [];
    const kit = li.kind === "profile";
    const voices = comparing
        ? editions.map((e) => ({
              id: e.id,
              label: `${e.label} · ${selectedSet(e)?.label || "Original"}`,
              posts: selectedSet(e)?.posts || e.posts,
          }))
        : !edition && li.layout === "compare" && li.sets?.length > 1
          ? li.sets
          : null;
    const controls = editions.length > 0 && (
        <div className="editorial-controls">
            <div className="seg" role="group" aria-label="Copy version">
                {[...editions, { id: "compare", label: "Compare" }].map((e) => (
                    <button
                        key={e.id}
                        type="button"
                        aria-pressed={editionId === e.id}
                        onClick={() => setEditionId(e.id)}
                    >
                        {e.label}
                    </button>
                ))}
            </div>
            {(comparing ? editions : [edition]).map(
                (e) =>
                    e.sets?.length > 0 && (
                        <label className="style-select" key={e.id}>
                            <span>{comparing ? e.label : "Style"}</span>
                            <select
                                value={selectedSet(e)?.id}
                                onChange={(event) =>
                                    setStyleIds({
                                        ...styleIds,
                                        [e.id]: event.target.value,
                                    })
                                }
                            >
                                {e.sets.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )
            )}
            <span className="meta">{posts.length} posts</span>
        </div>
    );

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
        <p className="lede">
            {kit && posts.length > 0 && "Profile & posts"}
            {kit && posts.length === 0 && "The profile itself"}
            {!kit && `${posts.length} document posts`}
        </p>
    );

    const jump = kit && posts.length > 0 && (
        <nav className="jump" aria-label="On this page">
            {li.page && (
                <a
                    href="#profile"
                    aria-current={here === "profile" ? "true" : undefined}
                >
                    Profile
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

    const pairName = (f) => fileName(f);
    const headerMock = kit && li.page?.logo && li.page?.banner && (
        <>
            <ProfileHeader
                cover={{ url: url(li.page.banner), label: "Cover" }}
                avatar={{ url: url(li.page.logo), label: "Profile photo" }}
                name={li.page.name}
                headline={
                    li.page.fields?.find((f) => f.label === "Headline")
                        ?.options?.[0]
                }
                meta={li.page.meta}
            />
            <div className="actions" style={{ marginTop: 14 }}>
                <ShareButton
                    label="Save both"
                    items={() => [
                        {
                            url: url(li.page.logo),
                            name: pairName(li.page.logo),
                        },
                        {
                            url: url(li.page.banner),
                            name: pairName(li.page.banner),
                        },
                    ]}
                />
                <DownloadButton
                    url={url(li.page.logo)}
                    name={pairName(li.page.logo)}
                    label="Photo"
                />
                <DownloadButton
                    url={url(li.page.banner)}
                    name={pairName(li.page.banner)}
                    label="Cover"
                />
            </div>
        </>
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
                            <DownloadButton
                                url={url(li.page.logo)}
                                name={fileName(li.page.logo)}
                            />
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
                        <DownloadButton
                            url={url(li.page.banner)}
                            name={fileName(li.page.banner)}
                        />
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
                <h2>{kit ? "Profile" : "Company page"}</h2>
            </div>
            {kit ? (
                <div className="page-grid">
                    <div>{headerMock || art}</div>
                    {comparing ? (
                        editions.map((e) => (
                            <div key={e.id}>
                                <h3>{e.label}</h3>
                                <Fields fields={e.page?.fields} />
                                {e.page?.profile?.map(field)}
                            </div>
                        ))
                    ) : (
                        <div>{copy}</div>
                    )}
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
        // A document post carries one PDF per theme, so its themes are its PDF keys. A
        // single-image post has no PDF at all, so its options are its page keys instead:
        // without this, a one-image post could never offer a choice.
        const pdfKeys = Object.keys(post.pdf || {});
        const have = pdfKeys.length
            ? pdfKeys
            : Object.keys(post.pages || {}).filter((k) => k !== "default");
        const t = chooseTheme(
            have,
            sel[`li:${post.slug}`] || theme,
            post.defaultTheme
        );
        const pdf = post.pdf?.[t];
        const pages = post.pages?.[t] || post.pages?.default || [];
        const pdfName = `${post.slug}${themes.length > 1 ? `-${t}` : ""}.pdf`;
        const single = pages.length === 1;
        const imageName = `${post.slug}${themes.length > 1 ? `-${t}` : ""}.png`;
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
                            <DownloadButton
                                url={url(post.reel.file)}
                                name={`${post.slug}.mp4`}
                            />
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
                    {/* A post with one page is an image post: LinkedIn boosts those and will not
                        boost a document, so the image is the thing to reach for and the PDF only
                        gets in the way. More than one page is a carousel, which uploads as a PDF. */}
                    {single && (
                        <ShareButton
                            label="Save image"
                            items={() => [{ url: url(pages[0]), name: imageName }]}
                        />
                    )}
                    {single && (
                        <DownloadButton
                            url={url(pages[0])}
                            name={imageName}
                            label="Image"
                        />
                    )}
                    {pdf && !single && (
                        <ShareButton
                            label="Save PDF"
                            items={() => [{ url: url(pdf), name: pdfName }]}
                        />
                    )}
                    {pdf && !single && (
                        <DownloadButton
                            url={url(pdf)}
                            name={pdfName}
                            label="PDF"
                        />
                    )}
                    {pages.length > 1 && (
                        <ShareButton
                            primary={false}
                            label={`Save ${pages.length} pages`}
                            deskLabel="Share pages"
                            items={() =>
                                pages.map((f) => ({
                                    url: url(f),
                                    name: fileName(f),
                                }))
                            }
                        />
                    )}
                    {have.length > 1 && (
                        <button
                            type="button"
                            className="btn quiet"
                            aria-expanded={more}
                            onClick={() => setOpen(more ? "" : post.slug)}
                        >
                            {more ? "Less" : post.pageLabels ? "Options" : "Theme"}
                        </button>
                    )}
                </div>
                {more && (
                    <div className="more">
                        <div
                            className="rings"
                            aria-label={
                                post.pageLabels
                                    ? "Image for this post"
                                    : "Theme for this document"
                            }
                        >
                            {have.map((id) => (
                                <Ring
                                    key={id}
                                    manifest={manifest}
                                    id={id}
                                    label={post.pageLabels?.[id]}
                                    pressed={id === t}
                                    onClick={() =>
                                        setSel(`li:${post.slug}`, id)
                                    }
                                />
                            ))}
                        </div>
                    </div>
                )}
                {/* LinkedIn asks for a document title only when a PDF is uploaded as a
                    document post. A single image has no document, so the field is noise on
                    exactly the posts we now publish. */}
                {!single && <Field label="Document title" text={post.documentTitle} />}
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
                        count
                    />
                ))}
            </div>
        ) : (
            <Field
                label={
                    edition
                        ? `${edition.label} · ${chosen?.label || "Original"}`
                        : "Post"
                }
                text={post.text}
                count
            />
        );
        const after = (
            <>
                <Field label="First comment" text={post.firstComment} />
                <Field
                    label="From a personal profile"
                    note="A native post a day or two later."
                    text={post.founderCaption}
                />
                {post.notes && (
                    <details className="details">
                        <summary>Notes & checks</summary>
                        <Field label="Publishing notes" text={post.notes} />
                    </details>
                )}
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
            <>
                {controls}
                <div className={`kit${comparing ? " comparing" : ""}`}>
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
            </>
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
