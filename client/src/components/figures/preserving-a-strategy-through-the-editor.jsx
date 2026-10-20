import { Plate, frame, NARROW, WIDE, useNarrow } from "./plate";

function Box({ x, y, w, title, lines, active = false }) {
    return (
        <g>
            <rect
                className={active ? "fig-wash strong" : "fig-wash"}
                x={x}
                y={y}
                width={w}
                height={112}
                rx="3"
            />
            <rect
                className="fig-ink"
                x={x}
                y={y}
                width={w}
                height={112}
                rx="3"
            />
            <text className="fig-title" x={x + 14} y={y + 26}>
                {title}
            </text>
            {lines.map((line, i) => (
                <text
                    key={line}
                    className="fig-sub"
                    x={x + 14}
                    y={y + 51 + i * 20}
                >
                    {line}
                </text>
            ))}
        </g>
    );
}
function Arrow({ x, y, vertical = false, length = 32 }) {
    return (
        <path
            className="fig-water"
            d={
                vertical
                    ? `M${x} ${y} v${length} m-4 -7 l4 7 4 -7`
                    : `M${x} ${y} h${length} m-7 -4 l7 4 -7 4`
            }
        />
    );
}
function Representations() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 610 : 320;
    const items = [
        [
            "Editor blocks",
            [
                'parent.allocations["group-1"] = 60',
                "group-1 → child weight block",
                "IDs connect the blocks",
            ],
        ],
        [
            "DSL text",
            [
                '(group "Equities" :weight 60',
                "  (weight :method equal …))",
                "The share is written on the group",
            ],
        ],
        [
            "Python tree",
            [
                'Group(name="Equities",',
                "      weight=60, children=[…])",
                "Nested nodes carry the fields",
            ],
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="The editor stores 60 in the parent's allocation map. DSL writes weight 60 on the group. Python parses it into a group node."
        >
            <Plate w={w} h={h} ground={[]}>
                {items.map(([title, lines], i) => {
                    const x = narrow ? 16 : 12 + i * 272,
                        y = narrow ? 36 + i * 155 : 66;
                    return (
                        <g key={title}>
                            <Box
                                x={x}
                                y={y}
                                w={narrow ? 304 : 248}
                                title={title}
                                lines={lines}
                                active={i === 1}
                            />
                            {i < 2 && (
                                <Arrow
                                    x={narrow ? w / 2 : x + 248}
                                    y={narrow ? y + 112 : y + 56}
                                    vertical={narrow}
                                    length={narrow ? 43 : 24}
                                />
                            )}
                        </g>
                    );
                })}
                <text className="fig-note" x={16} y={h - 65}>
                    The value and its parent relationship
                </text>
                <text className="fig-note" x={16} y={h - 44}>
                    must survive each conversion.
                </text>
            </Plate>
        </svg>
    );
}
function Allocation({ x, y, width, flat }) {
    const gap = 12,
        cell = (width - gap * 2) / 3;
    const centers = [0, 1, 2].map((i) => x + cell / 2 + i * (cell + gap));
    return (
        <g>
            <text className="fig-title" x={x} y={y}>
                {flat ? "One flat block" : "A group and an asset"}
            </text>
            <rect
                className="fig-ink"
                x={x}
                y={y + 25}
                width={width}
                height={42}
                rx="3"
            />
            <text className="fig-note" x={x + 12} y={y + 51}>
                Equal weighting
            </text>
            {flat ? (
                <path
                    className="fig-water"
                    d={`M${x + width / 2} ${y + 67} V${y + 150} M${centers[0]} ${y + 195} V${y + 150} H${centers[2]} V${y + 195} M${centers[1]} ${y + 150} V${y + 195}`}
                />
            ) : (
                <>
                    <path
                        className="fig-water"
                        d={`M${x + width / 2} ${y + 67} V${y + 85} H${x + width / 3} V${y + 100} M${x + width / 2} ${y + 85} H${centers[2]} V${y + 195}`}
                    />
                    <rect
                        className="fig-wash strong"
                        x={x}
                        y={y + 100}
                        width={cell * 2 + gap}
                        height={48}
                        rx="3"
                    />
                    <rect
                        className="fig-ink"
                        x={x}
                        y={y + 100}
                        width={cell * 2 + gap}
                        height={48}
                        rx="3"
                    />
                    <text className="fig-note" x={x + 10} y={y + 121}>
                        Group · 50% share
                    </text>
                    <text className="fig-sub" x={x + 10} y={y + 139}>
                        Equal split within the group
                    </text>
                    <path
                        className="fig-water"
                        d={`M${x + width / 3} ${y + 148} V${y + 170} M${centers[0]} ${y + 195} V${y + 170} H${centers[1]} V${y + 195}`}
                    />
                </>
            )}
            {["VTI", "QQQ", "TLT"].map((symbol, i) => (
                <g key={symbol}>
                    <rect
                        className="fig-ink"
                        x={centers[i] - cell / 2}
                        y={y + 195}
                        width={cell}
                        height={65}
                        rx="3"
                    />
                    <text
                        className="fig-note"
                        textAnchor="middle"
                        x={centers[i]}
                        y={y + 218}
                    >
                        {symbol}
                    </text>
                    <text
                        className="fig-title"
                        textAnchor="middle"
                        x={centers[i]}
                        y={y + 245}
                    >
                        {flat ? "33⅓%" : i === 2 ? "50%" : "25%"}
                    </text>
                </g>
            ))}
        </g>
    );
}
function Nesting() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 715 : 390;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Nested equal weighting produces VTI 25%, QQQ 25%, TLT 50%. Flattening the same assets produces one third each."
        >
            <Plate w={w} h={h} ground={[]}>
                <Allocation x={16} y={38} width={narrow ? 304 : 366} />
                <Allocation
                    x={narrow ? 16 : 438}
                    y={narrow ? 365 : 38}
                    width={narrow ? 304 : 366}
                    flat
                />
                <text className="fig-sub" x={16} y={h - 43}>
                    Same symbols · different grouping · different weights
                </text>
            </Plate>
        </svg>
    );
}
function Roundtrip() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 770 : 480;
    const labels = [
        ["Import source", ["DSL → editor tree A", "Project to canonical JSON"]],
        [
            "Export and re-import",
            ["Tree A → text → tree B", "Project tree B to canonical JSON"],
        ],
        [
            "Export again",
            ["Tree B → second export", "Compare with the first export"],
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Both imported trees must match committed reference JSON. The second export must equal the first export. Reference equality and stable text are separate checks."
        >
            <Plate w={w} h={h} ground={[]}>
                {labels.map(([title, lines], i) => {
                    const x = narrow ? 16 : 12 + i * 272,
                        y = narrow ? 38 + i * 162 : 50;
                    return (
                        <g key={title}>
                            <Box
                                x={x}
                                y={y}
                                w={narrow ? 304 : 248}
                                title={title}
                                lines={lines}
                            />
                            {i < 2 && (
                                <Arrow
                                    x={narrow ? 168 : x + 248}
                                    y={narrow ? y + 112 : y + 56}
                                    vertical={narrow}
                                    length={narrow ? 50 : 24}
                                />
                            )}
                        </g>
                    );
                })}
                <Box
                    x={16}
                    y={narrow ? 540 : 245}
                    w={narrow ? 304 : 788}
                    title="Two comparisons"
                    lines={[
                        "Tree A = reference · Tree B = reference",
                        "Second export = first export",
                        "Matching text alone can miss an earlier loss",
                    ]}
                    active
                />
                <text className="fig-note" x={16} y={h - 65}>
                    The reference checks structure and values.
                </text>
                <text className="fig-sub" x={16} y={h - 43}>
                    Repeated export checks stable serialization.
                </text>
            </Plate>
        </svg>
    );
}
export const EDITOR_DSL_FIGURES = {
    "editor-representations": Representations,
    "editor-nesting": Nesting,
    "editor-roundtrip": Roundtrip,
};
