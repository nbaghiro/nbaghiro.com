import { useState } from "react";
import "./Figures.css";
import {
    at,
    frame,
    Lines,
    NARROW,
    Pic,
    Plate,
    useNarrow,
    useReveal,
    WIDE,
} from "./figures/plate";
import { SLOT_FIGURES } from "./figures/when-a-slot-is-free";
import { VARIANT_FIGURES } from "./figures/every-version-checked";
import { SLEEVE_FIGURES } from "./figures/one-account-many-strategies";
import { ANCHOR_FIGURES } from "./figures/a-comment-that-moves";

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
 *
 * The primitives of that language are exported, and a post written after this one keeps its
 * own figures in `figures/<slug>.jsx` and is registered at the foot of this file.
 */

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
                    recorded in the September investigation
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
                    71 sample-map layers
                </text>
                <text
                    className="fig-note"
                    x={bx + 20}
                    y={by + (narrow ? 44 : 46)}
                >
                    2,557 MB in the Simulator,
                    <tspan x={bx + 20} dy="15">
                        at the sample opening view.
                    </tspan>
                    <tspan x={bx + 20} dy="15">
                        Parent-map measurements
                    </tspan>
                    <tspan x={bx + 20} dy="15">
                        are separate; see the text.
                    </tspan>
                </text>
                <text
                    className="fig-dim"
                    x={bx + 20}
                    y={by + (narrow ? 112 : 116)}
                >
                    Test device limit: 2,048 MB
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
                    <text className="fig-sub" x={sheet.x} y={sheet.y - 12}>
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
    wide: [{ y: 330, amp: 9 }],
    narrow: [{ y: 612, amp: 8 }],
};

export function TilePyramid() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 650 } : { w: WIDE, h: 348 };
    const top = narrow ? 44 : 52;
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
                                {l.cells.toLocaleString("en-GB")}
                                {l.cells === 1 ? " cell" : " cells"}
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
                        {narrow
                            ? "sea and blank paper, mostly alike"
                            : "sea, blank paper, flat land, mostly alike"}
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
                        d={
                            narrow
                                ? "M60 106 v26 m0 0 l-4 -7 m4 7 l4 -7"
                                : "M190 56 h44 m0 0 l-7 -4 m7 4 l-7 4"
                        }
                    />
                    <g
                        transform={
                            narrow ? "translate(0 146)" : "translate(250 0)"
                        }
                    >
                        <rect
                            className="fig-wash strong"
                            x="0"
                            y="32"
                            width={narrow ? 120 : 130}
                            height="34"
                        />
                        <rect
                            className="fig-ink"
                            x="0"
                            y="32"
                            width={narrow ? 120 : 130}
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
            aria-label="Textures are reused during camera movement. A 200 millisecond settling threshold allows refinement, and sharper pixels fade in over 150 milliseconds when ready."
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
                    {narrow ? (
                        <tspan x="0" dy="15">
                            unless it would look twice as soft
                        </tspan>
                    ) : (
                        <tspan> unless it would look twice as soft</tspan>
                    )}
                </text>

                <g
                    transform={`translate(${narrow ? 34 : 60} ${narrow ? 96 : 84})`}
                >
                    <Leafy x={0} y={0} s={narrow ? 1.5 : 1.7} soft />
                    <text className="fig-row" x={20} y="-8" textAnchor="middle">
                        kept
                    </text>
                </g>
                <g
                    transform={`translate(${narrow ? 176 : 480} ${narrow ? 96 : 84})`}
                >
                    <Leafy x={0} y={0} s={narrow ? 1.5 : 1.7} />
                    <text className="fig-row" x={20} y="-8" textAnchor="middle">
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
                    {narrow ? "refinement starts" : "refinement can begin"}
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

// Break a note into lines of about `max` characters, since SVG text does not wrap.
function wrap(text, max) {
    const out = [];
    let line = "";
    for (const word of text.split(" ")) {
        if (line && (line + " " + word).length > max) {
            out.push(line);
            line = word;
        } else {
            line = line ? line + " " + word : word;
        }
    }
    if (line) out.push(line);
    return out;
}

/* ---- one integration, two callers ---- */

const CALLER_GROUND = {
    wide: [{ y: 268, amp: 9 }],
    narrow: [{ y: 628, amp: 8 }],
};

