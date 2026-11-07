import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

function Box({ x, y, w, title, detail, wash = false }) {
    return (
        <g>
            {wash && (
                <rect className="fig-wash" x={x} y={y} width={w} height={66} />
            )}
            <rect className="fig-ink" x={x} y={y} width={w} height={66} />
            <text className="fig-title" x={x + 14} y={y + 26}>
                {title}
            </text>
            <text className="fig-sub" x={x + 14} y={y + 47}>
                {detail}
            </text>
        </g>
    );
}
function Arrow({ x1, y1, x2, y2 }) {
    const head = y1 === y2 ? `m-7 -4 7 4-7 4` : `m-4 -7 4 7 4-7`;
    return (
        <path
            className="fig-water"
            d={`M${x1} ${y1} L${x2} ${y2} M${x2} ${y2} ${head}`}
        />
    );
}
function PriceChange() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 500 : 300;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="New purchases use the replacement price. Existing subscriptions keep their previous price until a separate migration."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x={14} y={30}>
                    a new price, two customer paths
                </text>
                <text className="fig-sub" x={14} y={51}>
                    catalog setup does not migrate subscribers
                </text>
                <Box
                    x={14}
                    y={80}
                    w={narrow ? 308 : 220}
                    title="replacement price"
                    detail="new amount · same lookup key"
                    wash
                />
                <Arrow
                    x1={narrow ? 168 : 234}
                    y1={narrow ? 146 : 113}
                    x2={narrow ? 168 : 500}
                    y2={narrow ? 180 : 113}
                />
                {!narrow && (
                    <text className="fig-dim" x={280} y={100}>
                        new checkout resolves here
                    </text>
                )}
                <Box
                    x={narrow ? 14 : 500}
                    y={narrow ? 180 : 80}
                    w={narrow ? 308 : 306}
                    title="new subscribers"
                    detail="purchase at the replacement price"
                    wash
                />
                <Box
                    x={14}
                    y={narrow ? 280 : 190}
                    w={narrow ? 308 : 220}
                    title="previous price"
                    detail="archived for new purchases"
                />
                <Arrow
                    x1={narrow ? 168 : 234}
                    y1={narrow ? 346 : 223}
                    x2={narrow ? 168 : 500}
                    y2={narrow ? 380 : 223}
                />
                {!narrow && (
                    <text className="fig-sub" x={280} y={210}>
                        existing subscriptions retain it
                    </text>
                )}
                <Box
                    x={narrow ? 14 : 500}
                    y={narrow ? 380 : 190}
                    w={narrow ? 308 : 306}
                    title="existing subscribers"
                    detail="move only through a separate change"
                />
            </Plate>
        </svg>
    );
}
function WebhookCommit() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 612 : 410;
    const txX = narrow ? 14 : 294;
    const txY = narrow ? 190 : 80;
    const txW = narrow ? 308 : 512;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Verify the event and fetch Stripe state, then claim its receipt and apply billing changes in one database transaction. Failure rolls back both so redelivery can retry."
        >
            <Plate w={w} h={h} ground={[{ y: h - 30, amp: 5 }]}>
                <text className="fig-title" x={14} y={30}>
                    the receipt commits with the work
                </text>
                <text className="fig-sub" x={14} y={51}>
                    one database transaction for the local effects
                </text>
                <Box
                    x={14}
                    y={80}
                    w={narrow ? 308 : 222}
                    title="verified event"
                    detail="fetch current Stripe state"
                />
                <Arrow
                    x1={narrow ? 168 : 236}
                    y1={narrow ? 146 : 113}
                    x2={narrow ? 168 : 294}
                    y2={narrow ? 190 : 113}
                />
                <rect
                    className="fig-wash"
                    x={txX}
                    y={txY}
                    width={txW}
                    height={222}
                />
                <rect
                    className="fig-ink"
                    x={txX}
                    y={txY}
                    width={txW}
                    height={222}
                />
                <text className="fig-dim" x={txX + 16} y={txY + 25}>
                    BEGIN TRANSACTION
                </text>
                <text className="fig-title" x={txX + 16} y={txY + 61}>
                    claim the event receipt
                </text>
                <text className="fig-sub" x={txX + 16} y={txY + 82}>
                    already processed? skip its effects
                </text>
                <path
                    className="fig-mist"
                    d={`M${txX + 16} ${txY + 101}H${txX + txW - 16}`}
                />
                <text className="fig-title" x={txX + 16} y={txY + 130}>
                    apply billing changes
                </text>
                <text className="fig-sub" x={txX + 16} y={txY + 151}>
                    update access and record grants
                </text>
                <text className="fig-title" x={txX + 16} y={txY + 185}>
                    queue product events
                </text>
                <text className="fig-sub" x={txX + 16} y={txY + 206}>
                    dispatch after the commit
                </text>
                <text className="fig-title" x={14} y={narrow ? 454 : 204}>
                    on failure
                </text>
                <text className="fig-sub" x={14} y={narrow ? 476 : 226}>
                    receipt and changes roll back
                </text>
                <text className="fig-sub" x={14} y={narrow ? 496 : 246}>
                    redelivery can try again
                </text>
                <text
                    className="fig-title"
                    x={narrow ? 14 : 294}
                    y={narrow ? 537 : 336}
                >
                    on commit
                </text>
                <text
                    className="fig-sub"
                    x={narrow ? 14 : 294}
                    y={narrow ? 559 : 356}
                >
                    receipt and billing changes persist together
                </text>
            </Plate>
        </svg>
    );
}
export const SUBSCRIPTION_FIGURES = {
    "subscription-price-change": PriceChange,
    "subscription-webhook-commit": WebhookCommit,
};
