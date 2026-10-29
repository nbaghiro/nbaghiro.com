import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

/** The figures for "Running Clientbridge as a Stripe Connect platform". */

function Box({ x, y, w, h, name, note, wash, small }) {
    return (
        <g>
            {wash && (
                <rect className="fig-wash" x={x} y={y} width={w} height={h} />
            )}
            <rect className="fig-ink" x={x} y={y} width={w} height={h} />
            <text
                className={small ? "fig-row" : "fig-title sm"}
                x={x + 14}
                y={y + (small ? 18 : 25)}
            >
                {name}
            </text>
            {note && (
                <text
                    className={small ? "fig-dim" : "fig-sub"}
                    x={x + 14}
                    y={y + (small ? 33 : 43)}
                >
                    {note}
                </text>
            )}
        </g>
    );
}

// A water line from one point to another, turning once, with a head at the far end.
function Arrow({ from, to, label, labelAt, anchor = "start" }) {
    const [x1, y1] = from;
    const [x2, y2] = to;
    const horizontal = y1 === y2;
    const vertical = x1 === x2;
    let head;
    if (horizontal) {
        const s = x2 > x1 ? -7 : 7;
        head = `M${x2} ${y2} l${s} -4 M${x2} ${y2} l${s} 4`;
    } else {
        const s = y2 > y1 ? -7 : 7;
        head = `M${x2} ${y2} l-4 ${s} M${x2} ${y2} l4 ${s}`;
    }
    const d =
        horizontal || vertical
            ? `M${x1} ${y1} L${x2} ${y2}`
            : `M${x1} ${y1} H${x2} V${y2}`;
    return (
        <g>
            <path className="fig-water" d={d} />
            <path className="fig-water" d={head} />
            {label && (
                <text
                    className="fig-dim"
                    x={labelAt[0]}
                    y={labelAt[1]}
                    textAnchor={anchor}
                >
                    {label}
                </text>
            )}
        </g>
    );
}

// Two outlines peeking out behind a box: the same account again for every other business.
function Stack({ x, y, w, h }) {
    return (
        <g>
            {[8, 16].map((o) => (
                <path
                    key={o}
                    className="fig-mist"
                    d={`M${x + o} ${y} V${y - o} H${x + w + o} V${y + h - o} H${x + w}`}
                />
            ))}
        </g>
    );
}

/* ---- one account per business ---- */

const ACCOUNTS_LABEL =
    "A client pays into the business's own Stripe account, which pays out to the business's bank. The account carries two configurations: merchant, which takes the payment and sends Clientbridge its application fee, and customer, which pays Clientbridge's plan. Every business has an account of its own.";

function Account({ x, y, w }) {
    const cw = (w - 38) / 2;
    return (
        <g>
            <Stack x={x} y={y} w={w} h={140} />
            <Box
                x={x}
                y={y}
                w={w}
                h={140}
                name="the business's account"
                note="Accounts v2, one per business"
            />
            <Box
                x={x + 14}
                y={y + 66}
                w={cw}
                h={46}
                name="merchant"
                note="takes payments"
                small
                wash
            />
            <Box
                x={x + 24 + cw}
                y={y + 66}
                w={cw}
                h={46}
                name="customer"
                note="pays the plan"
                small
                wash
            />
        </g>
    );
}

