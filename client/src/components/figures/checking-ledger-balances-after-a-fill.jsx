import { Plate, frame, NARROW, WIDE, useNarrow } from "./plate";

function Box({ x, y, w, title, lines, active = false }) {
    const h = 48 + lines.length * 21;
    return (
        <g>
            <rect
                className={active ? "fig-wash strong" : "fig-wash"}
                x={x}
                y={y}
                width={w}
                height={h}
                rx="3"
            />
            <rect className="fig-ink" x={x} y={y} width={w} height={h} rx="3" />
            <text className="fig-title" x={x + 14} y={y + 27}>
                {title}
            </text>
            {lines.map((line, i) => (
                <text
                    key={line}
                    className="fig-sub"
                    x={x + 14}
                    y={y + 51 + i * 21}
                >
                    {line}
                </text>
            ))}
        </g>
    );
}
function Down({ x, y, to }) {
    return (
        <path className="fig-water" d={`M${x} ${y} V${to} m-4 -7 l4 7 4 -7`} />
    );
}
function BalanceCard({ x, y, w, title, rows, active = false }) {
    return (
        <g>
            <rect
                className={active ? "fig-wash strong" : "fig-wash"}
                x={x}
                y={y}
                width={w}
                height={128}
                rx="3"
            />
            <rect
                className="fig-ink"
                x={x}
                y={y}
                width={w}
                height={128}
                rx="3"
            />
            <text className="fig-title" x={x + 14} y={y + 27}>
                {title}
            </text>
            {rows.map(([label, amount], i) => (
                <g key={label}>
                    <text className="fig-sub" x={x + 14} y={y + 55 + i * 26}>
                        {label}
                    </text>
                    <text
                        className="fig-note"
                        textAnchor="end"
                        x={x + w - 14}
                        y={y + 55 + i * 26}
                    >
                        {amount}
                    </text>
                </g>
            ))}
        </g>
    );
}
function TwoChecks() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 645 : 390;
    const bw = narrow ? 304 : 366,
        right = narrow ? 16 : 438,
        secondY = narrow ? 338 : 80;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="A 1200 dollar buy has cash minus 1200 and position cost plus 1200, totaling zero. Starting with 1000 cash leaves negative 200 and triggers a sleeve violation."
        >
            <Plate w={w} h={h} ground={[]}>
                <text className="fig-note" x={16} y={35}>
                    One buy · 12 shares at $100 · no fees
                </text>
                <BalanceCard
                    x={16}
                    y={80}
                    w={bw}
                    title="Event postings"
                    rows={[
                        ["Cash movement", "−$1,200"],
                        ["Position cost", "+$1,200"],
                        ["Total", "$0"],
                    ]}
                />
                <text className="fig-dim" x={30} y={226}>
                    Posting balance passes
                </text>
                <BalanceCard
                    x={right}
                    y={secondY}
                    w={bw}
                    title="Projected cash"
                    rows={[
                        ["Starting cash", "$1,000"],
                        ["Cash movement", "−$1,200"],
                        ["Resulting cash", "−$200"],
                    ]}
                    active
                />
                <text className="fig-dim" x={right + 14} y={secondY + 146}>
                    negative_cash violation
                </text>
                <text className="fig-note" x={16} y={h - 64}>
                    Check the movement and the resulting balance.
                </text>
                <text className="fig-sub" x={16} y={h - 42}>
                    Illustrative amounts, checked against the ledger code.
                </text>
            </Plate>
        </svg>
    );
}
function Lane({ x, y, w, fill }) {
    const labels = fill
        ? [
              ["Recordable broker fill", ["Trade has already occurred"]],
              ["Append and project", ["Check the affected sleeve"]],
              [
                  "Violation: freeze sleeve",
                  ["Keep fill · record reason · commit"],
              ],
          ]
        : [
              ["Cash transfer request", ["Proposed local operation"]],
              ["Plan, append and project", ["Check sleeves and account"]],
              ["Violation: raise error", ["No successful commit · roll back"]],
          ];
    return (
        <g>
            {labels.map(([title, lines], i) => (
                <g key={title}>
                    <Box
                        x={x}
                        y={y + i * 116}
                        w={w}
                        title={title}
                        lines={lines}
                        active={i === 2}
                    />
                    {i < 2 && (
                        <Down
                            x={x + w / 2}
                            y={y + i * 116 + 69}
                            to={y + (i + 1) * 116}
                        />
                    )}
                </g>
            ))}
        </g>
    );
}
function WritePaths() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 830 : 440;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="A failing cash-transfer request rolls back before commit. A recordable fill with an invalid resulting sleeve is retained and committed with a freeze."
        >
            <Plate w={w} h={h} ground={[]}>
                <Lane x={16} y={38} w={narrow ? 304 : 366} />
                <Lane
                    x={narrow ? 16 : 438}
                    y={narrow ? 415 : 38}
                    w={narrow ? 304 : 366}
                    fill
                />
                <text className="fig-sub" x={16} y={h - 43}>
                    A freeze records the incident; it does not repair cash.
                </text>
            </Plate>
        </svg>
    );
}
function RepeatedFill() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 760 : 460;
    const bw = narrow ? 304 : 366,
        right = narrow ? 16 : 438;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="The first fill creates one economic event and, if needed, a freeze event. Redelivery with the same ID does not add another movement. A frozen sleeve fails the subsequent order risk check."
        >
            <Plate w={w} h={h} ground={[]}>
                <Box
                    x={16}
                    y={38}
                    w={bw}
                    title="First delivery"
                    lines={[
                        "Client order ID → fill event ID",
                        "Append economic event",
                        "Violation → freeze event + status",
                    ]}
                />
                <Box
                    x={right}
                    y={narrow ? 213 : 38}
                    w={bw}
                    title="Repeated delivery"
                    lines={[
                        "Same fill event ID",
                        "Insert conflict → existing event",
                        "Already frozen → no second freeze",
                    ]}
                />
                {narrow ? (
                    <Down x={168} y={324} to={408} />
                ) : (
                    <path
                        className="fig-water"
                        d="M199 149 V205 H621 V149 M410 205 V250 m-4 -7 l4 7 4 -7"
                    />
                )}
                <Box
                    x={narrow ? 16 : 180}
                    y={narrow ? 408 : 250}
                    w={narrow ? 304 : 460}
                    title="Subsequent order request"
                    lines={[
                        "Read sleeve status",
                        "FROZEN → reject buy or sell",
                    ]}
                    active
                />
                <text className="fig-note" x={16} y={h - 86}>
                    No second cash movement for the same event ID.
                </text>
                <text className="fig-sub" x={16} y={h - 64}>
                    The freeze does not reverse a completed trade
                </text>
                <text className="fig-sub" x={16} y={h - 43}>
                    or cancel every outstanding broker order.
                </text>
            </Plate>
        </svg>
    );
}
export const LEDGER_CHECK_FIGURES = {
    "ledger-two-checks": TwoChecks,
    "ledger-write-paths": WritePaths,
    "ledger-repeated-fill": RepeatedFill,
};
