import { useEffect, useRef, useState } from "react";
import "./Figures.css";

/**
 * The diagrams for the written pieces, drawn in one language: a plate with registration
 * marks at its corners, a measured rule and a line of ground along its foot, boxes as ink
 * hairlines over a water wash. Inline SVG rather than files, so a figure inherits the
 * page's tokens and typefaces, lays itself out for the width it has, and can animate the
 * one thing a static picture cannot show, which is an order.
 *
 * Each figure is drawn at about the number of units it will be given pixels, so a label at
 * 12 units reads at 12 pixels; the phone layouts redraw at their own width rather than
 * scaling the wide one down, which would take the type with it.
 */

const WIDE = 820;
const NARROW = 336;

// A delay, as the custom property the stylesheet reads.
function at(d) {
    return { "--d": `${d}s` };
}

// Ground: one soft contour across the foot of the plate, well clear of the type.
function contour(w, y, amp) {
    const s = w / 4;
    return [
        `M-14 ${y}`,
        `C ${s * 0.7} ${y - amp}, ${s * 1.3} ${y + amp * 0.7}, ${s * 2} ${y - amp * 0.35}`,
        `S ${s * 3.3} ${y + amp * 0.9}, ${w + 14} ${y - amp * 0.6}`,
    ].join(" ");
}

