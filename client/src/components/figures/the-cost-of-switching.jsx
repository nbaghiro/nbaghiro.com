import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

const palette = ["#557b70", "#7b7861", "#647c97", "#90775f", "#647c70"];

function TextLines({ lines, x, y, size = 13, color = "#465950" }) {
    return (
        <text x={x} y={y} style={{ fontSize: size, fill: color }}>
            {lines.map((line, i) => (
                <tspan key={line} x={x} dy={i ? 21 : 0}>
                    {line}
                </tspan>
            ))}
        </text>
    );
}

function Arrow({ x, y, vertical = false }) {
    return (
        <path
            d={
                vertical
                    ? `M${x} ${y}v20m-4-5 4 5 4-5`
                    : `M${x} ${y}h20m-5-4 5 4-5 4`
            }
            fill="none"
            stroke="#8b9e94"
            strokeWidth="1.5"
        />
    );
}

function MarketingPath() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 780 : 326;
    const cw = narrow ? w - 24 : 252;
    const cards = [
        {
            title: "Recognize the problem",
            question: "Does this happen here?",
            evidence: ["Explain one repeated task", "and the work it creates."],
            next: "See a relevant example",
        },
        {
            title: "See the workflow",
            question: "Would this help us?",
            evidence: ["Show the complete job,", "including its exceptions."],
            next: "Discuss workflow fit",
        },
        {
            title: "Understand the move",
            question: "Can we change safely?",
            evidence: [
                "Explain records, staff,",
                "timing, and responsibilities.",
            ],
            next: "Assess the transition",
        },
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Marketing path: recognize the problem, see the workflow, understand the move. Each stage pairs a buyer question with evidence and a next step."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 7 }]}>
                <text className="fig-title" x="12" y="28">
                    Give the next question an answer
                </text>
                {cards.map((c, i) => {
                    const x = narrow ? 12 : 12 + i * 272;
                    const y = narrow ? 52 + i * 222 : 56;
                    return (
                        <g key={c.title}>
                            <rect
                                x={x}
                                y={y}
                                width={cw}
                                height="202"
                                rx="12"
                                fill={palette[i]}
                                fillOpacity=".07"
                                stroke={palette[i]}
                                strokeOpacity=".35"
                            />
                            <rect
                                x={x + 16}
                                y={y + 17}
                                width="26"
                                height="26"
                                rx="8"
                                fill={palette[i]}
                            />
                            <text
                                x={x + 29}
                                y={y + 35}
                                textAnchor="middle"
                                style={{ fill: "white", fontSize: 13 }}
                            >
                                {i + 1}
                            </text>
                            <TextLines
                                x={x + 16}
                                y={y + 69}
                                size={16}
                                lines={[c.title]}
                            />
                            <TextLines
                                x={x + 16}
                                y={y + 96}
                                size={13}
                                color={palette[i]}
                                lines={[c.question]}
                            />
                            <TextLines
                                x={x + 16}
                                y={y + 124}
                                lines={c.evidence}
                            />
                            <path
                                d={`M${x + 16} ${y + 160}h${cw - 32}`}
                                stroke={palette[i]}
                                strokeOpacity=".25"
                            />
                            <TextLines
                                x={x + 16}
                                y={y + 184}
                                size={12}
                                lines={[c.next]}
                            />
                            {i < 2 && (
                                <Arrow
                                    x={narrow ? w / 2 : x + cw}
                                    y={narrow ? y + 202 : y + 100}
                                    vertical={narrow}
                                />
                            )}
                        </g>
                    );
                })}
                <TextLines
                    x={12}
                    y={h - 42}
                    size={12}
                    lines={["Carry the question and source into sales."]}
                />
            </Plate>
        </svg>
    );
}

