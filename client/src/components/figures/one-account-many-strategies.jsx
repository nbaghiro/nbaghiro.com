import { Plate, frame, NARROW, useNarrow, WIDE } from "./plate";

/**
 * The figures for "One brokerage account, several strategies". Cell and Flow repeat the
 * box and arrow the figures module keeps private, so this post owns its own drawing
 * rather than reaching into that file.
 */

function Cell({ x, y, w, h, name, note, wash }) {
    return (
        <g>
            {wash && (
                <rect className="fig-wash" x={x} y={y} width={w} height={h} />
            )}
            <rect className="fig-ink" x={x} y={y} width={w} height={h} />
            <text
                className="fig-title sm"
                x={x + 14}
                y={y + (note ? 25 : h / 2 + 6)}
            >
                {name}
            </text>
            {note && (
                <text className="fig-sub" x={x + 14} y={y + 43}>
                    {note}
                </text>
            )}
        </g>
    );
}

function Flow({ from, to, label }) {
    const [x1, y1] = from;
    const [x2, y2] = to;
    const horizontal = y1 === y2;
    const head = horizontal
        ? `M${x2} ${y2} l-7 -4 M${x2} ${y2} l-7 4`
        : `M${x2} ${y2} l-4 ${y2 > y1 ? -7 : 7} M${x2} ${y2} l4 ${y2 > y1 ? -7 : 7}`;
    return (
        <g>
            <path className="fig-water" d={`M${x1} ${y1} H${x2} V${y2}`} />
            <path className="fig-water" d={head} />
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

/* ---- one account, several sleeves ---- */

const SLEEVES = [
    { name: "unallocated", note: "free cash", held: null },
    { name: "manual", note: "hand traded", held: "SPY 10" },
    { name: "unmanaged", note: "from outside", held: null },
    { name: "strategy A", note: "allocated capital", held: "SPY 70" },
    { name: "strategy B", note: "allocated capital", held: null },
];
const ACCOUNT_GROUND = {
    wide: [{ y: 292, amp: 9 }],
    narrow: [{ y: 516, amp: 8 }],
};
const ACCOUNT_LABEL =
    "One brokerage account partitioned into sleeves: unallocated cash, a manual bucket, holdings that arrived from outside, and one sleeve per running strategy. The same symbol sits in two of them, and the broker reports only their sum.";

function OneAccount() {
    const narrow = useNarrow();
    if (narrow) {
        const w = NARROW - 40;
        return (
            <svg
                className="fig"
                viewBox={frame(NARROW, 560)}
                role="img"
                aria-label={ACCOUNT_LABEL}
            >
                <Plate w={NARROW} h={560} ground={ACCOUNT_GROUND.narrow}>
                    <Cell
                        x={0}
                        y={30}
                        w={w}
                        h={56}
                        name="the broker account"
                        note="one position per symbol"
                    />
                    <text className="fig-dim" x={w} y="22" textAnchor="end">
                        SPY 80
                    </text>
                    <Flow from={[w / 2, 86]} to={[w / 2, 124]} />
                    {SLEEVES.map((s, i) => (
                        <g key={s.name}>
                            <Cell
                                x={0}
                                y={124 + i * 70}
                                w={w}
                                h={56}
                                name={s.name}
                                note={s.note}
                                wash={Boolean(s.held)}
                            />
                            {s.held && (
                                <text
                                    className="fig-dim"
                                    x={w - 14}
                                    y={124 + i * 70 + 34}
                                    textAnchor="end"
                                >
                                    {s.held}
                                </text>
                            )}
                        </g>
                    ))}
                    <text className="fig-sub" x="0" y="496">
                        the broker sees only the sum
                    </text>
                </Plate>
            </svg>
        );
    }
    const cw = 150;
    const gap = (WIDE - cw * SLEEVES.length) / (SLEEVES.length - 1);
    return (
        <svg
            className="fig"
            viewBox={frame(WIDE, 310)}
            role="img"
            aria-label={ACCOUNT_LABEL}
        >
            <Plate w={WIDE} h={310} ground={ACCOUNT_GROUND.wide}>
                <text className="fig-title" x="0" y="22">
                    one account
                </text>
                <Cell
                    x={0}
                    y={40}
                    w={WIDE}
                    h={58}
                    name="the broker account"
                    note="one position per symbol, one cash balance"
                />
                <text className="fig-dim" x={WIDE - 14} y="74" textAnchor="end">
                    SPY 80
                </text>
                <path
                    className="fig-water"
                    d={`M${WIDE / 2} 98 V120 M${cw / 2} 120 H${WIDE - cw / 2}`}
                />
                {SLEEVES.map((s, i) => {
                    const mid = i * (cw + gap) + cw / 2;
                    return (
                        <path
                            key={`stem-${s.name}`}
                            className="fig-water"
                            d={`M${mid} 120 V142 M${mid} 142 l-4 -7 M${mid} 142 l4 -7`}
                        />
                    );
                })}
                <text className="fig-dim" x={WIDE / 2 + 10} y="112">
                    attributed into sleeves
                </text>
                {SLEEVES.map((s, i) => (
                    <g key={s.name}>
                        <Cell
                            x={i * (cw + gap)}
                            y={142}
                            w={cw}
                            h={74}
                            name={s.name}
                            note={s.note}
                            wash={Boolean(s.held)}
                        />
                        {s.held && (
                            <text
                                className="fig-dim"
                                x={i * (cw + gap) + 14}
                                y={240}
                            >
                                {s.held}
                            </text>
                        )}
                    </g>
                ))}
                <text className="fig-sub" x="0" y="276">
                    the same symbol can sit in more than one sleeve, and only
                    the sleeve that opened a holding may close it
                </text>
            </Plate>
        </svg>
    );
}

/* ---- a fill, attributed back ---- */

function FillToLots() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 420 : 280;
    const cellW = narrow ? NARROW - 16 : 370;
    const secondX = narrow ? 0 : 430;
    const secondY = narrow ? 218 : 54;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Two separate contracts: the netting plan combines a buy of seventy shares and a sell of ten into a net buy of sixty. Fill accounting deduplicates a cumulative terminal-fill record before projecting ledger balances. The netting function does not set an internal settlement price."
        >
            <Plate w={w} h={h} ground={[{ y: h - 12, amp: 8 }]}>
                <text className="fig-title" x="0" y="20">
                    plan and accounting
                </text>
                <Cell
                    x={0}
                    y={54}
                    w={cellW}
                    h={62}
                    name="netting plan"
                    note="buy 70 SPY + sell 10 SPY"
                    wash
                />
                <Flow from={[cellW / 2, 116]} to={[cellW / 2, 140]} />
                <Cell
                    x={0}
                    y={140}
                    w={cellW}
                    h={54}
                    name="net broker quantity"
                    note="buy 60; keep both sleeve allocations"
                />
                <Cell
                    x={secondX}
                    y={secondY}
                    w={cellW}
                    h={62}
                    name="terminal-fill record"
                    note="cumulative quantity and average price"
                />
                <Flow
                    from={[secondX + cellW / 2, secondY + 62]}
                    to={[secondX + cellW / 2, secondY + 86]}
                />
                <Cell
                    x={secondX}
                    y={secondY + 86}
                    w={cellW}
                    h={54}
                    name="ledger projection"
                    note="deduplicate the event; derive balances"
                    wash
                />
                <text className="fig-sub" x="0" y={narrow ? 390 : 240}>
                    {narrow
                        ? "Internal settlement still needs a price."
                        : "The netting function chooses quantities, not an internal settlement price."}
                </text>
            </Plate>
        </svg>
    );
}

export const SLEEVE_FIGURES = {
    "one-account": OneAccount,
    "fill-to-lots": FillToLots,
};
