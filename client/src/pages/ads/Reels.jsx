import { useState } from "react";
import { CopyButton, ShareButton } from "./actions";
import { themeName } from "./store";

// Reels are video: one file per theme, and the Instagram app needs it in Photos.
export function Reels({ manifest, url, theme, themes }) {
    const [open, setOpen] = useState("");
    const reels = manifest.reels || [];
    return (
        <>
            <p className="lede">
                {reels.length} reels
                {themes.length > 1 ? ` in ${themeName(manifest, theme)}` : ""}.
            </p>
            <div className="reels">
                {reels.map((reel) => {
                    const have = Object.keys(reel.files || {});
                    const t = have.includes(theme) ? theme : have[0];
                    const file = reel.files?.[t];
                    if (!file) return null;
                    const poster = reel.poster?.[t];
                    const name = `${manifest.project.id}-${reel.slug}${
                        themes.length > 1 ? `-${t}` : ""
                    }.mp4`;
                    const more = open === reel.slug;
                    return (
                        <article key={reel.slug} className="reel">
                            <video
                                crossOrigin="anonymous"
                                src={url(file)}
                                poster={poster ? url(poster) : undefined}
                                controls
                                loop
                                playsInline
                                preload="metadata"
                            />
                            <h2>{reel.title}</h2>
                            {reel.note && <p className="meta">{reel.note}</p>}
                            <div className="actions">
                                <ShareButton
                                    label="Save video"
                                    items={() => [{ url: url(file), name }]}
                                />
                                <a
                                    className="btn"
                                    href={url(file)}
                                    download={name}
                                >
                                    File
                                </a>
                                {reel.caption && (
                                    <CopyButton
                                        text={reel.caption}
                                        label="Copy caption"
                                    />
                                )}
                                {reel.caption && (
                                    <button
                                        type="button"
                                        className="btn quiet"
                                        aria-expanded={more}
                                        onClick={() =>
                                            setOpen(more ? "" : reel.slug)
                                        }
                                    >
                                        {more ? "Less" : "More"}
                                    </button>
                                )}
                            </div>
                            {more && <pre className="text">{reel.caption}</pre>}
                        </article>
                    );
                })}
            </div>
        </>
    );
}