function ConnectAccounts() {
    const narrow = useNarrow();
    if (narrow) {
        const w = NARROW;
        const h = 486;
        const ay = 164;
        const aw = w - 16;
        const cw = (aw - 38) / 2;
        const mx = 14 + cw / 2;
        const cx = 24 + cw + cw / 2;
        return (
            <svg
                className="fig"
                viewBox={frame(w, h)}
                role="img"
                aria-label={ACCOUNTS_LABEL}
            >
                <Plate w={w} h={h} ground={[{ y: 454, amp: 8 }]}>
                    <text className="fig-title" x="0" y="18">
                        one account per business
                    </text>
                    <Box
                        x={0}
                        y={40}
                        w={150}
                        h={56}
                        name="client"
                        note="card or debit"
                    />
                    <Box
                        x={186}
                        y={40}
                        w={150}
                        h={56}
                        name="bank"
                        note="the business's own"
                    />
                    <Arrow
                        from={[75, 96]}
                        to={[75, ay - 24]}
                        label="pays"
                        labelAt={[85, 124]}
                    />
                    <Arrow
                        from={[240, ay - 24]}
                        to={[240, 96]}
                        label="payout"
                        labelAt={[230, 124]}
                        anchor="end"
                    />
                    <Account x={0} y={ay} w={aw} />
                    <Arrow
                        from={[mx, ay + 112]}
                        to={[mx, 356]}
                        label="fee"
                        labelAt={[mx + 10, 334]}
                    />
                    <Arrow
                        from={[cx, ay + 112]}
                        to={[cx, 356]}
                        label="plan"
                        labelAt={[cx + 10, 334]}
                    />
                    <Box
                        x={0}
                        y={356}
                        w={w}
                        h={56}
                        name="Clientbridge's account"
                        note="the platform"
                    />
                </Plate>
            </svg>
        );
    }
    const w = WIDE;
    const h = 350;
    const A = { x: 260, y: 56, w: 300 };
    const cw = (A.w - 38) / 2;
    const mx = A.x + 14 + cw / 2;
    const cx = A.x + 24 + cw + cw / 2;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label={ACCOUNTS_LABEL}
        >
            <Plate w={w} h={h} ground={[{ y: 324, amp: 9 }]}>
                <text className="fig-title" x="0" y="18">
                    one account per business
                </text>
                <Box
                    x={0}
                    y={98}
                    w={168}
                    h={56}
                    name="client"
                    note="card, saved card, debit"
                />
                <Arrow
                    from={[168, 126]}
                    to={[A.x, 126]}
                    label="pays"
                    labelAt={[214, 116]}
                    anchor="middle"
                />
                <Account x={A.x} y={A.y} w={A.w} />
                <Arrow
                    from={[A.x + A.w + 20, 126]}
                    to={[652, 126]}
                    label="payout"
                    labelAt={[616, 116]}
                    anchor="middle"
                />
                <Box
                    x={652}
                    y={98}
                    w={168}
                    h={56}
                    name="the business's bank"
                    note="on its own schedule"
                />
                <Arrow
                    from={[mx, A.y + 112]}
                    to={[mx, 248]}
                    label="application fee"
                    labelAt={[mx - 10, 224]}
                    anchor="end"
                />
                <Arrow
                    from={[cx, A.y + 112]}
                    to={[cx, 248]}
                    label="plan, taxed by Stripe Tax"
                    labelAt={[cx + 10, 224]}
                />
                <Box
                    x={A.x}
                    y={248}
                    w={A.w}
                    h={56}
                    name="Clientbridge's account"
                    note="the platform"
                />
            </Plate>
        </svg>
    );
}

/* ---- who does what ---- */

const STRIPE_ROWS = [
    "verifying the business",
    "its own processing fee",
    "negative balances",
    "the dispute process",
    "holding funds and paying out",
];
const OURS_ROWS = [
    "when to charge, and how much",
    "sales tax, invoice and receipt",
    "records consistent with Stripe",
];
const SPLIT_LABEL =
    "Stripe handles verifying the business, collecting its own processing fee, negative balances, the dispute process, and holding and paying out funds. Clientbridge handles when to charge and how much, the sales tax, invoice and receipt, and keeping its records consistent with Stripe.";

function Column({ x, y, title, note, rows, width }) {
    return (
        <g>
            <text className="fig-title sm" x={x} y={y}>
                {title}
            </text>
            <text className="fig-sub" x={x} y={y + 18}>
                {note}
            </text>
            {rows.map((row, i) => {
                const ry = y + 50 + i * 30;
                return (
                    <g key={row}>
                        <rect
                            className="fig-solid"
                            x={x}
                            y={ry - 9}
                            width="6"
                            height="6"
                        />
                        <text className="fig-row" x={x + 18} y={ry - 2}>
                            {row}
                        </text>
                        <line
                            className="fig-mist"
                            x1={x}
                            y1={ry + 10}
                            x2={x + width}
                            y2={ry + 10}
                        />
                    </g>
                );
            })}
        </g>
    );
}