function Plate({ w, h, ground, children }) {
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
function frame(w, h) {
    return `-14 -10 ${w + 28} ${h + 20}`;
}

// Bars that stand in for lines of text, and a block that stands in for a picture.
function Lines({ x, y, w, n, pitch, quiet }) {
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

function Pic({ x, y, w, h }) {
    return <rect className="fig-pic" x={x} y={y} width={w} height={h} rx="1" />;
}

function useNarrow() {
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
function useReveal() {
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

/* ---- the three passes ---- */

// A root with a wrapping text block and a fixed picture beside it, sized from the panel
// width rather than scaled into it, so the type is the same size in both layouts.
function layout(w) {
    const tw = Math.round((w - 60) * 0.58);
    return {
        root: { x: 14, y: 68, w: w - 28, h: 82 },
        text: { x: 26, y: 80, w: tw, h: 58 },
        card: { x: 44 + tw, y: 80, w: w - 70 - tw, h: 36 },
        lines: { x: 34, y: 93, w: tw - 18, n: 4, pitch: 11 },
    };
}

const PASSES = [
    {
        n: "1",
        title: "widths",
        sub: "parent to child",
        note: ["a parent is the only thing", "that knows the room there is"],
    },
    {
        n: "2",
        title: "heights",
        sub: "child to parent",
        note: [
            "a line of text has no height",
            "until it has been given a width",
        ],
    },
    {
        n: "3",
        title: "positions",
        sub: "parent to child",
        note: ["x and y come last, once", "both sizes are settled"],
    },
];

function Rail({ down, d }) {
    const head = down ? "M2 145 L6 153 L10 145" : "M2 75 L6 67 L10 75";
    return (
        <g className="fig-water">
            <line
                x1="6"
                y1={down ? 68 : 150}
                x2="6"
                y2={down ? 150 : 68}
                pathLength="100"
                data-anim="draw"
                style={at(d)}
            />
            <path d={head} data-anim="in" style={at(d + 0.34)} />
        </g>
    );
}

// Height unknown: the top edge is drawn, the sides run off into nothing, there is no floor.
function OpenBox({ b, depth, d }) {
    return (
        <g className="fig-ink" data-anim="in" style={at(d)}>
            <line x1={b.x} y1={b.y} x2={b.x + b.w} y2={b.y} />
            <path
                className="fig-open"
                d={`M${b.x} ${b.y} v${depth} M${b.x + b.w} ${b.y} v${depth}`}
            />
        </g>
    );
}

function Box({ b, d }) {
    return (
        <g data-anim="in" style={at(d)}>
            <rect
                className="fig-wash"
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
            />
            <rect
                className="fig-ink"
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
            />
        </g>
    );
}

function Across({ x, y, w, label, d }) {
    return (
        <g>
            <path
                className="fig-water"
                d={`M${x} ${y - 3} v6 M${x} ${y} H${x + w} M${x + w} ${y - 3} v6`}
                pathLength="100"
                data-anim="draw"
                style={at(d)}
            />
            <text
                className="fig-dim"
                x={x + w / 2}
                y={y + 15}
                data-anim="in"
                style={at(d + 0.12)}
            >
                {label}
            </text>
        </g>
    );
}

function Upward({ x, top, bottom, d }) {
    return (
        <g className="fig-water">
            <line
                x1={x}
                y1={bottom}
                x2={x}
                y2={top}
                pathLength="100"
                data-anim="draw"
                style={at(d)}
            />
            <path
                d={`M${x - 3.5} ${top + 6} L${x} ${top} L${x + 3.5} ${top + 6}`}
                data-anim="in"
                style={at(d + 0.22)}
            />
        </g>
    );
}

function Origin({ x, y, d }) {
    return (
        <g className="fig-water" data-anim="pop" style={at(d)}>
            <path d={`M${x - 5} ${y} h10 M${x} ${y - 5} v10`} />
            <circle className="fig-solid" cx={x} cy={y} r="1.7" />
        </g>
    );
}

// The ground line sits in the air a figure has left over, which is a different place in
// each layout, so both sets are written down rather than derived.
const PASS_GROUND = {
    wide: [{ y: 198, amp: 8 }],
    narrow: [
        { y: 204, amp: 7 },
        { y: 416, amp: 7 },
        { y: 624, amp: 7 },
    ],
};

function Pass({ w, step, base }) {
    const l = layout(w);
    const p = PASSES[step];
    const down = step !== 1;
    return (
        <g>
            <text
                className="fig-num"
                x="0"
                y="22"
                data-anim="in"
                style={at(base)}
            >
                {p.n}
            </text>
            <g data-anim="in" style={at(base + 0.04)}>
                <text className="fig-title" x="20" y="22">
                    {p.title}
                </text>
                <text className="fig-sub" x="20" y="40">
                    {p.sub}
                </text>
            </g>
            <Rail down={down} d={base + 0.1} />
            {step === 0 && (
                <>
                    <OpenBox b={l.root} depth={46} d={base + 0.2} />
                    <OpenBox b={l.text} depth={34} d={base + 0.3} />
                    <OpenBox b={l.card} depth={30} d={base + 0.38} />
                    <Across
                        x={l.text.x}
                        y={l.text.y + 17}
                        w={l.text.w}
                        label="grow"
                        d={base + 0.5}
                    />
                    <Across
                        x={l.card.x}
                        y={l.card.y + 17}
                        w={l.card.w}
                        label="fixed"
                        d={base + 0.6}
                    />
                </>
            )}
            {step === 1 && (
                <>
                    <Box b={l.text} d={base + 0.2} />
                    <g data-anim="in" style={at(base + 0.24)}>
                        <Lines {...l.lines} />
                    </g>
                    <Box b={l.card} d={base + 0.3} />
                    <g data-anim="in" style={at(base + 0.34)}>
                        <Pic
                            x={l.card.x + 7}
                            y={l.card.y + 7}
                            w={l.card.w - 14}
                            h={l.card.h - 14}
                        />
                    </g>
                    <Box b={l.root} d={base + 0.42} />
                    <Upward
                        x={l.text.x + l.text.w + 9}
                        top={l.text.y + 2}
                        bottom={l.text.y + l.text.h}
                        d={base + 0.26}
                    />
                    <Upward
                        x={l.root.x + l.root.w + 9}
                        top={l.root.y}
                        bottom={l.root.y + l.root.h}
                        d={base + 0.48}
                    />
                </>
            )}
            {step === 2 && (
                <>
                    <Box b={l.root} d={base + 0.18} />
                    <Box b={l.text} d={base + 0.18} />
                    <Box b={l.card} d={base + 0.18} />
                    <g data-anim="in" style={at(base + 0.2)}>
                        <Lines {...l.lines} quiet />
                        <Pic
                            x={l.card.x + 7}
                            y={l.card.y + 7}
                            w={l.card.w - 14}
                            h={l.card.h - 14}
                        />
                    </g>
                    <path
                        className="fig-water lead"
                        d={`M${l.root.x} ${l.card.y} H${l.card.x} M${l.card.x} ${l.root.y} V${l.card.y}`}
                        pathLength="100"
                        data-anim="draw"
                        style={at(base + 0.5)}
                    />
                    <Origin x={l.root.x} y={l.root.y} d={base + 0.3} />
                    <Origin x={l.text.x} y={l.text.y} d={base + 0.42} />
                    <Origin x={l.card.x} y={l.card.y} d={base + 0.54} />
                    <text
                        className="fig-dim"
                        x={l.root.x + 12}
                        y={l.root.y - 8}
                        data-anim="in"
                        style={at(base + 0.62)}
                    >
                        x, y
                    </text>
                </>
            )}
            <text
                className="fig-note"
                x="0"
                y="174"
                data-anim="in"
                style={at(base + 0.72)}
            >
                {p.note[0]}
                <tspan x="0" dy="15">
                    {p.note[1]}
                </tspan>
            </text>
        </g>
    );
}

export function ThreePasses() {
    const narrow = useNarrow();
    const [host, shown] = useReveal();
    const [run, setRun] = useState(0);
    const w = narrow ? NARROW : 250;
    const pitch = narrow ? 212 : 285;
    const box = narrow ? { w: NARROW, h: 650 } : { w: WIDE, h: 222 };
    return (
        <div className="fig-host" ref={host}>
            <svg
                key={run}
                className={shown ? "fig playing" : "fig"}
                viewBox={frame(box.w, box.h)}
                role="img"
                aria-label="The same three boxes resolved by three passes: widths parent to child, heights child to parent, then positions parent to child."
            >
                <Plate
                    w={box.w}
                    h={box.h}
                    ground={PASS_GROUND[narrow ? "narrow" : "wide"]}
                >
                    {[0, 1, 2].map((step) => (
                        <g
                            key={step}
                            transform={
                                narrow
                                    ? `translate(0 ${step * pitch})`
                                    : `translate(${step * pitch} 0)`
                            }
                        >
                            <Pass
                                w={w}
                                step={step}
                                base={+(step * 0.9).toFixed(2)}
                            />
                        </g>
                    ))}
                </Plate>
            </svg>
            <button
                type="button"
                className="fig-replay"
                onClick={() => {
                    setRun((n) => n + 1);
                }}
            >
                Play the passes again
            </button>
        </div>
    );
}

/* ---- one tree, three formats ---- */

const PARTS = [
    { id: "heading", label: "heading" },
    { id: "paragraph", label: "paragraph" },
    { id: "picture", label: "picture" },
];

// The content, as a tree rather than as a page: a root and the three things in it.
function SourceTree({ x, y, w }) {
    const rowH = 30;
    const gap = 10;
    const h = 14 + PARTS.length * rowH + (PARTS.length - 1) * gap + 14;
    return (
        <g>
            <text className="fig-title sm" x={x} y={y - 26}>
                one artifact
            </text>
            <text className="fig-sub" x={x} y={y - 10}>
                three things, one tree
            </text>
            <rect className="fig-wash" x={x} y={y} width={w} height={h} />
            <rect className="fig-ink" x={x} y={y} width={w} height={h} />
            {PARTS.map((part, i) => {
                const ry = y + 14 + i * (rowH + gap);
                const gx = x + 14;
                return (
                    <g key={part.id}>
                        <rect
                            className="fig-mist"
                            x={x + 12}
                            y={ry}
                            width={w - 24}
                            height={rowH}
                        />
                        {part.id === "heading" && (
                            <rect
                                className="fig-solid"
                                x={gx}
                                y={ry + 13}
                                width="26"
                                height="4"
                            />
                        )}
                        {part.id === "paragraph" && (
                            <Lines x={gx} y={ry + 11} w={26} n={2} pitch={8} />
                        )}
                        {part.id === "picture" && (
                            <Pic x={gx} y={ry + 7} w={26} h={16} />
                        )}
                        <text className="fig-row" x={x + 52} y={ry + 19}>
                            {part.label}
                        </text>
                    </g>
                );
            })}
        </g>
    );
}

// The same three things, arranged the way each profile arranges them.
function Arrangement({ p, mode }) {
    const pad = Math.round(p.w * 0.05) + 5;
    const x = p.x + pad;
    const y = p.y + pad;
    const w = p.w - pad * 2;
    if (mode === "stack") {
        const pic = Math.round(w * 0.56);
        return (
            <>
                <rect
                    className="fig-solid"
                    x={x}
                    y={y}
                    width={w * 0.8}
                    height="4"
                />
                <Lines x={x} y={y + 16} w={w} n={3} pitch={9} />
                <Pic x={x} y={y + 44} w={w} h={pic} />
                <Lines x={x} y={y + 56 + pic} w={w} n={4} pitch={9} />
            </>
        );
    }
    if (mode === "band") {
        return (
            <>
                <rect
                    className="fig-solid"
                    x={x}
                    y={y}
                    width={w * 0.4}
                    height="4"
                />
                <Lines x={x} y={y + 18} w={w * 0.44} n={3} pitch={10} />
                <Pic
                    x={x + w * 0.56}
                    y={y + 12}
                    w={w * 0.44}
                    h={p.h - pad * 2 - 14}
                />
            </>
        );
    }
    const half = Math.round(w * 0.5);
    return (
        <>
            <rect
                className="fig-solid"
                x={x}
                y={y}
                width={w * 0.56}
                height="4"
            />
            <Lines x={x} y={y + 20} w={half - 8} n={4} pitch={10} />
            <Pic
                x={x + half + 8}
                y={y + 14}
                w={w - half - 8}
                h={p.h - pad * 2 - 14}
            />
        </>
    );
}

function FormatPlate({ p, note, labelY }) {
    // the site takes the width it is handed, which an arrow under the frame says better
    // than a frame running off the plate and being cut by it
    const open = p.mode === "band";
    const ay = p.y + p.h + 14;
    return (
        <g>
            <rect
                className="fig-wash"
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
            />
            <rect
                className="fig-ink"
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
            />
            {open && (
                <g className="fig-water">
                    <path
                        d={`M${p.x - 8} ${ay} H${p.x + p.w + 8} M${p.x - 8} ${ay} l6 -4 M${p.x - 8} ${ay} l6 4 M${p.x + p.w + 8} ${ay} l-6 -4 M${p.x + p.w + 8} ${ay} l-6 4`}
                    />
                </g>
            )}
            <Arrangement p={p} mode={p.mode} />
            <text className="fig-title sm" x={p.x} y={labelY}>
                {p.name}
            </text>
            <text className="fig-sub" x={p.x} y={labelY + 16}>
                {note}
            </text>
        </g>
    );
}

const FORMAT_PLATES = {
    wide: [
        { x: 300, y: 64, w: 196, h: 110, mode: "side", name: "deck" },
        { x: 530, y: 64, w: 108, h: 168, mode: "stack", name: "doc" },
        { x: 664, y: 64, w: 148, h: 98, mode: "band", name: "site" },
    ],
    narrow: [
        { x: 0, y: 290, w: 220, h: 124, mode: "side", name: "deck" },
        { x: 0, y: 472, w: 120, h: 188, mode: "stack", name: "doc" },
        { x: 0, y: 718, w: 190, h: 116, mode: "band", name: "site" },
    ],
};
const FORMAT_GROUND = {
    wide: [{ y: 288, amp: 9 }],
    narrow: [{ y: 890, amp: 9 }],
};

const FORMAT_NOTES = {
    deck: "1280 × 720, paged",
    doc: "a column 816 wide",
    site: "fills the width it is given",
};

export function ThreeFormats() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 920 } : { w: WIDE, h: 312 };
    const src = narrow ? { x: 0, y: 64, w: 230 } : { x: 0, y: 64, w: 210 };
    const plates = FORMAT_PLATES[narrow ? "narrow" : "wide"];
    const busX = 322;
    const busY = 40;
    const bus = narrow
        ? `M${src.w / 2} 206 V236 H${busX} V${plates[2].y + 20}`
        : `M${src.w + 10} 126 H250 M250 ${busY} V126 M250 ${busY} H${plates[2].x + 10}`;
    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="One artifact feeding three format profiles: a paged deck, a continuous document column, and a page that fills the width it is given."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={FORMAT_GROUND[narrow ? "narrow" : "wide"]}
            >
                <g className="fig-water fig-bus">
                    <path d={bus} />
                    {plates.map((p) => (
                        <path
                            key={p.name}
                            d={
                                narrow
                                    ? `M${busX} ${p.y + 20} H${p.x + p.w + 10}`
                                    : `M${p.x + 10} ${busY} V${p.y - 10}`
                            }
                        />
                    ))}
                </g>
                <text
                    className="fig-dim"
                    x={narrow ? 232 : 256}
                    y={narrow ? 230 : 32}
                >
                    one solver
                </text>
                <SourceTree x={src.x} y={src.y} w={src.w} />
                {plates.map((p) => (
                    <FormatPlate
                        key={p.name}
                        p={p}
                        note={FORMAT_NOTES[p.name]}
                        labelY={narrow ? p.y + p.h + 26 : 258}
                    />
                ))}
            </Plate>
        </svg>
    );
}

/* ---- one list, four backends ---- */

const KINDS = ["rect", "text", "text", "image", "rect", "surface"];
const REGIONS = ["section", "column", "chart"];
const SINKS = [
    { name: "DOM", note: "painted into elements" },
    { name: "2D canvas", note: "presenting, and PNG" },
    { name: "PDF", note: "vectors, fonts embedded" },
    { name: "PowerPoint", note: "shapes and real text boxes" },
];
const ROW = 19;
const STEP = 22;

const LIST_GROUND = {
    wide: [{ y: 360, amp: 9 }],
    narrow: [
        { y: 220, amp: 7 },
        { y: 496, amp: 7 },
    ],
};

function Stack({ x, y, w, rows, title, lead, command }) {
    return (
        <g>
            <text className="fig-title sm" x={x} y={y - 20}>
                {title}
            </text>
            <text className="fig-sub" x={x} y={y - 5}>
                {lead}
            </text>
            {rows.map((row, i) => (
                <g key={`${row}-${i}`}>
                    <rect
                        className="fig-wash"
                        x={x}
                        y={y + i * STEP}
                        width={w}
                        height={ROW}
                    />
                    <rect
                        className="fig-mist"
                        x={x}
                        y={y + i * STEP}
                        width={w}
                        height={ROW}
                    />
                    <rect
                        className={command ? "fig-solid" : "fig-chip"}
                        x={x}
                        y={y + i * STEP}
                        width="3"
                        height={ROW}
                    />
                    <text className="fig-row" x={x + 12} y={y + i * STEP + 13}>
                        {row}
                    </text>
                </g>
            ))}
        </g>
    );
}

function Sink({ s, dashed }) {
    return (
        <g>
            <rect
                className={dashed ? "fig-mist dash" : "fig-mist"}
                x={s.x}
                y={s.y}
                width={s.w}
                height="44"
            />
            <text className="fig-title sm" x={s.x + 12} y={s.y + 19}>
                {s.name}
            </text>
            <text className="fig-sub" x={s.x + 12} y={s.y + 34}>
                {s.note}
            </text>
        </g>
    );
}

export function CommandList() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 744 } : { w: WIDE, h: 384 };
    const cmd = narrow ? { x: 0, y: 64, w: 200 } : { x: 170, y: 62, w: 170 };
    const reg = narrow ? { x: 0, y: 540, w: 200 } : { x: 170, y: 258, w: 170 };
    const sinks = SINKS.map((s, i) =>
        narrow
            ? { ...s, x: 24, y: 240 + i * 62, w: 312 }
            : { ...s, x: 470, y: 40 + i * 62, w: 200 }
    );
    const hit = {
        name: "hit-testing",
        note: "selection, and dragging",
        ...(narrow ? { x: 24, y: 660, w: 312 } : { x: 470, y: 300, w: 200 }),
    };
    const tap = { x: cmd.x + cmd.w + 10, y: cmd.y + 60 };
    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="The layout returns commands in paint order and regions for every node with an id. Four backends consume the commands; hit-testing consumes the regions."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={LIST_GROUND[narrow ? "narrow" : "wide"]}
            >
                <g className="fig-water fig-bus">
                    {!narrow && (
                        <path
                            d={`M${cmd.x + cmd.w} ${cmd.y + 10} H${tap.x} V${cmd.y + KINDS.length * STEP - 14} M${tap.x} ${tap.y} H${tap.x + 14}`}
                        />
                    )}
                    {narrow && (
                        <path
                            d={`M100 ${cmd.y + KINDS.length * STEP} V208 H8 V${sinks[3].y + 22}`}
                        />
                    )}
                    {sinks.map((s) =>
                        narrow ? (
                            <path key={s.name} d={`M8 ${s.y + 22} H${s.x}`} />
                        ) : (
                            <path
                                key={s.name}
                                d={`M${tap.x + 14} ${tap.y} C ${tap.x + 60} ${tap.y}, ${s.x - 50} ${s.y + 22}, ${s.x - 6} ${s.y + 22}`}
                            />
                        )
                    )}
                </g>
                <g className="fig-mist fig-bus">
                    <path
                        d={
                            narrow
                                ? `M100 ${reg.y + REGIONS.length * STEP} V${hit.y - 28} H8 V${hit.y + 22} H${hit.x}`
                                : `M${reg.x + reg.w} ${reg.y + 30} H${reg.x + reg.w + 40} C ${reg.x + reg.w + 90} ${reg.y + 30}, ${hit.x - 50} ${hit.y + 22}, ${hit.x - 6} ${hit.y + 22}`
                        }
                    />
                </g>
                {!narrow && (
                    <>
                        <text className="fig-title sm" x="0" y="86">
                            one layout
                        </text>
                        <text className="fig-sub" x="0" y="102">
                            two arrays out
                        </text>
                        <path
                            className="fig-water"
                            d={`M0 120 H146 M140 116 L146 120 L140 124 M158 ${cmd.y} H152 V${reg.y + REGIONS.length * STEP - 3} H158`}
                        />
                    </>
                )}
                <Stack
                    {...cmd}
                    rows={KINDS}
                    title="commands"
                    lead="in paint order"
                    command
                />
                <Stack
                    {...reg}
                    rows={REGIONS}
                    title="regions"
                    lead="one box per node that carries an id"
                />
                {sinks.map((s) => (
                    <Sink key={s.name} s={s} />
                ))}
                <Sink s={hit} dashed />
            </Plate>
        </svg>
    );
}

