import { NARROW, Plate, frame, useNarrow, WIDE } from "./plate";

/**
 * The figures for the Lumischool verifier post, in the language the figures module sets:
 * hairline boxes over a water wash, the page's own two typefaces, no other colour.
 */

/* ---- one item, and the versions its parameters produce ---- */

// story.apples-to-ten as the corpus holds it: n from 3 to 8, and the answer 10 - n.
const WALKED = [3, 4, 5, 6, 7, 8].map((n) => ({ n, answer: 10 - n }));

const FAN_GROUND = {
    wide: [{ y: 348, amp: 9 }],
    narrow: [{ y: 578, amp: 8 }],
};

function Card({ x, y, w, h, title, lines }) {
    return (
        <g>
            <rect className="fig-wash" x={x} y={y} width={w} height={h} />
            <rect className="fig-ink" x={x} y={y} width={w} height={h} />
            <text className="fig-title sm" x={x + 14} y={y + 26}>
                {title}
            </text>
            {lines.map((line, i) => (
                <text
                    key={line}
                    className="fig-sub"
                    x={x + 14}
                    y={y + 50 + i * 18}
                >
                    {line}
                </text>
            ))}
        </g>
    );
}

function Tile({ x, y, w, h, top, bottom, marked }) {
    return (
        <g>
            <rect
                className={marked ? "fig-wash strong" : "fig-wash"}
                x={x}
                y={y}
                width={w}
                height={h}
            />
            <rect
                className={marked ? "fig-water" : "fig-mist"}
                x={x}
                y={y}
                width={w}
                height={h}
            />
            <text
                className="fig-sub"
                x={x + w / 2}
                y={y + 19}
                textAnchor="middle"
            >
                {top}
            </text>
            <text
                className="fig-title sm"
                x={x + w / 2}
                y={y + 39}
                textAnchor="middle"
            >
                {bottom}
            </text>
        </g>
    );
}

// Hairlines from one card to the column of versions it produces.
function Fan({ from, to, count, spread }) {
    return (
        <g>
            {Array.from({ length: count }, (_, i) => (
                <line
                    key={i}
                    className="fig-mist"
                    x1={from[0]}
                    y1={from[1]}
                    x2={to[0]}
                    y2={
                        to[1] -
                        spread / 2 +
                        (count === 1 ? 0.5 : i / (count - 1)) * spread
                    }
                />
            ))}
        </g>
    );
}

function VariantFan() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 602 } : { w: WIDE, h: 372 };
    const tw = narrow ? 100 : 108;
    const th = 50;
    const gap = narrow ? 12 : 16;
    const colX = narrow ? 0 : 332;
    const cardW = narrow ? NARROW : 290;
    const rowY = narrow ? 170 : 30;
    const band = narrow ? 350 : 212;
    const sampleTiles = narrow ? 2 : 3;
    const stripX = colX + sampleTiles * (tw + gap);

    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="An item with one parameter from three to eight produces six versions, and all six are built and checked. An item allowing around 64 million combinations is over the walk limit and is checked through a seeded sample of 400."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={FAN_GROUND[narrow ? "narrow" : "wide"]}
            >
                <text className="fig-title" x="0" y="14">
                    walked
                </text>
                <Card
                    x={0}
                    y={narrow ? 28 : 30}
                    w={cardW}
                    h={narrow ? 108 : 112}
                    title="story.apples-to-ten"
                    lines={[
                        "let n = 3..8",
                        "answer (10 − n)",
                        "6 combinations allowed",
                    ]}
                />
                {!narrow && (
                    <Fan
                        from={[cardW, 86]}
                        to={[colX - 12, 86]}
                        count={6}
                        spread={98}
                    />
                )}
                {WALKED.map((v, i) => (
                    <Tile
                        key={v.n}
                        x={colX + (i % 3) * (tw + gap)}
                        y={rowY + Math.floor(i / 3) * (th + gap)}
                        w={tw}
                        h={th}
                        top={`n = ${v.n}`}
                        bottom={String(v.answer)}
                        marked={false}
                    />
                ))}
                <text
                    className="fig-note"
                    x={colX}
                    y={rowY + 2 * (th + gap) + 14}
                >
                    all six built and checked
                </text>

                <line
                    className="fig-mist dash"
                    x1="0"
                    y1={band - 22}
                    x2={box.w}
                    y2={band - 22}
                />
                <text className="fig-title" x="0" y={band - 2}>
                    sampled
                </text>
                <Card
                    x={0}
                    y={band + 12}
                    w={cardW}
                    h={narrow ? 108 : 112}
                    title="columns.add"
                    lines={[
                        "four parameters",
                        "~64,000,000 allowed",
                        "over the 10,000 walk limit",
                    ]}
                />
                {!narrow && (
                    <Fan
                        from={[cardW, band + 68]}
                        to={[colX - 12, band + 68]}
                        count={4}
                        spread={56}
                    />
                )}
                {Array.from({ length: sampleTiles }, (_, i) => (
                    <Tile
                        key={i}
                        x={colX + i * (tw + gap)}
                        y={narrow ? band + 134 : band + 42}
                        w={tw}
                        h={th}
                        top="drawn"
                        bottom="checked"
                        marked
                    />
                ))}
                <rect
                    className="fig-mist dash"
                    x={stripX}
                    y={narrow ? band + 134 : band + 42}
                    width={box.w - stripX}
                    height={th}
                />
                <text
                    className="fig-note"
                    x={colX}
                    y={(narrow ? band + 134 : band + 42) + th + 16}
                >
                    400 drawn from a fixed seed, the rest not visited
                </text>
            </Plate>
        </svg>
    );
}

