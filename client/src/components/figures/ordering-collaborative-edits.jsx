import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function OrderedWrites() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 690 : 424;
    const rows = [
        ["01", "Alice changes colour", "data · title.color", "revision 81"],
        ["02", "Ben changes text", "data · title.text", "revision 82"],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Socket writes run one at a time. Alice's colour change commits revision 81 before Ben's text change commits revision 82. Each committed change is acknowledged and broadcast."
        >
            <Plate w={w} h={h} ground={[{ y: h - 20, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    two edits, one room queue
                </text>
                <text className="fig-sub" x="14" y="53">
                    new socket batches follow this path
                </text>
                {rows.map(([num, title, key, revision], i) => {
                    const y = 82 + i * (narrow ? 246 : 127);
                    return (
                        <g key={num}>
                            <rect
                                className="fig-wash"
                                x="14"
                                y={y}
                                width={w - 28}
                                height={narrow ? 225 : 109}
                            />
                            <rect
                                className="fig-ink"
                                x="14"
                                y={y}
                                width={w - 28}
                                height={narrow ? 225 : 109}
                            />
                            <text className="fig-dim" x="28" y={y + 25}>
                                {num}
                            </text>
                            <text className="fig-title" x="59" y={y + 26}>
                                {title}
                            </text>
                            <text className="fig-sub" x="59" y={y + 49}>
                                {key}
                            </text>
                            <path
                                className="fig-mist"
                                d={
                                    narrow
                                        ? `M28 ${y + 67}H${w - 28}`
                                        : `M303 ${y + 16}V${y + 92}`
                                }
                            />
                            <text
                                className="fig-title"
                                x={narrow ? 28 : 327}
                                y={y + (narrow ? 93 : 28)}
                            >
                                lock · apply · commit
                            </text>
                            <text
                                className="fig-sub"
                                x={narrow ? 28 : 327}
                                y={y + (narrow ? 117 : 53)}
                            >
                                {revision}
                            </text>
                            <path
                                className="fig-water"
                                d={
                                    narrow
                                        ? `M28 ${y + 137}H${w - 28}`
                                        : `M549 ${y + 49}h40m-6 -5l6 5l-6 5`
                                }
                            />
                            <text
                                className="fig-title"
                                x={narrow ? 28 : 610}
                                y={y + (narrow ? 164 : 29)}
                            >
                                acknowledge sender
                            </text>
                            <text
                                className="fig-sub"
                                x={narrow ? 28 : 610}
                                y={y + (narrow ? 189 : 54)}
                            >
                                broadcast to peers
                            </text>
                            {!narrow && (
                                <text className="fig-dim" x="59" y={y + 84}>
                                    different keys preserve both changes
                                </text>
                            )}
                        </g>
                    );
                })}
                <text className="fig-sub" x="14" y={h - 63}>
                    The row lock protects the content.
                </text>
                <text className="fig-sub" x="14" y={h - 42}>
                    The queue orders these socket writes.
                </text>
            </Plate>
        </svg>
    );
}

function ReconnectPath() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 759 : 475;
    const steps = [
        [
            "01 · socket drops",
            "commit may have succeeded",
            "acknowledgement is unknown",
        ],
        [
            "02 · HTTP takes over",
            "retry the original mutation ID",
            "receipt returns the saved result",
        ],
        [
            "03 · socket reconnects",
            "flush HTTP before hello",
            "then request missed revisions",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="After a socket drop, HTTP retries with the same mutation ID. Reconnect waits for HTTP saves to flush, then uses the room's recent buffer when covered or refetches the document when not covered."
        >
            <Plate w={w} h={h} ground={[{ y: h - 20, amp: 4 }]}>
                <text className="fig-title" x="14" y="30">
                    recover the write, then catch up
                </text>
                <text className="fig-sub" x="14" y="53">
                    one save driver at a time
                </text>
                {steps.map(([title, a, b], i) => {
                    const x = narrow ? 14 : 14 + i * 269;
                    const y = narrow ? 82 + i * 133 : 88;
                    const bw = narrow ? w - 28 : 252;
                    return (
                        <g key={title}>
                            <rect
                                className="fig-wash"
                                x={x}
                                y={y}
                                width={bw}
                                height="108"
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={bw}
                                height="108"
                            />
                            <text className="fig-title" x={x + 13} y={y + 29}>
                                {title}
                            </text>
                            <text className="fig-sub" x={x + 13} y={y + 57}>
                                {a}
                            </text>
                            <text className="fig-sub" x={x + 13} y={y + 79}>
                                {b}
                            </text>
                            {i < 2 && (
                                <path
                                    className="fig-water"
                                    d={
                                        narrow
                                            ? `M168 ${y + 108}v25m-5 -6l5 6l5 -6`
                                            : `M${x + bw} ${y + 54}h17m-5 -4l5 4l-5 4`
                                    }
                                />
                            )}
                        </g>
                    );
                })}
                <path
                    className="fig-mist"
                    d={narrow ? "M168 456v29" : "M686 196v31H211v27M614 227v27"}
                />
                {[
                    [
                        "gap covered",
                        "replay recent operations",
                        "256 batches kept in this process",
                    ],
                    [
                        "gap not covered",
                        "refetch the document",
                        "restart or lost history → resync",
                    ],
                ].map(([title, a, b], i) => {
                    const x = narrow ? 14 : 14 + i * 403;
                    const y = narrow ? 485 + i * 115 : 254;
                    const bw = narrow ? w - 28 : 389;
                    return (
                        <g key={title}>
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={bw}
                                height="98"
                            />
                            <text className="fig-title" x={x + 14} y={y + 28}>
                                {title}
                            </text>
                            <text className="fig-sub" x={x + 14} y={y + 52}>
                                {a}
                            </text>
                            <text className="fig-dim" x={x + 14} y={y + 76}>
                                {b}
                            </text>
                        </g>
                    );
                })}
                <text className="fig-dim" x="14" y={h - 35}>
                    Receipts persist; the room buffer does not.
                </text>
            </Plate>
        </svg>
    );
}

export const COLLAB_ORDER_FIGURES = {
    "collab-ordered-writes": OrderedWrites,
    "collab-reconnect-path": ReconnectPath,
};