function WhoHandlesWhat() {
    const narrow = useNarrow();
    if (narrow) {
        const h = 476;
        return (
            <svg
                className="fig"
                viewBox={frame(NARROW, h)}
                role="img"
                aria-label={SPLIT_LABEL}
            >
                <Plate w={NARROW} h={h} ground={[{ y: 444, amp: 8 }]}>
                    <text className="fig-title" x="0" y="18">
                        who does what
                    </text>
                    <Column
                        x={0}
                        y={58}
                        title="Stripe"
                        note="fixed when the account is created"
                        rows={STRIPE_ROWS}
                        width={NARROW}
                    />
                    <Column
                        x={0}
                        y={278}
                        title="Clientbridge"
                        note="the software around the payment"
                        rows={OURS_ROWS}
                        width={NARROW}
                    />
                </Plate>
            </svg>
        );
    }
    const h = 292;
    return (
        <svg
            className="fig"
            viewBox={frame(WIDE, h)}
            role="img"
            aria-label={SPLIT_LABEL}
        >
            <Plate w={WIDE} h={h} ground={[{ y: 266, amp: 9 }]}>
                <text className="fig-title" x="0" y="18">
                    who does what
                </text>
                <Column
                    x={0}
                    y={62}
                    title="Stripe"
                    note="fixed when the account is created"
                    rows={STRIPE_ROWS}
                    width={370}
                />
                <line
                    className="fig-mist dash"
                    x1={410}
                    y1={48}
                    x2={410}
                    y2={226}
                />
                <Column
                    x={450}
                    y={62}
                    title="Clientbridge"
                    note="the software around the payment"
                    rows={OURS_ROWS}
                    width={370}
                />
            </Plate>
        </svg>
    );
}

/* ---- the fee is sized against Stripe's ---- */

// Schematic shares of the ceiling, not real rates: what matters is which limit binds.
const FEE_ROWS = [
    {
        name: "card",
        stripe: 0.8,
        ours: 0.2,
        note: "Stripe's share is larger, so ours is smaller",
    },
    {
        name: "pre-authorized debit",
        stripe: 0.3,
        ours: 0.58,
        note: "ours reaches its cap before the ceiling",
    },
    {
        name: "card in another currency",
        stripe: 1.22,
        ours: 0,
        note: "the conversion fee passes the ceiling, ours is zero",
    },
];
const CAP = 0.58;
const FEE_LABEL =
    "Three charges drawn against a ceiling on the combined percentage. On a card, Stripe's share is large and Clientbridge's fills the rest up to the ceiling. On a pre-authorized debit, Stripe's share is small and Clientbridge's stops at its own cap, below the ceiling. On a card in another currency, Stripe's share with the conversion fee is already past the ceiling, so Clientbridge takes nothing. Schematic, not to scale.";

function FeeBar({ x0, unit, y, row, bar }) {
    const s = row.stripe * unit;
    const o = row.ours * unit;
    return (
        <g>
            <rect
                className="fig-wash strong"
                x={x0}
                y={y}
                width={s}
                height={bar}
            />
            <rect className="fig-mist" x={x0} y={y} width={s} height={bar} />
            {o > 0 && (
                <rect
                    className="fig-solid"
                    x={x0 + s}
                    y={y}
                    width={o}
                    height={bar}
                />
            )}
        </g>
    );
}

function Legend({ x, y }) {
    return (
        <g>
            <rect
                className="fig-wash strong"
                x={x}
                y={y - 9}
                width="16"
                height="10"
            />
            <rect className="fig-mist" x={x} y={y - 9} width="16" height="10" />
            <text className="fig-sub" x={x + 24} y={y}>
                Stripe's percentage
            </text>
            <rect
                className="fig-solid"
                x={x + 150}
                y={y - 9}
                width="16"
                height="10"
            />
            <text className="fig-sub" x={x + 174} y={y}>
                Clientbridge's fee
            </text>
        </g>
    );
}