/* ---- the hint that is also true of the correct answer ---- */

const PAIRS = [3, 4, 5, 6, 7, 8].map((n) => ({ n, right: 10 - n, hint: n }));

const OVERLAP_GROUND = {
    wide: [{ y: 274, amp: 8 }],
    narrow: [{ y: 306, amp: 7 }],
};

function HintOverlap() {
    const narrow = useNarrow();
    const box = narrow ? { w: NARROW, h: 330 } : { w: WIDE, h: 296 };
    const cw = narrow ? 48 : 92;
    const gap = narrow ? 7 : 16;
    const left = narrow ? 0 : 172;
    const rowA = narrow ? 88 : 92;
    const rowB = narrow ? 170 : 186;
    const ch = 46;

    return (
        <svg
            className="fig"
            viewBox={frame(box.w, box.h)}
            role="img"
            aria-label="For each version of the item the correct answer is ten minus n, while the hint matches an answer of n. At n equals five the two values are the same, so the hint would fire on a correct answer."
        >
            <Plate
                w={box.w}
                h={box.h}
                ground={OVERLAP_GROUND[narrow ? "narrow" : "wide"]}
            >
                <text className="fig-title" x="0" y="14">
                    story.apples-to-ten
                </text>
                <text className="fig-sub" x="0" y={narrow ? 34 : 36}>
                    {narrow
                        ? "when (answer == n)"
                        : "when (answer == n) say “That is how many she has now.”"}
                </text>

                {!narrow && (
                    <>
                        <text className="fig-sub" x="0" y={rowA + 28}>
                            correct answer, 10 − n
                        </text>
                        <text className="fig-sub" x="0" y={rowB + 28}>
                            the hint matches answer = n
                        </text>
                    </>
                )}
                {narrow && (
                    <>
                        <text className="fig-sub" x="0" y={rowA - 28}>
                            correct answer, 10 − n
                        </text>
                        <text className="fig-sub" x="0" y={rowB - 12}>
                            the hint matches, answer = n
                        </text>
                    </>
                )}

                {PAIRS.map((p, i) => {
                    const x = left + i * (cw + gap);
                    const same = p.right === p.hint;
                    return (
                        <g key={p.n}>
                            <text
                                className={narrow ? "fig-note" : "fig-sub"}
                                x={x + cw / 2}
                                y={rowA - 10}
                                textAnchor="middle"
                            >
                                {narrow ? p.n : `n = ${p.n}`}
                            </text>
                            <rect
                                className={
                                    same ? "fig-wash strong" : "fig-wash"
                                }
                                x={x}
                                y={rowA}
                                width={cw}
                                height={ch}
                            />
                            <rect
                                className={same ? "fig-water" : "fig-mist"}
                                x={x}
                                y={rowA}
                                width={cw}
                                height={ch}
                            />
                            <text
                                className="fig-title sm"
                                x={x + cw / 2}
                                y={rowA + 29}
                                textAnchor="middle"
                            >
                                {p.right}
                            </text>

                            <rect
                                className={
                                    same ? "fig-wash strong" : "fig-wash"
                                }
                                x={x}
                                y={rowB}
                                width={cw}
                                height={ch}
                            />
                            <rect
                                className={same ? "fig-water" : "fig-mist"}
                                x={x}
                                y={rowB}
                                width={cw}
                                height={ch}
                            />
                            <text
                                className="fig-title sm"
                                x={x + cw / 2}
                                y={rowB + 29}
                                textAnchor="middle"
                            >
                                {p.hint}
                            </text>

                            {same && !narrow && (
                                <line
                                    className="fig-water"
                                    x1={x + cw / 2}
                                    y1={rowA + ch}
                                    x2={x + cw / 2}
                                    y2={rowB}
                                />
                            )}
                        </g>
                    );
                })}

                {narrow ? (
                    <>
                        <text className="fig-note" x="0" y={rowB + ch + 28}>
                            at n = 5 the hint fires on a
                        </text>
                        <text className="fig-note" x="0" y={rowB + ch + 44}>
                            correct answer, and the verifier
                        </text>
                        <text className="fig-note" x="0" y={rowB + ch + 60}>
                            reports it
                        </text>
                    </>
                ) : (
                    <text className="fig-note" x="0" y={rowB + ch + 34}>
                        at n = 5 the hint fires on a correct answer, and the
                        verifier reports it
                    </text>
                )}
            </Plate>
        </svg>
    );
}

export const VARIANT_FIGURES = {
    "variant-fan": VariantFan,
    "hint-overlap": HintOverlap,
};
