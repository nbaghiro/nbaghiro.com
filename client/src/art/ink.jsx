import { useEffect, useState } from "react";

/**
 * The drawing language the five options share: deterministic path math and the few marks
 * every scene uses. Nothing here is random at render time, so a scene draws identically on
 * every reload and the geometry can be reasoned about. Lengths are user units inside each
 * scene's own viewBox.
 */

// Paths are strings, so a path's numbers are rounded once rather than carrying float noise.
function f(n) {
    return Math.round(n * 100) / 100;
}

// A small integer generator, so a scene can be irregular the way a drawn line is without
// being different on the next render.
export function seeded(seed) {
    let s = seed >>> 0 || 1;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

// Catmull-Rom through the points, written as cubics: the one curve builder every scene
// uses, so a ridge, a wave and a frond are all the same kind of line.
export function smooth(pts, tension = 1) {
    if (pts.length < 2) return "";
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i += 1) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const k = tension / 6;
        const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
        const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
        d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
}

/**
 * One undulating line. `amp` and `len` are the swell; a second, shorter wave rides on it so
 * the result is not a clean sine, and `jitter` lifts each sample off it by a hair, which is
 * what reads as a hand rather than a plotter.
 */
export function swell({
    from = 0,
    to = 1440,
    y,
    amp,
    len,
    phase = 0,
    step = 26,
    jitter = 0,
    rand,
}) {
    const pts = [];
    for (let x = from; x <= to + step / 2; x += step) {
        const t = Math.min(x, to);
        const a = Math.sin(phase + (t / len) * Math.PI * 2) * amp;
        const b =
            Math.sin(phase * 1.7 + (t / (len * 0.37)) * Math.PI * 2) *
            amp *
            0.3;
        const n = jitter && rand ? (rand() - 0.5) * jitter : 0;
        pts.push([t, y + a + b + n]);
    }
    return smooth(pts);
}

/**
 * A field of water: lines that crowd towards the horizon and open up as they come forward,
 * each with its own phase, amplitude and drift timing. Returns what a scene needs to draw
 * and animate them, never DOM, so a scene decides how they are strung together.
 */
export function water({ w, top, bottom, rows, seed = 7, ampAt, lenAt }) {
    const rand = seeded(seed);
    const lines = [];
    for (let i = 0; i < rows; i += 1) {
        const t = i / (rows - 1);
        // squared, so the rows bunch up at the horizon and spread out in the foreground
        const y = top + (bottom - top) * t * t;
        const amp = (ampAt ? ampAt(t) : 1.2 + t * 5.6) * (0.55 + rand() * 0.95);
        const len = (lenAt ? lenAt(t) : 170 + t * 430) * (0.75 + rand() * 0.6);
        const phase = rand() * Math.PI * 2;
        // Each row is a run of strokes rather than one line across: long and nearly
        // closed up at the horizon, short with open water between them in front. That
        // break is the difference between an ocean and a hatched rectangle.
        const segs = [];
        let x = -30 - rand() * 70;
        while (x < w + 8) {
            const run = w * (0.5 - t * 0.3) * (0.4 + rand() * 1.6);
            const end = Math.min(w + 26, x + run);
            if (end - x > 26) segs.push([x, end]);
            x = end + (6 + rand() * 90) * (0.22 + t);
        }
        lines.push({
            key: i,
            d: segs
                .map(([a, b]) =>
                    swell({
                        from: a,
                        to: b,
                        y,
                        amp,
                        len,
                        phase,
                        step: 18 + t * 18,
                        jitter: 0.4 + t * 1.5,
                        rand,
                    })
                )
                .join(" "),
            // the far rows are hairlines and nearly still; the near ones carry the movement
            width: f(0.8 + t * 0.75),
            fade: f(Math.min(0.92, (0.34 + t * 0.52) * (0.75 + rand() * 0.5))),
            drift: f(16 + rand() * 16),
            delay: f(-rand() * 20),
            shift: f(3 + t * 9),
        });
    }
    return lines;
}

/**
 * A fir, drawn the way one is drawn in ink: a silhouette that steps out and back down the
 * left side, crosses the foot, and steps back up the right, so the tiers read as boughs
 * rather than as arms on a stick. Returns the outline and the few inner strokes that give
 * it weight at the front of a scene.
 */
export function fir({ x, base, h, tiers = 7, spread = 0.3, seed = 1 }) {
    const rand = seeded(seed);
    const tip = base - h;
    const half = h * spread * 0.5;
    const left = [];
    const right = [];
    for (let i = 1; i <= tiers; i += 1) {
        const t = i / tiers;
        const y = tip + h * Math.pow(t, 1.04) * 0.93;
        const w = half * Math.pow(t, 1.15) * (0.88 + rand() * 0.24);
        const droop = h * 0.028;
        left.push([x - w, y + droop], [x - w * 0.34, y + droop * 0.4]);
        right.push([x + w, y + droop], [x + w * 0.34, y + droop * 0.4]);
    }
    const foot = base;
    const d = [
        `M${f(x)} ${f(tip)}`,
        ...left.map((p) => `L${f(p[0])} ${f(p[1])}`),
        `L${f(x - half * 0.26)} ${f(foot)}`,
        `L${f(x + half * 0.26)} ${f(foot)}`,
        ...right.reverse().map((p) => `L${f(p[0])} ${f(p[1])}`),
        "Z",
    ].join(" ");
    const inner = [];
    for (let i = 2; i < tiers; i += 2) {
        const t = i / tiers;
        const y = tip + h * t * 0.93;
        const w = half * Math.pow(t, 1.15) * 0.62;
        inner.push(
            `M${f(x)} ${f(y - h * 0.03)} L${f(x - w)} ${f(y + h * 0.01)}`
        );
        inner.push(
            `M${f(x)} ${f(y - h * 0.03)} L${f(x + w)} ${f(y + h * 0.01)}`
        );
    }
    return {
        d,
        inner: inner.join(" "),
        trunk: `M${f(x)} ${f(base)} v${f(h * 0.07)}`,
    };
}

