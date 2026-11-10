import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function RoundingBoundary() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 532 : 340;
    const branches = [
        {
            title: "Full membership",
            lines: [
                "A, B, C belong in the calendar",
                "A complete pass includes all three",
            ],
            total: "A + B + C",
            note: "Use completed membership for reconciliation",
        },
        {
            title: "Incremental changes",
            lines: ["Only B was edited", "The delta contains B"],
            total: "A and C stay",
            note: "Absence from this delta is not deletion",
        },
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Membership and changes differ. Three managed appointments; only B changes."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    Membership and changes differ
                </text>
                <text className="fig-sub" x="14" y="52">
                    Three managed appointments; only B changes.
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
                    A cancellation needs removal evidence.
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
            "01 · fetch",
            "Read all pages for this scope",
            "Preserve continuation state",
        ],
        [
            "02 · stage",
            "Collect IDs in a new generation",
            "Keep the previous completed set",
        ],
        [
            "03 · finalize",
            "After a complete, consistent pass",
            "Reconcile managed entries",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Complete the pass before cleanup. Example: a full membership reconciliation."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    Complete the pass before cleanup
                </text>
                <text className="fig-sub" x="14" y="52">
                    Example: a full membership reconciliation.
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
                <text className="fig-title sm" x="14" y={h - 93}>
                    A page failed before completion?
                </text>
                <text className="fig-sub" x="14" y={h - 69}>
                    Keep the previous membership generation.
                </text>
                <text className="fig-sub" x="14" y={h - 50}>
                    Do not treat missing pages as removals.
                </text>
            </Plate>
        </svg>
    );
}

export const CALENDAR_SYNC_FIGURES = {
    "calendar-membership-delta": RoundingBoundary,
    "calendar-reconciliation-round": IssueBoundary,
};
