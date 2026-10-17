import { frame, NARROW, Plate, useNarrow, WIDE } from "./plate";

/**
 * The figures for the comment-anchor post. A thread is drawn as the chip the rail shows, and the
 * range it covers as the water rule the editor draws over commented text. Words are laid out from
 * one measurement so the rule and its wash always agree.
 */

const CHAR = 0.54; // of the font size, close enough for the display face at these sizes

function row(words, size, gap) {
    let x = 0;
    return words.map((text) => {
        const w = text.length * size * CHAR;
        const at = { text, x, w };
        x += w + gap;
        return at;
    });
}

// The marked run: one wash behind the words, and the rule with its two offsets under them.
function Run({ cells, first, last, y, size, from, to }) {
    const a = cells[first];
    const b = cells[last];
    const x1 = a.x - 4;
    const x2 = b.x + b.w + 4;
    const tick = size * 0.72;
    return (
        <g>
            <rect
                className="fig-wash strong"
                x={x1}
                y={y - size - 1}
                width={x2 - x1}
                height={size + 9}
            />
            <path
                className="fig-water"
                d={`M${x1} ${y + 13} H${x2} M${x1} ${y + 9} v8 M${x2} ${y + 9} v8`}
            />
            <text
                className="fig-dim"
                x={x1}
                y={y + 30}
                textAnchor="middle"
                fontSize={tick}
            >
                {from}
            </text>
            <text
                className="fig-dim"
                x={x2}
                y={y + 30}
                textAnchor="middle"
                fontSize={tick}
            >
                {to}
            </text>
        </g>
    );
}

function Sentence({ cells, y, size, dim }) {
    return (
        <g>
            {cells.map((c) => (
                <text
                    key={c.text + c.x}
                    x={c.x}
                    y={y}
                    fontSize={size}
                    fontFamily="var(--font-display)"
                    style={{
                        fill:
                            dim === c.text ? "var(--ink-faint)" : "var(--ink)",
                    }}
                >
                    {c.text}
                </text>
            ))}
        </g>
    );
}

const BEFORE = ["the", "kitchen", "is", "ready"];
const AFTER = ["the", "kitchen", "is", "almost", "ready"];
const LABEL =
    "A comment mark covering the word ready at offsets 15 to 20. Seven characters are typed in front of it, the diff names one replaced span at 15, and the mark is spliced to 22 to 27, still covering the same word.";

// What diffRange names for this edit, drawn to one scale: a common prefix, an inserted span, a
// common suffix. Only the wide layout has room for it.
function DiffPanel({ x, y }) {
    const u = 11; // units per character
    const prefix = 15 * u;
    const insert = 7 * u;
    const suffix = 5 * u;
    const h = 24;
    const band = (bx, by, w, cls) => (
        <rect className={cls} x={bx} y={by} width={w} height={h} />
    );
    return (
        <g>
            <text className="fig-title sm" x={x} y={y}>
                what the diff names
            </text>
            <text className="fig-sub" x={x} y={y + 18}>
                one replaced span, found from both ends
            </text>

            <text className="fig-row" x={x} y={y + 50}>
                before, 20
            </text>
            {band(x, y + 58, prefix, "fig-wash")}
            {band(x + prefix, y + 58, suffix, "fig-wash")}
            <path
                className="fig-ink"
                d={`M${x} ${y + 58} h${prefix + suffix} v${h} h${-(prefix + suffix)} Z M${x + prefix} ${y + 58} v${h}`}
            />

            <text className="fig-row" x={x} y={y + 112}>
                after, 27
            </text>
            {band(x, y + 120, prefix, "fig-wash")}
            {band(x + prefix, y + 120, insert, "fig-wash strong")}
            {band(x + prefix + insert, y + 120, suffix, "fig-wash")}
            <path
                className="fig-ink"
                d={`M${x} ${y + 120} h${prefix + insert + suffix} v${h} h${-(prefix + insert + suffix)} Z M${x + prefix} ${y + 120} v${h} M${x + prefix + insert} ${y + 120} v${h}`}
            />

            <path
                className="fig-mist dash"
                d={`M${x + prefix} ${y + 82} V${y + 120}`}
            />
            <text
                className="fig-dim"
                x={x + prefix + insert / 2}
                y={y + 112}
                textAnchor="middle"
            >
                inserted, 7
            </text>
            <text className="fig-sub" x={x} y={y + 162}>
                common prefix, 15
            </text>
            <text
                className="fig-sub"
                x={x + prefix + insert + suffix}
                y={y + 162}
                textAnchor="end"
            >
                common suffix, 5
            </text>
        </g>
    );
}

