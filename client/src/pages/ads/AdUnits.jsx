import { useState } from "react";
import { CopyButton, DownloadButton, ShareButton } from "./actions";
import { Lightbox } from "./Lightbox";
import { Strip } from "./Strip";
import { chooseTheme, fileName, themeName } from "./store";

// The same creative posted rather than run as an ad: the company page's reading, the
// founder's own, and a line for sharing it on. An ad with no post copy shows none of these.
const POST_COPIES = [
    ["company", "Company page", "Posted from the Clientbridge page."],
    ["founder", "Founder profile", "The same subject, in the first person."],
    ["repost", "Repost", "One line for sharing the company post on."],
];

const SHAPES = [
    [
        "post",
        "Post",
        "2400 x 2400",
        "A LinkedIn post, the shape the rest of this studio's posts are made at",
    ],
    [
        "feed",
        "Feed",
        "1080 x 1350",
        "Instagram feed, and a LinkedIn single image ad",
    ],
    [
        "story",
        "Story",
        "1080 x 1920",
        "Instagram and Facebook stories and reels",
    ],
];

// Paid creatives, which is a different thing from a post: one per product, in the two shapes
// that cover the placements it runs in.
export function AdUnits({ manifest, url, theme, themes }) {
    const [lb, setLb] = useState(null);
    const items = manifest.ads?.items || [];

    // An ad drawn in more than one of the product's themes answers to the ring at the top, the
    // way a carousel does; one drawn in a single look is filed under "default" and ignores it.
    const inTheme = (ad) => {
        const have = Object.keys(ad.files ?? {});
        const id = chooseTheme(have, theme, ad.defaultTheme, "default");
        return { id, files: ad.files?.[id] ?? {} };
    };

    return (
        <>
            <p className="lede">
                {items.length === 1
                    ? "One ad, in both shapes."
                    : `${items.length} ads, each in both shapes.`}{" "}
                The button drawn into the frame is art. What carries the tap is
                the call to action you pick in Meta Ads Manager or LinkedIn
                Campaign Manager, or a link sticker laid over an organic story.
                A feed post carries no link at all, which is why every caption
                ends with the address.
            </p>
            {items.map((ad) => {
                const { id: themeId, files } = inTheme(ad);
                const drawn = Object.keys(ad.files ?? {});
                const frames = SHAPES.filter(([k]) => files[k]).map(
                    ([k, label]) => ({
                        key: k,
                        url: url(files[k]),
                        name: fileName(files[k]),
                        label,
                        alt: ad.alt,
                    })
                );
                return (
                    <section key={ad.slug} className="post">
                        <div className="post-head">
                            <h2>{ad.title}</h2>
                            <p className="meta">
                                {[
                                    ad.cta,
                                    ad.site,
                                    drawn.length > 1 &&
                                        themeName(manifest, themeId),
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </p>
                        </div>
                        <Strip
                            key={themeId}
                            pair
                            items={frames.map((f) => ({
                                url: f.url,
                                alt: f.alt || `${ad.title}, ${f.label}`,
                                label: f.label,
                            }))}
                            onOpen={(i) =>
                                setLb({
                                    title: ad.title,
                                    index: i,
                                    items: frames.map((f) => ({
                                        url: f.url,
                                        name: f.name,
                                        alt: f.alt,
                                    })),
                                })
                            }
                        />
                        <div className="actions">
                            <ShareButton
                                label={`Save ${frames.length} to Photos`}
                                items={() =>
                                    frames.map((f) => ({
                                        url: f.url,
                                        name: f.name,
                                    }))
                                }
                            />
                            {frames.map((f) => (
                                <DownloadButton
                                    key={f.key}
                                    url={f.url}
                                    name={f.name}
                                    label={f.label}
                                />
                            ))}
                        </div>
                        <ul className="where">
                            {SHAPES.filter(([k]) => files[k]).map(
                                ([k, label, size, runs]) => (
                                    <li key={k}>
                                        <b>
                                            {label} {size}
                                        </b>
                                        <span>{runs}</span>
                                    </li>
                                )
                            )}
                        </ul>
                        {ad.caption && (
                            <div className="field">
                                <div className="row">
                                    <h3>Caption</h3>
                                    <CopyButton
                                        text={ad.caption}
                                        label="Copy"
                                    />
                                </div>
                                <pre className="text">{ad.caption}</pre>
                            </div>
                        )}
                        {POST_COPIES.map(([key, label, note]) =>
                            ad.posts?.[key] ? (
                                <div className="field" key={key}>
                                    <div className="row">
                                        <h3>{label}</h3>
                                        <span className="char-count">
                                            {ad.posts[
                                                key
                                            ].length.toLocaleString()}{" "}
                                            characters
                                        </span>
                                        <CopyButton
                                            text={ad.posts[key]}
                                            label="Copy"
                                        />
                                    </div>
                                    <p className="note">{note}</p>
                                    <pre className="text">{ad.posts[key]}</pre>
                                </div>
                            ) : null
                        )}
                        {ad.alt && (
                            <div className="field">
                                <div className="row">
                                    <h3>Alt text</h3>
                                    <CopyButton text={ad.alt} label="Copy" />
                                </div>
                                <pre className="text">{ad.alt}</pre>
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
