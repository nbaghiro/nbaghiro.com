import { NARROW, Plate, frame, useNarrow, WIDE } from "./plate";

/**
 * The figures for the Lumischool game engine post, in the language plate.jsx sets:
 * hairline boxes over a water wash, the page's own two typefaces, no other colour.
 */

function Box({ x, y, w, h, title, sub, note }) {
    return (
        <g>
            <rect className="fig-wash" x={x} y={y} width={w} height={h} />
            <rect className="fig-ink" x={x} y={y} width={w} height={h} />
            <text className="fig-title sm" x={x + 12} y={y + 25}>
                {title}
            </text>
            {sub && (
                <text className="fig-sub" x={x + 12} y={y + 44}>
                    {sub}
                </text>
            )}
            {note && (
                <text className="fig-note" x={x + 12} y={y + 62}>
                    {note}
                </text>
            )}
        </g>
    );
}

// A hairline from one box to the next, with a head on the end it arrives at.
function Arrow({ x1, y1, x2, y2 }) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const back = 7;
    const side = 3.2;
    return (
        <g>
            <line className="fig-mist" x1={x1} y1={y1} x2={x2} y2={y2} />
            <path
                className="fig-mist"
                d={`M${x2} ${y2} L${x2 - ux * back - uy * side} ${
                    y2 - uy * back + ux * side
                } M${x2} ${y2} L${x2 - ux * back + uy * side} ${
                    y2 - uy * back - ux * side
                }`}
            />
        </g>
    );
}

/* ---- one step of an action game ---- */

// The chain a step runs along, and the short line under each name.
const STEP_CHAIN = [
    { title: "the pad", sub: "keys and fingers" },
    { title: "step(s, pad)", sub: "one tick" },
    { title: "the state", sub: "the game's own" },
    { title: "frame(s)", sub: "sprites and marks" },
    { title: "the renderer", sub: "one canvas" },
];

const LOOP_GROUND = {
    wide: [{ y: 206, amp: 8 }],
    narrow: [{ y: 452, amp: 7 }],
};

function GameLoop() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 486 } : { w: WIDE, h: 240 };
    const railY = 50;
    const bw = narrow ? NARROW : 140;
    const bh = narrow ? 52 : 72;
    const gap = narrow ? 22 : 30;
    const top = 70;
    const at = (i) =>
        narrow
            ? { x: 0, y: top + i * (bh + gap) }
            : { x: i * (bw + gap), y: top };

    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="Each tick of an action game reads the pad, steps the game's own state once, asks it for a frame of sprites and marks, and hands that frame to the renderer. Every action game is stepped sixty times a second."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={LOOP_GROUND[narrow ? "narrow" : "wide"]}
            >
                <text className="fig-title" x="0" y="14">
                    one step
                </text>
                <text className="fig-sub" x="0" y="32">
                    {narrow
                        ? "one clock, all 45 action games"
                        : "a fixed clock, the same rate for all 45 action games"}
                </text>
                <line
                    className="fig-mist"
                    x1="0"
                    y1={railY}
                    x2={box.w}
                    y2={railY}
                />
                {Array.from({ length: Math.floor(box.w / 16) + 1 }, (_, i) => (
                    <line
                        key={i}
                        className="fig-mist"
                        x1={i * 16}
                        y1={railY - (i % 5 === 0 ? 7 : 4)}
                        x2={i * 16}
                        y2={railY}
                    />
                ))}
                <text
                    className="fig-note"
                    x={box.w}
                    y={railY - 12}
                    textAnchor="end"
                >
                    60 steps a second
                </text>

                {STEP_CHAIN.map((step, i) => {
                    const p = at(i);
                    return (
                        <Box
                            key={step.title}
                            x={p.x}
                            y={p.y}
                            w={bw}
                            h={bh}
                            title={step.title}
                            sub={step.sub}
                        />
                    );
                })}
                {STEP_CHAIN.slice(1).map((step, i) => {
                    const a = at(i);
                    const b = at(i + 1);
                    return narrow ? (
                        <Arrow
                            key={step.title}
                            x1={56}
                            y1={a.y + bh + 4}
                            x2={56}
                            y2={b.y - 4}
                        />
                    ) : (
                        <Arrow
                            key={step.title}
                            x1={a.x + bw + 4}
                            y1={a.y + bh / 2}
                            x2={b.x - 4}
                            y2={b.y + bh / 2}
                        />
                    );
                })}

                {narrow ? (
                    <text
                        className="fig-note"
                        x="0"
                        y={top + 5 * (bh + gap) - 4}
                    >
                        then the next tick starts again at the pad
                    </text>
                ) : (
                    <>
                        <path
                            className="fig-mist"
                            d={`M${2 * (bw + gap) + bw / 2} ${top + bh} V182 H${
                                bw + gap + bw / 2
                            } V${top + bh + 6}`}
                        />
                        <path
                            className="fig-mist"
                            d={`M${bw + gap + bw / 2 - 3.2} ${
                                top + bh + 11
                            } l3.2 -6 l3.2 6`}
                        />
                        <text
                            className="fig-note"
                            x={2 * (bw + gap) + bw / 2 + 12}
                            y="186"
                        >
                            the same state, stepped again next tick
                        </text>
                    </>
                )}
            </Plate>
        </svg>
    );
}

/* ---- what reads the description a game gives ---- */