// A card with a title, a quiet second line and some rows of content under it.
function Card({ x, y, w, h, title, note, children, dashed, d }) {
    return (
        <g>
            <rect
                className="fig-wash"
                x={x}
                y={y}
                width={w}
                height={h}
                data-anim="in"
                style={at(d)}
            />
            <rect
                className={dashed ? "fig-mist dash" : "fig-ink"}
                x={x}
                y={y}
                width={w}
                height={h}
                data-anim="in"
                style={at(d)}
            />
            <text
                className="fig-title sm"
                x={x}
                y={y - 20}
                data-anim="in"
                style={at(d)}
            >
                {title}
            </text>
            <text
                className="fig-sub"
                x={x}
                y={y - 5}
                data-anim="in"
                style={at(d)}
            >
                {note}
            </text>
            <g data-anim="in" style={at(d)}>
                {children}
            </g>
        </g>
    );
}

// An arrow from one point to another, drawn in the water colour. It fades rather than
// draws: the draw animation keeps its dash array, which breaks a path longer than 100 units
// into dashes once it has finished.
function Arrow({ d: path, delay }) {
    return (
        <path
            className="fig-water"
            d={path}
            markerEnd="url(#fig-arrow)"
            data-anim="in"
            style={at(delay)}
        />
    );
}

const FIELDS = [
    { k: "channel", v: "#support" },
    { k: "text", v: "the reply" },
    { k: "thread_ts", v: "1760…" },
];

export function TwoCallers() {
    const narrow = useNarrow();
    const [host, shown] = useReveal();
    const [run, setRun] = useState(0);
    const box = narrow ? { w: NARROW, h: 680 } : { w: WIDE, h: 292 };
    const cw = narrow ? NARROW : 286;
    const node = { x: 0, y: narrow ? 42 : 46, w: cw, h: 108 };
    const tool = narrow
        ? { x: 0, y: 252, w: cw, h: 96 }
        : { x: box.w - cw, y: 46, w: cw, h: 108 };
    const op = narrow
        ? { x: 0, y: 470, w: cw, h: 86 }
        : { x: Math.round((box.w - 300) / 2), y: 214, w: 300, h: 60 };
    return (
        <div className="fig-host" ref={host}>
            <svg
                key={run}
                className={shown ? "fig playing" : "fig"}
                viewBox={frame(box.w, box.h)}
                role="img"
                aria-label="A workflow node and a model's tool call arriving at the same operation function, which then calls the service once."
            >
                <defs>
                    <marker
                        id="fig-arrow"
                        viewBox="0 0 8 8"
                        refX="7"
                        refY="4"
                        markerWidth="7"
                        markerHeight="7"
                        orient="auto"
                    >
                        <path d="M0 0 L8 4 L0 8" className="fig-head" />
                    </marker>
                </defs>
                <Plate
                    w={box.w}
                    h={box.h}
                    ground={CALLER_GROUND[narrow ? "narrow" : "wide"]}
                >
                    <Card
                        x={node.x}
                        y={node.y}
                        w={node.w}
                        h={node.h}
                        title="a node on the canvas"
                        note="a person filled this in"
                        d={0}
                    >
                        {FIELDS.map((f, i) => (
                            <g key={f.k}>
                                <text
                                    className="fig-row"
                                    x={node.x + 14}
                                    y={node.y + 28 + i * 27}
                                >
                                    {f.k}
                                </text>
                                <rect
                                    className="fig-chip"
                                    x={node.x + 118}
                                    y={node.y + 15 + i * 27}
                                    width={node.w - 132}
                                    height="19"
                                />
                                <text
                                    className="fig-sub"
                                    x={node.x + 126}
                                    y={node.y + 28 + i * 27}
                                >
                                    {f.v}
                                </text>
                            </g>
                        ))}
                    </Card>

                    <Card
                        x={tool.x}
                        y={tool.y}
                        w={tool.w}
                        h={tool.h}
                        title="a tool call from a model"
                        note="the model wrote this"
                        dashed
                        d={0.9}
                    >
                        <text
                            className="fig-row"
                            x={tool.x + 14}
                            y={tool.y + 28}
                        >
                            slack_sendMessage
                        </text>
                        {FIELDS.slice(0, 2).map((f, i) => (
                            <text
                                key={f.k}
                                className="fig-sub"
                                x={tool.x + 26}
                                y={tool.y + 54 + i * 20}
                            >
                                {f.k}: {f.v}
                            </text>
                        ))}
                    </Card>

                    <Arrow
                        delay={0.5}
                        d={
                            narrow
                                ? `M${node.w / 2} ${node.y + node.h + 6} V${tool.y - 26}`
                                : `M${node.w / 2} ${node.y + node.h + 6} V${op.y - 26} H${op.x + op.w / 2} V${op.y - 6}`
                        }
                    />
                    <Arrow
                        delay={1.5}
                        d={
                            narrow
                                ? `M${tool.x + tool.w / 2} ${tool.y + tool.h + 6} V${op.y - 6}`
                                : `M${tool.x + tool.w / 2} ${tool.y + tool.h + 6} V${op.y - 26} H${op.x + op.w / 2} V${op.y - 6}`
                        }
                    />

                    <rect
                        className="fig-wash strong"
                        x={op.x}
                        y={op.y}
                        width={op.w}
                        height={op.h}
                        data-anim="pop"
                        style={at(1.95)}
                    />
                    <rect
                        className="fig-ink"
                        x={op.x}
                        y={op.y}
                        width={op.w}
                        height={op.h}
                        data-anim="pop"
                        style={at(1.95)}
                    />
                    <text
                        className="fig-row"
                        x={op.x + 16}
                        y={op.y + 25}
                        data-anim="in"
                        style={at(2.1)}
                    >
                        executeSendMessage(client, params)
                    </text>
                    <text
                        className="fig-sub"
                        x={op.x + 16}
                        y={op.y + 45}
                        data-anim="in"
                        style={at(2.1)}
                    >
                        one function, one set of retries
                    </text>
                </Plate>
            </svg>
            <button
                type="button"
                className="fig-replay"
                onClick={() => {
                    setRun((n) => n + 1);
                }}
            >
                Play the two calls again
            </button>
        </div>
    );
}

