import { useEffect, useRef, useState } from "react";

/**
 * The language every figure is drawn in: a plate with registration marks at its corners, a
 * measured rule and a line of ground along its foot, bars standing in for lines of text.
 * Kept apart from the figures themselves so a post's own module can import it without the
 * two files importing each other.
 */

export const WIDE = 820;
export const NARROW = 336;

// A delay, as the custom property the stylesheet reads.
export function at(d) {
    return { "--d": `${d}s` };
}

// Ground: one soft contour across the foot of the plate, well clear of the type.
export function contour(w, y, amp) {
    const s = w / 4;
    return [
        `M-14 ${y}`,
        `C ${s * 0.7} ${y - amp}, ${s * 1.3} ${y + amp * 0.7}, ${s * 2} ${y - amp * 0.35}`,
        `S ${s * 3.3} ${y + amp * 0.9}, ${w + 14} ${y - amp * 0.6}`,
    ].join(" ");
}

export function Plate({ w, h, ground, children }) {
    const ticks = [];
    for (let x = 0, i = 0; x <= w; x += 14, i += 1) {
        ticks.push(
            <line
                key={x}
                x1={x}
                y1={h - 12}
                x2={x}
                y2={h - 12 + (i % 5 === 0 ? 6 : 3)}
            />
        );
    }
    const c = 9;
    return (
        <>
            <g className="fig-ground">
                {ground.map((g) => (
                    <path key={g.y} d={contour(w, g.y, g.amp)} />
                ))}
            </g>
            {children}
            <g className="fig-plate">
                <path
                    d={`M0 ${c} V0 H${c} M${w - c} 0 H${w} V${c} M${w} ${h - c} V${h} H${w - c} M${c} ${h} H0 V${h - c}`}
                />
            </g>
            <g className="fig-foot">
                <line x1="0" y1={h - 12} x2={w} y2={h - 12} />
                {ticks}
            </g>
        </>
    );
}

// The frame a figure draws into: the plate inset from the edges, so nothing is clipped.
export function frame(w, h) {
    return `-14 -10 ${w + 28} ${h + 20}`;
}

// Bars that stand in for lines of text, and a block that stands in for a picture.
export function Lines({ x, y, w, n, pitch, quiet }) {
    return (
        <g className={quiet ? "fig-bars quiet" : "fig-bars"}>
            {Array.from({ length: n }, (_, i) => (
                <line
                    key={i}
                    x1={x}
                    y1={y + i * pitch}
                    x2={x + (i === n - 1 ? w * 0.52 : w)}
                    y2={y + i * pitch}
                />
            ))}
        </g>
    );
}

export function Pic({ x, y, w, h }) {
    return <rect className="fig-pic" x={x} y={y} width={w} height={h} rx="1" />;
}

export function useNarrow() {
    const [narrow, setNarrow] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 680px)");
        const sync = () => setNarrow(mq.matches);
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, []);
    return narrow;
}

/**
 * The animated figure plays once, when it is first scrolled to, and again on request. Its
 * resting state is its finished state, so the animation only delays what is already drawn:
 * a reader who never scrolls that far, or who has asked for less movement, sees the whole
 * diagram.
 */
export function useReveal() {
    const host = useRef(null);
    const [shown, setShown] = useState(false);
    useEffect(() => {
        const el = host.current;
        if (!el || typeof IntersectionObserver === "undefined")
            return undefined;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setShown(true);
                    io.disconnect();
                }
            },
            { threshold: 0.3 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return [host, shown];
}
