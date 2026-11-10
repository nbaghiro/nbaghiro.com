import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function Box({ x, y, w, h, title, lines }) {
    return (
        <g>
            <rect className="fig-wash" x={x} y={y} width={w} height={h} />
            <rect className="fig-ink" x={x} y={y} width={w} height={h} />
            <text className="fig-title" x={x + 14} y={y + 26}>
                {title}
            </text>
            {lines.map((line, i) => (
                <text
                    key={line}
                    className="fig-sub"
                    x={x + 14}
                    y={y + 50 + i * 21}
                >
                    {line}
                </text>
            ))}
        </g>
    );
}

function DatasetIdentity() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 650 : 440;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="The same normalized dataset specification gets the same hash. A change to the fetch window, adjustment, or version produces a new key."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    which requests can share a snapshot?
                </text>
                <text className="fig-sub" x="14" y="52">
                    all six specification fields must agree
                </text>
                <Box
                    x={14}
                    y={82}
                    w={narrow ? 308 : 244}
                    h={112}
                    title="run A"
                    lines={["spy · QQQ · SPY", "same dates and settings"]}
                />
                <Box
                    x={narrow ? 14 : 14}
                    y={narrow ? 211 : 211}
                    w={narrow ? 308 : 244}
                    h={112}
                    title="run B"
                    lines={["QQQ · spy", "same dates and settings"]}
                />
                <path
                    className="fig-water"
                    d={
                        narrow
                            ? "M168 323v25m-4-6 4 6 4-6"
                            : "M258 138h24v128h-24m24-64h25m-6-4 6 4-6 4"
                    }
                />
                <Box
                    x={narrow ? 14 : 307}
                    y={narrow ? 348 : 82}
                    w={narrow ? 308 : 265}
                    h={196}
                    title="normalized specification"
                    lines={[
                        "QQQ · SPY",
                        "timeframe + fetch window",
                        "adjustment + data version",
                        "sorted, compact JSON",
                        "SHA-256 → 32 hex characters",
                    ]}
                />
                <path
                    className="fig-water"
                    d={
                        narrow
                            ? "M168 544v21m-4-6 4 6 4-6"
                            : "M572 181h25m-6-4 6 4-6 4"
                    }
                />
                {narrow ? (
                    <text className="fig-title" x="29" y="590">
                        same key → same snapshot path
                    </text>
                ) : (
                    <Box
                        x={597}
                        y={118}
                        w={209}
                        h={124}
                        title="one snapshot path"
                        lines={["1D/<hash>.parquet", "shared prepared input"]}
                    />
                )}
                {!narrow && (
                    <>
                        <path className="fig-mist" d="M307 302H806" />
                        <text className="fig-title" x="307" y="335">
                            a changed input means a new key
                        </text>
                        <text className="fig-sub" x="307" y="358">
                            longer warm-up · raw prices · later data version
                        </text>
                    </>
                )}
                <text className="fig-dim" x="14" y={h - 35}>
                    identity describes the request, not a checksum of prices
                </text>
            </Plate>
        </svg>
    );
}

function DatasetPreparation() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 760 : 480;
    const rows = [
        [
            "01 · coordinate",
            "worker A gets the Redis lease",
            "worker B waits for the snapshot",
        ],
        [
            "02 · prepare",
            "fetch bars and repair large gaps",
            "write a temporary Parquet file",
        ],
        [
            "03 · publish",
            "replace the final path atomically",
            "both workers can read the file",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Worker A gets a lease and writes a temporary Parquet file. Atomic replacement publishes the snapshot for both workers. If waiting times out, worker B prepares its own data. Shared storage is required."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    prepare once when coordination succeeds
                </text>
                <text className="fig-sub" x="14" y="52">
                    two workers requesting the same specification
                </text>
                {rows.map(([title, a, b], i) => {
                    const x = narrow ? 14 : 14 + i * 270;
                    const y = narrow ? 82 + i * 158 : 92;
                    const bw = narrow ? 308 : 252;
                    return (
                        <g key={title}>
                            <Box
                                x={x}
                                y={y}
                                w={bw}
                                h={132}
                                title={title}
                                lines={[a, b]}
                            />
                            {i < 2 && (
                                <path
                                    className="fig-water"
                                    d={
                                        narrow
                                            ? `M168 ${y + 132}v22m-4-6 4 6 4-6`
                                            : `M${x + bw} ${y + 66}h18m-6-4 6 4-6 4`
                                    }
                                />
                            )}
                        </g>
                    );
                })}
                <path
                    className="fig-mist"
                    d={`M14 ${narrow ? 578 : 265}H${w - 14}`}
                />
                <text className="fig-title" x="14" y={narrow ? 611 : 300}>
                    if the lease or wait fails
                </text>
                <text className="fig-sub" x="14" y={narrow ? 638 : 327}>
                    another preparation is allowed to proceed
                </text>
                <text className="fig-sub" x="14" y={narrow ? 659 : 350}>
                    duplicate work is possible; waiting is bounded
                </text>
                <text className="fig-title" x="14" y={narrow ? 695 : 399}>
                    the snapshot must be visible to both workers
                </text>
                <text className="fig-dim" x="14" y={h - 35}>
                    shared Redis does not share local files
                </text>
            </Plate>
        </svg>
    );
}

export const DATASET_FIGURES = {
    "dataset-identity": DatasetIdentity,
    "dataset-preparation": DatasetPreparation,
};