/* ---- one definition, three readers ---- */

const READERS = [
    {
        t: "the canvas",
        h: "the node's form",
        p: "fields and their types, so a new parameter needs no UI work",
    },
    {
        t: "the engine",
        h: "the validation",
        p: "the same schema parses the parameters before the call",
    },
    {
        t: "the model",
        h: "the tool spec",
        p: "converted to JSON Schema and handed over as the tool's input",
    },
];

export function OneDefinition() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 620 } : { w: WIDE, h: 318 };
    const def = narrow
        ? { x: 0, y: 44, w: NARROW, h: 92 }
        : { x: Math.round((box.w - 330) / 2), y: 40, w: 330, h: 92 };
    const cw = narrow ? NARROW : 236;
    const top = narrow ? 212 : 206;
    const gap = narrow ? 136 : 0;
    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="One operation definition read by three things: the node's form, the engine's validation, and the tool spec given to the model."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={[{ y: narrow ? 586 : 292, amp: 8 }]}
            >
                <text className="fig-title sm" x={def.x} y={def.y - 20}>
                    one OperationDefinition
                </text>
                <text className="fig-sub" x={def.x} y={def.y - 5}>
                    slack · sendMessage
                </text>
                <rect
                    className="fig-wash strong"
                    x={def.x}
                    y={def.y}
                    width={def.w}
                    height={def.h}
                />
                <rect
                    className="fig-ink"
                    x={def.x}
                    y={def.y}
                    width={def.w}
                    height={def.h}
                />
                <rect
                    className="fig-chip"
                    x={def.x + 12}
                    y={def.y + 44}
                    width={def.w - 24}
                    height="26"
                />
                {["id, name, description", "inputSchema: z.object({ … })"].map(
                    (line, i) => (
                        <text
                            key={line}
                            className={i ? "fig-row" : "fig-sub"}
                            x={def.x + 16}
                            y={def.y + 32 + i * 30}
                        >
                            {line}
                        </text>
                    )
                )}

                {READERS.map((r, i) => {
                    const x = narrow ? 0 : i * (cw + 56);
                    const y = top + i * gap;
                    return (
                        <g key={r.t}>
                            <path
                                className="fig-mist"
                                d={
                                    narrow
                                        ? `M18 ${def.y + def.h + 6} V${y - 10}`
                                        : `M${def.x + def.w / 2} ${def.y + def.h + 6} V${def.y + def.h + 30} H${x + cw / 2} V${y - 10}`
                                }
                            />
                            <text className="fig-sub" x={x} y={y + 2}>
                                {r.t}
                            </text>
                            <text className="fig-title sm" x={x} y={y + 24}>
                                {r.h}
                            </text>
                            <text className="fig-note" x={x} y={y + 46}>
                                {wrap(r.p, narrow ? 46 : 32).map((line, j) => (
                                    <tspan key={line} x={x} dy={j ? 16 : 0}>
                                        {line}
                                    </tspan>
                                ))}
                            </text>
                        </g>
                    );
                })}
            </Plate>
        </svg>
    );
}

