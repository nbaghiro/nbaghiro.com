import { Plate, frame, useNarrow } from "./plate";

function Label({ x, y, lines, title = false }) {
    return <text x={x} y={y} className={title ? "fig-title" : "fig-sub"}>
        {lines.map((line, i) => <tspan key={i} x={x} dy={i ? 20 : 0}>{line}</tspan>)}
    </text>;
}
function Panel({ x, y, w, h = 148, title, lines, number }) {
    return <g>
        <rect x={x} y={y} width={w} height={h} rx="2" className="fig-ink" />
        <Label x={x + 16} y={y + 23} lines={[number]} />
        <Label x={x + 16} y={y + 53} lines={[title]} title />
        <Label x={x + 16} y={y + 81} lines={lines} />
    </g>;
}
function Arrow({ x1, y1, x2, y2 }) {
    return <path className="fig-water" d={x1 === x2
        ? `M${x1} ${y1}V${y2}m-4-6 4 6 4-6`
        : `M${x1} ${y1}H${x2}m-6-4 6 4-6 4`} />;
}
function Canvas({ w, h, title, note, children }) {
    return <svg className="fig" viewBox={frame(w, h)} role="img" aria-label={title}>
        <title>{title}</title>
        <Plate w={w} h={h} ground={[{ y: h - 27, amp: 3 }]}>
            <Label x={14} y={34} lines={[title]} title />
            {children}
            <Label x={14} y={h - 62} lines={note} />
        </Plate>
    </svg>;
}
function State() {
    const narrow = useNarrow(), w = narrow ? 336 : 820, h = narrow ? 630 : 330;
    const data = [
        ["Files", ["Edits and new assets", "A known input snapshot", "Transfer, then verify"]],
        ["Context", ["Goal and decisions", "What was checked", "The next useful step"]],
        ["Processes", ["Agent, shell and jobs", "Remain on their host", "Reconnect or restart"]],
    ];
    return <Canvas w={w} h={h} title="Three kinds of continuity" note={narrow ? ["Running processes remain", "on their original host."] : ["Files, context, and processes each need a separate handoff method."]}>
        {data.map(([title, lines], i) => <Panel key={title} x={narrow ? 14 : 14 + i * 268} y={narrow ? 65 + i * 161 : 78} w={narrow ? 308 : 256} title={title} lines={lines} number={`0${i + 1}`} />)}
    </Canvas>;
}
function Handoff() {
    const narrow = useNarrow(), w = narrow ? 336 : 820, h = narrow ? 790 : 380;
    const steps = [
        ["Pause", ["Stop source writers", "Record the snapshot"]],
        ["Compare", ["Check both copies", "Preserve conflicts"]],
        ["Transfer", ["Stage the file set", "Verify its contents"]],
        ["Continue", ["Acknowledge receipt", "Change the owner"]],
    ];
    return <Canvas w={w} h={h} title="One active workspace" note={narrow ? ["If the handoff is uncertain,", "check ownership before writing."] : ["Keep source writers paused until the destination is verified and the handoff is acknowledged."]}>
        {steps.map(([title, lines], i) => {
            const x = narrow ? 28 : 14 + i * 202, y = narrow ? 65 + i * 164 : 85, bw = narrow ? 280 : 186;
            return <g key={title}>
                <Panel x={x} y={y} w={bw} h={138} title={title} lines={lines} number={`0${i + 1}`} />
                {i < 3 && <Arrow x1={narrow ? 168 : x + bw} y1={narrow ? y + 138 : y + 70} x2={narrow ? 168 : x + 202} y2={narrow ? y + 160 : y + 70} />}
            </g>;
        })}
        {!narrow && <Label x={14} y={268} lines={["Source active → writers paused → destination verified → destination active"]} />}
    </Canvas>;
}
function Message() {
    const narrow = useNarrow(), w = narrow ? 336 : 820, h = narrow ? 668 : 420;
    const data = [
        ["Send a task", ["Stable task ID", "Input snapshot", "Goal and allowed scope"]],
        ["Run remotely", ["Acknowledge receipt", "Record progress", "Write result artifacts"]],
        ["Review the result", ["Match the input", "Read logs and changes", "Accept or reconcile"]],
    ];
    return <Canvas w={w} h={h} title="A message with a result" note={narrow ? ["SSH carries the exchange.", "A worker must consume the task."] : ["SSH provides transport. A task interface supplies delivery, identity, acknowledgment and results."]}>
        {data.map(([title, lines], i) => {
            const x = narrow ? 28 : 14 + i * 270, y = narrow ? 65 + i * 170 : 85, bw = narrow ? 280 : 248;
            return <g key={title}><Panel x={x} y={y} w={bw} title={title} lines={lines} number={`0${i + 1}`} />
                {i < 2 && <Arrow x1={narrow ? 168 : x + bw} y1={narrow ? y + 148 : y + 74} x2={narrow ? 168 : x + 270} y2={narrow ? y + 168 : y + 74} />}
            </g>;
        })}
        {!narrow && <><path className="fig-water" d="M675 251v35H140v-24m-4 6 4-6 4 6" /><Label x={245} y={312} lines={["Task identity survives retries and reconnects."]} /></>}
    </Canvas>;
}
function Jobs() {
    const narrow = useNarrow(), w = narrow ? 336 : 820, h = narrow ? 738 : 435;
    return <Canvas w={w} h={h} title="Separate work, traceable results" note={narrow ? ["A result belongs to the snapshot", "the worker actually used."] : ["Each job result identifies the input snapshot used during that run."]}>
        <Panel x={14} y={70} w={narrow ? 308 : 365} h={164} title="Foreground Mac" number="01" lines={["Active project and agent", "Continue editing locally", "Review returned changes"]} />
        <Panel x={narrow ? 14 : 441} y={narrow ? 275 : 70} w={narrow ? 308 : 365} h={164} title="Background Mac" number="02" lines={["Isolated task workspace", "Build, test or render", "Record inputs and outputs"]} />
        <Arrow x1={narrow ? 168 : 379} y1={narrow ? 234 : 153} x2={narrow ? 168 : 441} y2={narrow ? 273 : 153} />
        <rect x={14} y={narrow ? 485 : 280} width={w - 28} height={narrow ? 146 : 74} rx="2" className="fig-ink" />
        <Label x={30} y={narrow ? 515 : 308} title lines={["Result record"]} />
        <Label x={30} y={narrow ? 545 : 333} lines={narrow ? ["Input fingerprint · tool versions", "Commands · exit codes", "Logs · artifacts · file changes"] : ["Input fingerprint · tool versions · commands · exit codes · logs · artifacts · file changes"]} />
    </Canvas>;
}
export const TWO_MACS_FIGURES = {
    "two-macs-state": State,
    "two-macs-handoff": Handoff,
    "two-macs-message": Message,
    "two-macs-jobs": Jobs,
};
