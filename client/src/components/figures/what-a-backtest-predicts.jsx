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

// The shared core and the seams around it. The session is drawn once and reached from both
// sides, because drawing it twice would be the picture of the system this one replaced.
function ParityCore() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 772 : 462;
    const seams = [
        ["bar feed", "replays a dataset", "live bar stream"],
        ["execution", "simulated fill", "broker submit"],
        ["portfolio", "in-memory book", "ledger-backed"],
        ["observer", "run progress", "telemetry"],
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="The backtest engine and the live runner both call one strategy session, which evaluates merged bars into target weights and sizes the orders. Each path supplies its own bar feed, execution, portfolio and observer."
        >
            <Plate w={w} h={h} ground={[{ y: h - 26, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    one session, two drivers
                </text>
                <text className="fig-sub" x="14" y="52">
                    shared evaluation and sizing, with four adapters
                </text>

                {narrow ? (
                    <>
                        <Box
                            x={14}
                            y={82}
                            w={308}
                            h={146}
                            title="strategy session"
                            lines={[
                                "merged bars, every symbol",
                                "rebalance clock",
                                "target weights",
                                "sells before buys",
                            ]}
                        />
                        <path
                            className="fig-water"
                            d="M168 228v26m-4-7 4 7 4-7"
                        />
                        <Box
                            x={14}
                            y={262}
                            w={146}
                            h={92}
                            title="backtest"
                            lines={["bounded feed", "liquidates at", "the end"]}
                        />
                        <Box
                            x={176}
                            y={262}
                            w={146}
                            h={92}
                            title="live runner"
                            lines={[
                                "unbounded feed",
                                "never",
                                "liquidates",
                            ]}
                        />
                        <path className="fig-mist" d="M14 386H322" />
                        <text className="fig-title" x="14" y="414">
                            what each path swaps
                        </text>
                        {seams.map(([name, back, live], i) => (
                            <Box
                                key={name}
                                x={14}
                                y={432 + i * 72}
                                w={308}
                                h={62}
                                title={name}
                                lines={[`${back} · ${live}`]}
                            />
                        ))}
                    </>
                ) : (
                    <>
                        <Box
                            x={14}
                            y={110}
                            w={206}
                            h={86}
                            title="backtest engine"
                            lines={["bounded feed", "liquidates at the end"]}
                        />
                        <Box
                            x={256}
                            y={82}
                            w={308}
                            h={142}
                            title="strategy session"
                            lines={[
                                "merged bars, every symbol",
                                "rebalance clock",
                                "target weights, then sizing",
                                "sells before buys",
                            ]}
                        />
                        <Box
                            x={600}
                            y={110}
                            w={206}
                            h={86}
                            title="live runner"
                            lines={["unbounded feed", "never liquidates"]}
                        />
                        <path
                            className="fig-water"
                            d="M220 153h30m-6-4 6 4-6 4"
                        />
                        <path
                            className="fig-water"
                            d="M600 153h-30m6-4-6 4 6 4"
                        />
                        <path className="fig-mist" d="M14 256H806" />
                        <text className="fig-title" x="14" y="284">
                            what each path swaps
                        </text>
                        {seams.map(([name, back, live], i) => (
                            <Box
                                key={name}
                                x={14 + i * 204}
                                w={180}
                                y={300}
                                h={84}
                                title={name}
                                lines={[back, live]}
                            />
                        ))}
                    </>
                )}
                <text className="fig-dim" x="14" y={h - 36}>
                    both paths call the same strategy session
                </text>
            </Plate>
        </svg>
    );
}

// One rebalance down both paths: shared above the split, divergent below it.
function ParityGap() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 658 : 430;
    const back = [
        "evaluates on the symbols the date has",
        "fills at the bar close, plus slippage",
        "fractional quantity passes through",
        "liquidates open positions at the end",
    ];
    const live = [
        "waits for every symbol's bar",
        "submits; the fill lands out of band",
        "rounds down, re-checks the floor",
        "never liquidates",
    ];
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Both paths share evaluation and sizing rules. Inputs, triggers, fills and quantity rounding can change their results."
        >
            <Plate w={w} h={h} ground={[{ y: h - 26, amp: 5 }]}>
                <text className="fig-title" x="14" y="30">
                    one rebalance, both paths
                </text>
                <text className="fig-sub" x="14" y="52">
                    shared rules, different execution
                </text>
                <Box
                    x={14}
                    y={82}
                    w={w - 28}
                    h={narrow ? 114 : 92}
                    title="shared evaluation and sizing"
                    lines={
                        narrow
                            ? [
                                  "merged bars · rebalance clock",
                                  "target weights",
                                  "sells before buys · drift band",
                              ]
                            : [
                                  "merged bars · rebalance clock · target weights",
                                  "sells before buys · drift band · buys fitted to cash",
                              ]
                    }
                />
                {narrow ? (
                    <>
                        <path
                            className="fig-water"
                            d="M168 196v24m-4-7 4 7 4-7"
                        />
                        <Box
                            x={14}
                            y={228}
                            w={308}
                            h={126}
                            title="backtest"
                            lines={[
                                "evaluates on the symbols",
                                "fills at the bar close",
                                "fractional quantity passes",
                                "liquidates at the end",
                            ]}
                        />
                        <Box
                            x={14}
                            y={376}
                            w={308}
                            h={126}
                            title="live"
                            lines={[
                                "waits for every symbol's bar",
                                "fill lands out of band",
                                "rounds down to an increment",
                                "never liquidates",
                            ]}
                        />
                        <text className="fig-title" x="14" y="546">
                            evaluation rules are shared
                        </text>
                        <text className="fig-sub" x="14" y="568">
                            inputs and fills can differ
                        </text>
                    </>
                ) : (
                    <>
                        <path
                            className="fig-water"
                            d="M210 174v24m-4-7 4 7 4-7"
                        />
                        <path
                            className="fig-water"
                            d="M610 174v24m-4-7 4 7 4-7"
                        />
                        <Box
                            x={14}
                            y={206}
                            w={388}
                            h={142}
                            title="backtest"
                            lines={back}
                        />
                        <Box
                            x={418}
                            y={206}
                            w={388}
                            h={142}
                            title="live"
                            lines={live}
                        />
                    </>
                )}
                <text className="fig-dim" x="14" y={h - 36}>
                    results depend on the supplied data and execution model
                </text>
            </Plate>
        </svg>
    );
}

export const PARITY_FIGURES = {
    "parity-core": ParityCore,
    "parity-gap": ParityGap,
};