/* ---- the shape of a provider ---- */

const PROVIDER_FILES = [
    { f: "SlackProvider.ts", n: "both surfaces, declared", both: true },
    { f: "client/SlackClient.ts", n: "auth, pooling, retries" },
    { f: "operations/sendMessage.ts", n: "the work" },
    { f: "operations/listChannels.ts", n: "the work" },
    { f: "mcp/SlackMCPAdapter.ts", n: "46 lines of renaming", mcp: true },
];

const COUNTS = [
    { n: "156", p: "providers, one registry line each" },
    { n: "1,759", p: "operation files, shared by both callers" },
    { n: "46", p: "lines in the Slack adapter" },
];

export function ProviderShape() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 520 } : { w: WIDE, h: 300 };
    const pitch = 34;
    const top = narrow ? 50 : 56;
    const colX = narrow ? 0 : 470;
    const colY = narrow ? top + PROVIDER_FILES.length * pitch + 44 : top;
    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="The files of one provider, with the operations shared by both callers and a small adapter for the model, beside the counts across the repository."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={[{ y: narrow ? 486 : 274, amp: 8 }]}
            >
                <text className="fig-title sm" x="0" y={top - 26}>
                    providers/slack
                </text>
                <text className="fig-sub" x="0" y={top - 10}>
                    one of 156, loaded when something asks for it
                </text>
                {PROVIDER_FILES.map((row, i) => {
                    const y = top + i * pitch;
                    return (
                        <g key={row.f}>
                            <rect
                                className={
                                    row.both ? "fig-wash strong" : "fig-wash"
                                }
                                x="0"
                                y={y}
                                width={narrow ? NARROW : 420}
                                height="26"
                            />
                            <rect
                                className={
                                    row.mcp ? "fig-mist dash" : "fig-ink"
                                }
                                x="0"
                                y={y}
                                width={narrow ? NARROW : 420}
                                height="26"
                            />
                            <text className="fig-row" x="12" y={y + 18}>
                                {row.f}
                            </text>
                            {!narrow && (
                                <text className="fig-sub" x="252" y={y + 18}>
                                    {row.n}
                                </text>
                            )}
                        </g>
                    );
                })}
                {narrow && (
                    <text
                        className="fig-note"
                        x="0"
                        y={top + PROVIDER_FILES.length * pitch + 16}
                    >
                        the operations are the work; the adapter only renames
                    </text>
                )}

                {COUNTS.map((c, i) => (
                    <g
                        key={c.n}
                        transform={`translate(${colX} ${colY + i * 62})`}
                    >
                        <text className="fig-count" x="0" y="26">
                            {c.n}
                        </text>
                        <text className="fig-note" x="0" y="44">
                            {c.p}
                        </text>
                    </g>
                ))}
            </Plate>
        </svg>
    );
}

/* ---- reads replicate, writes are commands ---- */