/* ---- where to put the scissors ---- */

// The card's fill starts here, inside the flow, and the picture sits at the bottom of it.
const CARD_TOP = 86;
const CARD_H = 116;
const PIC_TOP = 130;

const CUT_PAGES = {
    wide: [
        { x: 320, y: 66, w: 230, h: 134, part: "first" },
        { x: 590, y: 66, w: 230, h: 134, part: "rest" },
    ],
    narrow: [
        { x: 0, y: 420, w: 160, h: 128, part: "first" },
        { x: 176, y: 420, w: 160, h: 128, part: "rest" },
    ],
};
const CUT_GROUND = {
    wide: [{ y: 356, amp: 9 }],
    narrow: [
        { y: 370, amp: 9 },
        { y: 630, amp: 9 },
    ],
};

function Flow({ x, y, w, cut }) {
    const pad = 10;
    const inner = w - pad * 2;
    return (
        <g>
            <rect className="fig-ink" x={x} y={y} width={w} height="238" />
            <rect
                className="fig-solid"
                x={x + pad}
                y={y + 14}
                width={inner * 0.6}
                height="4"
            />
            <Lines x={x + pad} y={y + 32} w={inner} n={4} pitch={11} />
            <rect
                className="fig-wash strong"
                x={x + pad}
                y={y + CARD_TOP}
                width={inner}
                height={CARD_H}
            />
            <rect
                className="fig-mist"
                x={x + pad}
                y={y + CARD_TOP}
                width={inner}
                height={CARD_H}
            />
            <Lines
                x={x + pad + 8}
                y={y + 100}
                w={inner - 16}
                n={2}
                pitch={11}
            />
            <Pic
                x={x + pad + 8}
                y={y + PIC_TOP}
                w={inner - 16}
                h={CARD_H - (PIC_TOP - CARD_TOP) - 8}
            />
            <Lines x={x + pad} y={y + 216} w={inner} n={2} pitch={11} />
            <g className="fig-water">
                <path className="cut" d={`M${x - 12} ${cut} H${x + w + 12}`} />
                <circle className="fig-solid" cx={x - 12} cy={cut} r="2" />
            </g>
        </g>
    );
}

