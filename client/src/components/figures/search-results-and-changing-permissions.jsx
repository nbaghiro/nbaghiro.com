import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function Panel({ x, y, w, title, lines, muted = false }) {
    return (
        <g opacity={muted ? 0.55 : 1}>
            <rect
                className="fig-wash"
                x={x}
                y={y}
                width={w}
                height="102"
                rx="3"
            />
            <rect
                className="fig-ink"
                x={x}
                y={y}
                width={w}
                height="102"
                rx="3"
            />
            <text className="fig-title" x={x + 14} y={y + 29}>
                {title}
            </text>
            {lines.map((line, i) => (
                <text
                    key={line}
                    className="fig-sub"
                    x={x + 14}
                    y={y + 56 + i * 20}
                >
                    {line}
                </text>
            ))}
        </g>
    );
}

function Gate() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 690 : 370;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Documents A, B and C match. Current permission excludes B before titles and snippets leave the server."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="32">
                    Three matches. Two permitted results.
                </text>
                <text className="fig-sub" x="14" y="55">
                    Query: launch plan · requester: Maya
                </text>
                {[
                    ["A", "Access retained"],
                    ["B", "Access removed"],
                    ["C", "Access retained"],
                ].map(([id, status], i) => (
                    <g key={id}>
                        <Panel
                            x={narrow ? 14 : 14 + i * 274}
                            y={narrow ? 82 + i * 134 : 86}
                            w={narrow ? 308 : 246}
                            title={`Document ${id}`}
                            lines={[
                                status,
                                id === "B"
                                    ? "Exclude title and snippet"
                                    : "Include title and snippet",
                            ]}
                            muted={id === "B"}
                        />
                        <text
                            className="fig-key"
                            x={narrow ? 30 : 30 + i * 274}
                            y={narrow ? 202 + i * 134 : 220}
                        >
                            {id === "B" ? "— excluded" : "✓ allowed"}
                        </text>
                    </g>
                ))}
                <path className="fig-water" d={`M14 ${h - 128}H${w - 14}`} />
                <text className="fig-title" x="14" y={h - 95}>
                    Return A + C
                </text>
                <text className="fig-sub" x="14" y={h - 70}>
                    Apply access policy to every result surface.
                </text>
                <text className="fig-dim" x="14" y={h - 49}>
                    Recents · suggestions · previews · counts
                </text>
            </Plate>
        </svg>
    );
}

function Timeline() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 595 : 385;
    const steps = [
        [
            "01 · permission changes",
            "Maya loses access to B.",
            "Index update is pending.",
        ],
        [
            "02 · another search",
            "The index still matches B.",
            "Authorization excludes it.",
        ],
        [
            "03 · worker catches up",
            "Index metadata is updated.",
            "Other readers retain access.",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Access is revoked before asynchronous index maintenance finishes. Authorization excludes stale matches during the delay."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="32">
                    Access changes before the index catches up
                </text>
                <text className="fig-sub" x="14" y="55">
                    Proposed flow for a separate search service
                </text>
                {steps.map(([title, ...lines], i) => (
                    <g key={title}>
                        <Panel
                            x={narrow ? 14 : 14 + i * 274}
                            y={narrow ? 82 + i * 134 : 100}
                            w={narrow ? 308 : 246}
                            title={title}
                            lines={lines}
                        />
                        {i < 2 && (
                            <path
                                className="fig-water"
                                d={
                                    narrow
                                        ? `M168 ${184 + i * 134}v26m-4 -6 4 6 4-6`
                                        : `M${260 + i * 274} 151h24m-6 -4 6 4-6 4`
                                }
                            />
                        )}
                    </g>
                ))}
                <text className="fig-title sm" x="14" y={h - 86}>
                    During the delay
                </text>
                <text className="fig-sub" x="14" y={h - 62}>
                    Check access before returning the match.
                </text>
                <text className="fig-dim" x="14" y={h - 43}>
                    Index freshness has its own recovery path.
                </text>
            </Plate>
        </svg>
    );
}

function Provenance() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 730 : 460;
    const steps = [
        [
            "Retrieve candidates",
            "Document IDs + revisions",
            "Resolve current access",
        ],
        [
            "Build model context",
            "Include permitted text",
            "Record source revisions",
        ],
        [
            "Reuse an answer",
            "Check its sources again",
            "Regenerate if access changed",
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Authorize retrieved documents before model context. Track the sources of generated answers and check their permissions again before reuse."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="32">
                    An answer carries its sources forward
                </text>
                <text className="fig-sub" x="14" y="55">
                    Proposed retrieval and cache policy
                </text>
                {steps.map(([title, ...lines], i) => (
                    <g key={title}>
                        <Panel
                            x={narrow ? 14 : 14 + i * 274}
                            y={narrow ? 82 + i * 134 : 100}
                            w={narrow ? 308 : 246}
                            title={title}
                            lines={lines}
                        />
                        {i < 2 && (
                            <path
                                className="fig-water"
                                d={
                                    narrow
                                        ? `M168 ${184 + i * 134}v26m-4 -6 4 6 4-6`
                                        : `M${260 + i * 274} 151h24m-6 -4 6 4-6 4`
                                }
                            />
                        )}
                    </g>
                ))}
                <rect
                    className="fig-wash"
                    x="14"
                    y={h - 210}
                    width={w - 28}
                    height="145"
                    rx="3"
                />
                <text className="fig-title" x="28" y={h - 178}>
                    Saved with the answer
                </text>
                <text className="fig-key" x="28" y={h - 149}>
                    A · revision 12
                </text>
                <text className="fig-key" x="28" y={h - 125}>
                    C · revision 07
                </text>
                <text className="fig-sub" x="28" y={h - 94}>
                    A citation alone does not enforce access.
                </text>
            </Plate>
        </svg>
    );
}

export const SEARCH_PERMISSION_FIGURES = {
    "search-permission-gate": Gate,
    "search-revocation-timeline": Timeline,
    "search-answer-provenance": Provenance,
};
