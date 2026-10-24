import { useState } from "react";
import { DownloadButton, Fields, ShareButton } from "./actions";
import { ProfileHeader } from "./Header";
import { fileName } from "./store";

// The account in one view: the photo and cover judged as the pair they are seen as, and the
// written fields underneath. These were two tabs, which meant choosing a cover on one screen
// and reading the headline that sits on it on another.
export function Account({ manifest, url }) {
    const c = manifest.combos || {};
    const page = manifest.linkedin?.page || {};
    const avatars = c.avatars || [];
    const covers = c.covers || [];
    const [a, setA] = useState(0);
    const [b, setB] = useState(0);
    const avatar = avatars[a];
    const cover = covers[b];

    return (
        <>
            {avatar && cover ? (
                <>
                    <p className="lede">
                        {avatars.length} photos and {covers.length} covers. The
                        card is the profile header at LinkedIn&apos;s
                        proportions, with the headline that will sit on it.
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
                                {
                                    url: url(avatar.file),
                                    name: fileName(avatar.file),
                                },
                                {
                                    url: url(cover.file),
                                    name: fileName(cover.file),
                                },
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

                    {[
                        ["Photo", avatar, avatars, a, setA, "round"],
                        ["Cover", cover, covers, b, setB, "wide"],
                    ].map(([label, chosen, list, i, set, shape]) => (
                        <div className="picker" key={label}>
                            <h3>
                                {label} · {chosen.label}
                            </h3>
                            <div className="row">
                                {list.map((it, n) => (
                                    <button
                                        key={it.file}
                                        type="button"
                                        className={`pick ${shape}`}
                                        aria-pressed={n === i}
                                        onClick={() => set(n)}
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
                    ))}
                </>
            ) : (
                <p className="lede">No photos or covers in this kit yet.</p>
            )}

            {page.fields?.length > 0 && (
                <div className="acct-fields">
                    <h2>The written profile</h2>
                    <Fields fields={page.fields} />
                </div>
            )}
        </>
    );
}