// One arrow in the figures' language: a hairline with a small head, and an optional label
// set along it.
function FlowArrow({ from, to, label, dash, d }) {
    const [x1, y1] = from;
    const [x2, y2] = to;
    const horizontal = y1 === y2;
    const head = horizontal
        ? `M${x2} ${y2} l-7 -4 M${x2} ${y2} l-7 4`
        : `M${x2} ${y2} l-4 ${y2 > y1 ? -7 : 7} M${x2} ${y2} l4 ${y2 > y1 ? -7 : 7}`;
    return (
        <g
            data-anim={d === undefined ? undefined : "in"}
            style={d === undefined ? undefined : at(d)}
        >
            <path
                className={dash ? "fig-mist dash" : "fig-water"}
                d={`M${x1} ${y1} H${x2} V${y2}`}
            />
            <path className={dash ? "fig-mist" : "fig-water"} d={head} />
            {label && (
                <text
                    className="fig-dim"
                    x={horizontal ? (x1 + x2) / 2 : x1 + 8}
                    y={horizontal ? y1 - 9 : (y1 + y2) / 2}
                    textAnchor={horizontal ? "middle" : "start"}
                >
                    {label}
                </text>
            )}
        </g>
    );
}

// A labelled box: the name inside, a quiet line under it when there is one.
function Boxed({ x, y, w, h, name, note, wash }) {
    return (
        <g>
            {wash && (
                <rect className="fig-wash" x={x} y={y} width={w} height={h} />
            )}
            <rect className="fig-ink" x={x} y={y} width={w} height={h} />
            <text
                className="fig-title sm"
                x={x + 14}
                y={y + (note ? 26 : h / 2 + 6)}
            >
                {name}
            </text>
            {note && (
                <text className="fig-sub" x={x + 14} y={y + 44}>
                    {note}
                </text>
            )}
        </g>
    );
}

const PATHS_GROUND = {
    wide: [{ y: 300, amp: 9 }],
    narrow: [{ y: 486, amp: 8 }],
};

export function TwoPaths() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 520 } : { w: WIDE, h: 322 };
    if (narrow) {
        const w = NARROW - 40;
        const rows = [
            { name: "Postgres", note: "the source of truth", y: 40 },
            {
                name: "SQLite on the device",
                note: "only this business's rows",
                y: 150,
            },
            { name: "the screen", note: "a local query, no request", y: 260 },
            { name: "a command", note: "lock, check, write, audit", y: 370 },
        ];
        return (
            <svg
                className="fig"
                viewBox={frame(box.w, box.h)}
                role="img"
                aria-label="Reads leave Postgres through the replication log and arrive in the device's own SQLite, which the screen queries. A write goes the other way as a command, and returns to every device through the same log."
            >
                <Plate w={box.w} h={box.h} ground={PATHS_GROUND.narrow}>
                    {rows.map((r) => (
                        <Boxed
                            key={r.name}
                            x={0}
                            y={r.y}
                            w={w}
                            h={62}
                            name={r.name}
                            note={r.note}
                            wash={r.name === "a command"}
                        />
                    ))}
                    <FlowArrow
                        from={[w / 2, 102]}
                        to={[w / 2, 150]}
                        label="replication log"
                    />
                    <FlowArrow from={[w / 2, 212]} to={[w / 2, 260]} />
                    <FlowArrow
                        from={[w / 2, 322]}
                        to={[w / 2, 370]}
                        label="a write"
                    />
                    <path
                        className="fig-water"
                        d={`M${w} 401 H${w + 22} V71 H${w}`}
                    />
                    <path
                        className="fig-water"
                        d={`M${w} 71 l7 -4 M${w} 71 l7 4`}
                    />
                    <text className="fig-dim" x={w - 4} y="24" textAnchor="end">
                        and back out the same way
                    </text>
                </Plate>
            </svg>
        );
    }
    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="Reads leave Postgres through the replication log and arrive in the device's own SQLite, which the screen queries. A write goes the other way as a command, and returns to every device through the same log."
        >
            <Plate w={box.w} h={box.h} ground={PATHS_GROUND.wide}>
                <text className="fig-title" x="0" y="22">
                    one loop
                </text>
                <Boxed
                    x={0}
                    y={52}
                    w={176}
                    h={62}
                    name="Postgres"
                    note="the source of truth"
                />
                <Boxed
                    x={292}
                    y={52}
                    w={210}
                    h={62}
                    name="SQLite on the device"
                    note="only this business's rows"
                />
                <Boxed
                    x={620}
                    y={52}
                    w={200}
                    h={62}
                    name="the screen"
                    note="a local query, no request"
                />
                <FlowArrow
                    from={[176, 83]}
                    to={[292, 83]}
                    label="replication log"
                />
                <FlowArrow from={[502, 83]} to={[620, 83]} />
                <Boxed
                    x={292}
                    y={196}
                    w={210}
                    h={62}
                    name="a command"
                    note="lock, check, write, audit"
                    wash
                />
                <FlowArrow from={[720, 114]} to={[720, 196]} label="a write" />
                <path className="fig-water" d="M720 196 H502" />
                <path className="fig-water" d="M502 196 l7 -4 M502 196 l7 4" />
                <path className="fig-water" d="M292 227 H88 V114" />
                <path className="fig-water" d="M88 114 l-4 7 M88 114 l4 7" />
                <text className="fig-dim" x="96" y="168">
                    and back out the same way
                </text>
                <text className="fig-sub" x="0" y="286">
                    the API is not in the read loop, and it is the only way into
                    the write one
                </text>
            </Plate>
        </svg>
    );
}