// What each page gets. The card's fill runs to the window's edge instead of closing there,
// which is marked by the heavier water line where the fill meets the cut.
function PageOut({ p, part }) {
    const pad = 14;
    const inner = p.w - pad * 2;
    const x = p.x + pad;
    const first = part === "first";
    const fillTop = first ? p.y + CARD_TOP : p.y;
    const fillBottom = first ? p.y + p.h : p.y + 76;
    return (
        <g>
            <rect
                className="fig-ink"
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
            />
            <rect
                className="fig-wash strong"
                x={x}
                y={fillTop}
                width={inner}
                height={fillBottom - fillTop}
            />
            <path
                className="fig-mist"
                d={
                    first
                        ? `M${x} ${fillBottom} V${fillTop} H${x + inner} V${fillBottom}`
                        : `M${x} ${fillTop} V${fillBottom} H${x + inner} V${fillTop}`
                }
            />
            <line
                className="fig-seam"
                x1={x}
                y1={first ? p.y + p.h : p.y}
                x2={x + inner}
                y2={first ? p.y + p.h : p.y}
            />
            {first ? (
                <>
                    <rect
                        className="fig-solid"
                        x={x}
                        y={p.y + 14}
                        width={inner * 0.6}
                        height="4"
                    />
                    <Lines x={x} y={p.y + 32} w={inner} n={4} pitch={11} />
                    <Lines
                        x={x + 8}
                        y={p.y + 100}
                        w={inner - 16}
                        n={2}
                        pitch={11}
                    />
                </>
            ) : (
                <>
                    <Pic x={x + 8} y={p.y + 12} w={inner - 16} h={52} />
                    <Lines x={x} y={p.y + 96} w={inner} n={2} pitch={11} />
                </>
            )}
        </g>
    );
}

