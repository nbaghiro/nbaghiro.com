import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function ResumeCursor() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 650 : 410;
    const rows = [
        [
            "01 · before disconnect",
            "browser has received through 7",
            "cursor 7",
        ],
        [
            "02 · while disconnected",
            "worker appends 8, 9, and 10",
            "log keeps growing",
        ],
        [
            "03 · after reconnect",
            "Last-Event-ID is 7; read after 7",
            "deliver 8 → 9 → 10",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="The browser receives event seven, disconnects while eight through ten are logged, then reconnects with cursor seven and receives the retained later entries."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    resume the same execution
                </text>
                <text className="fig-sub" x="14" y="52">
                    Short IDs illustrate the cursor order.
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
                            replay and following use one log
                        </text>
                        <text className="fig-sub" x="14" y="331">
                            XREAD returns retained entries after the cursor,
                            then waits for new ones.
                        </text>
                    </>
                )}
                <text className="fig-dim" x="14" y={h - 37}>
                    Only successfully appended, retained events can replay.
                </text>
            </Plate>
        </svg>
    );
}

function RecoveryPaths() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 650 : 430;
    const rows = [
        [
            "reconnect with a cursor",
            "Read entries after that ID.",
            "Continue from the retained log.",
        ],
        [
            "fresh connection, still running",
            "Start after the latest user message.",
            "Load earlier history separately.",
        ],
        [
            "finished, log unavailable",
            "Read the stored final result.",
            "Intermediate events are not rebuilt.",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="A reconnect resumes after its cursor. A fresh running connection starts at the current turn. A finished execution without its log recovers final state from the database."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    choose the recovery path
                </text>
                <text className="fig-sub" x="14" y="52">
                    Authenticate and check execution ownership first.
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
                    A cursor is a transport position.
                </text>
                <text className="fig-sub" x="14" y={h - 37}>
                    It does not confirm that the UI applied the event.
                </text>
            </Plate>
        </svg>
    );
}
export const SSE_RESUME_FIGURES = {
    "sse-resume-cursor": ResumeCursor,
    "sse-recovery-paths": RecoveryPaths,
};