/* ---- the five checks inside one command ---- */

const CHECKS = [
    "the member is not on time off",
    "the business is not closed",
    "the time is inside their working hours",
    "the seat, or the visits around it, leave room",
    "the resource the service needs is free",
];
const WRITTEN = ["the slot", "the booking", "the audit row"];
const CHECK_GROUND = {
    wide: [{ y: 312, amp: 9 }],
    narrow: [{ y: 582, amp: 8 }],
};

export function FiveChecks() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 620 } : { w: WIDE, h: 334 };
    const top = narrow ? 92 : 78;
    const pitch = narrow ? 42 : 40;
    const tx = narrow
        ? { x: 0, y: 352, w: NARROW, h: 180 }
        : { x: 530, y: 68, w: 290, h: 196 };
    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="One command: an advisory lock on the team member, five checks against rows another device may be changing, then the slot, the booking and the audit row written in a single transaction."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={CHECK_GROUND[narrow ? "narrow" : "wide"]}
            >
                <text className="fig-title" x="0" y={narrow ? 18 : 22}>
                    one command
                </text>
                <rect
                    className="fig-wash"
                    x="0"
                    y={narrow ? 36 : 44}
                    width={narrow ? NARROW : 470}
                    height="26"
                />
                <rect
                    className="fig-ink"
                    x="0"
                    y={narrow ? 36 : 44}
                    width={narrow ? NARROW : 470}
                    height="26"
                />
                <text className="fig-sub" x="12" y={narrow ? 54 : 62}>
                    advisory lock on the member, held to the end
                </text>
                {CHECKS.map((c, i) => (
                    <g key={c}>
                        <text
                            className="fig-num"
                            x="0"
                            y={top + i * pitch + 12}
                        >
                            {i + 1}
                        </text>
                        <text
                            className="fig-row"
                            x="26"
                            y={top + i * pitch + 12}
                        >
                            {c}
                        </text>
                        <line
                            className="fig-mist"
                            x1="0"
                            y1={top + i * pitch + 24}
                            x2={narrow ? NARROW : 470}
                            y2={top + i * pitch + 24}
                        />
                    </g>
                ))}
                <rect
                    className="fig-ink"
                    x={tx.x}
                    y={tx.y}
                    width={tx.w}
                    height={tx.h}
                />
                <text className="fig-title sm" x={tx.x + 18} y={tx.y + 32}>
                    one transaction
                </text>
                {WRITTEN.map((wname, i) => (
                    <g key={wname}>
                        <rect
                            className="fig-wash strong"
                            x={tx.x + 18}
                            y={tx.y + 50 + i * 38}
                            width={tx.w - 36}
                            height="28"
                        />
                        <text
                            className="fig-sub"
                            x={tx.x + 30}
                            y={tx.y + 69 + i * 38}
                        >
                            {wname}
                        </text>
                    </g>
                ))}
                {!narrow && <FlowArrow from={[470, 166]} to={[530, 166]} />}
                {narrow && (
                    <FlowArrow
                        from={[NARROW / 2, 306]}
                        to={[NARROW / 2, 352]}
                    />
                )}
            </Plate>
        </svg>
    );
}

/* ---- the life of one offline proposal ---- */

const STATES = [
    { name: "queued", note: "absorbs more edits" },
    { name: "sending", note: "payload frozen" },
    { name: "accepted", note: "a revision comes back" },
    { name: "retired", note: "the replica shows it" },
];
const WEEK_GROUND = {
    wide: [{ y: 318, amp: 9 }],
    narrow: [{ y: 524, amp: 8 }],
};

