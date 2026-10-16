import { CopyButton, ShareButton } from "./actions";
import { fileName } from "./store";

// One-pagers and anything else that is a finished document rather than a post: the page as an
// image, the PDF to send, and a link that can be pasted into a message from anywhere.
export function Docs({ manifest, url }) {
    const items = manifest.docs?.items || [];
    return (
        <>
            <p className="lede">
                {items.length} to send as they are. Download the PDF, or copy
                the link and paste it into a message.
            </p>
            {items.map((doc) => (
                <section className="post doc" key={doc.id}>
                    <div className="post-head">
                        <h2>{doc.title}</h2>
                        {doc.meta && <p className="meta">{doc.meta}</p>}
                    </div>
                    {doc.page && (
                        <a
                            className="doc-page"
                            href={url(doc.pdf)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <img
                                crossOrigin="anonymous"
                                src={url(doc.page)}
                                alt={doc.title}
                                loading="lazy"
                            />
                        </a>
                    )}
                    <div className="actions">
                        <ShareButton
                            label="Send"
                            items={() => [
                                { url: url(doc.pdf), name: fileName(doc.pdf) },
                            ]}
                        />
                        <a
                            className="btn"
                            href={url(doc.pdf)}
                            download={fileName(doc.pdf)}
                        >
                            PDF
                        </a>
                        <CopyButton text={url(doc.pdf)} label="Copy link" />
                    </div>
                    {doc.note && <p className="doc-note">{doc.note}</p>}
                    {doc.covering && (
                        <div className="field">
                            <div className="row">
                                <h3>To send with it</h3>
                                <CopyButton text={doc.covering} label="Copy" />
                            </div>
                            <pre className="text">{doc.covering}</pre>
                        </div>
                    )}
                </section>
            ))}
        </>
    );
}