function MarkRebase() {
    const narrow = useNarrow();
    const size = narrow ? 13 : 17;
    const gap = narrow ? 8 : 10;
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 330 : 318;
    const before = row(BEFORE, size, gap);
    const after = row(AFTER, size, gap);
    const yA = narrow ? 76 : 82;
    const yB = narrow ? 214 : 240;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label={LABEL}
        >
            <Plate w={w} h={h} ground={[{ y: h - 40, amp: 7 }]}>
                <text className="fig-note" x="0" y="26">
                    before the edit
                </text>
                <Run
                    cells={before}
                    first={3}
                    last={3}
                    y={yA}
                    size={size}
                    from="15"
                    to="20"
                />
                <Sentence cells={before} y={yA} size={size} />
                <text
                    className="fig-row"
                    x={narrow ? NARROW : 300}
                    y={yA}
                    textAnchor={narrow ? "end" : "start"}
                >
                    mark at 15 to 20
                </text>

                <path className="fig-water" d={`M14 ${yA + 48} V${yB - 76}`} />
                <path
                    className="fig-head"
                    stroke="none"
                    d={`M14 ${yB - 70} l-4.5 -8 h9 Z`}
                />
                <text className="fig-note" x="32" y={yA + 76}>
                    seven characters typed in front of it
                </text>

                <text className="fig-note" x="0" y={yB - 44}>
                    after the edit
                </text>
                <Run
                    cells={after}
                    first={4}
                    last={4}
                    y={yB}
                    size={size}
                    from="22"
                    to="27"
                />
                <Sentence cells={after} y={yB} size={size} dim="almost" />
                <text
                    className="fig-row"
                    x={narrow ? NARROW : 300}
                    y={yB}
                    textAnchor={narrow ? "end" : "start"}
                >
                    mark at 22 to 27
                </text>

                {narrow ? (
                    <text className="fig-dim" x="0" y={h - 52}>
                        every offset at or after 15 moves by 7
                    </text>
                ) : (
                    <>
                        <path className="fig-mist" d={`M452 10 V${h - 46}`} />
                        <DiffPanel x={500} y={30} />
                        <text className="fig-dim" x="500" y={h - 52}>
                            every offset at or after 15 moves by 7
                        </text>
                    </>
                )}
            </Plate>
        </svg>
    );
}

// A thread as the rail draws it. Once it is an orphan the chip carries the stored quote.
function Chip({ x, y, quote }) {
    const w = quote ? 96 : 32;
    return (
        <g>
            <rect
                className="fig-wash strong"
                x={x}
                y={y}
                width={w}
                height={26}
            />
            <rect className="fig-ink" x={x} y={y} width={w} height={26} />
            <path
                className="fig-water"
                d={`M${x + 9} ${y + 10} h14 M${x + 9} ${y + 17} h9`}
            />
            {quote && (
                <text className="fig-sub" x={x + 32} y={y + 17}>
                    the quote
                </text>
            )}
        </g>
    );
}

// One rung: the element as it still stands, and the furthest the thread still reaches into it.
function Step({ x, y, w, name, note, state }) {
    const orphan = state === "orphan";
    const boxW = w - (orphan ? 112 : 46);
    const chipX = x + w - 32 - (orphan ? 64 : 0);
    const tail = state === "text" ? x + 58 : x + boxW;
    return (
        <g>
            <text className="fig-title sm" x={x} y={y - 26}>
                {name}
            </text>
            <text className="fig-sub" x={x} y={y - 10}>
                {note}
            </text>
            <rect
                className={orphan ? "fig-mist dash" : "fig-ink"}
                x={x}
                y={y}
                width={boxW}
                height={64}
            />
            <g className="fig-bars">
                <line x1={x + 12} y1={y + 22} x2={x + boxW - 18} y2={y + 22} />
                <line x1={x + 12} y1={y + 38} x2={x + boxW - 44} y2={y + 38} />
            </g>
            {state === "text" && (
                <path
                    className="fig-water"
                    d={`M${x + 12} ${y + 28} H${x + 58} M${x + 12} ${y + 24} v8 M${x + 58} ${y + 24} v8`}
                />
            )}
            {!orphan && (
                <path
                    className="fig-mist dash"
                    d={`M${tail} ${y + 32} H${chipX}`}
                />
            )}
            <Chip x={chipX} y={y + 19} quote={orphan} />
        </g>
    );
}

const STEPS = [
    { name: "text", note: "element and mark present", state: "text" },
    { name: "element", note: "the phrase was deleted", state: "element" },
    { name: "orphan", note: "the element left the tree", state: "orphan" },
];

const DEGRADE_LABEL =
    "Three states of one thread: live on a text range, fallen back to the element after the phrase is deleted, and orphaned with only its quote once the element is gone.";

function AnchorDegrade() {
    const narrow = useNarrow();
    if (narrow) {
        const w = NARROW;
        const h = 402;
        return (
            <svg
                className="fig"
                viewBox={frame(w, h)}
                role="img"
                aria-label={DEGRADE_LABEL}
            >
                <Plate w={w} h={h} ground={[{ y: h - 34, amp: 7 }]}>
                    {STEPS.map((s, i) => (
                        <Step
                            key={s.name}
                            x={0}
                            y={56 + i * 118}
                            w={w}
                            name={s.name}
                            note={s.note}
                            state={s.state}
                        />
                    ))}
                </Plate>
            </svg>
        );
    }
    const w = WIDE;
    const h = 216;
    const col = 258;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label={DEGRADE_LABEL}
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 8 }]}>
                {STEPS.map((s, i) => (
                    <Step
                        key={s.name}
                        x={i * (col + 23)}
                        y={74}
                        w={col}
                        name={s.name}
                        note={s.note}
                        state={s.state}
                    />
                ))}
                <text className="fig-dim" x="0" y={h - 48}>
                    the row and its replies are unchanged in all three
                </text>
            </Plate>
        </svg>
    );
}

export const ANCHOR_FIGURES = {
    "mark-rebase": MarkRebase,
    "anchor-degrade": AnchorDegrade,
};