// A round-headed tree: a scalloped edge around a soft loop, the way foliage is drawn beside
// an elevation for scale.
export function canopy({ x, y, rx, ry, scallops = 13, seed = 1 }) {
    const rand = seeded(seed);
    const parts = [];
    for (let i = 0; i < scallops; i += 1) {
        const a0 = (i / scallops) * Math.PI * 2;
        const a1 = ((i + 1) / scallops) * Math.PI * 2;
        const k = 0.94 + rand() * 0.14;
        const p0 = [x + Math.cos(a0) * rx * k, y + Math.sin(a0) * ry * k];
        const p1 = [x + Math.cos(a1) * rx * k, y + Math.sin(a1) * ry * k];
        const am = (a0 + a1) / 2;
        const bulge = 1.3 + rand() * 0.2;
        const c = [
            x + Math.cos(am) * rx * k * bulge,
            y + Math.sin(am) * ry * k * bulge,
        ];
        parts.push(
            `${i === 0 ? `M${f(p0[0])} ${f(p0[1])} ` : ""}Q${f(c[0])} ${f(c[1])} ${f(p1[0])} ${f(p1[1])}`
        );
    }
    return parts.join(" ");
}

// Broken water under a light: short dashes on the swell, shortest at the far edge.
export function reflection({ cx, top, bottom, rows, spread, seed = 11 }) {
    const rand = seeded(seed);
    const out = [];
    for (let i = 0; i < rows; i += 1) {
        const t = i / (rows - 1);
        const y = top + (bottom - top) * t * t;
        const half = spread * (0.18 + t * 0.9);
        const n = 1 + Math.round(t * 3);
        for (let j = 0; j < n; j += 1) {
            const k = n === 1 ? 0 : j / (n - 1) - 0.5;
            const x = cx + k * half * 1.7 + (rand() - 0.5) * 12;
            const len = 8 + t * 26 + rand() * 14;
            out.push({
                key: `${i}-${j}`,
                x1: f(x - len / 2),
                x2: f(x + len / 2),
                y: f(y),
                fade: f(0.75 - t * 0.3),
                drift: f(9 + rand() * 9),
                delay: f(-rand() * 12),
            });
        }
    }
    return out;
}

// A low sun: the disc, a ring of measured ticks around it, and the gaps where the water
// crosses it, which is what keeps it sitting in the scene rather than on top of it.
export function rays({
    cx,
    cy,
    r,
    count,
    from = 0,
    to = Math.PI * 2,
    inner = 1.25,
    outer = 1.5,
}) {
    const out = [];
    for (let i = 0; i < count; i += 1) {
        const a = from + ((to - from) * i) / count;
        out.push({
            key: i,
            x1: f(cx + Math.cos(a) * r * inner),
            y1: f(cy + Math.sin(a) * r * inner),
            x2: f(cx + Math.cos(a) * r * outer),
            y2: f(cy + Math.sin(a) * r * outer),
        });
    }
    return out;
}

// A bird, drawn as the two strokes it takes: a shallow V with lifted tips, centred on 0,0
// so the group around it carries the flight.
export const BIRD =
    "M-9 0.6 C-6.4 -3.4 -3.4 -4.6 0 -0.9 C3.4 -4.6 6.4 -3.4 9 0.6";

export function Bird({ x, y, s = 1, flap = 0, className = "ink-bird" }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                className={className}
                d={BIRD}
                style={flap ? { "--flap": `${flap}s` } : undefined}
            />
        </g>
    );
}

// Registration marks at the corners, the same ones the article plates carry.
export function Marks({ w, h, c = 11, className = "ink-marks" }) {
    return (
        <path
            className={className}
            d={`M0 ${c} V0 H${c} M${w - c} 0 H${w} V${c} M${w} ${h - c} V${h} H${w - c} M${c} ${h} H0 V${h - c}`}
        />
    );
}

// A measured rule: a line with every fifth tick longer, read left to right.
export function Rule({ w, y, pitch = 14, from = 0, className = "ink-rule" }) {
    const ticks = [];
    for (let x = from, i = 0; x <= w; x += pitch, i += 1) {
        ticks.push(
            <line
                key={x}
                x1={f(x)}
                y1={y}
                x2={f(x)}
                y2={y + (i % 5 === 0 ? 6 : 3)}
            />
        );
    }
    return (
        <g className={className}>
            <line x1={from} y1={y} x2={w} y2={y} />
            {ticks}
        </g>
    );
}

// Hatching inside a band, the drafting way of saying solid ground.
export function hatch({ x, y, w, h, pitch = 9, lean = 0.6 }) {
    const out = [];
    for (let i = -h; i < w; i += pitch) {
        const x1 = x + i;
        out.push(`M${f(x1)} ${f(y + h)} L${f(x1 + h * lean)} ${f(y)}`);
    }
    return out.join(" ");
}

// The scenes are drawn twice, because a 1440-unit landscape squeezed into a phone is a
// 90-unit-tall ribbon. Each one keeps a second set of numbers for the narrow frame.
export function useNarrow(query = "(max-width: 700px)") {
    const [narrow, setNarrow] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia(query);
        const sync = () => setNarrow(mq.matches);
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, [query]);
    return narrow;
}
