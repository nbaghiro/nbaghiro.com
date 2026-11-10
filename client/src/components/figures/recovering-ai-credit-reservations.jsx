import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function CreditReserveSettle() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 610 : 340;
    const rows = [
        [
            "01 · before work",
            "100 credits available",
            "estimate: 30 credits",
            "balance 100",
        ],
        [
            "02 · reserve",
            "lock the workspace row",
            "post −30; create held operation",
            "balance 70",
        ],
        [
            "03 · settle",
            "measured cost: 8 credits",
            "post +22; close the operation",
            "balance 92",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="An account starts with 100 credits. Reserving 30 leaves 70. Settling for eight returns 22, leaving 92."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    a reservation is an estimate
                </text>
                <text className="fig-sub" x="14" y="52">
                    settlement records the final debit
                </text>
                {rows.map(([title, a, b, total], i) => {
                    const x = narrow ? 14 : 14 + i * 270;
                    const y = narrow ? 80 + i * 160 : 84;
                    const bw = narrow ? 308 : 252;
                    return (
                        <g key={title}>
                            <rect
                                className="fig-wash"
                                x={x}
                                y={y}
                                width={bw}
                                height="138"
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={bw}
                                height="138"
                            />
                            <text className="fig-title" x={x + 12} y={y + 27}>
                                {title}
                            </text>
                            <text className="fig-sub" x={x + 12} y={y + 54}>
                                {a}
                            </text>
                            <text className="fig-sub" x={x + 12} y={y + 75}>
                                {b}
                            </text>
                            <path
                                className="fig-mist"
                                d={`M${x + 12} ${y + 92}h${bw - 24}`}
                            />
                            <text className="fig-title" x={x + 12} y={y + 119}>
                                {total}
                            </text>
                            {i < 2 && (
                                <path
                                    className="fig-water"
                                    d={
                                        narrow
                                            ? `M168 ${y + 138}v18m-4 -6 4 6 4-6`
                                            : `M${x + bw} ${y + 69}h18m-6 -4 6 4-6 4`
                                    }
                                />
                            )}
                        </g>
                    );
                })}
                <text className="fig-sub" x="14" y={h - 47}>
                    journal: −30 + 22 = −8 credits
                </text>
            </Plate>
        </svg>
    );
}

function CreditRecoveryFlow() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 805 : 500;
    const rows = [
        [
            "01 · worker reports",
            "heartbeat roughly every 30 seconds",
            "save observed cost; extend lease",
            "$0.02 saved → 8 credits",
        ],
        [
            "02 · reports stop",
            "the process crashes or loses contact",
            "unreported usage is not in the row",
            "three-minute lease expires",
        ],
        [
            "03 · recovery claims",
            "lock expired rows; skip locked rows",
            "extend leases in a short transaction",
            "claim up to 50 operations",
        ],
        [
            "04 · close the hold",
            "settle from the saved checkpoint",
            "held → recovered; return unused credit",
            "later settlement cannot charge again",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Heartbeats save usage and extend a lease. After expiry, recovery claims abandoned operations and settles the saved amount. Usage not checkpointed remains unknown."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    recover the hold, not the provider call
                </text>
                <text className="fig-sub" x="14" y="52">
                    an expired lease is a recovery signal
                </text>
                {rows.map(([title, a, b, total], i) => {
                    const x = narrow ? 14 : 14 + (i % 2) * 410;
                    const y = narrow
                        ? 80 + i * 167
                        : 80 + Math.floor(i / 2) * 170;
                    const bw = narrow ? 308 : 382;
                    return (
                        <g key={title}>
                            <rect
                                className="fig-wash"
                                x={x}
                                y={y}
                                width={bw}
                                height="145"
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={bw}
                                height="145"
                            />
                            <text className="fig-title" x={x + 12} y={y + 27}>
                                {title}
                            </text>
                            <text className="fig-sub" x={x + 12} y={y + 54}>
                                {a}
                            </text>
                            <text className="fig-sub" x={x + 12} y={y + 76}>
                                {b}
                            </text>
                            <path
                                className="fig-mist"
                                d={`M${x + 12} ${y + 94}h${bw - 24}`}
                            />
                            <text className="fig-sub" x={x + 12} y={y + 122}>
                                {total}
                            </text>
                            {narrow && i < 3 && (
                                <path
                                    className="fig-water"
                                    d={`M168 ${y + 145}v18m-4 -6 4 6 4-6`}
                                />
                            )}
                        </g>
                    );
                })}
                <text className="fig-dim" x="14" y={h - 38}>
                    saved usage may be less than the provider bill
                </text>
            </Plate>
        </svg>
    );
}

export const CREDIT_RECOVERY_FIGURES = {
    "credit-reserve-settle": CreditReserveSettle,
    "credit-recovery-flow": CreditRecoveryFlow,
};
