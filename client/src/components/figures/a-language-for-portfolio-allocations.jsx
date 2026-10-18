import { Plate, frame, NARROW, useNarrow, WIDE } from "./plate";

function Box({ x, y, w, title, note, wash = false }) {
    return (
        <g>
            {wash && (
                <rect className="fig-wash" x={x} y={y} width={w} height={64} />
            )}
            <rect className="fig-ink" x={x} y={y} width={w} height={64} />
            <text className="fig-title sm" x={x + 12} y={y + 26}>
                {title}
            </text>
            <text className="fig-sub" x={x + 12} y={y + 46}>
                {note}
            </text>
        </g>
    );
}
function Arrow({ x, from, to }) {
    return (
        <path
            className="fig-water"
            d={`M${x} ${from} V${to} m-4 -7 l4 7 4 -7`}
        />
    );
}
function Pipeline() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const steps = [
        ["Parse", "source → typed nodes"],
        ["Validate", "check fields and relationships"],
        ["Prepare", "symbols, indicators, history"],
        ["Evaluate", "tree → target weights"],
        ["Size in the session", "weights → intended orders"],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, 526)}
            role="img"
            aria-label="Parsing, validation and preparation lead to allocation evaluation. The session sizes intended orders separately."
        >
            <Plate w={w} h={526} ground={[]}>
                {steps.map(([title, note], i) => (
                    <g key={title}>
                        <Box
                            x={narrow ? 16 : 190}
                            y={22 + i * 94}
                            w={narrow ? w - 32 : 440}
                            title={title}
                            note={note}
                            wash={i === 3}
                        />
                        {i < 4 && (
                            <Arrow
                                x={w / 2}
                                from={86 + i * 94}
                                to={116 + i * 94}
                            />
                        )}
                    </g>
                ))}
            </Plate>
        </svg>
    );
}
function Composition() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    if (narrow)
        return (
            <svg
                className="fig"
                viewBox={frame(w, 466)}
                role="img"
                aria-label="Equities receive 60 percent and divide equally into VTI 30 percent and QQQ 30 percent. Bonds receive 40 percent in TLT."
            >
                <Plate w={w} h={466} ground={[]}>
                    <Box
                        x={16}
                        y={22}
                        w={304}
                        title="Equities: 60%"
                        note="equal split within the group"
                    />
                    <Arrow x={168} from={86} to={116} />
                    <Box
                        x={16}
                        y={116}
                        w={144}
                        title="VTI: 30%"
                        note="60 × 50 / 100"
                        wash
                    />
                    <Box
                        x={176}
                        y={116}
                        w={144}
                        title="QQQ: 30%"
                        note="60 × 50 / 100"
                        wash
                    />
                    <Box
                        x={16}
                        y={224}
                        w={304}
                        title="Bonds: 40%"
                        note="one asset receives this share"
                    />
                    <Arrow x={168} from={288} to={318} />
                    <Box
                        x={16}
                        y={318}
                        w={304}
                        title="TLT: 40%"
                        note="40 × 100 / 100"
                        wash
                    />
                    <text className="fig-sub" x={16} y={420}>
                        Portfolio total: 30 + 30 + 40 = 100%
                    </text>
                </Plate>
            </svg>
        );
    return (
        <svg
            className="fig"
            viewBox={frame(w, 338)}
            role="img"
            aria-label="The 60 percent equity group divides into two 30 percent allocations. The bond group contributes 40 percent to TLT."
        >
            <Plate w={w} h={338} ground={[]}>
                <Box
                    x={20}
                    y={26}
                    w={480}
                    title="Equities: 60%"
                    note="each child receives half of this group’s share"
                />
                <Box
                    x={540}
                    y={26}
                    w={260}
                    title="Bonds: 40%"
                    note="one asset receives this share"
                />
                <path
                    className="fig-water"
                    d="M260 90 V118 M140 118 H380 M140 118 V152 M380 118 V152"
                />
                <Arrow x={670} from={90} to={152} />
                <Box
                    x={20}
                    y={152}
                    w={230}
                    title="VTI: 30%"
                    note="60 × 50 / 100"
                    wash
                />
                <Box
                    x={270}
                    y={152}
                    w={230}
                    title="QQQ: 30%"
                    note="60 × 50 / 100"
                    wash
                />
                <Box
                    x={540}
                    y={152}
                    w={260}
                    title="TLT: 40%"
                    note="40 × 100 / 100"
                    wash
                />
                <text className="fig-sub" x={20} y={280}>
                    Each child allocates internally; the parent scales its
                    contribution to the portfolio.
                </text>
            </Plate>
        </svg>
    );
}
export const DSL_FIGURES = {
    "dsl-pipeline": Pipeline,
    "dsl-composition": Composition,
};
