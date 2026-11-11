import { frame, Plate, useNarrow, WIDE, NARROW } from "./plate";

function panel(x, y, width, title, lines, height = 122) {
    return (
        <g key={title}>
            <rect
                className="fig-wash"
                x={x}
                y={y}
                width={width}
                height={height}
            />
            <rect
                className="fig-ink"
                x={x}
                y={y}
                width={width}
                height={height}
            />
            <text className="fig-title" x={x + 14} y={y + 29}>
                {title}
            </text>
            {lines.map((line, i) => (
                <text
                    key={line}
                    className="fig-sub"
                    x={x + 14}
                    y={y + 58 + i * 23}
                >
                    {line}
                </text>
            ))}
        </g>
    );
}
function arrow(x, y, vertical, length = 24) {
    return (
        <path
            className="fig-water"
            d={
                vertical
                    ? `M${x} ${y}v${length}m-4-6 4 6 4-6`
                    : `M${x} ${y}h${length}m-6-4 6 4-6 4`
            }
        />
    );
}
function TaskFit() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 610 : 344;
    const options = [
        [
            "Script",
            ["Known steps", "Collect queue statistics"],
            "One execution",
        ],
        [
            "Agent",
            ["Bounded investigation", "Explain a failure"],
            "One question",
        ],
        [
            "Workflow",
            ["Coordination across time", "Wait, retry, and hand off"],
            "Persistent state",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Choose a script for known steps, an agent for bounded investigation, or a durable workflow for coordination across time. These are alternatives, not maturity levels."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    Choose the amount of automation
                </text>
                <text className="fig-sub" x="14" y="53">
                    Different tasks need different tools.
                </text>
                {options.map(([title, lines, note], i) => {
                    const x = narrow ? 14 : 14 + i * 274,
                        y = narrow ? 82 + i * 151 : 90,
                        bw = narrow ? 308 : 246;
                    return (
                        <g key={title}>
                            {panel(x, y, bw, title, lines, 130)}
                            <path
                                className="fig-mist"
                                d={`M${x + 14} ${y + 96}h${bw - 28}`}
                            />
                            <text className="fig-dim" x={x + 14} y={y + 117}>
                                {note}
                            </text>
                        </g>
                    );
                })}
                <text className="fig-sub" x="14" y={h - 63}>
                    Start with the simplest approach that fits.
                </text>
            </Plate>
        </svg>
    );
}
function IncidentFlow() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 794 : 572;
    const rows = narrow
        ? [
              [
                  "Incident record",
                  [
                      "Alerts, support reports, and traces",
                      "Bounded, dated evidence",
                  ],
              ],
              [
                  "Investigation",
                  ["Test the suspected cause", "Keep uncertainty visible"],
              ],
              [
                  "Responder and mitigation",
                  [
                      "Choose an established action",
                      "Check scope and preconditions",
                  ],
              ],
              [
                  "Observe recovery",
                  [
                      "Queue age and delivery latency",
                      "Recovered or still pending?",
                  ],
              ],
          ]
        : [
              [
                  "Collect evidence",
                  ["Alerts, support, and logs", "Bound the queries"],
              ],
              [
                  "Incident record",
                  ["Group related signals", "Date the observations"],
              ],
              [
                  "Investigation",
                  ["Test the suspected cause", "Keep uncertainty visible"],
              ],
              ["Responder", ["Own the decision", "Confirm the scope"]],
              [
                  "Mitigation",
                  ["Use an established action", "Check preconditions"],
              ],
              [
                  "Observe recovery",
                  ["Queue age and latency", "Recovered or pending?"],
              ],
          ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Collect evidence into one incident record, investigate, then have a responder select mitigation and observe recovery. A permanent repair proceeds separately."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    Evidence, decisions, and recovery
                </text>
                <text className="fig-sub" x="14" y="53">
                    Keep the responsibilities explicit.
                </text>
                {rows.map(([title, lines], i) => {
                    const x = narrow ? 14 : 14 + (i % 3) * 274,
                        y = narrow
                            ? 82 + i * 139
                            : 90 + Math.floor(i / 3) * 174,
                        bw = narrow ? 308 : 246;
                    return (
                        <g key={title}>
                            {panel(x, y, bw, title, lines, 110)}
                            {narrow && i < 3 && arrow(168, y + 110, true, 25)}
                            {!narrow &&
                                i % 3 < 2 &&
                                arrow(x + bw, y + 55, false, 24)}
                        </g>
                    );
                })}
                {!narrow && (
                    <path
                        className="fig-water"
                        d="M685 200v30H137v30m-4-6 4 6 4-6"
                    />
                )}
                <path className="fig-mist" d={`M14 ${h - 140}H${w - 14}`} />
                <text className="fig-title sm" x="14" y={h - 112}>
                    Prepare the permanent repair separately
                </text>
                <text className="fig-sub" x="14" y={h - 87}>
                    Reproduce, patch, review, and release.
                </text>
                <text className="fig-dim" x="14" y={h - 58}>
                    A hypothesis does not authorize a change.
                </text>
            </Plate>
        </svg>
    );
}
function ReviewCapacity() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 608 : 444;
    const barWidth = narrow ? 222 : 310;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Illustrative daily rates: twelve proposals arrive and four are reviewed, adding eight to the queue before closures or rework. Limit maintenance intake when review is full."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    Review capacity limits throughput
                </text>
                <text className="fig-sub" x="14" y="53">
                    Illustrative rates per working day.
                </text>
                {[
                    ["Proposals arriving", 12],
                    ["Proposals reviewed", 4],
                ].map(([label, value], i) => {
                    const y = 94 + i * 91;
                    return (
                        <g key={label}>
                            <text className="fig-title sm" x="14" y={y}>
                                {label}
                            </text>
                            <rect
                                className="fig-wash"
                                x="14"
                                y={y + 16}
                                width={barWidth}
                                height="19"
                            />
                            <rect
                                className="fig-solid"
                                x="14"
                                y={y + 16}
                                width={(barWidth * value) / 12}
                                height="19"
                            />
                            <text
                                className="fig-title"
                                x={barWidth + 30}
                                y={y + 32}
                            >
                                {value}
                            </text>
                        </g>
                    );
                })}
                <g
                    transform={`translate(${narrow ? 14 : 438},${narrow ? 286 : 90})`}
                >
                    <text className="fig-title" x="0" y="0">
                        8 more waiting each day
                    </text>
                    {Array.from({ length: 8 }, (_, i) => (
                        <g key={i}>
                            <rect
                                className="fig-wash"
                                x={(i % 4) * 68}
                                y={20 + Math.floor(i / 4) * 40}
                                width="52"
                                height="28"
                            />
                            <rect
                                className="fig-mist"
                                x={(i % 4) * 68}
                                y={20 + Math.floor(i / 4) * 40}
                                width="52"
                                height="28"
                            />
                            <path
                                className="fig-water"
                                d={`M${(i % 4) * 68 + 12} ${34 + Math.floor(i / 4) * 40}h28`}
                            />
                        </g>
                    ))}
                    <text className="fig-sub" x="0" y="117">
                        Before closures or rework.
                    </text>
                </g>
                <path className="fig-mist" d={`M14 ${h - 150}H${w - 14}`} />
                <text className="fig-title sm" x="14" y={h - 121}>
                    Limit new maintenance investigations
                </text>
                <text className="fig-sub" x="14" y={h - 96}>
                    Pause intake when review is full.
                </text>
                <text className="fig-sub" x="14" y={h - 74}>
                    Keep capacity for incident response.
                </text>
                <text className="fig-dim" x="14" y={h - 42}>
                    Example assumptions, not production metrics.
                </text>
            </Plate>
        </svg>
    );
}
export const FACTORY_FIGURES = {
    "factory-task-fit": TaskFit,
    "factory-incident-flow": IncidentFlow,
    "factory-review-capacity": ReviewCapacity,
};