export function Fragment() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 660 } : { w: WIDE, h: 382 };
    const flow = narrow ? { x: 0, y: 66, w: 168 } : { x: 10, y: 66, w: 186 };
    // above the picture, which is the lowest edge in this flow that splits no command
    const cut = flow.y + PIC_TOP - 8;
    const pages = CUT_PAGES[narrow ? "narrow" : "wide"];
    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="One flow cut into two pages. The break lands above the picture that must not be split, and the card's own fill is clipped to each page's window rather than closing at the seam."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={CUT_GROUND[narrow ? "narrow" : "wide"]}
            >
                <text className="fig-title sm" x={flow.x} y={flow.y - 26}>
                    one flow
                </text>
                <text className="fig-sub" x={flow.x} y={flow.y - 10}>
                    taller than a page
                </text>
                <Flow {...flow} cut={cut} />
                <text className="fig-note" x={flow.x} y={flow.y + 266}>
                    the break is the lowest edge
                    <tspan x={flow.x} dy="15">
                        that splits no command
                    </tspan>
                </text>
                {!narrow && (
                    <path
                        className="fig-water"
                        d={`M${flow.x + flow.w + 26} 152 H304 M298 148 L304 152 L298 156`}
                    />
                )}
                {pages.map((p) => (
                    <PageOut key={p.part} p={p} part={p.part} />
                ))}
                <text
                    className="fig-title sm"
                    x={pages[0].x}
                    y={pages[0].y - 26}
                >
                    page one
                </text>
                <text className="fig-sub" x={pages[0].x} y={pages[0].y - 10}>
                    the fill runs to the window
                </text>
                <text
                    className="fig-title sm"
                    x={pages[1].x}
                    y={pages[1].y - 26}
                >
                    page two
                </text>
                <text className="fig-sub" x={pages[1].x} y={pages[1].y - 10}>
                    the picture arrives whole
                </text>
                <text
                    className="fig-note"
                    x={pages[0].x}
                    y={pages[0].y + pages[0].h + 36}
                >
                    a fill that spans its children is clipped
                    <tspan x={pages[0].x} dy="15">
                        to each window, never closed and reopened
                    </tspan>
                </text>
            </Plate>
        </svg>
    );
}

/* ---- what the browser's compositor was holding ---- */

const LAYERS = [
    { zoom: "0.084", mb: 216 },
    { zoom: "0.039", mb: 415 },
    { zoom: "0.0069", mb: 540, note: "the opening view" },
];
const LAYER_GROUND = {
    wide: [{ y: 286, amp: 9 }],
    narrow: [{ y: 582, amp: 8 }],
};