export function OutboxWeek() {
    const narrow = useNarrow();
    const [host, shown] = useReveal();
    const [run, setRun] = useState(0);
    const box = narrow ? { w: NARROW, h: 562 } : { w: WIDE, h: 340 };
    const cw = narrow ? NARROW : 176;
    const gap = narrow ? 0 : 38;
    const top = narrow ? 46 : 70;
    const at0 = (i) => +(i * 0.34).toFixed(2);
    return (
        <div className="fig-host" ref={host}>
            <svg
                key={run}
                className={shown ? "fig playing" : "fig"}
                viewBox={frame(box.w, box.h)}
                role="img"
                aria-label="One proposal's life: queued and still editable, frozen the moment it is sent, accepted with a revision, and retired only when that revision appears in the replica. A refusal stops the chain and keeps the week for review."
            >
                <Plate
                    w={box.w}
                    h={box.h}
                    ground={WEEK_GROUND[narrow ? "narrow" : "wide"]}
                >
                    <text className="fig-title" x="0" y={narrow ? 18 : 24}>
                        one working week, offline
                    </text>
                    {STATES.map((st, i) => {
                        const x = narrow ? 0 : i * (cw + gap);
                        const y = narrow ? top + i * 84 : top;
                        return (
                            <g key={st.name} data-anim="in" style={at(at0(i))}>
                                <Boxed
                                    x={x}
                                    y={y}
                                    w={cw}
                                    h={66}
                                    name={st.name}
                                    note={st.note}
                                    wash={i < 2}
                                />
                            </g>
                        );
                    })}
                    {STATES.slice(1).map((st, i) =>
                        narrow ? (
                            <FlowArrow
                                key={st.name}
                                from={[cw / 2, top + i * 84 + 66]}
                                to={[cw / 2, top + (i + 1) * 84]}
                                d={at0(i + 1)}
                            />
                        ) : (
                            <FlowArrow
                                key={st.name}
                                from={[(i + 1) * cw + i * gap, top + 33]}
                                to={[(i + 1) * (cw + gap), top + 33]}
                                d={at0(i + 1)}
                            />
                        )
                    )}
                    <g data-anim="in" style={at(at0(4))}>
                        <rect
                            className="fig-ink"
                            x={narrow ? 0 : 214}
                            y={narrow ? 396 : 196}
                            width={narrow ? NARROW : 338}
                            height="66"
                        />
                        <text
                            className="fig-title sm"
                            x={(narrow ? 0 : 214) + 14}
                            y={(narrow ? 396 : 196) + 26}
                        >
                            refused
                        </text>
                        <text
                            className="fig-sub"
                            x={(narrow ? 0 : 214) + 14}
                            y={(narrow ? 396 : 196) + 44}
                        >
                            the chain stops, the week is kept for review
                        </text>
                        <text
                            className="fig-sub"
                            x={narrow ? 0 : 214}
                            y={(narrow ? 396 : 196) + 92}
                        >
                            apply it again against the fresh revision, or
                            discard it
                        </text>
                    </g>
                    <g data-anim="in" style={at(at0(4))}>
                        <FlowArrow
                            from={narrow ? [cw / 2, 214] : [302, top + 66]}
                            to={narrow ? [cw / 2, 396] : [302, 196]}
                            dash
                        />
                    </g>
                </Plate>
            </svg>
            <button
                type="button"
                className="fig-replay"
                onClick={() => setRun((n) => n + 1)}
            >
                Play the states again
            </button>
        </div>
    );
}

export const FIGURES = {
    ...SLOT_FIGURES,
    ...VARIANT_FIGURES,
    ...SLEEVE_FIGURES,
    ...ANCHOR_FIGURES,
    "three-passes": ThreePasses,
    "three-formats": ThreeFormats,
    "command-list": CommandList,
    fragment: Fragment,
    "layer-memory": LayerMemory,
    "five-passes": FivePasses,
    "tile-pyramid": TilePyramid,
    "reuse-settle": ReuseSettle,
    "two-callers": TwoCallers,
    "one-definition": OneDefinition,
    "provider-shape": ProviderShape,
    "two-paths": TwoPaths,
    "five-checks": FiveChecks,
    "outbox-week": OutboxWeek,
};
