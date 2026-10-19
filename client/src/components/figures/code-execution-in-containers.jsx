import { Plate, frame, NARROW, useNarrow, WIDE } from "./plate";

function Box({ x, y, w, title, lines = [], active = false }) {
    const h = 48 + lines.length * 19;
    return (
        <g>
            {active && (
                <rect
                    className="fig-wash strong"
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx="3"
                />
            )}
            <rect className="fig-ink" x={x} y={y} width={w} height={h} rx="3" />
            <text className="fig-title" x={x + 14} y={y + 25}>
                {title}
            </text>
            {lines.map((line, i) => (
                <text
                    key={line}
                    className="fig-sub"
                    x={x + 14}
                    y={y + 47 + i * 19}
                >
                    {line}
                </text>
            ))}
        </g>
    );
}
function Down({ x, y, to }) {
    return (
        <path className="fig-water" d={`M${x} ${y} V${to} m-4 -7 l4 7 4 -7`} />
    );
}
function Paths() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 630 : 410;
    const bw = narrow ? w - 32 : 350;
    const right = narrow ? 16 : 454;
    const agentY = narrow ? 190 : 34;
    const sharedY = narrow ? 374 : 218;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Workflow nodes validate configuration and select context. Agent tools validate inputs and check blocked patterns. Both call shared container and language functions."
        >
            <Plate w={w} h={h} ground={[]}>
                <Box
                    x={16}
                    y={34}
                    w={bw}
                    title="Workflow code node"
                    lines={[
                        "Configuration + selected context",
                        "128 MB default · no pattern check",
                        "Removal requested after each run",
                    ]}
                />
                <Box
                    x={right}
                    y={agentY}
                    w={bw}
                    title="Agent code tool"
                    lines={[
                        "Input validation + pattern check",
                        "Activity uses 256 MB default",
                        "Optional files, packages and sessions",
                    ]}
                />
                {narrow ? (
                    <>
                        <path className="fig-mist" d="M16 82 H8 V350 H168" />
                        <Down x={168} y={295} to={sharedY} />
                    </>
                ) : (
                    <>
                        <path
                            className="fig-water"
                            d="M191 139 V180 H629 V139 M410 180 V218 m-4 -7 l4 7 4 -7"
                        />
                    </>
                )}
                <Box
                    x={narrow ? 16 : 180}
                    y={sharedY}
                    w={narrow ? bw : 460}
                    title="Shared execution functions"
                    lines={[
                        "Create container · wrap inputs",
                        "Run interpreter · parse output",
                    ]}
                    active
                />
                <text className="fig-note" x={16} y={h - 76}>
                    The callers keep their own validation,
                </text>
                <text className="fig-note" x={16} y={h - 56}>
                    resource overrides and cleanup behavior.
                </text>
            </Plate>
        </svg>
    );
}
function Result() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 660 : 370;
    const steps = [
        ["Input", ["records: three rows", "code: filter and count"]],
        ["Wrapper", ["Inject input variables", "Write /tmp/code.py"]],
        ["Interpreter", ["Print logs to stdout", "Mark the result as JSON"]],
        ["Parser", ["result: count 2, ids b/c", "stdout: selected 2 rows"]],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Input and code are wrapped into a Python script. The interpreter writes logs and a marked JSON result. The parser separates the result from stdout."
        >
            <Plate w={w} h={h} ground={[]}>
                {steps.map(([title, lines], i) => {
                    const x = narrow ? 16 : 14 + i * 204;
                    const y = narrow ? 28 + i * 128 : 80;
                    return (
                        <g key={title}>
                            <text className="fig-dim" x={x} y={y - 10}>
                                0{i + 1}
                            </text>
                            <Box
                                x={x}
                                y={y}
                                w={narrow ? w - 32 : 180}
                                title={title}
                                lines={lines}
                                active={i === 3}
                            />
                            {i < 3 &&
                                (narrow ? (
                                    <Down x={w / 2} y={y + 86} to={y + 116} />
                                ) : (
                                    <path
                                        className="fig-water"
                                        d={`M${x + 180} ${y + 43} h24 m-6 -4 l6 4 -6 4`}
                                    />
                                ))}
                        </g>
                    );
                })}
                <text className="fig-note" x={16} y={h - 81}>
                    Result markers share stdout with logs.
                </text>
                <text className="fig-sub" x={16} y={h - 59}>
                    Both markers must survive capture
                </text>
                <text className="fig-sub" x={16} y={h - 40}>
                    for the parser to recover the envelope.
                </text>
            </Plate>
        </svg>
    );
}
function Session() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const x = narrow ? 16 : 170;
    const bw = narrow ? w - 32 : 480;
    const h = 610;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="A session keeps a container and its temporary files. Call one and call two use different interpreter processes. After the inactivity threshold, periodic cleanup requests removal."
        >
            <Plate w={w} h={h} ground={[]}>
                <rect
                    className="fig-wash"
                    x={x}
                    y={24}
                    width={bw}
                    height={382}
                    rx="3"
                />
                <rect
                    className="fig-mist"
                    x={x}
                    y={24}
                    width={bw}
                    height={382}
                    rx="3"
                />
                <text className="fig-title" x={x + 16} y={54}>
                    One session container
                </text>
                <Box
                    x={x + 16}
                    y={78}
                    w={bw - 32}
                    title="Call 1 · new interpreter"
                    lines={[
                        "Write a file in /tmp",
                        "Interpreter exits after the script",
                    ]}
                />
                <Down x={w / 2} y={164} to={196} />
                <text className="fig-dim" x={x + 16} y={216}>
                    Temporary files remain in the container
                </text>
                <Down x={w / 2} y={230} to={262} />
                <Box
                    x={x + 16}
                    y={262}
                    w={bw - 32}
                    title="Call 2 · new interpreter"
                    lines={[
                        "Read the file explicitly",
                        "Previous variables are not retained",
                    ]}
                />
                <text className="fig-sub" x={x + 16} y={383}>
                    Reuse updates the activity timestamp.
                </text>
                <Down x={w / 2} y={406} to={448} />
                <Box
                    x={x}
                    y={448}
                    w={bw}
                    title="Periodic cleanup"
                    lines={[
                        "10-minute inactivity default",
                        "2-minute scan · request removal",
                    ]}
                    active
                />
                <text className="fig-sub" x={x} y={574}>
                    The session registry is process-local memory.
                </text>
            </Plate>
        </svg>
    );
}
export const SANDBOX_FIGURES = {
    "sandbox-paths": Paths,
    "sandbox-result": Result,
    "sandbox-session": Session,
};