// One bar per measured zoom, on one scale, with the page's own total left to the bracket
// beside them rather than drawn at a second scale.
function Bar({ x, base, w, mb, zoom, note, tall }) {
    const h = Math.round((mb / 540) * tall);
    return (
        <g>
            <rect
                className="fig-wash strong"
                x={x}
                y={base - h}
                width={w}
                height={h}
            />
            <rect className="fig-ink" x={x} y={base - h} width={w} height={h} />
            <text
                className="fig-dim"
                x={x + w / 2}
                y={base - h - 9}
                textAnchor="middle"
            >
                {mb} MB
            </text>
            <text
                className="fig-row"
                x={x + w / 2}
                y={base + 17}
                textAnchor="middle"
            >
                zoom {zoom}
            </text>
            {note && (
                <text
                    className="fig-sub"
                    x={x + w / 2}
                    y={base + 32}
                    textAnchor="middle"
                >
                    {note}
                </text>
            )}
        </g>
    );
}

export function LayerMemory() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 620 } : { w: WIDE, h: 300 };
    const base = narrow ? 400 : 232;
    const tall = narrow ? 250 : 150;
    const w = narrow ? 64 : 76;
    const step = narrow ? 104 : 124;
    const x0 = narrow ? 6 : 40;
    const bx = narrow ? 0 : x0 + step * 2 + w + 54;
    const by = narrow ? base + 74 : base - tall;
    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="The backing store of one composited layer at three camera zooms: 216 MB, 415 MB and 540 MB, growing as the camera draws back."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={LAYER_GROUND[narrow ? "narrow" : "wide"]}
            >
                <text className="fig-title" x={x0} y={narrow ? 26 : 32}>
                    one layer, drawn back
                </text>
                <text className="fig-sub" x={x0} y={narrow ? 44 : 50}>
                    sized as if the map were at scale one
                </text>
                <line
                    className="fig-mist"
                    x1={narrow ? 0 : x0 - 6}
                    y1={base}
                    x2={narrow ? NARROW : bx - 18}
                    y2={base}
                />
                {LAYERS.map((l, i) => (
                    <Bar
                        key={l.zoom}
                        x={x0 + i * step}
                        base={base}
                        w={w}
                        mb={l.mb}
                        zoom={l.zoom}
                        note={l.note}
                        tall={tall}
                    />
                ))}
                {/* the page's total is a number rather than a fourth bar, since it is five times the scale */}
                <path
                    className="fig-water"
                    d={
                        narrow
                            ? `M${bx} ${by} h${NARROW - 20}`
                            : `M${bx} ${by} h10 v${tall} h-10`
                    }
                />
                <text
                    className="fig-title sm"
                    x={bx + 20}
                    y={by + (narrow ? 24 : 26)}
                >
                    × 71 layers
                </text>
                <text
                    className="fig-note"
                    x={bx + 20}
                    y={by + (narrow ? 44 : 46)}
                >
                    2,557 MB of them at the
                    <tspan x={bx + 20} dy="15">
                        opening view, with 27,089
                    </tspan>
                    <tspan x={bx + 20} dy="15">
                        elements and 500 MB of
                    </tspan>
                    <tspan x={bx + 20} dy="15">
                        heap above that
                    </tspan>
                </text>
                <text
                    className="fig-dim"
                    x={bx + 20}
                    y={by + (narrow ? 108 : 92)}
                >
                    iOS kills the tab at 2,048 MB
                </text>
            </Plate>
        </svg>
    );
}

/* ---- the five passes of a frame ---- */

const FRAME_PASSES = [
    {
        n: "1",
        title: "the paper grid",
        sub: "from a shader, one device pixel wide",
    },
    {
        n: "2",
        title: "the terrain tiles",
        sub: "masked by what the child has reached",
    },
    { n: "3", title: "the child's ink", sub: "roads walked, land known" },
    {
        n: "4",
        title: "every drawing in view",
        sub: "one instanced batch to a page",
    },
    {
        n: "5",
        title: "the plane and the token",
        sub: "the only things moving every frame",
    },
];
const FRAME_GROUND = {
    wide: [{ y: 300, amp: 9 }],
    narrow: [{ y: 610, amp: 8 }],
};

// The right-hand frame builds up in the same order as the rows, one pass to a delay.
function Built({ x, y, w, h, d }) {
    const grid = [];
    for (let gx = x + 12; gx < x + w; gx += 18) grid.push(gx);
    const rows = [];
    for (let gy = y + 12; gy < y + h; gy += 18) rows.push(gy);
    return (
        <g>
            <g className="fig-mist" data-anim="in" style={at(d)}>
                {grid.map((gx) => (
                    <line
                        key={`v${gx}`}
                        x1={gx}
                        y1={y + 2}
                        x2={gx}
                        y2={y + h - 2}
                    />
                ))}
                {rows.map((gy) => (
                    <line
                        key={`h${gy}`}
                        x1={x + 2}
                        y1={gy}
                        x2={x + w - 2}
                        y2={gy}
                    />
                ))}
            </g>
            <path
                className="fig-wash strong"
                data-anim="in"
                style={at(d + 0.2)}
                d={`M${x + 14} ${y + h - 26} C ${x + w * 0.3} ${y + h - 70}, ${x + w * 0.42} ${y + 30}, ${x + w * 0.68} ${y + 44} C ${x + w * 0.9} ${y + 54}, ${x + w - 10} ${y + h - 60}, ${x + w - 16} ${y + h - 20} Z`}
            />
            <path
                className="fig-ink"
                data-anim="draw"
                style={at(d + 0.4)}
                d={`M${x + 18} ${y + h - 18} C ${x + w * 0.4} ${y + h - 40}, ${x + w * 0.55} ${y + 46}, ${x + w - 22} ${y + 30}`}
            />
            <g data-anim="pop" style={at(d + 0.6)}>
                <Pic x={x + 30} y={y + h - 58} w={26} h={22} />
                <Pic x={x + w * 0.46} y={y + 54} w={30} h={24} />
                <Pic x={x + w - 66} y={y + h - 74} w={24} h={20} />
            </g>
            <g className="fig-water" data-anim="in" style={at(d + 0.8)}>
                <path d={`M${x + w * 0.52} ${y + 24} l10 6 l-10 6 l3 -6 Z`} />
                <path
                    className="fig-open"
                    d={`M${x + 24} ${y + h - 10} C ${x + w * 0.4} ${y + h - 30}, ${x + w * 0.46} ${y + 30}, ${x + w * 0.52} ${y + 30}`}
                />
            </g>
        </g>
    );
}

