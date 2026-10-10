import { useState } from "react";
import { CopyButton, ShareButton } from "./actions";
import { Lightbox } from "./Lightbox";
import { Strip } from "./Strip";
import { fileName } from "./store";

// Story sets: posted in order, each frame standing on its own, some asking for a sticker
// the Instagram app adds over the frame.
export function Stories({ manifest, url }) {
    const [lb, setLb] = useState(null);
    const sets = manifest.stories || [];
    return (
        <>
            <p className="lede">
                {sets.length} story sets, each tied to a Highlight. Post the
                frames in order.
            </p>
            {sets.map((set) => {
                const items = () =>
                    set.frames.map((f) => ({
                        url: url(f.file),
                        name: fileName(f.file),
                    }));
                const stickers = set.frames
                    .map((f, i) => ({ i, text: f.sticker }))
                    .filter((s) => s.text);
                return (
                    <section key={set.slug} className="post">
                        <div className="post-head">
                            <h2>{set.title}</h2>
                            <p className="meta">
                                {set.frames.length} frames
                                {set.highlight
                                    ? `, in the “${set.highlight}” highlight`
                                    : ""}
                            </p>
                        </div>
                        <Strip
                            story
                            items={set.frames.map((f, i) => ({
                                url: url(f.file),
                                alt: f.alt || `${set.title}, frame ${i + 1}`,
                            }))}
                            onOpen={(i) =>
                                setLb({
                                    title: set.title,
                                    index: i,
                                    items: set.frames.map((x) => ({
                                        url: url(x.file),
                                        name: fileName(x.file),
                                        alt: x.alt,
                                    })),
                                })
                            }
                        />
                        <div className="actions">
                            <ShareButton
                                label={`Save ${set.frames.length} to Photos`}
                                items={items}
                            />
                        </div>
                        {stickers.length > 0 && (
                            <ul className="stickers">
                                {stickers.map((s) => (
                                    <li key={s.i}>
                                        <span className="n">{s.i + 1}</span>
                                        <span>{s.text}</span>
                                        <CopyButton
                                            text={s.text}
                                            label="Copy"
                                        />
                                    </li>
                                ))}
                            </ul>
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
