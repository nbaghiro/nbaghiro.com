import { Plate, frame, NARROW, useNarrow, WIDE } from "./plate";

/**
 * The figures for "Recovering an order after a restart". The order id is drawn as what it is,
 * a hash over the decision, because the whole recovery story rests on it being derived
 * rather than generated.
 */

function Box({ x, y, w, h, name, note, wash, mono }) {
    return (
        <g>
            {wash && <rect className="fig-wash" x={x} y={y} width={w} height={h} />}
            <rect className="fig-ink" x={x} y={y} width={w} height={h} />
            <text
                className={mono ? "fig-row" : "fig-title sm"}
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

function Arrow({ from, to, label }) {
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
                    x={horizontal ? (x1 + x2) / 2 : x1 + 10}
                    y={horizontal ? y1 - 9 : (y1 + y2) / 2 + 4}
                    textAnchor={horizontal ? "middle" : "start"}
                >
                    {label}
                </text>
            )}
        </g>
    );
}

/* ---- the id is hashed from the decision ---- */

const PARTS = ["session", "symbol", "side", "signal timestamp"];
const DERIVE_LABEL =
    "A signal becomes an order id by hashing the session, symbol, side and signal timestamp. The same decision always derives the same id, and the broker enforces that id's uniqueness on the account.";

function Derive() {
    const narrow = useNarrow();
    if (narrow) {
        const w = NARROW - 40;
        const h = 470;
        return (
            <svg className="fig" viewBox={frame(NARROW, h)} role="img" aria-label={DERIVE_LABEL}>
                <Plate w={NARROW} h={h} ground={[{ y: 426, amp: 8 }]}>
                    <text className="fig-title sm" x={0} y={22}>
                        the decision
                    </text>
                    {PARTS.map((p, i) => (
                        <g key={p}>
                            <rect
                                className="fig-ink"
                                x={0}
                                y={38 + i * 42}
                                width={w}
                                height={32}
                            />
                            <text className="fig-sub" x={14} y={59 + i * 42}>
                                {p}
                            </text>
                        </g>
                    ))}
                    <Arrow from={[w / 2, 206]} to={[w / 2, 244]} label="sha-256" />
                    <Box x={0} y={244} w={w} h={48} name="lt-9f2c4ab1e0d73856" mono wash />
                    <Arrow from={[w / 2, 292]} to={[w / 2, 330]} />
                    <Box
                        x={0}
                        y={330}
                        w={w}
                        h={58}
                        name="the broker"
                        note="rejects a second order with this id"
                    />
                    <text className="fig-sub" x={0} y={412}>
                        the same decision always derives the same id
                    </text>
                </Plate>
            </svg>
        );
    }
    const h = 300;
    const pw = (WIDE - 36) / PARTS.length;
    return (
        <svg className="fig" viewBox={frame(WIDE, h)} role="img" aria-label={DERIVE_LABEL}>
            <Plate w={WIDE} h={h} ground={[{ y: 282, amp: 9 }]}>
                <text className="fig-title sm" x={0} y={22}>
                    the decision
                </text>
                {PARTS.map((p, i) => (
                    <g key={p}>
                        <rect
                            className="fig-ink"
                            x={i * (pw + 12)}
                            y={38}
                            width={pw}
                            height={44}
                        />
                        <text className="fig-sub" x={i * (pw + 12) + 14} y={65}>
                            {p}
                        </text>
                    </g>
                ))}
                <Arrow from={[WIDE / 2, 82]} to={[WIDE / 2, 120]} label="sha-256" />
                <Box x={0} y={120} w={WIDE} h={46} name="lt-9f2c4ab1e0d73856" mono wash />
                <Arrow from={[WIDE / 2, 166]} to={[WIDE / 2, 204]} />
                <Box
                    x={0}
                    y={204}
                    w={WIDE}
                    h={46}
                    name="the broker rejects a second order carrying this id"
                />
                <text className="fig-sub" x={0} y={276}>
                    the client order id can be looked up after a restart
                </text>
            </Plate>
        </svg>
    );
}

