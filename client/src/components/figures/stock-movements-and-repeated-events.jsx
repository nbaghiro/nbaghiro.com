import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function StockRepeatFlow() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 600 : 390;
    const rows = [
        {
            label: "first settlement",
            key: "line 42 · sale · −2",
            result: "new movement",
            count: "5 → 3",
            note: "insert succeeds; subtract two",
        },
        {
            label: "repeated settlement",
            key: "line 42 · sale · −2",
            result: "existing movement",
            count: "3 → 3",
            note: "insert conflicts; keep the count",
        },
        {
            label: "full refund",
            key: "line 42 · refund · +2",
            result: "new movement",
            count: "3 → 5",
            note: "different reason; add two back",
        },
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Stock starts at five. A new sale movement reduces it to three. A repeated sale leaves it at three. A full refund movement restores five."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    one movement per line and reason
                </text>
                <text className="fig-sub" x="14" y="52">
                    the insert result controls the count
                </text>
                {rows.map((r, i) => {
                    const y = 82 + i * (narrow ? 155 : 85);
                    return (
                        <g key={r.label}>
                            <rect
                                className="fig-wash"
                                x="14"
                                y={y}
                                width={w - 28}
                                height={narrow ? 137 : 72}
                            />
                            <rect
                                className="fig-ink"
                                x="14"
                                y={y}
                                width={w - 28}
                                height={narrow ? 137 : 72}
                            />
                            <text className="fig-title" x="28" y={y + 26}>
                                {r.label}
                            </text>
                            <text className="fig-sub" x="28" y={y + 48}>
                                {r.key}
                            </text>
                            <text
                                className="fig-title"
                                x={narrow ? 28 : 320}
                                y={y + (narrow ? 78 : 28)}
                            >
                                {r.result}
                            </text>
                            <text
                                className="fig-sub"
                                x={narrow ? 28 : 320}
                                y={y + (narrow ? 103 : 51)}
                            >
                                {r.note}
                            </text>
                            <text
                                className="fig-title"
                                x={narrow ? 240 : 730}
                                y={y + (narrow ? 79 : 41)}
                            >
                                {r.count}
                            </text>
                        </g>
                    );
                })}
                <text className="fig-dim" x="14" y={h - 35}>
                    movement + count commit together
                </text>
            </Plate>
        </svg>
    );
}

function StockReservationFlow() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 640 : 400;
    const rows = [
        [
            "01 · first checkout",
            "lock item; one unit available",
            "create pending payment; commit",
            "on hand 1 · held 1",
        ],
        [
            "02 · second checkout",
            "wait for the item lock",
            "read the committed payment hold",
            "available 0 · reject checkout",
        ],
        [
            "03 · first payment settles",
            "insert the sale movement",
            "subtract one; exclude sold line",
            "on hand 0 · held 0",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="With one unit on hand, the first checkout reserves it with a pending payment. A second checkout waits and then sees zero available. Settlement converts the hold into a sale movement."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    one unit, two checkouts
                </text>
                <text className="fig-sub" x="14" y="52">
                    available = on hand − other active holds
                </text>
                {rows.map(([title, a, b, total], i) => {
                    const x = narrow ? 14 : 14 + i * 270,
                        y = narrow ? 83 + i * 169 : 94,
                        bw = narrow ? 308 : 252;
                    return (
                        <g key={title}>
                            <rect
                                className="fig-wash"
                                x={x}
                                y={y}
                                width={bw}
                                height="144"
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={bw}
                                height="144"
                            />
                            <text className="fig-title" x={x + 13} y={y + 27}>
                                {title}
                            </text>
                            <text className="fig-sub" x={x + 13} y={y + 54}>
                                {a}
                            </text>
                            <text className="fig-sub" x={x + 13} y={y + 75}>
                                {b}
                            </text>
                            <path
                                className="fig-mist"
                                d={`M${x + 13} ${y + 94}h${bw - 26}`}
                            />
                            <text className="fig-sub" x={x + 13} y={y + 120}>
                                {total}
                            </text>
                            {i < 2 && (
                                <path
                                    className="fig-water"
                                    d={
                                        narrow
                                            ? `M168 ${y + 144}v21m-4 -6 4 6 4-6`
                                            : `M${x + bw} ${y + 72}h18m-6 -4 6 4-6 4`
                                    }
                                />
                            )}
                        </g>
                    );
                })}
                {!narrow && (
                    <>
                        <text className="fig-title" x="14" y="296">
                            holds and movements describe different stages
                        </text>
                        <text className="fig-sub" x="14" y="322">
                            A pending payment holds the unit. A sale movement
                            changes the stored count.
                        </text>
                    </>
                )}
                <text className="fig-dim" x="14" y={h - 35}>
                    online checkout policy · whole units
                </text>
            </Plate>
        </svg>
    );
}

export const STOCK_MOVEMENT_FIGURES = {
    "stock-repeat-flow": StockRepeatFlow,
    "stock-reservation-flow": StockReservationFlow,
};
