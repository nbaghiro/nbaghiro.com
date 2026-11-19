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

// The pipeline, with the one step a format swap would reach marked apart from the rest.
function NotationLayers() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 740 : 480;
    const steps = [
        [
            "01 · parse",
            ["text into a generic tree", "489 lines, no vocabulary"],
        ],
        ["02 · check", ["against the vocabulary", "59 scene node types"]],
        ["03 · verify", ["every variant proved", "capacities and fit"]],
        ["04 · draw", ["instantiate, lay out", "screen or sheet"]],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="A lesson file is parsed into a generic tree, checked against the vocabulary, verified and drawn. Only the parse step is syntax, and it is the only step a move to JSON would replace."
        >
            <Plate w={w} h={h} ground={[{ y: h - 26, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    one file, four steps
                </text>
                <text className="fig-sub" x="14" y="52">
                    the vocabulary carries the meaning, not the syntax
                </text>
                {narrow ? (
                    <>
                        {steps.map(([name, lines], i) => (
                            <g key={name}>
                                <Box
                                    x={14}
                                    y={86 + i * 142}
                                    w={308}
                                    h={96}
                                    title={name}
                                    lines={lines}
                                />
                                {i < 3 && (
                                    <path
                                        className="fig-water"
                                        d={`M168 ${182 + i * 142}v22m-4-6 4 6 4-6`}
                                    />
                                )}
                            </g>
                        ))}
                        <text className="fig-dim" x="14" y={h - 58}>
                            a format swap reaches the first box
                        </text>
                        <text className="fig-dim" x="14" y={h - 36}>
                            and stops there
                        </text>
                    </>
                ) : (
                    <>
                        {steps.map(([name, lines], i) => (
                            <g key={name}>
                                <Box
                                    x={14 + i * 204}
                                    y={92}
                                    w={180}
                                    h={132}
                                    title={name}
                                    lines={lines}
                                />
                                {i < 3 && (
                                    <path
                                        className="fig-water"
                                        d={`M${194 + i * 204} 158h18m-6-4 6 4-6 4`}
                                    />
                                )}
                            </g>
                        ))}
                        <path className="fig-mist" d="M14 266H806" />
                        <text className="fig-title" x="14" y="296">
                            what a move to JSON would reach
                        </text>
                        <text className="fig-sub" x="14" y="318">
                            the first box, and nothing after it
                        </text>
                        <Box
                            x={14}
                            y={340}
                            w={180}
                            h={88}
                            title="replaced"
                            lines={["the 489 syntax lines"]}
                        />
                        <Box
                            x={218}
                            y={340}
                            w={588}
                            h={88}
                            title="untouched"
                            lines={[
                                "exact arithmetic · the vocabulary · verification · instantiation · layout · renderers",
                            ]}
                        />
                        <text className="fig-dim" x="14" y={h - 36}>
                            none of it reads characters
                        </text>
                    </>
                )}
            </Plate>
        </svg>
    );
}

// The two sides of the trade, in the counts that were actually taken.
function NotationCost() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 668 : 430;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="The notation module is 13,112 lines and the syntax is 489 of them. The corpus holds 1,713 prose blocks and 10,496 comment lines, which JSON would escape or lose."
        >
            <Plate w={w} h={h} ground={[{ y: h - 26, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    what the swap would cost
                </text>
                <text className="fig-sub" x="14" y="52">
                    counted in the module and in the files
                </text>
                <Box
                    x={14}
                    y={82}
                    w={narrow ? 308 : 388}
                    h={narrow ? 136 : 150}
                    title="the module"
                    lines={[
                        "13,112 lines, excluding tests",
                        "489 of them are the syntax",
                        "59 node types, none named in it",
                    ]}
                />
                <Box
                    x={narrow ? 14 : 418}
                    y={narrow ? 246 : 82}
                    w={narrow ? 308 : 388}
                    h={narrow ? 136 : 150}
                    title="the content"
                    lines={[
                        "6,455 files, 241,369 lines",
                        "1,713 prose blocks, escaped",
                        "10,496 comment lines, lost",
                    ]}
                />
                <path
                    className="fig-mist"
                    d={narrow ? "M14 412H322" : "M14 264H806"}
                />
                <text className="fig-title" x="14" y={narrow ? 442 : 294}>
                    under four per cent of one module
                </text>
                <text className="fig-sub" x="14" y={narrow ? 464 : 316}>
                    {narrow
                        ? "the arithmetic, the vocabulary, the"
                        : "the arithmetic, the vocabulary, the verifier, the layout"}
                </text>
                <text className="fig-sub" x="14" y={narrow ? 486 : 338}>
                    {narrow
                        ? "verifier and the renderers never"
                        : "and the renderers never read characters"}
                </text>
                {narrow && (
                    <text className="fig-sub" x="14" y={508}>
                        read characters
                    </text>
                )}
                <text className="fig-dim" x="14" y={h - 36}>
                    the format was never the expensive part
                </text>
            </Plate>
        </svg>
    );
}

export const NOTATION_FIGURES = {
    "notation-layers": NotationLayers,
    "notation-cost": NotationCost,
};
