import { Plate, frame, NARROW, useNarrow, WIDE } from "./plate";

/**
 * The figures for "Deciding what runs next". Box, Arrow and Chip repeat the primitives the
 * figures module keeps private, so this post owns its own drawing rather than reaching
 * into that file.
 */

function Box({ x, y, w, h, name, note, wash, open }) {
    return (
        <g>
            {wash && (
                <rect className="fig-wash" x={x} y={y} width={w} height={h} />
            )}
            <rect
                className={open ? "fig-ink fig-open" : "fig-ink"}
                x={x}
                y={y}
                width={w}
                height={h}
            />
            <text
                className="fig-title sm"
                x={x + 13}
                y={y + (note ? 24 : h / 2 + 5)}
            >
                {name}
            </text>
            {note && (
                <text className="fig-sub" x={x + 13} y={y + 42}>
                    {note}
                </text>
            )}
        </g>
    );
}

// A water-coloured run with a head on its far end, horizontal or vertical.
function Arrow({ from, to }) {
    const [x1, y1] = from;
    const [x2, y2] = to;
    const horizontal = y1 === y2;
    const head = horizontal
        ? `M${x2} ${y2} l-7 -4 M${x2} ${y2} l-7 4`
        : `M${x2} ${y2} l-4 ${y2 > y1 ? -7 : 7} M${x2} ${y2} l4 ${y2 > y1 ? -7 : 7}`;
    return (
        <g>
            <path className="fig-water" d={`M${x1} ${y1} H${x2} V${y2}`} />
            <path className="fig-water" d={head} />
        </g>
    );
}

// A node as it appears in a batch: named, and drawn open when it was skipped.
function Chip({ x, y, w, label, open }) {
    return (
        <g>
            <rect
                className={open ? "fig-ink fig-open" : "fig-ink"}
                x={x}
                y={y}
                width={w}
                height={24}
                rx="2"
            />
            <text
                className={open ? "fig-sub" : "fig-row"}
                x={x + w / 2}
                y={y + 16}
                textAnchor="middle"
            >
                {label}
            </text>
        </g>
    );
}

/* ---- the drawing, the four passes, the plan ---- */

const PASSES = [
    ["01", "paths", "breadth-first from the trigger"],
    ["02", "loops", "a loop node becomes two sentinels"],
    ["03", "nodes", "parallel nodes expand into branches"],
    ["04", "edges", "each one typed by the handle it leaves"],
];
const PLAN_LABEL =
    "The nodes and edges someone laid out on the canvas pass through four stages of buildWorkflow and come out as an execution plan: the nodes the trigger can reach, every edge typed by the handle it leaves from, and a dependency list for each node.";