const READERS = [
    {
        title: "the prover",
        sub: "walks every position",
        from: [true, false],
    },
    {
        title: "one renderer",
        sub: "draws it on the GPU",
        from: [true, true],
    },
    {
        title: "a test in Node",
        sub: "no browser at all",
        from: [true, true],
    },
];

const SOURCES = [
    {
        title: "a mechanic",
        sub: "a position and its moves",
        note: "1 game, 5 levels",
    },
    {
        title: "a frame",
        sub: "keyed sprites under a camera",
        note: "45 games, 339 levels",
    },
];

const READ_GROUND = {
    wide: [{ y: 314, amp: 8 }],
    narrow: [{ y: 466, amp: 7 }],
};

function OneRenderer() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 500 } : { w: WIDE, h: 348 };
    const src = narrow
        ? { w: 160, h: 86, y: 34, gap: 16 }
        : { w: 390, h: 86, y: 34, gap: 40 };
    const srcX = (i) => i * (src.w + src.gap);
    const rw = narrow ? 288 : 250;
    const rh = narrow ? 62 : 68;
    const rowY = narrow ? 170 : 212;
    const rgap = narrow ? 14 : 35;
    const readerAt = (i) =>
        narrow
            ? { x: 24, y: rowY + i * (rh + rgap) }
            : { x: i * (rw + rgap), y: rowY };
    // where each source's run down the page sits once it leaves its box
    const rail = [8, box.w - 8];
    const railEnd = rowY + 2 * (rh + rgap) + rh / 2;

    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="A mechanic's position graph and an action game's frame are both read by the renderer and by tests that run without a browser. Only the mechanic reaches the prover, because an action game has no position graph to walk."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={READ_GROUND[narrow ? "narrow" : "wide"]}
            >
                <text className="fig-title" x="0" y="14">
                    {narrow
                        ? "what a game gives"
                        : "what a game gives, and what reads it"}
                </text>
                {SOURCES.map((s, i) => (
                    <Box
                        key={s.title}
                        x={srcX(i)}
                        y={src.y}
                        w={src.w}
                        h={src.h}
                        title={s.title}
                        sub={narrow ? undefined : s.sub}
                        note={s.note}
                    />
                ))}
                {READERS.map((r, i) => {
                    const p = readerAt(i);
                    return (
                        <Box
                            key={r.title}
                            x={p.x}
                            y={p.y}
                            w={rw}
                            h={rh}
                            title={r.title}
                            sub={r.sub}
                        />
                    );
                })}

                {narrow ? (
                    <>
                        {SOURCES.map((s, i) => (
                            <path
                                key={s.title}
                                className="fig-mist"
                                d={`M${srcX(i) + src.w / 2} ${
                                    src.y + src.h
                                } V${src.y + src.h + 14} H${rail[i]} V${railEnd}`}
                            />
                        ))}
                        {READERS.flatMap((r, i) =>
                            r.from.map((on, j) => {
                                const p = readerAt(i);
                                const cy = p.y + rh / 2;
                                const inner = j === 0 ? p.x : p.x + rw;
                                if (!on)
                                    return (
                                        <path
                                            key={`${i}-${j}`}
                                            className="fig-mist"
                                            d={`M${rail[j] - 5} ${cy - 5} l10 10 M${
                                                rail[j] + 5
                                            } ${cy - 5} l-10 10`}
                                        />
                                    );
                                return (
                                    <Arrow
                                        key={`${i}-${j}`}
                                        x1={rail[j]}
                                        y1={cy}
                                        x2={inner + (j === 0 ? -4 : 4)}
                                        y2={cy}
                                    />
                                );
                            })
                        )}
                    </>
                ) : (
                    READERS.flatMap((r, i) =>
                        r.from.map((on, j) => {
                            const p = readerAt(i);
                            const key = `${i}-${j}`;
                            const x1 = srcX(j) + src.w / 2;
                            const y1 = src.y + src.h;
                            const x2 = p.x + rw / 2;
                            if (on)
                                return (
                                    <Arrow
                                        key={key}
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={p.y - 5}
                                    />
                                );
                            // the one that is not there, stopped short of the box it never reaches
                            const t = 0.62;
                            const sx = x1 + (x2 - x1) * t;
                            const sy = y1 + (p.y - 5 - y1) * t;
                            return (
                                <g key={key}>
                                    <line
                                        className="fig-mist dash"
                                        x1={x1}
                                        y1={y1}
                                        x2={sx}
                                        y2={sy}
                                    />
                                    <path
                                        className="fig-mist"
                                        d={`M${sx - 5} ${sy - 5} l10 10 M${
                                            sx + 5
                                        } ${sy - 5} l-10 10`}
                                    />
                                </g>
                            );
                        })
                    )
                )}

                {narrow ? (
                    [
                        "an action game has no position",
                        "graph, so nothing it gives",
                        "reaches the prover",
                    ].map((line, i) => (
                        <text
                            key={line}
                            className="fig-note"
                            x="0"
                            y={railEnd + 52 + i * 16}
                        >
                            {line}
                        </text>
                    ))
                ) : (
                    <text className="fig-note" x="0" y="300">
                        an action game has no position graph, so nothing it
                        gives reaches the prover
                    </text>
                )}
            </Plate>
        </svg>
    );
}

export const GAME_FIGURES = {
    "game-loop": GameLoop,
    "one-renderer": OneRenderer,
};
