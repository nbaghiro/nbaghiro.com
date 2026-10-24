import { useEffect, useRef } from "react";
import { DownloadButton, ShareButton } from "./actions";

// One frame per screen over everything, swiped between on a phone and arrowed on a
// keyboard; it moves only within the set it was opened from.
export function Lightbox({ items, index, onIndex, onClose, title, arrange }) {
    const track = useRef(null);
    const cur = items[index];

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") go(index - 1);
            if (e.key === "ArrowRight") go(index + 1);
        };
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    });

    // land on the opened frame before the first paint, then follow index changes
    useEffect(() => {
        const el = track.current;
        if (!el) return;
        const target = el.clientWidth * index;
        if (Math.abs(el.scrollLeft - target) > el.clientWidth / 2) {
            el.scrollTo({ left: target, behavior: "auto" });
        }
    }, [index]);

    const go = (i) => {
        const el = track.current;
        if (!el || i < 0 || i >= items.length) return;
        el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
    };
    const onScroll = () => {
        const el = track.current;
        const i = Math.round(el.scrollLeft / el.clientWidth);
        if (i !== index && i >= 0 && i < items.length) onIndex(i);
    };

    if (!cur) return null;
    return (
        <div className="lb" role="dialog" aria-label={title}>
            <div className="lb-track" ref={track} onScroll={onScroll}>
                {items.map((it) => (
                    <div
                        className={`lb-item${it.off ? " off" : ""}`}
                        key={it.url}
                    >
                        <img
                            crossOrigin="anonymous"
                            src={it.url}
                            alt={it.alt || ""}
                        />
                    </div>
                ))}
            </div>
            {cur.alt && <p className="lb-alt">{cur.alt}</p>}
            <div className="lb-bar">
                <span className="title">
                    {title}, {index + 1} of {items.length}
                    {arrange && cur.off && " · left out"}
                    {arrange && !cur.off && cur.at ? ` · uploads ${cur.at}` : ""}
                </span>
                {arrange && (
                    <>
                        <button
                            type="button"
                            className="btn"
                            disabled={index === 0}
                            aria-label="Move earlier"
                            onClick={() => arrange.onMove(index, -1)}
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            className="btn"
                            disabled={index === items.length - 1}
                            aria-label="Move later"
                            onClick={() => arrange.onMove(index, 1)}
                        >
                            ›
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => arrange.onToggle(index)}
                        >
                            {cur.off ? "Bring back" : "Leave out"}
                        </button>
                    </>
                )}
                <ShareButton
                    label="Save to Photos"
                    items={() => [{ url: cur.url, name: cur.name }]}
                />
                <DownloadButton url={cur.url} name={cur.name} />
                <button type="button" className="btn" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}