export function FivePasses() {
    const narrow = useNarrow();
    const [host, shown] = useReveal();
    const [run, setRun] = useState(0);
    const box = narrow ? { w: NARROW, h: 650 } : { w: WIDE, h: 314 };
    const rowY = narrow ? 36 : 54;
    const pitch = narrow ? 44 : 44;
    const sheet = narrow
        ? { x: 14, y: 290, w: NARROW - 28, h: 290 }
        : { x: 430, y: 46, w: 360, h: 232 };
    return (
        <div className="fig-host" ref={host}>
            <svg
                key={run}
                className={shown ? "fig playing" : "fig"}
                viewBox={frame(box.w, box.h)}
                role="img"
                aria-label="A frame in five passes: the paper grid, the terrain tiles, the child's ink, every drawing in view, then the plane and the guide's token."
            >
                <Plate
                    w={box.w}
                    h={box.h}
                    ground={FRAME_GROUND[narrow ? "narrow" : "wide"]}
                >
                    <text className="fig-title" x="0" y={narrow ? 18 : 26}>
                        one frame, in order
                    </text>
                    {FRAME_PASSES.map((p, i) => (
                        <g
                            key={p.n}
                            data-anim="in"
                            style={at(+(i * 0.2).toFixed(2))}
                        >
                            <text
                                className="fig-num"
                                x="0"
                                y={rowY + i * pitch + 14}
                            >
                                {p.n}
                            </text>
                            <text
                                className="fig-title sm"
                                x="28"
                                y={rowY + i * pitch + 2}
                            >
                                {p.title}
                            </text>
                            <text
                                className="fig-sub"
                                x="28"
                                y={rowY + i * pitch + 18}
                            >
                                {p.sub}
                            </text>
                            <line
                                className="fig-mist"
                                x1="0"
                                y1={rowY + i * pitch + 30}
                                x2={narrow ? NARROW : 390}
                                y2={rowY + i * pitch + 30}
                            />
                        </g>
                    ))}
                    <rect
                        className="fig-ink"
                        x={sheet.x}
                        y={sheet.y}
                        width={sheet.w}
                        height={sheet.h}
                    />
                    <Built
                        x={sheet.x}
                        y={sheet.y}
                        w={sheet.w}
                        h={sheet.h}
                        d={0}
                    />
                    <text
                        className="fig-sub"
                        x={sheet.x}
                        y={sheet.y + sheet.h + 18}
                    >
                        the canvas, after all five
                    </text>
                </Plate>
            </svg>
            <button
                type="button"
                className="fig-replay"
                onClick={() => setRun((n) => n + 1)}
            >
                Play the passes again
            </button>
        </div>
    );
}

/* ---- the tile pyramid, folded ---- */

const LEVELS = [
    { n: 0, grid: "1 × 1", cells: 1 },
    { n: 1, grid: "2 × 2", cells: 4 },
    { n: 2, grid: "4 × 4", cells: 16 },
    { n: 3, grid: "8 × 7", cells: 56 },
    { n: 4, grid: "16 × 14", cells: 224 },
    { n: 5, grid: "32 × 28", cells: 896 },
    { n: 6, grid: "64 × 56", cells: 3584 },
];
const PYRAMID_GROUND = {
    wide: [{ y: 318, amp: 9 }],
    narrow: [{ y: 600, amp: 8 }],
};

export function TilePyramid() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 640 } : { w: WIDE, h: 332 };
    const top = narrow ? 44 : 56;
    const pitch = narrow ? 32 : 34;
    const wMax = narrow ? 150 : 210;
    const foldX = narrow ? 8 : 438;
    const foldY = narrow ? 320 : 56;
    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="Seven levels of tiles in seven layers, 33,467 cell and layer slots, folded by content address into 6,680 images and 26 MB."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={PYRAMID_GROUND[narrow ? "narrow" : "wide"]}
            >
                <text className="fig-title" x="0" y={narrow ? 20 : 26}>
                    seven levels
                </text>
                {LEVELS.map((l, i) => {
                    const w = Math.round(
                        wMax * ((i + 1.6) / (LEVELS.length + 0.6))
                    );
                    const y = top + i * pitch;
                    const cols = Math.min(8, 2 ** i || 1);
                    const ticks = [];
                    for (let c = 1; c < cols; c += 1)
                        ticks.push(Math.round((w / cols) * c));
                    return (
                        <g key={l.n}>
                            <rect
                                className="fig-wash"
                                x="0"
                                y={y}
                                width={w}
                                height={22}
                            />
                            <rect
                                className="fig-ink"
                                x="0"
                                y={y}
                                width={w}
                                height={22}
                            />
                            <g className="fig-mist">
                                {ticks.map((t) => (
                                    <line
                                        key={t}
                                        x1={t}
                                        y1={y}
                                        x2={t}
                                        y2={y + 22}
                                    />
                                ))}
                            </g>
                            <text className="fig-row" x={w + 12} y={y + 15}>
                                {l.grid}
                            </text>
                            <text className="fig-sub" x={w + 74} y={y + 15}>
                                {l.cells.toLocaleString("en-GB")} cells
                            </text>
                        </g>
                    );
                })}
                <text
                    className="fig-note"
                    x="0"
                    y={top + LEVELS.length * pitch + 18}
                >
                    4,781 cells, each in seven layers
                </text>

                <g transform={`translate(${foldX} ${foldY})`}>
                    <text className="fig-title sm" x="0" y="0">
                        33,467 slots
                    </text>
                    <text className="fig-sub" x="0" y="17">
                        sea, blank paper, flat land, mostly alike
                    </text>
                    <g className="fig-mist">
                        {Array.from({ length: 7 }, (_, i) => (
                            <rect
                                key={i}
                                x={i * 7}
                                y={32 + i * 5}
                                width={narrow ? 120 : 150}
                                height="34"
                            />
                        ))}
                    </g>
                    <path
                        className="fig-water"
                        d={`M${narrow ? 140 : 190} 56 h${narrow ? 40 : 44} m0 0 l-7 -4 m7 4 l-7 4`}
                    />
                    <g transform={`translate(${narrow ? 190 : 250} 0)`}>
                        <rect
                            className="fig-wash strong"
                            x="0"
                            y="32"
                            width={narrow ? 100 : 130}
                            height="34"
                        />
                        <rect
                            className="fig-ink"
                            x="0"
                            y="32"
                            width={narrow ? 100 : 130}
                            height="34"
                        />
                        <text className="fig-title sm" x="0" y="0">
                            6,680 images
                        </text>
                        <text className="fig-sub" x="0" y="17">
                            26 MB on disk
                        </text>
                        <text className="fig-dim" x="0" y="86">
                            content addressed, so
                        </text>
                        <text className="fig-dim" x="0" y="101">
                            alike tiles are one file
                        </text>
                    </g>
                </g>
            </Plate>
        </svg>
    );
}

