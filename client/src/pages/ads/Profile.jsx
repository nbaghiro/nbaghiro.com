import { useState } from "react";
import { DownloadButton, Fields, ShareButton } from "./actions";
import { fileName } from "./store";

const first = (fields, label) =>
    fields?.find((f) => f.label === label)?.options?.[0] ?? "";

// The account itself: the photo (one per theme where the project has themes), highlight
// covers, and the bio fields with the options written for them. Where the kit supplies an
// avatar and a header, they are shown together first, at the proportions the account will
// have, because the two pictures are only ever judged as a pair.
export function Profile({ manifest, url }) {
    const p = manifest.profile || {};
    // where the kit offers alternatives, the pair is picked here rather than in a rebuild
    const avatars = p.choices?.avatars ?? [];
    const headers = p.choices?.headers ?? [];
    const [a, setA] = useState(0);
    const [h, setH] = useState(0);
    const avatar =
        avatars[a] ?? p.pictures?.find((x) => /avatar/i.test(x.label));
    const header =
        headers[h] ??
        p.pictures?.find((x) => /header|cover|banner/i.test(x.label));
    const name = first(p.fields, "Name");
    const handle = first(p.fields, "Handle");
    const bio = first(p.fields, "Bio");
    const where = first(p.fields, "Location");
    const site = first(p.fields, "Website");
    return (
        <>
            <p className="lede">
                The account photo, highlight covers and the bio.
            </p>
            {avatar && header && (
                <div className="xmock">
                    <img
                        crossOrigin="anonymous"
                        className="xmock-cover"
                        src={url(header.file)}
                        alt={header.label}
                    />
                    <img
                        crossOrigin="anonymous"
                        className="xmock-avatar"
                        src={url(avatar.file)}
                        alt={avatar.label}
                    />
                    <div className="xmock-body">
                        <span className="xmock-follow">Follow</span>
                        <h3 className="xmock-name">{name}</h3>
                        <p className="xmock-handle">{handle}</p>
                        {bio && <p className="xmock-bio">{bio}</p>}
                        <p className="xmock-meta">
                            {[where, site].filter(Boolean).join("  ·  ")}
                        </p>
                    </div>
                </div>
            )}
            {(avatars.length > 1 || headers.length > 1) && (
                <div className="xpick">
                    {[
                        ["Photo", avatars, a, setA],
                        ["Header", headers, h, setH],
                    ]
                        .filter(([, list]) => list.length > 1)
                        .map(([label, list, active, set]) => (
                            <div className="xpick-row" key={label}>
                                <p className="xpick-label">{label}</p>
                                <div className="xpick-items">
                                    {list.map((item, i) => (
                                        <button
                                            type="button"
                                            key={item.file}
                                            className={
                                                i === active ? "on" : undefined
                                            }
                                            onClick={() => set(i)}
                                        >
                                            <img
                                                crossOrigin="anonymous"
                                                src={url(item.file)}
                                                alt={item.label}
                                            />
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    <div className="actions">
                        <ShareButton
                            label="Save the pair"
                            items={() => [
                                {
                                    url: url(avatar.file),
                                    name: fileName(avatar.file),
                                },
                                {
                                    url: url(header.file),
                                    name: fileName(header.file),
                                },
                            ]}
                        />
                        <DownloadButton
                            url={url(avatar.file)}
                            name={fileName(avatar.file)}
                            label="Photo"
                        />
                        <DownloadButton
                            url={url(header.file)}
                            name={fileName(header.file)}
                            label="Header"
                        />
                    </div>
                </div>
            )}
            <section className="post">
                {p.pictures?.length > 0 && (
                    <div className="pics">
                        {p.pictures.map((pic) => (
                            <figure key={pic.file}>
                                <img
                                    crossOrigin="anonymous"
                                    className="round"
                                    src={url(pic.file)}
                                    alt={pic.label}
                                />
                                <figcaption>{pic.label}</figcaption>
                                <div className="actions">
                                    <ShareButton
                                        label="Save"
                                        items={() => [
                                            {
                                                url: url(pic.file),
                                                name: fileName(pic.file),
                                            },
                                        ]}
                                    />
                                    <DownloadButton
                                        url={url(pic.file)}
                                        name={fileName(pic.file)}
                                    />
                                </div>
                            </figure>
                        ))}
                    </div>
                )}
                {p.note && (
                    <p
                        className="meta"
                        style={{ marginTop: 16, maxWidth: "62ch" }}
                    >
                        {p.note}
                    </p>
                )}
                <Fields fields={p.fields} />
            </section>
        </>
    );
}
