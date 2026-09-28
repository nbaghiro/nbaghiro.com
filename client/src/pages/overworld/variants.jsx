/**
 * Design variants of the overworld, selected with ?v1 ... ?v5 (or ?v=3).
 * Each variant can move home and the islands (`home`, `layout`), draw its own
 * scene behind them (`Art`, in stage coordinates) and choose how home
 * connects to them (`paths`). The default scene has no query parameter.
 */

import { HOME, PROJECTS, STAGE } from "../../data/projects";

const W = STAGE.width;
const H = STAGE.height;

function seeded(seed) {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

function Svg({ children, className }) {
    return (
        <svg className={`variant-art ${className || ""}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {children}
        </svg>
    );
}

/* ---------- Shared flow-field drawing (Currents, River, Vortex) ---------- */

// Obstacles sit where home and each island are, so lines bend around them
function obstaclesFor(home, places) {
    return [{ x: home.x, y: home.y, r: 130 }, ...places.map((p) => ({ x: p.x, y: p.y + 30, r: 78 }))];
}

// Adds a swirl around each obstacle and a push away from its edge
function aroundObstacles(vx, vy, x, y, obstacles, swirlStrength) {
    for (const o of obstacles) {
        const dx = x - o.x;
        const dy = y - o.y;
        const d = Math.hypot(dx, dy) || 1;
        const swirl = Math.exp(-((d - o.r) ** 2) / (2 * 70 * 70)) * swirlStrength;
        const push = Math.max(0, (o.r + 30 - d) / o.r) * 2;
        vx += (-dy / d) * swirl + (dx / d) * push;
        vy += (dx / d) * swirl + (dy / d) * push;
    }
    const len = Math.hypot(vx, vy) || 1;
    return [vx / len, vy / len];
}

function traceStreamlines(flow, obstacles, { spacing = 46, steps = 40, seed = 29 } = {}) {
    const blocked = (x, y) =>
        x < -20 || y < -20 || x > W + 20 || y > H + 20 || obstacles.some((o) => Math.hypot(x - o.x, y - o.y) < o.r - 10);
    const rand = seeded(seed);
    const lines = [];
    for (let gy = 20; gy < H; gy += spacing) {
        for (let gx = 20; gx < W; gx += spacing) {
            const sx = gx + (rand() - 0.5) * spacing * 0.65;
            const sy = gy + (rand() - 0.5) * spacing * 0.65;
            if (blocked(sx, sy)) continue;
            const trace = (dir) => {
                const pts = [];
                let [x, y] = [sx, sy];
                for (let k = 0; k < steps && !blocked(x, y); k++) {
                    const [vx, vy] = flow(x, y);
                    x += vx * 6 * dir;
                    y += vy * 6 * dir;
                    pts.push([x, y]);
                }
                return pts;
            };
            const pts = [...trace(-1).reverse(), [sx, sy], ...trace(1)];
            if (pts.length > 12) lines.push("M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L"));
        }
    }
    return lines;
}

// Faint lines, with light travelling along every third one
function FlowArt({ lines, className }) {
    const rand = seeded(5);
    return (
        <Svg className={`flow ${className || ""}`}>
            {lines.map((d, i) => (
                <path key={i} d={d} vectorEffect="non-scaling-stroke" />
            ))}
            <g className="flow-light">
                {lines
                    .filter((_, i) => i % 3 === 0)
                    .map((d, i) => (
                        <path key={i} d={d} vectorEffect="non-scaling-stroke" style={{ animationDuration: `${7 + rand() * 7}s`, animationDelay: `${-rand() * 10}s` }} />
                    ))}
            </g>
        </Svg>
    );
}

const flowCache = {};
function cachedLines(key, make) {
    if (!flowCache[key]) flowCache[key] = make();
    return flowCache[key];
}

/* ---------- v4 Currents: a flow field bending around the islands ---------- */

function Currents({ places, home }) {
    const lines = cachedLines("currents", () => {
        const obstacles = obstaclesFor(home, places);
        const flow = (x, y) => {
            const base = 0.9 * Math.sin(x / 190 + Math.cos(y / 150)) + 0.6 * Math.cos(y / 120 - x / 260);
            return aroundObstacles(Math.cos(base), Math.sin(base) * 0.7, x, y, obstacles, 1.4);
        };
        return traceStreamlines(flow, obstacles);
    });
    return <FlowArt lines={lines} />;
}

/* ---------- v1 River: home upstream on the left, projects downstream ---------- */

const RIVER_HOME = { x: 190, y: 390 };
const RIVER_ORDER = ["galleo", "branchpad", "flowmaestro", "lumischool", "llamatrade", "clientbridge", "sourcewell"];
const riverLayout = Object.fromEntries(
    RIVER_ORDER.map((id, i) => [id, { x: 450 + i * 140, y: i % 2 ? 560 : 230 + (i === 6 ? 30 : 0) }])
);

function River({ places, home }) {
    const lines = cachedLines("river", () => {
        const obstacles = obstaclesFor(home, places);
        const flow = (x, y) => aroundObstacles(1, 0.5 * Math.cos(x / 160 + y / 300) + 0.25 * Math.sin(y / 90), x, y, obstacles, 0.7);
        return traceStreamlines(flow, obstacles, { spacing: 40, steps: 55, seed: 41 });
    });
    return <FlowArt lines={lines} className="river" />;
}

/* ---------- v2 Vortex: projects on a golden-angle spiral, flow curling in ---------- */

const vortexLayout = Object.fromEntries(
    PROJECTS.map((p, i) => {
        const r = 250 + 44 * i;
        const t = ((-130 + i * 137.5) * Math.PI) / 180;
        return [p.id, { x: HOME.x + r * 1.25 * Math.cos(t), y: HOME.y + r * 0.74 * Math.sin(t) - 20 }];
    })
);

function Vortex({ places, home }) {
    const lines = cachedLines("vortex", () => {
        const obstacles = obstaclesFor(home, places);
        const flow = (x, y) => {
            const dx = (x - home.x) / 1.25;
            const dy = (y - home.y) / 0.74;
            const d = Math.hypot(dx, dy) || 1;
            // Mostly around home, a little inward: a slow spiral
            const vx = (-dy / d) * 1.25 - (dx / d) * 0.32;
            const vy = (dx / d) * 0.74 - (dy / d) * 0.24;
            return aroundObstacles(vx, vy, x, y, obstacles.slice(1), 0.6);
        };
        return traceStreamlines(flow, obstacles, { spacing: 44, steps: 60, seed: 13 });
    });
    return <FlowArt lines={lines} className="vortex" />;
}

/* ---------- v3 Ripples: projects on a ring, each sending out slow ripples ---------- */

const rippleLayout = Object.fromEntries(
    PROJECTS.map((p, i) => {
        const t = ((-90 + (i * 360) / PROJECTS.length) * Math.PI) / 180;
        return [p.id, { x: HOME.x + 500 * Math.cos(t), y: HOME.y + 300 * Math.sin(t) - 20 }];
    })
);

const pct = (v, total) => `${(v / total) * 100}%`;

function Ripples({ places, home }) {
    const sources = [
        { id: "home", x: home.x, y: home.y, color: "#EDEAE2", size: 300 },
        ...places.map((p) => ({ id: p.id, x: p.x, y: p.y + 66, color: p.color, size: 170 })),
    ];
    return (
        <div className="ripples" aria-hidden="true">
            {sources.map((s, i) =>
                [0, 1, 2].map((k) => (
                    <span
                        key={`${s.id}-${k}`}
                        className="ripple"
                        style={{
                            left: pct(s.x, W),
                            top: pct(s.y, H),
                            width: s.size,
                            height: s.size * 0.36,
                            borderColor: s.color,
                            animationDelay: `${-(k * 2.4 + i * 0.9)}s`,
                        }}
                    />
                ))
            )}
        </div>
    );
}

/* ---------- v5 Field lines: home on the left, projects fanned on an arc ---------- */

const FIELD_HOME = { x: 300, y: HOME.y };
// A fan in two staggered columns, bowing out toward the middle
const fieldLayout = Object.fromEntries(
    PROJECTS.map((p, i) => {
        const fromMiddle = Math.abs(i - 3);
        const x = i % 2 === 0 ? 1180 - fromMiddle * 70 : 880 - fromMiddle * 50;
        return [p.id, { x, y: 90 + i * 100 }];
    })
);

function FieldLines({ places, home }) {
    const bundles = places.map((p) => {
        const to = { x: p.x, y: p.y };
        const nx = -(to.y - home.y);
        const ny = to.x - home.x;
        const n = Math.hypot(nx, ny) || 1;
        return [-3, -2, -1, 0, 1, 2, 3].map((k) => {
            const mid = { x: (home.x + to.x) / 2 + (nx / n) * k * 34, y: (home.y + to.y) / 2 + (ny / n) * k * 34 };
            return { d: `M${home.x} ${home.y} Q${mid.x} ${mid.y} ${to.x} ${to.y}`, k, color: p.color, id: p.id };
        });
    });
    // Open lines leaving home to the left, like the far side of a magnet
    const open = Array.from({ length: 9 }, (_, i) => {
        const a = ((140 + i * 10) * Math.PI) / 180;
        const end = { x: home.x + Math.cos(a) * 520, y: home.y + Math.sin(a) * 520 };
        const ctrl = { x: home.x + Math.cos(a) * 200, y: home.y + Math.sin(a) * 90 };
        return `M${home.x} ${home.y} Q${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`;
    });
    return (
        <Svg className="field">
            {open.map((d, i) => (
                <path key={`o-${i}`} d={d} className="field-open" vectorEffect="non-scaling-stroke" />
            ))}
            {bundles.flat().map((l) => (
                <path key={`${l.id}-${l.k}`} d={l.d} opacity={0.3 - Math.abs(l.k) * 0.07} vectorEffect="non-scaling-stroke" />
            ))}
            <g className="field-pulses">
                {bundles.map((b, i) => (
                    <path key={b[3].id} d={b[3].d} stroke={b[3].color} vectorEffect="non-scaling-stroke" style={{ animationDelay: `${-i * 1.1}s` }} />
                ))}
            </g>
        </Svg>
    );
}

export const VARIANTS = [
    { id: "default", label: "Current" },
    { id: "v1", label: "River", Art: River, home: RIVER_HOME, layout: riverLayout, paths: "chain", className: "variant-v1 bubble-below" },
    { id: "v2", label: "Vortex", Art: Vortex, layout: vortexLayout, paths: "none", className: "variant-v2 bubble-below" },
    { id: "v3", label: "Ripples", Art: Ripples, layout: rippleLayout, paths: "none", className: "variant-v3 bubble-below" },
    { id: "v4", label: "Currents", Art: Currents, paths: "none", className: "variant-v4" },
    { id: "v5", label: "Field lines", Art: FieldLines, home: FIELD_HOME, layout: fieldLayout, paths: "none", className: "variant-v5" },
];

export function getVariant(search) {
    const params = new URLSearchParams(search);
    const id = params.get("v") ? `v${params.get("v")}` : VARIANTS.find((v) => params.has(v.id))?.id;
    return VARIANTS.find((v) => v.id === id) || VARIANTS[0];
}

export function placeProjects(variant) {
    return PROJECTS.map((p) => ({ ...p, ...(variant.layout?.[p.id] || {}) }));
}