function DrawnToPlan() {
    const narrow = useNarrow();
    if (narrow) {
        const w = NARROW - 40;
        return (
            <svg
                className="fig"
                viewBox={frame(NARROW, 540)}
                role="img"
                aria-label={PLAN_LABEL}
            >
                <Plate w={NARROW} h={540} ground={[{ y: 500, amp: 8 }]}>
                    <Box
                        x={0}
                        y={14}
                        w={w}
                        h={56}
                        name="the drawing"
                        note="8 nodes, 9 edges, positions"
                    />
                    <Arrow from={[w / 2, 70]} to={[w / 2, 104]} />
                    {PASSES.map(([n, name, note], i) => (
                        <g key={n}>
                            <Box
                                x={0}
                                y={104 + i * 66}
                                w={w}
                                h={52}
                                name={`${n}  ${name}`}
                                note={note}
                            />
                        </g>
                    ))}
                    <Arrow from={[w / 2, 368]} to={[w / 2, 402]} />
                    <Box
                        x={0}
                        y={402}
                        w={w}
                        h={56}
                        name="the plan"
                        note="typed edges, dependencies per node"
                        wash
                    />
                    <text className="fig-sub" x="0" y="486">
                        all four are pure, so they run inside the workflow
                    </text>
                </Plate>
            </svg>
        );
    }
    const col = 224;
    const mid = 298;
    return (
        <svg
            className="fig"
            viewBox={frame(WIDE, 300)}
            role="img"
            aria-label={PLAN_LABEL}
        >
            <Plate w={WIDE} h={300} ground={[{ y: 268, amp: 9 }]}>
                <text className="fig-title" x="0" y="20">
                    the drawing
                </text>
                <text className="fig-title" x={mid} y="20">
                    four passes
                </text>
                <text className="fig-title" x={WIDE - col} y="20">
                    the plan
                </text>

                <rect
                    className="fig-ink"
                    x={0}
                    y={36}
                    width={col}
                    height={166}
                />
                <text className="fig-sub" x="13" y="86">
                    8 nodes
                </text>
                <text className="fig-sub" x="13" y="110">
                    9 edges
                </text>
                <text className="fig-sub" x="13" y="134">
                    positions on a grid
                </text>
                <text className="fig-dim" x="13" y="176">
                    nothing here is ordered
                </text>

                {PASSES.map(([n, name], i) => (
                    <g key={n}>
                        <rect
                            className="fig-ink"
                            x={mid}
                            y={36 + i * 42}
                            width={col}
                            height={34}
                        />
                        <text
                            className="fig-dim"
                            x={mid + 13}
                            y={36 + i * 42 + 22}
                        >
                            {n}
                        </text>
                        <text
                            className="fig-title sm"
                            x={mid + 44}
                            y={36 + i * 42 + 22}
                        >
                            {name}
                        </text>
                    </g>
                ))}

                <rect
                    className="fig-wash"
                    x={WIDE - col}
                    y={36}
                    width={col}
                    height={166}
                />
                <rect
                    className="fig-ink"
                    x={WIDE - col}
                    y={36}
                    width={col}
                    height={166}
                />
                <text className="fig-sub" x={WIDE - col + 13} y="86">
                    reachable nodes
                </text>
                <text className="fig-sub" x={WIDE - col + 13} y="110">
                    edges typed by handle
                </text>
                <text className="fig-sub" x={WIDE - col + 13} y="134">
                    a dependency list each
                </text>
                <text className="fig-dim" x={WIDE - col + 13} y="176">
                    this is what the loop reads
                </text>

                <Arrow from={[col + 12, 119]} to={[mid - 12, 119]} />
                <Arrow
                    from={[mid + col + 12, 119]}
                    to={[WIDE - col - 12, 119]}
                />

                <text className="fig-sub" x="0" y="238">
                    all four passes are pure functions, so they run inside the
                    workflow rather than as an activity
                </text>
            </Plate>
        </svg>
    );
}

/* ---- the batches, and the node nobody took ---- */

const BATCHES = [
    [["trigger", false]],
    [
        ["enrich", false],
        ["score", false],
    ],
    [["check", false]],
    [
        ["notify", false],
        ["nurture", true],
    ],
    [["record", false]],
    [["done", false]],
];
const NOTES = [
    "",
    "both become ready at once",
    "takes the true branch",
    "the false branch is skipped",
    "one parent completed, one skipped",
    "",
];
const BATCH_LABEL =
    "Six batches of one run. The trigger runs alone, then two nodes together, then the conditional, which skips the branch it did not take. The join after the branches still runs, because one of its two parents completed.";

function BatchByBatch() {
    const narrow = useNarrow();
    const cw = narrow ? 84 : 96;
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 396 : 350;
    const railX = narrow ? 18 : 22;
    const startX = narrow ? 40 : 48;
    const top = 36;
    const pitch = narrow ? 40 : 38;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label={BATCH_LABEL}
        >
            <Plate w={w} h={h} ground={[{ y: h - 20, amp: 8 }]}>
                <text className="fig-title" x="0" y="20">
                    one run, batch by batch
                </text>
                <path
                    className="fig-mist"
                    d={`M${railX} ${top + 6} V${top + pitch * 5 + 18}`}
                />
                {BATCHES.map((set, i) => (
                    <g key={i}>
                        <text
                            className="fig-dim"
                            x={railX - 8}
                            y={top + i * pitch + 18}
                            textAnchor="end"
                        >
                            {i + 1}
                        </text>
                        {set.map(([name, open], j) => (
                            <Chip
                                key={name}
                                x={startX + j * (cw + 10)}
                                y={top + i * pitch}
                                w={cw}
                                label={name}
                                open={open}
                            />
                        ))}
                        {!narrow && NOTES[i] && (
                            <text
                                className="fig-sub"
                                x={startX + 2 * (cw + 10) + 12}
                                y={top + i * pitch + 16}
                            >
                                {NOTES[i]}
                            </text>
                        )}
                    </g>
                ))}
                {(narrow
                    ? [
                          ["fig-sub", "the ready set is recomputed after"],
                          ["fig-sub", "every batch, so it follows the skips"],
                          ["fig-dim", "the batch is a barrier: the next one"],
                          ["fig-dim", "starts when the slowest finishes"],
                      ]
                    : [
                          [
                              "fig-sub",
                              "the ready set is recomputed after every batch, so it follows the skips",
                          ],
                          [
                              "fig-dim",
                              "the batch is a barrier: the next one starts when the slowest node in this one finishes",
                          ],
                      ]
                ).map(([cls, text], i, all) => (
                    <text
                        key={text}
                        className={cls}
                        x="0"
                        y={top + pitch * 5 + 60 + i * 18}
                    >
                        {text}
                    </text>
                ))}
            </Plate>
        </svg>
    );
}

