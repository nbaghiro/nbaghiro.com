import { Fields, ShareButton } from "./actions";
import { fileName } from "./store";

const first = (fields, label) =>
    fields?.find((f) => f.label === label)?.options?.[0] ?? "";

// The account itself: the photo (one per theme where the project has themes), highlight
// covers, and the bio fields with the options written for them. Where the kit supplies an
// avatar and a header, they are shown together first, at the proportions the account will
// have, because the two pictures are only ever judged as a pair.
export function Profile({ manifest, url }) {
    const p = manifest.profile || {};
    const avatar = p.pictures?.find((x) => /avatar/i.test(x.label));
    const header = p.pictures?.find((x) =>
        /header|cover|banner/i.test(x.label)
    );
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
                                    <a
                                        className="btn"
                                        href={url(pic.file)}
                                        download={fileName(pic.file)}
                                    >
                                        File
                                    </a>
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
