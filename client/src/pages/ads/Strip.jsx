import { useEffect, useRef, useState } from "react";

// A row of frames. On a phone it snaps one frame at a time and shows the dots Instagram
// would; on a wide screen it is a plain row at a fixed height.
export function Strip({ items, story = false, onOpen }) {
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
            <div className={story ? "strip story" : "strip"} ref={ref}>
                {items.map((it, i) => (
                    <figure key={it.url}>
                        <img
                            crossOrigin="anonymous"
                            src={it.url}
                            alt={it.alt || ""}
                            loading="lazy"
                            onClick={() => onOpen && onOpen(i)}
                        />
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