function FeeCeiling() {
    const narrow = useNarrow();
    if (narrow) {
        const h = 410;
        const unit = 240;
        const bar = 22;
        const top = 92;
        const pitch = 84;
        const ceil = unit;
        return (
            <svg
                className="fig"
                viewBox={frame(NARROW, h)}
                role="img"
                aria-label={FEE_LABEL}
            >
                <Plate w={NARROW} h={h} ground={[{ y: 382, amp: 8 }]}>
                    <text className="fig-title" x="0" y="18">
                        one ceiling, three charges
                    </text>
                    <Legend x={0} y={48} />
                    <line
                        className="fig-water fig-open"
                        x1={ceil}
                        y1={top - 18}
                        x2={ceil}
                        y2={top + pitch * 2 + bar + 8}
                    />
                    <text
                        className="fig-dim"
                        x={ceil - 6}
                        y={top - 24}
                        textAnchor="end"
                    >
                        ceiling
                    </text>
                    {FEE_ROWS.map((row, i) => {
                        const y = top + i * pitch;
                        return (
                            <g key={row.name}>
                                <text className="fig-row" x="0" y={y - 8}>
                                    {row.name}
                                </text>
                                <FeeBar
                                    x0={0}
                                    unit={unit}
                                    y={y}
                                    row={row}
                                    bar={bar}
                                />
                            </g>
                        );
                    })}
                    <text
                        className="fig-note"
                        x="0"
                        y={top + pitch * 2 + bar + 46}
                    >
                        Schematic, not to scale.
                    </text>
                </Plate>
            </svg>
        );
    }
    const h = 356;
    const x0 = 196;
    const unit = 430;
    const ceil = x0 + unit;
    const top = 92;
    const pitch = 66;
    const bar = 24;
    return (
        <svg
            className="fig"
            viewBox={frame(WIDE, h)}
            role="img"
            aria-label={FEE_LABEL}
        >
            <Plate w={WIDE} h={h} ground={[{ y: 334, amp: 9 }]}>
                <text className="fig-title" x="0" y="18">
                    one ceiling, three charges
                </text>
                <Legend x={x0} y={52} />
                <line
                    className="fig-water fig-open"
                    x1={ceil}
                    y1={top - 16}
                    x2={ceil}
                    y2={top + pitch * 2 + bar + 10}
                />
                <text className="fig-dim" x={ceil + 8} y={top - 6}>
                    ceiling
                </text>
                <line
                    className="fig-mist dash"
                    x1={x0 + CAP * unit + 0.3 * unit}
                    y1={top + pitch - 6}
                    x2={x0 + CAP * unit + 0.3 * unit}
                    y2={top + pitch + bar + 6}
                />
                <text
                    className="fig-dim"
                    x={x0 + (CAP + 0.3) * unit + 6}
                    y={top + pitch - 10}
                >
                    cap
                </text>
                {FEE_ROWS.map((row, i) => {
                    const y = top + i * pitch;
                    return (
                        <g key={row.name}>
                            <text className="fig-row" x="0" y={y + 16}>
                                {row.name}
                            </text>
                            <FeeBar
                                x0={x0}
                                unit={unit}
                                y={y}
                                row={row}
                                bar={bar}
                            />
                            <text className="fig-dim" x={x0} y={y + bar + 17}>
                                {row.note}
                            </text>
                        </g>
                    );
                })}
                <text className="fig-note" x="0" y={top + pitch * 2 + bar + 52}>
                    Schematic, not to scale. Stripe's fixed amount per payment
                    comes on top of both.
                </text>
            </Plate>
        </svg>
    );
}

/* ---- one event, five steps ---- */

const STEPS = [
    ["verify", "the signature"],
    ["check version", "one pinned version"],
    ["deduplicate", "event id, row locked"],
    ["apply", "one transaction"],
    ["keep failures", "with the payload"],
];
const ASIDES = [
    null,
    ["another version:", "kept, not applied"],
    ["seen before:", "nothing to do"],
    ["client notice only", "if under a day old"],
    null,
];
const PIPE_LABEL =
    "A Stripe event passes through five steps: verify the signature, check it was rendered at the one pinned API version, deduplicate on its event id with the row locked, apply it in one transaction, and keep it with its payload if it fails. An event at another version is kept but not applied, one already seen does nothing, and the client notice is only sent if the event is under a day old. A replay job looks for events Stripe could not deliver in the last seven days, re-reads each object and applies what its current state stands for, at most 100 per account and 500 per run.";

