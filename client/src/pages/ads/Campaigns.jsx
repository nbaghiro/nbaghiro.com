import { useState } from "react";
import { DownloadButton, ShareButton, Field } from "./actions";
import { Lightbox } from "./Lightbox";

export function Campaigns({ manifest, url }) {
    const [selected, setSelected] = useState(null);
    const items = manifest.campaigns?.items ?? [];
    return (
        <>
            <p className="lede">
                Multi-screen visuals with company-page LinkedIn copy. All
                screens use demo accounts.
            </p>
            {items.map((item, index) => (
                <article className="campaign-post" key={item.id}>
                    <div>
                        <button
                            className="campaign-image"
                            onClick={() => setSelected(index)}
                            aria-label={`Enlarge ${item.title}`}
                        >
                            <img
                                src={url(item.file)}
                                alt={item.title}
                                loading="lazy"
                            />
                        </button>
                        <div className="actions">
                            <ShareButton
                                items={() => [
                                    {
                                        url: url(item.file),
                                        name: `${item.id}.png`,
                                    },
                                ]}
                            />
                            <DownloadButton
                                url={url(item.file)}
                                name={`${item.id}.png`}
                                label="Download image"
                            />
                        </div>
                    </div>
                    <div>
                        <p className="meta">
                            {item.surface} · Company page · Draft
                        </p>
                        <h2>{item.title}</h2>
                        <Field label="LinkedIn copy" text={item.text} count />
                    </div>
                </article>
            ))}
            {selected !== null && (
                <Lightbox
                    title="Screen posts"
                    items={items.map((item) => ({
                        url: url(item.file),
                        alt: item.title,
                        name: `${item.id}.png`,
                    }))}
                    index={selected}
                    onIndex={setSelected}
                    onClose={() => setSelected(null)}
                />
            )}
        </>
    );
}
