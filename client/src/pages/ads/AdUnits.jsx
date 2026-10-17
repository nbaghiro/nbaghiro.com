import { useState } from "react";
import { CopyButton, DownloadButton, ShareButton } from "./actions";
import { Lightbox } from "./Lightbox";
import { Strip } from "./Strip";
import { fileName } from "./store";

const SHAPES = [
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
export function AdUnits({ manifest, url }) {
    const [lb, setLb] = useState(null);
    const items = manifest.ads?.items || [];

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
                const frames = SHAPES.filter(([k]) => ad.files?.[k]).map(
                    ([k, label]) => ({
                        key: k,
                        file: ad.files[k],
                        url: url(ad.files[k]),
                        name: fileName(ad.files[k]),
                        label,
                        alt: ad.alt,
                    })
                );
                return (
                    <section key={ad.slug} className="post">
                        <div className="post-head">
                            <h2>{ad.title}</h2>
                            <p className="meta">
                                {[ad.cta, ad.site].filter(Boolean).join(" · ")}
                            </p>
                        </div>
                        <Strip
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
                            {SHAPES.filter(([k]) => ad.files?.[k]).map(
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
