import { Plate, frame, NARROW, useNarrow, WIDE } from "./plate";

/**
 * The figures for "How much history a strategy needs before its first order". Box and Flow
 * are this post's own, like the other posts' modules, so the shared file stays the plate
 * language rather than a component library.
 */

function Box({ x, y, w, h, name, note, wash, right }) {
    return (
        <g>
            {wash && <rect className="fig-wash" x={x} y={y} width={w} height={h} />}
            <rect className="fig-ink" x={x} y={y} width={w} height={h} />
            <text className="fig-title sm" x={x + 14} y={y + (note ? 25 : h / 2 + 6)}>
                {name}
            </text>
            {note && (
                <text className="fig-sub" x={x + 14} y={y + 43}>
                    {note}
                </text>
            )}
            {right && (
                <text className="fig-dim" x={x + w - 14} y={y + h / 2 + 5} textAnchor="end">
                    {right}
                </text>
            )}
        </g>
    );
}

function Down({ x, from, to, label }) {
    return (
        <g>
            <path className="fig-water" d={`M${x} ${from} V${to}`} />
            <path className="fig-water" d={`M${x} ${to} l-4 -7 M${x} ${to} l4 -7`} />
            {label && (
                <text className="fig-dim" x={x + 10} y={(from + to) / 2 + 4}>
                    {label}
                </text>
            )}
        </g>
    );
}

/* ---- the plan a strategy compiles to, before any bar is fetched ---- */

const PLAN = [
    { k: "symbols", v: "7" },
    { k: "indicators", v: "1" },
    { k: "warm-up", v: "200 bars" },
    { k: "retained", v: "210 bars" },
];
const PLAN_LABEL =
    "Compiling a strategy produces a plan before any market data is requested: the symbols it reads, the indicators it needs with each one's warm-up, the bars required before the first evaluation, and the cap on retained history.";

function StrategyPlan() {
    const narrow = useNarrow();
    if (narrow) {
        const w = NARROW - 40;
        const h = 520;
        return (
            <svg className="fig" viewBox={frame(NARROW, h)} role="img" aria-label={PLAN_LABEL}>
                <Plate w={NARROW} h={h} ground={[{ y: 476, amp: 8 }]}>
                    <Box
                        x={0}
                        y={26}
                        w={w}
                        h={58}
                        name="the strategy, as written"
                        note="an expression returning target weights"
                    />
                    <Down x={w / 2} from={84} to={120} />
                    <rect className="fig-wash" x={0} y={120} width={w} height={214} />
                    <rect className="fig-ink" x={0} y={120} width={w} height={214} />
                    <text className="fig-title sm" x={14} y={146}>
                        the execution plan
                    </text>
                    {PLAN.map((p, i) => (
                        <g key={p.k}>
                            <text className="fig-sub" x={14} y={186 + i * 38}>
                                {p.k}
                            </text>
                            <text
                                className="fig-dim"
                                x={w - 14}
                                y={186 + i * 38}
                                textAnchor="end"
                            >
                                {p.v}
                            </text>
                        </g>
                    ))}
                    <Down x={w / 2} from={334} to={372} />
                    <Box
                        x={0}
                        y={372}
                        w={w}
                        h={58}
                        name="the history request"
                        note="the start date, padded back by the warm-up"
                    />
                    <text className="fig-sub" x={0} y={462}>
                        nothing is fetched until the plan says how much
                    </text>
                </Plate>
            </svg>
        );
    }
    const h = 350;
    const cw = WIDE / PLAN.length;
    return (
        <svg className="fig" viewBox={frame(WIDE, h)} role="img" aria-label={PLAN_LABEL}>
            <Plate w={WIDE} h={h} ground={[{ y: 332, amp: 9 }]}>
                <Box
                    x={0}
                    y={26}
                    w={WIDE}
                    h={52}
                    name="the strategy, as written"
                    note="an expression returning target weights"
                />
                <Down x={WIDE / 2} from={78} to={116} label="compile" />
                <rect className="fig-wash" x={0} y={116} width={WIDE} height={96} />
                <rect className="fig-ink" x={0} y={116} width={WIDE} height={96} />
                {PLAN.map((p, i) => (
                    <g key={p.k}>
                        {i > 0 && (
                            <path
                                className="fig-mist"
                                d={`M${i * cw} 116 V212`}
                            />
                        )}
                        <text className="fig-sub" x={i * cw + 18} y={148}>
                            {p.k}
                        </text>
                        <text className="fig-title sm" x={i * cw + 18} y={186}>
                            {p.v}
                        </text>
                    </g>
                ))}
                <Down x={WIDE / 2} from={212} to={250} />
                <Box
                    x={0}
                    y={250}
                    w={WIDE}
                    h={52}
                    name="the history request"
                    note="the start date, padded back by the warm-up"
                />
                <text className="fig-sub" x={0} y={326}>
                    the plan is derived from the strategy alone, before a single bar is
                    fetched
                </text>
            </Plate>
        </svg>
    );
}