/* ---- the three ways a recorded order resolves ---- */

const BRANCHES = [
    {
        q: "carries a broker id",
        a: "recorded order",
        n: ["return the recorded", "order unchanged"],
    },
    {
        q: "pending, broker has it",
        a: "adopt it",
        n: ["the response was lost,", "not the order"],
    },
    {
        q: "pending, broker does not",
        a: "resume the row",
        n: ["lookup returned no match;", "send it on this row"],
    },
];
const RESOLVE_LABEL =
    "On resubmission a recorded order resolves three ways: recorded order and returned as is, found at the broker and adopted, or resumed on the same row when the lookup returns no match.";

function Resolve() {
    const narrow = useNarrow();
    if (narrow) {
        const w = NARROW - 40;
        const h = 530;
        return (
            <svg className="fig" viewBox={frame(NARROW, h)} role="img" aria-label={RESOLVE_LABEL}>
                <Plate w={NARROW} h={h} ground={[{ y: 486, amp: 8 }]}>
                    <Box
                        x={0}
                        y={24}
                        w={w}
                        h={58}
                        name="an order already recorded"
                        note="with this derived id"
                    />
                    <Arrow from={[w / 2, 82]} to={[w / 2, 116]} />
                    {BRANCHES.map((b, i) => (
                        <g key={b.a}>
                            <rect
                                className="fig-wash"
                                x={0}
                                y={116 + i * 116}
                                width={w}
                                height={104}
                            />
                            <rect
                                className="fig-ink"
                                x={0}
                                y={116 + i * 116}
                                width={w}
                                height={104}
                            />
                            <text className="fig-sub" x={14} y={140 + i * 116}>
                                {b.q}
                            </text>
                            <text className="fig-title sm" x={14} y={170 + i * 116}>
                                {b.a}
                            </text>
                            {b.n.map((line, j) => (
                                <text
                                    key={line}
                                    className="fig-note"
                                    x={14}
                                    y={194 + i * 116 + j * 18}
                                >
                                    {line}
                                </text>
                            ))}
                        </g>
                    ))}
                    <text className="fig-sub" x={0} y={474}>
                        lookup errors remain unresolved
                    </text>
                </Plate>
            </svg>
        );
    }
    const h = 300;
    const cw = (WIDE - 36) / 3;
    return (
        <svg className="fig" viewBox={frame(WIDE, h)} role="img" aria-label={RESOLVE_LABEL}>
            <Plate w={WIDE} h={h} ground={[{ y: 282, amp: 9 }]}>
                <Box
                    x={0}
                    y={22}
                    w={WIDE}
                    h={52}
                    name="an order already recorded with this derived id"
                    note="local state alone cannot say whether the broker has it"
                />
                {BRANCHES.map((b, i) => {
                    const x = i * (cw + 18);
                    return (
                        <g key={b.a}>
                            <path
                                className="fig-water"
                                d={`M${WIDE / 2} 74 V98 H${x + cw / 2} V130`}
                            />
                            <path
                                className="fig-water"
                                d={`M${x + cw / 2} 130 l-4 -7 M${x + cw / 2} 130 l4 -7`}
                            />
                            <rect
                                className="fig-wash"
                                x={x}
                                y={130}
                                width={cw}
                                height={108}
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={130}
                                width={cw}
                                height={108}
                            />
                            <text className="fig-sub" x={x + 14} y={156}>
                                {b.q}
                            </text>
                            <text className="fig-title sm" x={x + 14} y={190}>
                                {b.a}
                            </text>
                            {b.n.map((line, j) => (
                                <text
                                    key={line}
                                    className="fig-note"
                                    x={x + 14}
                                    y={214 + j * 18}
                                >
                                    {line}
                                </text>
                            ))}
                        </g>
                    );
                })}
                <text className="fig-sub" x={0} y={272}>
                    lookup errors are not treated as a missing order
                </text>
            </Plate>
        </svg>
    );
}

export const ORDER_FIGURES = {
    derive: Derive,
    resolve: Resolve,
};
