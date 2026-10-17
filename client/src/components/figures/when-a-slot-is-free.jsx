import { NARROW, Plate, WIDE, frame, useNarrow } from "./plate";

/** The figures for "Deciding whether a booking slot is free". */

/* ---- a visit is longer than its appointment ---- */

// Both visits as fractions of the plate's width: the solid bar is the appointment, the
// wash around it is that service's own before and after buffers.
const EXISTING = { wash: [0.09, 0.53], bar: [0.16, 0.47] };
const INCOMING = { wash: [0.42, 0.81], bar: [0.49, 0.75] };

const BUFFER_GROUND = {
    wide: [{ y: 314, amp: 9 }],
    narrow: [{ y: 366, amp: 8 }],
};

function Visit({ w, y, span, label, note, height, textAt }) {
    const x = (f) => Math.round(f * w);
    const tx = textAt ?? x(span.wash[0]);
    return (
        <g>
            <text className="fig-sub" x={tx} y={y - 10}>
                {label}
            </text>
            <rect
                className="fig-wash"
                x={x(span.wash[0])}
                y={y}
                width={x(span.wash[1]) - x(span.wash[0])}
                height={height}
            />
            <rect
                className="fig-solid"
                x={x(span.bar[0])}
                y={y}
                width={x(span.bar[1]) - x(span.bar[0])}
                height={height}
            />
            <text className="fig-dim" x={tx} y={y + height + 18}>
                {note}
            </text>
        </g>
    );
}

function BufferedWindow() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 384 : 332;
    const bar = narrow ? 30 : 34;
    const rowA = narrow ? 82 : 80;
    const rowB = narrow ? 196 : 190;
    const x = (f) => Math.round(f * w);
    const band = [x(INCOMING.wash[0]), x(EXISTING.wash[1])];
    const bandTop = rowA - 20;
    const bandEnd = rowB + bar + 26;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="Two visits on one member's day. Each is a solid bar with a pale band around it for its own before and after buffers. The bars are clear of each other, the bands overlap, and that overlap is what the booking check refuses."
        >
            <Plate
                w={w}
                h={h}
                ground={BUFFER_GROUND[narrow ? "narrow" : "wide"]}
            >
                <text className="fig-title" x="0" y="18">
                    one member, one afternoon
                </text>
                <rect
                    className="fig-wash strong"
                    x={band[0]}
                    y={bandTop}
                    width={band[1] - band[0]}
                    height={bandEnd - bandTop}
                />
                <line
                    className="fig-water"
                    x1={band[0]}
                    y1={bandTop}
                    x2={band[0]}
                    y2={bandEnd}
                />
                <line
                    className="fig-water"
                    x1={band[1]}
                    y1={bandTop}
                    x2={band[1]}
                    y2={bandEnd}
                />
                <Visit
                    w={w}
                    y={rowA}
                    span={EXISTING}
                    height={bar}
                    label="booked"
                    note="setup before, cleanup after"
                />
                <Visit
                    w={w}
                    y={rowB}
                    span={INCOMING}
                    height={bar}
                    label="being booked"
                    note="its own buffers"
                    textAt={band[1] + 12}
                />
                <text className="fig-note" x="0" y={narrow ? 292 : 276}>
                    {narrow
                        ? "Clear on the clock. Not clear once"
                        : "Clear of each other on the clock. Not clear once each service's"}
                </text>
                <text className="fig-note" x="0" y={narrow ? 312 : 296}>
                    {narrow
                        ? "each service's own buffers count."
                        : "own buffers are counted on both sides."}
                </text>
            </Plate>
        </svg>
    );
}

/* ---- the order the locks are taken in ---- */

const LOCKS = [
    ["hours", "one key per business"],
    ["members", "one key per staff id, sorted"],
    ["bookings", "rows selected for update, by id"],
    ["slots", "the insert itself"],
];
const LOCK_GROUND = {
    wide: [{ y: 262, amp: 9 }],
    narrow: [{ y: 338, amp: 8 }],
};
const NOTE = [
    "every lock held to the end",
    "so the check cannot go stale",
    "between reading and writing",
];

function LockOrder() {
    const narrow = useNarrow();
    const w = narrow ? NARROW : WIDE;
    const h = narrow ? 356 : 282;
    const top = narrow ? 84 : 76;
    const pitch = narrow ? 52 : 44;
    const left = 34;
    const rowW = narrow ? NARROW - left : 470;
    const last = top + (LOCKS.length - 1) * pitch;
    return (
        <svg
            className="fig"
            viewBox={frame(w, h)}
            role="img"
            aria-label="The four locks a booking takes, numbered in the order they are always taken: the hours key, then members by id, then booking rows by id, then the slot insert. All of them are held until the transaction ends."
        >
            <Plate w={w} h={h} ground={LOCK_GROUND[narrow ? "narrow" : "wide"]}>
                <text className="fig-title" x="0" y="18">
                    always this order
                </text>
                <path
                    className="fig-water"
                    d={`M8 ${top - 10} V${last + 26} M8 ${last + 26} l-4 -7 M8 ${last + 26} l4 -7`}
                />
                {LOCKS.map(([name, note], i) => (
                    <g key={name}>
                        <text
                            className="fig-num"
                            x={left}
                            y={top + i * pitch + 12}
                        >
                            {i + 1}
                        </text>
                        <text
                            className="fig-row"
                            x={left + 26}
                            y={top + i * pitch + 12}
                        >
                            {name}
                        </text>
                        <text
                            className="fig-dim"
                            x={left + 26}
                            y={top + i * pitch + 30}
                        >
                            {note}
                        </text>
                        <line
                            className="fig-mist"
                            x1={left}
                            y1={top + i * pitch + 38}
                            x2={left + rowW}
                            y2={top + i * pitch + 38}
                        />
                    </g>
                ))}
                {!narrow && (
                    <g>
                        <rect
                            className="fig-ink"
                            x="552"
                            y={top - 10}
                            width="268"
                            height="142"
                        />
                        <text className="fig-title sm" x="572" y={top + 16}>
                            one transaction
                        </text>
                        {NOTE.map((line, i) => (
                            <text
                                key={line}
                                className={i === 0 ? "fig-sub" : "fig-dim"}
                                x="572"
                                y={top + 48 + i * 26}
                            >
                                {line}
                            </text>
                        ))}
                    </g>
                )}
                {narrow && (
                    <text className="fig-note" x="0" y={last + 62}>
                        Held to the end of the transaction.
                    </text>
                )}
            </Plate>
        </svg>
    );
}

export const SLOT_FIGURES = {
    "buffered-window": BufferedWindow,
    "lock-order": LockOrder,
};
