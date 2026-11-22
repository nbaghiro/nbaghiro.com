import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";
import diagrams from "./mac-setup-data.json";

function wrap(text, max) {
    const lines = [""];
    for (const word of text.split(" ")) {
        const last = lines.length - 1;
        if (lines[last] && lines[last].length + word.length + 1 > max)
            lines.push(word);
        else lines[last] += (lines[last] ? " " : "") + word;
    }
    return lines;
}

function Diagram({ spec }) {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const title = wrap(spec.title, narrow ? 37 : 90);
    const note = wrap(spec.note, narrow ? 43 : 110);
    const start = 88 + (title.length - 1) * 24;
    const h = narrow ? start + 3 * 132 + 100 : start + 230;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label={`${spec.title}. ${spec.note}`}
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                {title.map((line, i) => (
                    <text
                        key={line}
                        className="fig-title"
                        x="14"
                        y={32 + i * 24}
                    >
                        {line}
                    </text>
                ))}
                {wrap(spec.sub, narrow ? 47 : 120).map((line, i) => (
                    <text
                        key={line}
                        className="fig-sub"
                        x="14"
                        y={55 + (title.length - 1) * 24 + i * 17}
                    >
                        {line}
                    </text>
                ))}
                {spec.cards.map(([heading, ...lines], i) => {
                    const x = narrow ? 14 : 14 + i * 274;
                    const y = narrow ? start + i * 132 : start;
                    const bw = narrow ? 308 : 246;
                    return (
                        <g key={heading}>
                            <rect
                                className="fig-wash"
                                x={x}
                                y={y}
                                width={bw}
                                height="103"
                                rx="3"
                            />
                            <rect
                                className="fig-ink"
                                x={x}
                                y={y}
                                width={bw}
                                height="103"
                                rx="3"
                            />
                            <text className="fig-title" x={x + 13} y={y + 29}>
                                {heading}
                            </text>
                            {lines.map((line, j) => (
                                <text
                                    className="fig-sub"
                                    key={line}
                                    x={x + 13}
                                    y={y + 57 + j * 21}
                                >
                                    {line}
                                </text>
                            ))}
                            {spec.flow && i < 2 && (
                                <path
                                    className="fig-water"
                                    d={
                                        narrow
                                            ? `M168 ${y + 103}v25m-4 -6 4 6 4-6`
                                            : `M${x + bw} ${y + 51}h24m-6 -4 6 4-6 4`
                                    }
                                />
                            )}
                        </g>
                    );
                })}
                <path className="fig-mist" d={`M14 ${h - 105}H${w - 14}`} />
                {note.map((line, i) => (
                    <text
                        key={line}
                        className="fig-sub"
                        x="14"
                        y={h - 78 + i * 19}
                    >
                        {line}
                    </text>
                ))}
            </Plate>
        </svg>
    );
}

export const MAC_SETUP_FIGURES = Object.fromEntries(
    diagrams.map((spec) => [
        spec.id,
        function Figure() {
            return <Diagram spec={spec} />;
        },
    ])
);
