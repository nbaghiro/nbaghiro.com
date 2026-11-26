import { Plate, frame, useNarrow } from "./plate";
function wrap(s, max) {
    const out = [""];
    for (const word of s.split(" ")) {
        let i = out.length - 1;
        if (out[i] && out[i].length + word.length + 1 > max) out.push(word);
        else out[i] += (out[i] ? " " : "") + word;
    }
    return out;
}
function Text({ x, y, lines, size = 15 }) {
    return (
        <text
            x={x}
            y={y}
            className={size >= 17 ? "fig-title" : size <= 14 ? "fig-sub" : "fig-note"}
        >
            {lines.map((t, i) => (
                <tspan key={i} x={x} dy={i ? 21 : 0}>
                    {t}
                </tspan>
            ))}
        </text>
    );
}
function Box({ x, y, w, h = 116, title, body, num }) {
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx="2"
                className="fig-ink"
            />
            {num && <Text x={x + 14} y={y + 23} lines={[num]} size={11} />}
            <Text
                x={x + 14}
                y={y + (num ? 49 : 29)}
                lines={[title]}
                size={17}
            />
            <Text
                x={x + 14}
                y={y + (num ? 74 : 56)}
                lines={wrap(body, Math.floor((w - 28) / 7.4))}
                size={14}
            />
        </g>
    );
}
function Arrow({ d }) {
    return <path d={d} className="fig-water" />;
}
function Sheet({ title, n, w, h, note, children }) {
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label={`${title}. ${note}`}
        >
            <title>{title}</title>
            <Plate w={w} h={h} ground={[{ y: h - 29, amp: 3 }]}>
                <Text
                    x={14}
                    y={31}
                    lines={wrap(title, n ? 30 : 85)}
                    size={21}
                />
                {children}
                <Text
                    x={14}
                    y={h - (n ? 62 : 49)}
                    lines={wrap(note, n ? 40 : 105)}
                    size={13}
                />
            </Plate>
        </svg>
    );
}
function Loop() {
    const n = useNarrow(),
        w = n ? 336 : 820,
        h = n ? 740 : 425;
    const steps = [
        ["Brief", "Audience, claim and evidence"],
        ["Sources", "Recorded or generated material"],
        ["Review", "Approve an exact creative revision"],
        ["Distribute", "Paid campaign or organic post"],
        ["Learn", "Results inform the next question"],
    ];
    return (
        <Sheet
            title="One experiment, kept together"
            n={n}
            w={w}
            h={h}
            note="Proposed workflow. Publishing and spending each need approval."
        >
            {steps.map(([title, body], i) => {
                const x = n ? 32 : 14 + i * 162,
                    y = n ? 85 + i * 111 : 93;
                return (
                    <g key={title}>
                        <Box
                            x={x}
                            y={y}
                            w={n ? 282 : 148}
                            h={n ? 94 : 168}
                            title={title}
                            body={body}
                            num={`0${i + 1}`}
                        />
                        {i < 4 && (
                            <Arrow
                                d={
                                    n
                                        ? `M173 ${y + 94}v16m-4-5 4 5 4-5`
                                        : `M${x + 148} 177h13m-5-4 5 4-5 4`
                                }
                            />
                        )}
                    </g>
                );
            })}
            <Arrow
                d={
                    n
                        ? "M32 626H18V132h12m-5-4 5 4-5 4"
                        : "M736 263v45H87v-44m-4 5 4-5 4 5"
                }
            />
            {!n && (
                <Text
                    x={257}
                    y={337}
                    lines={["Keep the evidence with the next brief."]}
                    size={14}
                />
            )}
        </Sheet>
    );
}
function Sources() {
    const n = useNarrow(),
        w = n ? 336 : 820,
        h = n ? 780 : 480;
    const rows = [
        ["Import a recording", "Existing demos and phone footage"],
        ["Capture the product", "Demo state, actions and checks"],
        ["Generate a scene", "A prompt with supported controls"],
    ];
    return (
        <Sheet
            title="Three ways to make source material"
            n={n}
            w={w}
            h={h}
            note="Every source keeps its origin. These capture paths are proposed."
        >
            <Box
                x={n ? 25 : 14}
                y={n ? 90 : 160}
                w={n ? 286 : 190}
                h={95}
                title="Shot plan"
                body="What must this shot show?"
            />
            {rows.map(([title, body], i) => {
                const x = n ? 43 : 268,
                    y = n ? 216 + i * 125 : 78 + i * 109;
                return (
                    <g key={title}>
                        <Box
                            x={x}
                            y={y}
                            w={n ? 268 : 260}
                            h={97}
                            title={title}
                            body={body}
                        />
                        <Arrow
                            d={
                                n
                                    ? `M25 ${y + 48}h17`
                                    : `M204 208h28V${y + 48}h34m-5-4 5 4-5 4`
                            }
                        />
                    </g>
                );
            })}
            {n ? (
                <>
                    <Arrow d="M25 185v330M311 264h14v379h-14m5-4-5 4 5 4M311 389h14M311 514h14" />
                    <Box
                        x={25}
                        y={595}
                        w={286}
                        h={97}
                        title="Source library"
                        body="Review the assets before assembly."
                    />
                </>
            ) : (
                <>
                    <Arrow d="M530 126h25v109h36m-5-4 5 4-5 4M530 235h61M530 344h25V235" />
                    <Box
                        x={592}
                        y={175}
                        w={214}
                        h={122}
                        title="Source library"
                        body="Files, provenance and review notes"
                    />
                </>
            )}
        </Sheet>
    );
}
function Jobs() {
    const n = useNarrow(),
        w = n ? 336 : 820,
        h = n ? 754 : 488;
    const rows = [
        ["Submit", "Save the external job ID."],
        ["Wait", "Release the worker; check later."],
        ["Collect", "Validate and store the output."],
    ];
    return (
        <Sheet
            title="A slow render should be recoverable"
            n={n}
            w={w}
            h={h}
            note="A saved step helps recovery. External submission still needs reconciliation."
        >
            {rows.map(([title, body], i) => {
                const x = n ? 24 : 14 + i * 270,
                    y = n ? 91 + i * 135 : 91;
                return (
                    <g key={title}>
                        <Box
                            x={x}
                            y={y}
                            w={n ? 288 : 250}
                            h={111}
                            title={title}
                            body={body}
                            num={`0${i + 1}`}
                        />
                        {i < 2 && (
                            <Arrow
                                d={
                                    n
                                        ? `M168 ${y + 112}v22m-4-5 4 5 4-5`
                                        : `M${x + 251} 147h18m-5-4 5 4-5 4`
                                }
                            />
                        )}
                    </g>
                );
            })}
            <rect
                x="24"
                y={n ? 518 : 265}
                width={w - 48}
                height={n ? 125 : 117}
                rx="2"
                className="fig-mist dash"
            />
            <Text
                x={40}
                y={n ? 548 : 295}
                lines={["Did submission succeed?"]}
                size={18}
            />
            <Text
                x={40}
                y={n ? 579 : 326}
                lines={wrap(
                    "If the response was lost, look up the request or hold it for review before retrying.",
                    n ? 34 : 94
                )}
                size={14}
            />
            <Arrow
                d={
                    n
                        ? "M24 145H12V578h12m-5-4 5 4-5 4"
                        : "M139 204v57m-4-5 4 5 4-5"
                }
            />
        </Sheet>
    );
}
function Launch() {
    const n = useNarrow(),
        w = n ? 336 : 820,
        h = n ? 778 : 485;
    const rows = [
        ["Approved plan", "Account, creative, destination and budget"],
        ["Upload media", "Wait for processing and save remote IDs"],
        ["Create paused", "Build objects and read them back"],
        ["Activate", "Confirm the launch decision"],
    ];
    return (
        <Sheet
            title="Launching has several checkpoints"
            n={n}
            w={w}
            h={h}
            note="Platform review and delivery remain separate from our local workflow."
        >
            {rows.map(([title, body], i) => {
                const x = n ? 24 : 14 + i * 202,
                    y = n ? 91 + i * 125 : 85;
                return (
                    <g key={title}>
                        <Box
                            x={x}
                            y={y}
                            w={n ? 288 : 187}
                            h={n ? 105 : 176}
                            num={`0${i + 1}`}
                            title={title}
                            body={body}
                        />
                        {i < 3 && (
                            <Arrow
                                d={
                                    n
                                        ? `M168 ${y + 106}v18m-4-5 4 5 4-5`
                                        : `M${x + 188} 170h13m-5-4 5 4-5 4`
                                }
                            />
                        )}
                    </g>
                );
            })}
            <Text
                x={24}
                y={n ? 628 : 321}
                lines={["Read the platform state back"]}
                size={19}
            />
            <Text
                x={24}
                y={n ? 659 : 351}
                lines={wrap(
                    "In review · rejected · paused · delivering",
                    n ? 32 : 100
                )}
                size={14}
            />
            <Arrow
                d={
                    n
                        ? "M168 573v27m-4-5 4 5 4-5"
                        : "M710 264v28H230m5-4-5 4 5 4"
                }
            />
        </Sheet>
    );
}
function Lineage() {
    const n = useNarrow(),
        w = n ? 336 : 820,
        h = n ? 810 : 440;
    const items = [
        ["Brief v1", "The question we asked"],
        ["Take v2", "The reviewed revision"],
        ["Export", "The exact media file"],
        ["Platform ad", "Account and remote ID"],
        ["Report", "Period and metric context"],
    ];
    return (
        <Sheet
            title="Keep the identity of every version"
            n={n}
            w={w}
            h={h}
            note="One creative can have many ads and reports. Results retain their context."
        >
            {items.map(([title, body], i) => {
                const x = n ? 30 : 14 + i * 162,
                    y = n ? 91 + i * 124 : 94;
                return (
                    <g key={title}>
                        <Box
                            x={x}
                            y={y}
                            w={n ? 276 : 148}
                            h={n ? 102 : 166}
                            title={title}
                            body={body}
                            num={`0${i + 1}`}
                        />
                        {i < 4 && (
                            <Arrow
                                d={
                                    n
                                        ? `M168 ${y + 103}v20m-4-5 4 5 4-5`
                                        : `M${x + 149} 173h12m-5-4 5 4-5 4`
                                }
                            />
                        )}
                    </g>
                );
            })}
            {!n && (
                <>
                    <path d="M27 300H793" className="fig-mist" />
                    <Text
                        x={27}
                        y={328}
                        lines={[
                            "Source history + approval history + account context",
                        ]}
                        size={16}
                    />
                </>
            )}
        </Sheet>
    );
}
function Edit() {
    const n = useNarrow(),
        w = n ? 336 : 820,
        h = n ? 730 : 480;
    const shots = [
        ["Opening", "A clear situation"],
        ["Demonstration", "Real product footage"],
        ["Next action", "A useful destination"],
    ];
    return (
        <Sheet
            title="Build a take from visible decisions"
            n={n}
            w={w}
            h={h}
            note="Proposed editing extension. Review the exported file, including its audio."
        >
            {shots.map(([title, body], i) => {
                const x = n ? 25 : 14 + i * 270,
                    y = n ? 91 + i * 139 : 87;
                return (
                    <g key={title}>
                        <Box
                            x={x}
                            y={y}
                            w={n ? 286 : 250}
                            h={115}
                            title={title}
                            body={body}
                            num={`SHOT 0${i + 1}`}
                        />
                        {[0, 1, 2, 3, 4, 5, 6].map((j) => (
                            <rect
                                key={j}
                                x={x + 11 + j * (n ? 39 : 33)}
                                y={y + 103}
                                width="16"
                                height="4"
                                rx="1"
                                className="fig-chip"
                            />
                        ))}
                    </g>
                );
            })}
            {!n && (
                <>
                    <rect
                        x="14"
                        y="227"
                        width="790"
                        height="18"
                        rx="3"
                        className="fig-wash strong"
                    />
                    <rect
                        x="14"
                        y="252"
                        width="240"
                        height="10"
                        rx="3"
                        className="fig-pic"
                    />
                    <rect
                        x="284"
                        y="252"
                        width="240"
                        height="10"
                        rx="3"
                        className="fig-pic"
                    />
                    <rect
                        x="554"
                        y="252"
                        width="250"
                        height="10"
                        rx="3"
                        className="fig-pic"
                    />
                    <Text
                        x={14}
                        y={293}
                        lines={[
                            "Picture, captions and audio share one timeline.",
                        ]}
                        size={14}
                    />
                </>
            )}
            <Box
                x={n ? 25 : 180}
                y={n ? 544 : 323}
                w={n ? 286 : 460}
                h={87}
                title="Export → watch → approve"
                body="Approval belongs to this exact revision."
            />
        </Sheet>
    );
}
export const DAILIES_FIGURES = {
    "dailies-edit": Edit,
    "dailies-loop": Loop,
    "dailies-sources": Sources,
    "dailies-jobs": Jobs,
    "dailies-launch": Launch,
    "dailies-lineage": Lineage,
};