function EventPipeline() {
    const narrow = useNarrow();
    if (narrow) {
        const h = 590;
        const top = 64;
        const pitch = 62;
        const ry = top + STEPS.length * pitch + 20;
        const y4 = top + 3 * pitch;
        return (
            <svg
                className="fig"
                viewBox={frame(NARROW, h)}
                role="img"
                aria-label={PIPE_LABEL}
            >
                <Plate w={NARROW} h={h} ground={[{ y: 558, amp: 8 }]}>
                    <text className="fig-title" x="0" y="18">
                        one event, five steps
                    </text>
                    {STEPS.map(([name, note], i) => {
                        const y = top + i * pitch;
                        // the fourth step's aside moves under the plate, where the replay
                        // line has no text to cross
                        const aside = i === 3 ? null : ASIDES[i];
                        return (
                            <g key={name}>
                                <text className="fig-num" x="0" y={y + 18}>
                                    {i + 1}
                                </text>
                                <text className="fig-row" x="30" y={y + 8}>
                                    {name}
                                </text>
                                <text className="fig-dim" x="30" y={y + 24}>
                                    {note}
                                </text>
                                {aside && (
                                    <text className="fig-sub" x="186" y={y + 8}>
                                        {aside[0]}
                                        <tspan x="186" dy="15">
                                            {aside[1]}
                                        </tspan>
                                    </text>
                                )}
                                <line
                                    className="fig-mist"
                                    x1="0"
                                    y1={y + 40}
                                    x2={NARROW}
                                    y2={y + 40}
                                />
                            </g>
                        );
                    })}
                    <Box
                        x={0}
                        y={ry}
                        w={286}
                        h={56}
                        name="replay job"
                        note="missed events, seven days back"
                        wash
                    />
                    <path
                        className="fig-water"
                        d={`M286 ${ry + 28} H322 V${y4 + 12} H170`}
                    />
                    <path
                        className="fig-water"
                        d={`M170 ${y4 + 12} l7 -4 M170 ${y4 + 12} l7 4`}
                    />
                    <text className="fig-sub" x="0" y={ry + 80}>
                        at most 100 per account, 500 per run
                    </text>
                    <text className="fig-sub" x="0" y={ry + 100}>
                        step 4 sends a client notice only
                    </text>
                    <text className="fig-sub" x="0" y={ry + 116}>
                        if the event is under a day old
                    </text>
                </Plate>
            </svg>
        );
    }
    const h = 410;
    const bw = 140;
    const gap = 30;
    const by = 96;
    const bh = 60;
    const left = (i) => i * (bw + gap);
    const into = left(3) + 22;
    const ry = 262;
    return (
        <svg
            className="fig"
            viewBox={frame(WIDE, h)}
            role="img"
            aria-label={PIPE_LABEL}
        >
            <Plate w={WIDE} h={h} ground={[{ y: 384, amp: 9 }]}>
                <text className="fig-title" x="0" y="18">
                    one event, five steps
                </text>
                <text className="fig-sub" x="0" y="42">
                    every webhook from Stripe, in this order
                </text>
                {STEPS.map(([name, note], i) => {
                    // the fourth step's aside sits right of the replay line rather than across it
                    const ax = i === 3 ? left(i) + 58 : left(i) + 20;
                    return (
                        <g key={name}>
                            <text className="fig-num" x={left(i)} y={by - 8}>
                                {i + 1}
                            </text>
                            <Box
                                x={left(i)}
                                y={by}
                                w={bw}
                                h={bh}
                                name={name}
                                note={note}
                                small
                                wash={i === 3}
                            />
                            {i < STEPS.length - 1 && (
                                <Arrow
                                    from={[left(i) + bw + 4, by + bh / 2]}
                                    to={[left(i + 1) - 4, by + bh / 2]}
                                />
                            )}
                            {ASIDES[i] && (
                                <g>
                                    <line
                                        className="fig-mist dash"
                                        x1={ax}
                                        y1={by + bh}
                                        x2={ax}
                                        y2={by + bh + 22}
                                    />
                                    <text
                                        className="fig-sub"
                                        x={ax + 8}
                                        y={by + bh + 36}
                                    >
                                        {ASIDES[i][0]}
                                        <tspan x={ax + 8} dy="15">
                                            {ASIDES[i][1]}
                                        </tspan>
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
                <Box
                    x={0}
                    y={ry}
                    w={440}
                    h={56}
                    name="replay job"
                    note="events Stripe could not deliver, seven days back"
                    wash
                />
                <Arrow from={[440, ry + 28]} to={[into, by + bh]} />
                <text className="fig-dim" x={into + 12} y={ry - 6}>
                    re-read, apply the current state
                </text>
                <text className="fig-sub" x="0" y={ry + 78}>
                    at most 100 per account and 500 per run
                </text>
            </Plate>
        </svg>
    );
}

export const CONNECT_FIGURES = {
    "connect-accounts": ConnectAccounts,
    "who-handles-what": WhoHandlesWhat,
    "fee-ceiling": FeeCeiling,
    "event-pipeline": EventPipeline,
};