/* ---- what a failure changes ---- */

const CASES = [
    {
        head: "one of two parallel calls fails",
        body: "check has two parents. One failed, one completed, so check still ran.",
        tally: "6 completed · 1 failed · 1 skipped",
        note: "all six batches went through",
    },
    {
        head: "the branch that was taken fails",
        body: "Nothing downstream has a completed parent left, so the join and the output are skipped.",
        tally: "4 completed · 1 failed · 3 skipped",
        note: "the run ends after four batches",
    },
];
const FAIL_LABEL =
    "Two runs of the same workflow. When one of two parallel calls fails, the node after them still runs because its other parent completed. When the only branch taken fails, everything downstream loses its last completed parent and is skipped.";

function WhenSomethingFails() {
    const narrow = useNarrow();
    if (narrow) {
        const w = NARROW - 40;
        return (
            <svg
                className="fig"
                viewBox={frame(NARROW, 400)}
                role="img"
                aria-label={FAIL_LABEL}
            >
                <Plate w={NARROW} h={400} ground={[{ y: 394, amp: 7 }]}>
                    {CASES.map((c, i) => (
                        <g key={c.head}>
                            <rect
                                className="fig-ink"
                                x={0}
                                y={14 + i * 176}
                                width={w}
                                height={154}
                            />
                            <text
                                className="fig-dim"
                                x="13"
                                y={14 + i * 176 + 24}
                            >
                                {c.head}
                            </text>
                            <text
                                className="fig-sub"
                                x="13"
                                y={14 + i * 176 + 50}
                            >
                                {c.body.slice(0, 44)}
                            </text>
                            <text
                                className="fig-sub"
                                x="13"
                                y={14 + i * 176 + 68}
                            >
                                {c.body.slice(44)}
                            </text>
                            <text
                                className="fig-title sm"
                                x="13"
                                y={14 + i * 176 + 104}
                            >
                                {c.tally}
                            </text>
                            <text
                                className="fig-sub"
                                x="13"
                                y={14 + i * 176 + 130}
                            >
                                {c.note}
                            </text>
                        </g>
                    ))}
                    <text className="fig-sub" x="0" y="362">
                        a node is skipped only when every one of
                    </text>
                    <text className="fig-sub" x="0" y="380">
                        its dependencies failed or was skipped
                    </text>
                </Plate>
            </svg>
        );
    }
    const col = (WIDE - 28) / 2;
    return (
        <svg
            className="fig"
            viewBox={frame(WIDE, 250)}
            role="img"
            aria-label={FAIL_LABEL}
        >
            <Plate w={WIDE} h={250} ground={[{ y: 218, amp: 9 }]}>
                <text className="fig-title" x="0" y="20">
                    what a failure changes
                </text>
                {CASES.map((c, i) => (
                    <g key={c.head}>
                        {i === 1 && (
                            <rect
                                className="fig-wash"
                                x={i * (col + 28)}
                                y={36}
                                width={col}
                                height={128}
                            />
                        )}
                        <rect
                            className="fig-ink"
                            x={i * (col + 28)}
                            y={36}
                            width={col}
                            height={128}
                        />
                        <text
                            className="fig-dim"
                            x={i * (col + 28) + 13}
                            y={60}
                        >
                            {c.head}
                        </text>
                        <text
                            className="fig-title sm"
                            x={i * (col + 28) + 13}
                            y={92}
                        >
                            {c.tally}
                        </text>
                        <text
                            className="fig-sub"
                            x={i * (col + 28) + 13}
                            y={120}
                        >
                            {c.note}
                        </text>
                        <text
                            className="fig-sub"
                            x={i * (col + 28) + 13}
                            y={146}
                        >
                            {i === 0
                                ? "the join kept one completed parent"
                                : "the join lost its last completed parent"}
                        </text>
                    </g>
                ))}
                <text className="fig-sub" x="0" y="194">
                    a node is skipped only when every one of its dependencies
                    failed or was skipped, and skipping walks forward from there
                </text>
            </Plate>
        </svg>
    );
}

export const PLAN_FIGURES = {
    "drawn-to-plan": DrawnToPlan,
    "batch-by-batch": BatchByBatch,
    "when-something-fails": WhenSomethingFails,
};
