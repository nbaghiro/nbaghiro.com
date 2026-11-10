import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function RoundingBoundary() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 532 : 340;
    const branches = [
        {
            title: "Round each line",
            lines: ["5¢ × 10% = 0.5¢ → 1¢", "5¢ × 10% = 0.5¢ → 1¢"],
            total: "Line tax adds up to 2¢",
            note: "Clientbridge's calculation",
        },
        {
            title: "Round the combined base",
            lines: ["5¢ + 5¢ = 10¢", "10¢ × 10% = 1¢"],
            total: "Combined tax is 1¢",
            note: "A different rounding policy",
        },
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Two five-cent lines at an illustrative ten percent rate. Per-line rounding produces two cents; rounding after combining the lines produces one cent."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    Where the rounding happens
                </text>
                <text className="fig-sub" x="14" y="52">
                    Two lines · illustrative 10% rate
                </text>
                {branches.map((branch, i) => {
                    const x = narrow ? 14 : 14 + i * 414;
                    const y = narrow ? 78 + i * 194 : 78;
                    const bw = narrow ? 308 : 378;
                    return (
                        <g key={branch.title}>
                            <rect
                                className="fig-wash"
                                x={x}
                                y={y}
                                width={bw}
                                height="174"
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={bw}
                                height="174"
                            />
                            <text className="fig-title" x={x + 14} y={y + 28}>
                                {branch.title}
                            </text>
                            {branch.lines.map((line, j) => (
                                <text
                                    key={line}
                                    className="fig-sub"
                                    x={x + 14}
                                    y={y + 57 + j * 25}
                                >
                                    {line}
                                </text>
                            ))}
                            <path
                                className="fig-mist"
                                d={`M${x + 14} ${y + 99}h${bw - 28}`}
                            />
                            <text className="fig-title" x={x + 14} y={y + 126}>
                                {branch.total}
                            </text>
                            <text className="fig-dim" x={x + 14} y={y + 151}>
                                {branch.note}
                            </text>
                        </g>
                    );
                })}
                <text className="fig-sub" x="14" y={h - 53}>
                    The invoice total follows its rounded lines.
                </text>
            </Plate>
        </svg>
    );
}

function IssueBoundary() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 564 : 352;
    const stages = [
        [
            "01 · draft",
            "Current rates + line amounts",
            "Recalculate while eligible",
        ],
        [
            "02 · issue",
            "Store line tax and totals",
            "Post the same result to the ledger",
        ],
        [
            "03 · later views",
            "Payment page + receipt",
            "Read the tax already charged",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="An invoice moves from a recalculable draft to stored line tax at issue. Its payment page and receipt preserve those charged amounts after settings change."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    When the numbers become fixed
                </text>
                <text className="fig-sub" x="14" y="52">
                    The invoice's state controls recalculation.
                </text>
                {stages.map(([title, first, second], i) => {
                    const x = narrow ? 14 : 14 + i * 274;
                    const y = narrow ? 80 + i * 126 : 90;
                    const bw = narrow ? 308 : 246;
                    return (
                        <g key={title}>
                            <rect
                                className="fig-wash"
                                x={x}
                                y={y}
                                width={bw}
                                height="100"
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={bw}
                                height="100"
                            />
                            <text className="fig-title" x={x + 12} y={y + 27}>
                                {title}
                            </text>
                            <text className="fig-sub" x={x + 12} y={y + 54}>
                                {first}
                            </text>
                            <text className="fig-sub" x={x + 12} y={y + 78}>
                                {second}
                            </text>
                            {i < 2 && (
                                <path
                                    className="fig-water"
                                    d={
                                        narrow
                                            ? `M168 ${y + 100}v22m-4 -6 4 6 4-6`
                                            : `M${x + bw} ${y + 50}h24m-6 -4 6 4-6 4`
                                    }
                                />
                            )}
                        </g>
                    );
                })}
                <text className="fig-title" x="14" y={h - 93}>
                    $24.00 + $2.88 = $26.88
                </text>
                <text className="fig-sub" x="14" y={h - 69}>
                    Changing a setting later does not change
                </text>
                <text className="fig-sub" x="14" y={h - 50}>
                    the amount on the issued invoice.
                </text>
            </Plate>
        </svg>
    );
}

export const INVOICE_ARITHMETIC_FIGURES = {
    "invoice-rounding-boundary": RoundingBoundary,
    "invoice-issue-boundary": IssueBoundary,
};
