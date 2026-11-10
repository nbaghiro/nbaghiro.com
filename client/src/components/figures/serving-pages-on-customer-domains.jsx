import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function Box({ x, y, w, title, lines }) {
    return (
        <g>
            <rect
                className="fig-wash"
                x={x}
                y={y}
                width={w}
                height={58 + lines.length * 19}
            />
            <rect
                className="fig-ink"
                x={x}
                y={y}
                width={w}
                height={58 + lines.length * 19}
            />
            <text className="fig-title" x={x + 14} y={y + 27}>
                {title}
            </text>
            {lines.map((line, i) => (
                <text
                    key={line}
                    className="fig-sub"
                    x={x + 14}
                    y={y + 51 + i * 19}
                >
                    {line}
                </text>
            ))}
        </g>
    );
}
function DomainRouting() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 730 : 464;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Host routing splits before application routes. App hostnames continue to normal routes. Customer domains resolve one verified page and allow only public routes; all other paths return 404."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    route by hostname first
                </text>
                <text className="fig-sub" x="14" y="52">
                    with custom-domain handling enabled
                </text>
                <Box
                    x={14}
                    y={76}
                    w={narrow ? 308 : 792}
                    title="Normalize Host"
                    lines={[
                        narrow
                            ? "Exact host lookup; no forwarded headers"
                            : "Exact application-host lookup; ignore forwarded host headers",
                    ]}
                />
                {narrow ? (
                    <>
                        <path
                            className="fig-water"
                            d="M168 153v27m-4 -6 4 6 4-6"
                        />
                        <Box
                            x={14}
                            y={182}
                            w={308}
                            title="Application hostname"
                            lines={[
                                "Continue to normal routes",
                                "Authentication still applies",
                            ]}
                        />
                        <text className="fig-dim" x="14" y="308">
                            or, for a customer hostname
                        </text>
                        <Box
                            x={14}
                            y={328}
                            w={308}
                            title="Resolve the verified holder"
                            lines={[
                                "Load that page and check eligibility",
                                "Requested host must still match",
                            ]}
                        />
                        <path
                            className="fig-water"
                            d="M168 424v27m-4 -6 4 6 4-6"
                        />
                        <Box
                            x={14}
                            y={454}
                            w={308}
                            title="GET / HEAD · public routes"
                            lines={[
                                "/ · own tracked links · public photos",
                                "robots.txt · one-page sitemap",
                            ]}
                        />
                        <text className="fig-title" x="14" y="593">
                            other routes → 404
                        </text>
                        <text className="fig-sub" x="14" y="618">
                            /app · /login · /api/* · writes
                        </text>
                        <text className="fig-dim" x="14" y="671">
                            /health is an explicit early exception
                        </text>
                    </>
                ) : (
                    <>
                        <path
                            className="fig-water"
                            d="M410 153v22H203v22m-4 -6 4 6 4-6M410 175h207v22m-4 -6 4 6 4-6"
                        />
                        <Box
                            x={14}
                            y={199}
                            w={378}
                            title="Application hostname"
                            lines={[
                                "Continue to normal application routes",
                                "Authentication still applies",
                            ]}
                        />
                        <Box
                            x={428}
                            y={199}
                            w={378}
                            title="Customer hostname"
                            lines={[
                                "Verified holder → live, eligible page",
                                "GET / HEAD → small public route list",
                            ]}
                        />
                        <text className="fig-title" x="428" y="330">
                            other routes → 404
                        </text>
                        <text className="fig-sub" x="428" y="353">
                            /app · /login · /api/* · other pages · writes
                        </text>
                        <text className="fig-sub" x="14" y="330">
                            /health is an early exception.
                        </text>
                        <text className="fig-sub" x="14" y="353">
                            Photos remain shared public assets.
                        </text>
                        <text className="fig-dim" x="14" y="410">
                            The customer path cannot fall through into newly
                            added application endpoints.
                        </text>
                    </>
                )}
            </Plate>
        </svg>
    );
}
function DomainVerification() {
    const narrow = useNarrow(),
        w = narrow ? NARROW : WIDE,
        h = narrow ? 653 : 420;
    const steps = [
        ["01 · Pending request", ["page_id + host", "No exclusive claim yet"]],
        [
            "02 · DNS proof",
            [
                "TXT value tied to this page + host",
                "Read and match the expected value",
            ],
        ],
        [
            "03 · Provider verification",
            [
                "Attach the hostname; check readiness",
                "External work can need a retry",
            ],
        ],
        [
            "04 · Verified holder",
            ["Set verified_at", "Unique host among verified rows"],
        ],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Domain connection proceeds from pending request to page-bound TXT proof to provider verification and then a unique verified holder. Every request still checks page and plan eligibility."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    proof, attachment, then publication
                </text>
                <text className="fig-sub" x="14" y="52">
                    the checks answer different questions
                </text>
                {steps.map(([title, lines], i) => {
                    const x = narrow ? 14 : 14 + (i % 2) * 414;
                    const y = narrow
                        ? 80 + i * 126
                        : 80 + Math.floor(i / 2) * 126;
                    return (
                        <g key={title}>
                            <Box
                                x={x}
                                y={y}
                                w={narrow ? 308 : 378}
                                title={title}
                                lines={lines}
                            />
                            {narrow && i < 3 && (
                                <path
                                    className="fig-water"
                                    d={`M168 ${y + 96}v25m-4 -6 4 6 4-6`}
                                />
                            )}
                            {!narrow && i % 2 === 0 && (
                                <path
                                    className="fig-water"
                                    d={`M392 ${y + 48}h30m-6 -4 6 4-6 4`}
                                />
                            )}
                        </g>
                    );
                })}
                {!narrow && (
                    <path
                        className="fig-water"
                        d="M617 176v15H203v15m-4 -6 4 6 4-6"
                    />
                )}
                <text className="fig-sub" x="14" y={h - 76}>
                    Serving also checks page and plan eligibility.
                </text>
                <text className="fig-dim" x="14" y={h - 54}>
                    A verified row does not replace those checks.
                </text>
            </Plate>
        </svg>
    );
}
export const CUSTOMER_DOMAIN_FIGURES = {
    "domain-routing": DomainRouting,
    "domain-verification": DomainVerification,
};
