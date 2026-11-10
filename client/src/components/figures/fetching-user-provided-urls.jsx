import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function FetchBoundaries() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 650 : 410;
    const rows = [
        [
            "01 · parse the URL",
            "HTTP(S), ports, credentials",
            "reject private literals",
        ],
        [
            "02 · resolve for the socket",
            "Check every returned address.",
            "mixed answers fail",
        ],
        [
            "03 · inspect the response",
            "Location returns to step 01.",
            "three redirects at most",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="URL validation leads to a guarded socket lookup and response inspection. Redirects repeat the checks."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    validate each new destination
                </text>
                <text className="fig-sub" x="14" y="52">
                    The connection uses the guarded lookup result.
                </text>
                {rows.map(([title, note, result], i) => {
                    const x = narrow ? 14 : 14 + i * 270,
                        y = narrow ? 82 + i * 170 : 100,
                        bw = narrow ? 308 : 252;
                    return (
                        <g key={title}>
                            <rect
                                className="fig-wash"
                                x={x}
                                y={y}
                                width={bw}
                                height="143"
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={bw}
                                height="143"
                            />
                            <text className="fig-title" x={x + 13} y={y + 28}>
                                {title}
                            </text>
                            <text className="fig-sub" x={x + 13} y={y + 58}>
                                {note}
                            </text>
                            <path
                                className="fig-mist"
                                d={`M${x + 13} ${y + 79}h${bw - 26}`}
                            />
                            <text className="fig-title" x={x + 13} y={y + 112}>
                                {result}
                            </text>
                            {i < 2 && (
                                <path
                                    className="fig-water"
                                    d={
                                        narrow
                                            ? `M168 ${y + 143}v22m-4-6 4 6 4-6`
                                            : `M${x + bw} ${y + 72}h18m-6-4 6 4-6 4`
                                    }
                                />
                            )}
                        </g>
                    );
                })}
                {!narrow && (
                    <>
                        <text className="fig-title" x="14" y="304">
                            keep the hostname in the HTTPS URL
                        </text>
                        <text className="fig-sub" x="14" y="331">
                            Address checks do not replace normal TLS certificate
                            checks.
                        </text>
                    </>
                )}
                <text className="fig-dim" x="14" y={h - 37}>
                    Every redirect repeats the destination policy.
                </text>
            </Plate>
        </svg>
    );
}

function FetchBudgets() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 650 : 430;
    const rows = [
        [
            "elapsed time",
            "15 seconds for one fetch chain.",
            "Robots and page use separate chains.",
        ],
        [
            "response body",
            "Page: 2 MB. Image: 12 MiB.",
            "Current behavior returns a capped prefix.",
        ],
        [
            "decoding work",
            "No HTTP decompression layer here.",
            "Image pixels need a separate budget.",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Time, body bytes, and decoding work are separate limits. The current body cap returns partial content without a truncation flag."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    give each kind of work a budget
                </text>
                <text className="fig-sub" x="14" y="52">
                    A body limit is not a process-memory limit.
                </text>
                {rows.map(([title, a, b], i) => {
                    const y = 82 + i * (narrow ? 160 : 92);
                    return (
                        <g key={title}>
                            <rect
                                className="fig-wash"
                                x="14"
                                y={y}
                                width={w - 28}
                                height={narrow ? 140 : 78}
                            />
                            <rect
                                className="fig-ink"
                                x="14"
                                y={y}
                                width={w - 28}
                                height={narrow ? 140 : 78}
                            />
                            <text className="fig-title" x="28" y={y + 29}>
                                {title}
                            </text>
                            <text
                                className="fig-sub"
                                x={narrow ? 28 : 370}
                                y={y + (narrow ? 69 : 28)}
                            >
                                {a}
                            </text>
                            <text
                                className="fig-sub"
                                x={narrow ? 28 : 370}
                                y={y + (narrow ? 94 : 52)}
                            >
                                {b}
                            </text>
                        </g>
                    );
                })}
                <text className="fig-dim" x="14" y={h - 58}>
                    Truncation is not currently reported.
                </text>
                <text className="fig-sub" x="14" y={h - 37}>
                    The caller cannot tell if the body was complete.
                </text>
            </Plate>
        </svg>
    );
}
export const URL_FETCH_FIGURES = {
    "url-fetch-boundaries": FetchBoundaries,
    "url-fetch-budgets": FetchBudgets,
};
