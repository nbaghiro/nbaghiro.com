import { Fields, ShareButton } from "./actions";
import { fileName } from "./store";

// The account itself: the photo (one per theme where the project has themes), highlight
// covers, and the bio fields with the options written for them.
export function Profile({ manifest, url }) {
    const p = manifest.profile || {};
    return (
        <>
            <p className="lede">
                The account photo, highlight covers and the bio.
            </p>
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