/* ---- the retained window, and what it costs not to have one ---- */

const WINDOW_LABEL =
    "Retained history is capped at the largest window the strategy actually reads, plus headroom. The cap keeps per-bar indicator recomputation bounded without changing any result.";

function Bars({ x, y, w, n, kept }) {
    const pitch = w / n;
    return (
        <g>
            {Array.from({ length: n }, (_, i) => (
                <line
                    key={i}
                    className={i >= n - kept ? "fig-water" : "fig-mist"}
                    x1={x + i * pitch + pitch / 2}
                    y1={y}
                    x2={x + i * pitch + pitch / 2}
                    y2={y + 34}
                />
            ))}
        </g>
    );
}

function HistoryWindow() {
    const narrow = useNarrow();
    const n = narrow ? 26 : 54;
    const kept = narrow ? 8 : 16;
    if (narrow) {
        const w = NARROW - 40;
        const h = 400;
        return (
            <svg className="fig" viewBox={frame(NARROW, h)} role="img" aria-label={WINDOW_LABEL}>
                <Plate w={NARROW} h={h} ground={[{ y: 356, amp: 8 }]}>
                    <text className="fig-title sm" x={0} y={26}>
                        keeping everything
                    </text>
                    <Bars x={0} y={46} w={w} n={n} kept={0} />
                    <text className="fig-sub" x={0} y={104}>
                        recompute grows with the run
                    </text>
                    <text className="fig-title sm" x={0} y={174}>
                        keeping the window
                    </text>
                    <Bars x={0} y={194} w={w} n={n} kept={kept} />
                    <rect
                        className="fig-ink"
                        x={w - (w / n) * kept}
                        y={188}
                        width={(w / n) * kept}
                        height={46}
                    />
                    <text className="fig-sub" x={0} y={252}>
                        the largest read, plus ten bars of headroom
                    </text>
                    <text className="fig-note" x={0} y={296}>
                        a test runs both and asserts the outputs match
                    </text>
                    <text className="fig-note" x={0} y={320}>
                        an unbounded read is capped at 2,000 bars
                    </text>
                </Plate>
            </svg>
        );
    }
    const h = 290;
    return (
        <svg className="fig" viewBox={frame(WIDE, h)} role="img" aria-label={WINDOW_LABEL}>
            <Plate w={WIDE} h={h} ground={[{ y: 258, amp: 9 }]}>
                <text className="fig-title sm" x={0} y={24}>
                    keeping everything
                </text>
                <text className="fig-dim" x={WIDE} y={24} textAnchor="end">
                    recompute grows with the run
                </text>
                <Bars x={0} y={42} w={WIDE} n={n} kept={0} />
                <text className="fig-title sm" x={0} y={136}>
                    keeping the window
                </text>
                <text className="fig-dim" x={WIDE} y={136} textAnchor="end">
                    the largest read, plus ten bars of headroom
                </text>
                <Bars x={0} y={154} w={WIDE} n={n} kept={kept} />
                <rect
                    className="fig-ink"
                    x={WIDE - (WIDE / n) * kept}
                    y={148}
                    width={(WIDE / n) * kept}
                    height={46}
                />
                <text className="fig-sub" x={0} y={226}>
                    a test runs a strategy both ways and asserts the outputs match; a
                    strategy that reads unbounded history is capped at 2,000 bars
                </text>
            </Plate>
        </svg>
    );
}

export const PLAN_FIGURES = {
    plan: StrategyPlan,
    window: HistoryWindow,
};