function SalesGates() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 756 : 570;
    const rows = [
        [
            "Qualified problem",
            "Owner names the pain",
            "Current tools, impact, and timing",
        ],
        [
            "Workflow fit",
            "Real scenario works",
            "Requirements and gaps recorded",
        ],
        [
            "Transition feasible",
            "Move is understood",
            "Records, people, and risks checked",
        ],
        [
            "Decision agreed",
            "Buyer commits to a plan",
            "Scope, price, owner, and start date",
        ],
        [
            "Won and handed over",
            "Onboarding has an owner",
            "Promises and open risks transferred",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Five proposed sales stages, each paired with buyer evidence. Qualified problem, workflow fit, transition feasible, decision agreed, and won and handed over. Activation is tracked separately after sale."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 7 }]}>
                <text className="fig-title" x="12" y="28">
                    Progress needs evidence
                </text>
                {!narrow && (
                    <>
                        <TextLines x={60} y={59} size={11} lines={["STAGE"]} />
                        <TextLines
                            x={304}
                            y={59}
                            size={11}
                            lines={["EVIDENCE BEFORE ADVANCING"]}
                        />
                    </>
                )}
                {rows.map(([stage, evidence, detail], i) => {
                    const y = (narrow ? 52 : 76) + i * (narrow ? 124 : 84);
                    return (
                        <g key={stage}>
                            {i < 4 && (
                                <path
                                    d={`M28 ${y + 22}v${narrow ? 124 : 84}`}
                                    stroke="#a2b2aa"
                                />
                            )}
                            <circle
                                cx="28"
                                cy={y + 22}
                                r="14"
                                fill={palette[i]}
                            />
                            <text
                                x="28"
                                y={y + 27}
                                textAnchor="middle"
                                style={{ fill: "white", fontSize: 13 }}
                            >
                                {i + 1}
                            </text>
                            <rect
                                x="52"
                                y={y}
                                width={w - 64}
                                height={narrow ? 108 : 68}
                                rx="9"
                                fill={palette[i]}
                                fillOpacity=".055"
                                stroke={palette[i]}
                                strokeOpacity=".25"
                            />
                            <TextLines
                                x={64}
                                y={y + 25}
                                size={15}
                                lines={[stage]}
                            />
                            <TextLines
                                x={narrow ? 64 : 304}
                                y={y + (narrow ? 53 : 25)}
                                size={14}
                                color={palette[i]}
                                lines={[evidence]}
                            />
                            <TextLines
                                x={narrow ? 64 : 304}
                                y={y + (narrow ? 79 : 48)}
                                size={narrow ? 11 : 13}
                                lines={[detail]}
                            />
                        </g>
                    );
                })}
                <TextLines
                    x={12}
                    y={h - 58}
                    size={12}
                    lines={[
                        "After the sale: activate the agreed workflow.",
                        "Keep activation separate from closed-won.",
                    ]}
                />
            </Plate>
        </svg>
    );
}

function CohortEconomics() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 718 : 470;
    const bw = narrow ? 210 : 330;
    const rows = [
        ["Inquiries", 20],
        ["Qualified", 10],
        ["Paying", 6],
        ["Activated", 4],
    ];
    const panelX = narrow ? 12 : 464;
    const panelY = narrow ? 380 : 74;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Hypothetical cohort: 20 inquiries, 10 qualified opportunities, six paying customers, four activated businesses. Acquisition costs 2400 dollars; 120 per inquiry, 400 per paying customer, 600 per activated business. Adding 400 dollars of onboarding makes 700 per activated business."
        >
            <Plate w={w} h={h} ground={[{ y: h - 24, amp: 7 }]}>
                <text className="fig-title" x="12" y="28">
                    Follow the cohort through adoption
                </text>
                <TextLines
                    x={12}
                    y={51}
                    size={12}
                    lines={["Illustrative only · not Clientbridge results"]}
                />
                {rows.map(([label, n], i) => {
                    const y = 78 + i * 72;
                    return (
                        <g key={label}>
                            <TextLines x={12} y={y} size={13} lines={[label]} />
                            <rect
                                x="12"
                                y={y + 11}
                                width={bw}
                                height="22"
                                rx="5"
                                fill="#617e70"
                                fillOpacity=".08"
                            />
                            <rect
                                x="12"
                                y={y + 11}
                                width={(bw * n) / 20}
                                height="22"
                                rx="5"
                                fill={palette[i]}
                                fillOpacity=".8"
                            />
                            <TextLines
                                x={bw + 28}
                                y={y + 28}
                                size={16}
                                lines={[String(n)]}
                            />
                        </g>
                    );
                })}
                <rect
                    x={panelX}
                    y={panelY}
                    width={narrow ? w - 24 : 344}
                    height="280"
                    rx="12"
                    fill="#557b70"
                    fillOpacity=".065"
                    stroke="#9caea2"
                />
                <TextLines
                    x={panelX + 18}
                    y={panelY + 30}
                    size={15}
                    lines={["$2,400 acquisition spend"]}
                />
                <TextLines
                    x={panelX + 18}
                    y={panelY + 66}
                    lines={[
                        "÷ 20 inquiries = $120 each",
                        "÷ 6 paying customers = $400 each",
                        "÷ 4 activated businesses = $600 each",
                    ]}
                />
                <path
                    d={`M${panelX + 18} ${panelY + 131}h${narrow ? w - 60 : 308}`}
                    stroke="#acbbb2"
                />
                <TextLines
                    x={panelX + 18}
                    y={panelY + 163}
                    size={14}
                    lines={["Add $400 for onboarding"]}
                />
                <TextLines
                    x={panelX + 18}
                    y={panelY + 199}
                    size={22}
                    color="#416757"
                    lines={["$700 per activated business"]}
                />
                <TextLines
                    x={panelX + 18}
                    y={panelY + 234}
                    size={12}
                    lines={[
                        "($2,400 + $400) ÷ 4",
                        "Includes the cost of incomplete adoption.",
                    ]}
                />
                <TextLines
                    x={12}
                    y={h - 44}
                    size={12}
                    lines={[
                        narrow
                            ? "Use a cohort with time to progress."
                            : "Same cohort, different denominators. Give every business time to progress.",
                    ]}
                />
            </Plate>
        </svg>
    );
}

export const SWITCHING_FIGURES = {
    "switching-marketing": MarketingPath,
    "switching-sales": SalesGates,
    "switching-economics": CohortEconomics,
};
