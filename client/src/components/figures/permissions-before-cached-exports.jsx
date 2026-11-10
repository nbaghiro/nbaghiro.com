import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function RoundingBoundary() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 532 : 340;
    const branches = [
        {
            title: "Cache hit",
            lines: [
                "Check current export permission",
                "Find the existing private artifact",
            ],
            total: "Issue a new download grant",
            note: "Reuse the bytes after authorization",
        },
        {
            title: "Cache miss",
            lines: [
                "Check current export permission",
                "Queue work for a fixed revision",
            ],
            total: "Keep the result private",
            note: "Check access again before delivery",
        },
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="One check before both paths. Permission depends on the current request."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    One check before both paths
                </text>
                <text className="fig-sub" x="14" y="52">
                    Permission depends on the current request.
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
                    A cache hit does not preserve an old permission.
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
            "01 · request",
            "Resolve resource and identity",
            "Check export rights; queue work",
        ],
        [
            "02 · generation",
            "Render the specified revision",
            "Save the private result",
        ],
        [
            "03 · delivery",
            "Check current access again",
            "Issue a short download grant",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Access can change while a job runs. Work and delivery have separate boundaries."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    Access can change while a job runs
                </text>
                <text className="fig-sub" x="14" y="52">
                    Work and delivery have separate boundaries.
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
                    Access removed while the job runs?
                </text>
                <text className="fig-sub" x="14" y={h - 69}>
                    Keep the artifact for authorized users.
                </text>
                <text className="fig-sub" x="14" y={h - 50}>
                    Deny a new grant to the removed user.
                </text>
            </Plate>
        </svg>
    );
}

export const EXPORT_PERMISSION_FIGURES = {
    "export-authorization-order": RoundingBoundary,
    "export-delivery-lifecycle": IssueBoundary,
};