/* ---- keeping the pixels you already have ---- */

const SETTLE_GROUND = {
    wide: [{ y: 268, amp: 9 }],
    narrow: [{ y: 470, amp: 8 }],
};

// A soft drawing and a sharp one, the same drawing at two rasterisations.
function Leafy({ x, y, s, soft }) {
    const c = soft ? "fig-mist" : "fig-ink";
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                className={c}
                d="M0 40 C 0 18, 12 4, 26 0 C 26 22, 14 36, 0 40 Z"
            />
            <path
                className={soft ? "fig-mist" : "fig-ink"}
                d="M0 40 C 8 30, 16 20, 24 6"
            />
            {!soft && (
                <g className="fig-mist">
                    <path d="M4 34 C 8 30, 12 28, 16 27" />
                    <path d="M8 28 C 12 24, 15 22, 19 20" />
                    <path d="M12 22 C 15 19, 18 16, 21 13" />
                </g>
            )}
        </g>
    );
}

export function ReuseSettle() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 500 } : { w: WIDE, h: 282 };
    const axis = narrow ? 300 : 206;
    const x0 = 0;
    const x1 = narrow ? NARROW - 16 : 760;
    const stop = narrow ? 0.42 : 0.44;
    const sharp = narrow ? 0.72 : 0.7;
    const at1 = x0 + (x1 - x0) * stop;
    const at2 = x0 + (x1 - x0) * sharp;
    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="While the camera moves a drawing keeps the texture it has; 200 milliseconds after it rests the drawing is rasterised at the size it is seen, and the sharper pixels fade in over 150 milliseconds."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={SETTLE_GROUND[narrow ? "narrow" : "wide"]}
            >
                <text className="fig-title" x="0" y={narrow ? 20 : 26}>
                    while the camera moves
                </text>
                <text className="fig-sub" x="0" y={narrow ? 38 : 44}>
                    a drawing keeps the texture it has,
                    <tspan x="0" dy={narrow ? 15 : 0}>
                        {narrow ? "" : " "}unless it would look twice as soft
                    </tspan>
                </text>

                <g
                    transform={`translate(${narrow ? 34 : 60} ${narrow ? 88 : 72})`}
                >
                    <Leafy x={0} y={0} s={narrow ? 1.5 : 1.7} soft />
                    <text
                        className="fig-row"
                        x={20}
                        y={narrow ? 84 : 92}
                        textAnchor="middle"
                    >
                        kept
                    </text>
                </g>
                <g
                    transform={`translate(${narrow ? 176 : 480} ${narrow ? 88 : 72})`}
                >
                    <Leafy x={0} y={0} s={narrow ? 1.5 : 1.7} />
                    <text
                        className="fig-row"
                        x={20}
                        y={narrow ? 84 : 92}
                        textAnchor="middle"
                    >
                        drawn again
                    </text>
                </g>

                <line
                    className="fig-mist"
                    x1={x0}
                    y1={axis}
                    x2={x1}
                    y2={axis}
                />
                <rect
                    className="fig-wash"
                    x={x0}
                    y={axis - 26}
                    width={at1 - x0}
                    height="26"
                />
                <text className="fig-row" x={x0 + 8} y={axis - 8}>
                    the camera is moving
                </text>
                <g className="fig-water">
                    <line x1={at1} y1={axis - 34} x2={at1} y2={axis + 10} />
                    <line x1={at2} y1={axis - 34} x2={at2} y2={axis + 10} />
                    <path
                        d={`M${at1} ${axis + 18} H${at2} m0 0 l-6 -4 m6 4 l-6 4 M${at1} ${axis + 18} l6 -4 m-6 4 l6 4`}
                    />
                </g>
                <text
                    className="fig-dim"
                    x={(at1 + at2) / 2}
                    y={axis + 36}
                    textAnchor="middle"
                >
                    200 ms
                </text>
                <text
                    className="fig-sub"
                    x={at1 - 6}
                    y={axis - 42}
                    textAnchor="end"
                >
                    it rests
                </text>
                <text
                    className="fig-sub"
                    x={narrow ? NARROW : at2 + 6}
                    y={axis - 42}
                    textAnchor={narrow ? "end" : "start"}
                >
                    {narrow ? "drawn sharp" : "drawn at the size it is seen"}
                </text>
                <text
                    className="fig-note"
                    x={narrow ? 0 : at2 + 6}
                    y={axis + (narrow ? 76 : 36)}
                >
                    the sharper pixels fade in over 150 ms,
                    <tspan x={narrow ? 0 : at2 + 6} dy="15">
                        the softer ones kept underneath
                    </tspan>
                </text>
            </Plate>
        </svg>
    );
}

export const FIGURES = {
    "three-passes": ThreePasses,
    "three-formats": ThreeFormats,
    "command-list": CommandList,
    fragment: Fragment,
    "layer-memory": LayerMemory,
    "five-passes": FivePasses,
    "tile-pyramid": TilePyramid,
    "reuse-settle": ReuseSettle,
};
