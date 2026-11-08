import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function UploadFlow() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 550 : 330;
    const steps = [
        ["01 · application", "authorize + create upload URL"],
        ["02 · browser → Mux", "send the file directly"],
        ["03 · processing", "upload complete ≠ ready"],
        ["04 · application", "verify event + offer playback"],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Four stages from authorized upload to playback. File transfer goes directly to Mux; a verified ready event updates the application."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    from upload to playback
                </text>
                <text className="fig-sub" x="14" y="52">
                    file transfer and readiness are separate
                </text>
                {steps.map(([title, detail], i) => {
                    const x = narrow ? 14 : 14 + (i % 2) * 414;
                    const y = narrow
                        ? 80 + i * 104
                        : 80 + Math.floor(i / 2) * 100;
                    return (
                        <g key={title}>
                            <rect
                                className="fig-wash"
                                x={x}
                                y={y}
                                width={narrow ? 308 : 378}
                                height="72"
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={narrow ? 308 : 378}
                                height="72"
                            />
                            <text className="fig-title" x={x + 14} y={y + 28}>
                                {title}
                            </text>
                            <text className="fig-sub" x={x + 14} y={y + 51}>
                                {detail}
                            </text>
                            {narrow && i < 3 && (
                                <path
                                    className="fig-water"
                                    d={`M168 ${y + 72}v27m-4 -6 4 6 4-6`}
                                />
                            )}
                            {!narrow && i % 2 === 0 && (
                                <path
                                    className="fig-water"
                                    d={`M392 ${y + 36}h30m-6 -4 6 4-6 4`}
                                />
                            )}
                        </g>
                    );
                })}
                {!narrow && (
                    <path
                        className="fig-water"
                        d="M617 152v15H203v13m-4 -6 4 6 4-6"
                    />
                )}
                <text className="fig-dim" x="14" y={h - 55}>
                    application ID · upload ID · asset ID · playback ID
                </text>
            </Plate>
        </svg>
    );
}
function CostModel() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 548 : 356;
    const items = [
        {
            title: "the library",
            a: "2,000 videos × 5 minutes",
            b: "10,000 stored minutes",
            c: "× $0.0024 / minute-month",
            d: "$24 storage",
        },
        {
            title: "the audience",
            a: "100,000 sessions × 3 minutes",
            b: "300,000 delivered minutes",
            c: "(300,000 − 100,000 free) × $0.0008",
            d: "$160 delivery",
        },
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Illustrative Basic 720p monthly cost: 10,000 stored minutes costs 24 dollars; 300,000 delivered minutes costs 160 dollars after the free delivery allowance, before credits and discounts."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    two independent usage meters
                </text>
                <text className="fig-sub" x="14" y="52">
                    Basic · up to 720p · USD · November 2026
                </text>
                {items.map((v, i) => {
                    const x = narrow ? 14 : 14 + i * 414,
                        y = narrow ? 78 + i * 195 : 78,
                        bw = narrow ? 308 : 378;
                    return (
                        <g key={v.title}>
                            <rect
                                className="fig-wash"
                                x={x}
                                y={y}
                                width={bw}
                                height="177"
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={bw}
                                height="177"
                            />
                            <text className="fig-title" x={x + 14} y={y + 28}>
                                {v.title}
                            </text>
                            <text className="fig-sub" x={x + 14} y={y + 56}>
                                {v.a}
                            </text>
                            <text className="fig-title" x={x + 14} y={y + 83}>
                                {v.b}
                            </text>
                            <path
                                className="fig-mist"
                                d={`M${x + 14} ${y + 98}h${bw - 28}`}
                            />
                            <text className="fig-sub" x={x + 14} y={y + 122}>
                                {v.c}
                            </text>
                            <text className="fig-title" x={x + 14} y={y + 153}>
                                {v.d}
                            </text>
                        </g>
                    );
                })}
                <text className="fig-sub" x="14" y={h - 68}>
                    Illustrative subtotal: $184 before credits,
                </text>
                <text className="fig-sub" x="14" y={h - 49}>
                    storage discounts, tax, and optional features.
                </text>
            </Plate>
        </svg>
    );
}
export const MUX_FIGURES = {
    "mux-upload-flow": UploadFlow,
    "mux-cost-model": CostModel,
};
