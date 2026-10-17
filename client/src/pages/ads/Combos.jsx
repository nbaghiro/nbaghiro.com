import { useState } from "react";
import { DownloadButton, ShareButton } from "./actions";
import { ProfileHeader } from "./Header";
import { fileName } from "./store";

// Profile combinations: pick a photo and a cover and see them together in a mock of the
// LinkedIn profile header, at the proportions LinkedIn actually uses, so the pair can be
// judged before either is uploaded.
export function Combos({ manifest, url }) {
    const c = manifest.combos || {};
    const avatars = c.avatars || [];
    const covers = c.covers || [];
    const [a, setA] = useState(0);
    const [b, setB] = useState(0);
    const avatar = avatars[a];
    const cover = covers[b];
    if (!avatar || !cover) return <p className="lede">Nothing to show yet.</p>;

    return (
        <>
            <p className="lede">
                {avatars.length} photos and {covers.length} covers. Pick one of
                each; the card below is the profile header at LinkedIn&apos;s
                proportions.
            </p>

            <ProfileHeader
                cover={{ url: url(cover.file), label: cover.label }}
                avatar={{ url: url(avatar.file), label: avatar.label }}
                name={c.name}
                headline={c.headline}
                meta={c.meta}
            />

            <div className="actions" style={{ marginTop: 14 }}>
                <ShareButton
                    label="Save both"
                    items={() => [
                        { url: url(avatar.file), name: fileName(avatar.file) },
                        { url: url(cover.file), name: fileName(cover.file) },
                    ]}
                />
                <DownloadButton
                    url={url(avatar.file)}
                    name={fileName(avatar.file)}
                    label="Photo"
                />
                <DownloadButton
                    url={url(cover.file)}
                    name={fileName(cover.file)}
                    label="Cover"
                />
            </div>

            <div className="picker">
                <h3>Photo · {avatar.label}</h3>
                <div className="row">
                    {avatars.map((it, i) => (
                        <button
                            key={it.file}
                            type="button"
                            className="pick round"
                            aria-pressed={i === a}
                            onClick={() => setA(i)}
                        >
                            <img
                                crossOrigin="anonymous"
                                src={url(it.file)}
                                alt={it.label}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="picker">
                <h3>Cover · {cover.label}</h3>
                <div className="row">
                    {covers.map((it, i) => (
                        <button
                            key={it.file}
                            type="button"
                            className="pick wide"
                            aria-pressed={i === b}
                            onClick={() => setB(i)}
                        >
                            <img
                                crossOrigin="anonymous"
                                src={url(it.file)}
                                alt={it.label}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
