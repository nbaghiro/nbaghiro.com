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

const FILL_GROUND = {
    wide: [{ y: 312, amp: 9 }],
    narrow: [{ y: 420, amp: 8 }],
};
const FILL_LABEL =
    "Two sleeves trading the same symbol are bunched into one net broker order. The fill returns as a single event, is attributed to the sleeves that asked for it, and expands into balanced postings whose signed amounts sum to zero.";
const FILL_ROWS = [
    { name: "strategy A", note: "buy 70 SPY", wash: false },
    { name: "manual", note: "sell 10 SPY", wash: false },
    { name: "one net order", note: "buy 60 at the broker", wash: true },
    {
        name: "one fill event",
        note: "cumulative qty, average price",
        wash: false,
    },
    {
        name: "balanced postings",
        note: "signed amounts sum to zero",
        wash: true,
    },
];

function FillToLots() {
    const narrow = useNarrow();
    if (narrow) {
        const w = NARROW - 40;
        return (
            <svg
                className="fig"
                viewBox={frame(NARROW, 460)}
                role="img"
                aria-label={FILL_LABEL}
            >
                <Plate w={NARROW} h={460} ground={FILL_GROUND.narrow}>
                    <Cell
                        x={0}
                        y={20}
                        w={141}
                        h={56}
                        name="strategy A"
                        note="buy 70 SPY"
                    />
                    <Cell
                        x={155}
                        y={20}
                        w={141}
                        h={56}
                        name="manual"
                        note="sell 10 SPY"
                    />
                    <path
                        className="fig-water"
                        d={`M70 76 V96 M226 76 V96 M70 96 H226 M${w / 2} 96 V112 M${w / 2} 112 l-4 -7 M${w / 2} 112 l4 -7`}
                    />
                    {FILL_ROWS.slice(2).map((r, i) => (
                        <g key={r.name}>
                            <Cell
                                x={0}
                                y={112 + i * 86}
                                w={w}
                                h={56}
                                name={r.name}
                                note={r.note}
                                wash={r.wash}
                            />
                            {i < FILL_ROWS.length - 3 && (
                                <Flow
                                    from={[w / 2, 168 + i * 86]}
                                    to={[w / 2, 198 + i * 86]}
                                />
                            )}
                        </g>
                    ))}
                    <text className="fig-sub" x="0" y="400">
                        a sell takes the sleeve&rsquo;s own lots first
                    </text>
                </Plate>
            </svg>
        );
    }
    return (
        <svg
            className="fig"
            viewBox={frame(WIDE, 330)}
            role="img"
            aria-label={FILL_LABEL}
        >
            <Plate w={WIDE} h={330} ground={FILL_GROUND.wide}>
                <text className="fig-title" x="0" y="22">
                    one fill, attributed
                </text>
                <Cell
                    x={0}
                    y={44}
                    w={186}
                    h={54}
                    name="strategy A"
                    note="buy 70 SPY"
                />
                <Cell
                    x={0}
                    y={116}
                    w={186}
                    h={54}
                    name="manual"
                    note="sell 10 SPY"
                />
                <path
                    className="fig-water"
                    d="M186 71 H230 M186 143 H230 M230 71 V143 M230 107 H262 M262 107 l-7 -4 M262 107 l-7 4"
                />
                <text className="fig-dim" x="196" y="100">
                    bunched
                </text>
                <Cell
                    x={262}
                    y={80}
                    w={196}
                    h={54}
                    name="one net order"
                    note="buy 60"
                    wash
                />
                <Flow from={[458, 107]} to={[534, 107]} label="the broker" />
                <Cell
                    x={534}
                    y={80}
                    w={286}
                    h={54}
                    name="one fill event"
                    note="cumulative quantity, average price"
                />
                <Flow from={[677, 134]} to={[677, 196]} />
                <Cell
                    x={0}
                    y={196}
                    w={WIDE}
                    h={62}
                    name="balanced postings"
                    note="cash, position at cost, realized profit and loss; signed amounts sum to zero"
                    wash
                />
                <text className="fig-sub" x="0" y="294">
                    lots are projected from the log, and a sell takes the
                    sleeve&rsquo;s own lots first in, first out
                </text>
            </Plate>
        </svg>
    );
}

export const SLEEVE_FIGURES = {
    "one-account": OneAccount,
    "fill-to-lots": FillToLots,
};
