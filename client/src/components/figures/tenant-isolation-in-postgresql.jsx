import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function ScopeBox({ x, y, w, title, lines }) {
    return (
        <g>
            <rect className="fig-wash" x={x} y={y} width={w} height={120} />
            <rect className="fig-ink" x={x} y={y} width={w} height={120} />
            <text className="fig-title" x={x + 14} y={y + 27}>
                {title}
            </text>
            {lines.map((line, i) => (
                <text
                    key={line}
                    className="fig-sub"
                    x={x + 14}
                    y={y + 54 + i * 22}
                >
                    {line}
                </text>
            ))}
        </g>
    );
}
function TransactionScope() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 672 : 382;
    const steps = [
        [
            "01 · establish scope",
            "Authenticate the caller",
            "Begin a transaction",
        ],
        [
            "02 · query as the app role",
            "Set family + user locally",
            "Policies apply to the rows",
        ],
        [
            "03 · finish the transaction",
            "Commit or roll back",
            "Local settings end here",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Authenticate the caller, begin a transaction, set local family context, and query under row policies. Commit or rollback ends the settings before connection reuse."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    Context lasts for one transaction
                </text>
                <text className="fig-sub" x="14" y="52">
                    The connection can serve another request later.
                </text>
                {steps.map(([title, ...lines], i) => {
                    const x = narrow ? 14 : 14 + i * 270,
                        y = narrow ? 82 + i * 150 : 90,
                        bw = narrow ? 308 : 252;
                    return (
                        <g key={title}>
                            <ScopeBox
                                x={x}
                                y={y}
                                w={bw}
                                title={title}
                                lines={lines}
                            />
                            {i < 2 && (
                                <path
                                    className="fig-water"
                                    d={
                                        narrow
                                            ? `M168 ${y + 120}v26m-4-6 4 6 4-6`
                                            : `M${x + bw} ${y + 60}h18m-6-4 6 4-6 4`
                                    }
                                />
                            )}
                        </g>
                    );
                })}
                <path
                    className="fig-mist"
                    d={`M14 ${narrow ? 541 : 253}H${w - 14}`}
                />
                <text className="fig-title" x="14" y={narrow ? 576 : 287}>
                    Next request, new scope
                </text>
                <text className="fig-sub" x="14" y={narrow ? 602 : 313}>
                    Set context before issuing its queries.
                </text>
                <text className="fig-dim" x="14" y={h - 35}>
                    A pooled connection does not own a family.
                </text>
            </Plate>
        </svg>
    );
}
function RowPolicies() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 665 : 400;
    const rows = [
        [
            "Family A rows",
            "Read and write within family A",
            "Policy compares family_id with scope",
        ],
        [
            "Family B rows",
            "Hidden from family A",
            "Writes cannot name family B",
        ],
        [
            "Shared catalog",
            "Read through a separate policy",
            "Family path cannot create shared rows",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="A transaction scoped to family A can reach family A rows, cannot reach family B rows, and can read shared catalog content through an explicit separate policy."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    One scope, explicit row classes
                </text>
                <text className="fig-sub" x="14" y="52">
                    Application role · current family A
                </text>
                {rows.map(([title, ...lines], i) => {
                    const x = 14,
                        y = narrow ? 82 + i * 151 : 82 + i * 80,
                        bw = w - 28;
                    return (
                        <g key={title}>
                            <rect
                                className="fig-wash"
                                x={x}
                                y={y}
                                width={bw}
                                height={narrow ? 130 : 68}
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={bw}
                                height={narrow ? 130 : 68}
                            />
                            <text className="fig-title" x="28" y={y + 27}>
                                {title}
                            </text>
                            <text
                                className="fig-sub"
                                x={narrow ? 28 : 256}
                                y={y + (narrow ? 61 : 26)}
                            >
                                {lines[0]}
                            </text>
                            <text
                                className="fig-sub"
                                x={narrow ? 28 : 256}
                                y={y + (narrow ? 85 : 49)}
                            >
                                {lines[1]}
                            </text>
                        </g>
                    );
                })}
                <text className="fig-title" x="14" y={narrow ? 585 : 348}>
                    Permissions inside A still need checks.
                </text>
                <text className="fig-dim" x="14" y={h - 35}>
                    Parent, tutor, and child access differ.
                </text>
            </Plate>
        </svg>
    );
}
export const TENANT_ISOLATION_FIGURES = {
    "tenant-transaction-scope": TransactionScope,
    "tenant-row-policies": RowPolicies,
};
