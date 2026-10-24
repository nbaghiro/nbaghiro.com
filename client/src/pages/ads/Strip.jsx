import { useEffect, useRef, useState } from "react";

// A row of frames. On a phone it snaps one frame at a time and shows the dots Instagram
// would; on a wide screen it is a plain row at a fixed height. `small` is the overview
// size: every frame of a set in view at once, each at its own shape; `pair` is the same for
// two frames of one thing, which are the same picture in different shapes.
export function Strip({
    items,
    story = false,
    small = false,
    pair = false,
    onOpen,
    arrange,
}) {
    const ref = useRef(null);
    const [active, setActive] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const onScroll = () => {
            const first = el.firstElementChild;
            if (!first) return;
            setActive(Math.round(el.scrollLeft / (first.offsetWidth + 10)));
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, [items.length]);

    return (
        <div>
            <div
                className={[
                    "strip",
                    story && "story",
                    small && "small",
                    pair && "pair",
                ]
                    .filter(Boolean)
                    .join(" ")}
                ref={ref}
            >
                {items.map((it, i) => (
                    <figure
                        key={it.url}
                        className={arrange && it.off ? "off" : undefined}
                    >
                        <img
                            crossOrigin="anonymous"
                            src={it.url}
                            alt={it.alt || ""}
                            loading="lazy"
                            onClick={() => onOpen && onOpen(i)}
                        />
                        {arrange && (
                            <div className="arrange">
                                <button
                                    type="button"
                                    aria-label={`Move ${i + 1} earlier`}
                                    disabled={i === 0}
                                    onClick={() => arrange.onMove(i, -1)}
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    className="pick"
                                    aria-pressed={!it.off}
                                    aria-label={
                                        it.off
                                            ? `Include page ${i + 1}`
                                            : `Leave page ${i + 1} out`
                                    }
                                    onClick={() => arrange.onToggle(i)}
                                >
                                    {it.off ? "Out" : String(it.at)}
                                </button>
                                <button
                                    type="button"
                                    aria-label={`Move ${i + 1} later`}
                                    disabled={i === items.length - 1}
                                    onClick={() => arrange.onMove(i, 1)}
                                >
                                    ›
                                </button>
                            </div>
                        )}
                        {it.label && <figcaption>{it.label}</figcaption>}
                    </figure>
                ))}
            </div>
            {items.length > 1 && (
                <div className="dots" aria-hidden="true">
                    {items.map((it, i) => (
                        <span
                            key={it.url}
                            className={i === active ? "on" : ""}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
