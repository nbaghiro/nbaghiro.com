import { useEffect, useRef, useState } from "react";
import "./Ask.css";
import "./Booking.css";
import { openContact } from "./Contact";

// Any page can open it; the dialog itself is mounted once, in the layout.
export function openBooking() {
    window.dispatchEvent(new Event("book:open"));
}

const EMAIL = "naib.baghirov@gmail.com";

const dayKey = (iso, timeZone) =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(iso));

const dayLabel = (iso, timeZone) =>
    new Intl.DateTimeFormat("en-GB", {
        timeZone,
        weekday: "short",
        day: "numeric",
        month: "short",
    }).format(new Date(iso));

const clock = (iso, timeZone) =>
    new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
        .format(new Date(iso))
        .replace(/\s?([ap])m/i, (_, p) => ` ${p.toLowerCase()}m`);

const here = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

// "2026-10" for the month a slot falls in, read in the owner's zone
const monthOf = (dayIso) => dayIso.slice(0, 7);

const monthName = (ym) =>
    new Intl.DateTimeFormat("en-GB", {
        timeZone: "UTC",
        month: "long",
        year: "numeric",
    }).format(new Date(`${ym}-01T00:00:00Z`));

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * The cells of one month, Monday first: nulls for the lead-in, then "2026-10-01" and so on.
 * Plain calendar arithmetic, so no instant and no zone is involved.
 */
function monthCells(ym) {
    const [year, month] = ym.split("-").map(Number);
    const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const cells = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= length; d += 1) {
        cells.push(`${ym}-${String(d).padStart(2, "0")}`);
    }
    return cells;
}

/**
 * Booking. The rules and the free time come from the server, which reads the calendar;
 * this only draws them. Three steps, in the same dialog the repo agent uses, because a
 * second dialog style would be a second thing to maintain and to look at.
 */
function Booking() {
    const dialog = useRef(null);
    const [state, setState] = useState("loading");
    const [data, setData] = useState(null);
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const grid = useRef(null);
    const [slot, setSlot] = useState("");
    const [form, setForm] = useState({ name: "", email: "", note: "" });
    const [sending, setSending] = useState(false);
    const [problem, setProblem] = useState("");
    const [booked, setBooked] = useState(null);

    const load = async () => {
        setState("loading");
        setProblem("");
        try {
            const res = await fetch("/api/booking/slots");
            if (res.status === 503) return setState("off");
            if (!res.ok) throw new Error(String(res.status));
            const json = await res.json();
            setData(json);
            const first = json.slots[0];
            const firstDay = first ? dayKey(first.start, json.timezone) : "";
            setDay(firstDay);
            setMonth(firstDay ? monthOf(firstDay) : "");
            setSlot("");
            setState(json.slots.length ? "pick" : "none");
        } catch {
            setState("error");
        }
    };

    useEffect(() => {
        const open = () => {
            const d = dialog.current;
            if (d && !d.open) {
                setBooked(null);
                setSlot("");
                d.showModal();
                load();
            }
        };
        window.addEventListener("book:open", open);
        return () => window.removeEventListener("book:open", open);
    }, []);

    const zone = data?.timezone ?? "America/Toronto";
    const label = data?.zoneLabel ?? "ET";
    const elsewhere = here() !== zone;

    const days = [];
    const byDay = new Map();
    for (const s of data?.slots ?? []) {
        const key = dayKey(s.start, zone);
        if (!byDay.has(key)) {
            byDay.set(key, []);
            days.push({ key, label: dayLabel(s.start, zone) });
        }
        byDay.get(key).push(s);
    }

    const months = [...new Set(days.map((d) => monthOf(d.key)))];
    const atMonth = months.indexOf(month);
    const today = dayKey(new Date().toISOString(), zone);
    const open = new Map(
        days.map((d) => [d.key, byDay.get(d.key)?.length ?? 0])
    );

    // arrows walk the bookable days of the month on screen; Enter is the button's own job
    const onGridKey = (event) => {
        const step = {
            ArrowRight: 1,
            ArrowLeft: -1,
            ArrowDown: 7,
            ArrowUp: -7,
        }[event.key];
        if (!step) return;
        const cells = monthCells(month);
        const from = cells.indexOf(event.target.dataset?.day);
        if (from < 0) return;
        event.preventDefault();
        for (let i = from + step; i >= 0 && i < cells.length; i += step) {
            const key = cells[i];
            if (key && open.get(key)) {
                grid.current?.querySelector(`[data-day="${key}"]`)?.focus();
                return;
            }
        }
    };

    const submit = async (event) => {
        event.preventDefault();
        setSending(true);
        setProblem("");
        try {
            const res = await fetch("/api/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, start: slot }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                setProblem(
                    json.error ||
                        "The booking could not be completed. Please try again."
                );
                if (res.status === 409) {
                    await load();
                    setState("pick");
                }
                return;
            }
            setBooked(json);
            setState("done");
        } catch {
            setProblem("The booking could not be completed. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const close = () => dialog.current?.close();

    return (
        <dialog className="ask-modal" ref={dialog}>
            <div className="ask-modal-inner">
                <figure className="ask-plate">
                    <img src="/img/book.webp" alt="" />
                    <figcaption>
                        <p className="ask-plate-title">Book a short call</p>
                        <p className="ask-plate-line">
                            A 30-minute video call. Choose a time that works for
                            you.
                        </p>
                    </figcaption>
                </figure>

                <div className="ask-panel book-panel">
                    <button
                        className="ask-close"
                        type="button"
                        onClick={close}
                        aria-label="Close"
                    >
                        Close
                    </button>

                    <div className="book-body">
                        {state === "loading" && (
                            <p className="ask-activity">
                                Loading available times
                            </p>
                        )}

                        {state === "off" && (
                            <div className="book-note">
                                <p>
                                    Online booking is not available yet. Email
                                    me to arrange a call.
                                </p>
                                <p className="book-mail">
                                    <button
                                        type="button"
                                        className="book-mail-open"
                                        onClick={() => {
                                            dialog.current?.close();
                                            openContact();
                                        }}
                                    >
                                        Send a message instead
                                    </button>
                                </p>
                            </div>
                        )}

                        {state === "error" && (
                            <div className="book-note">
                                <p>
                                    Available times could not be loaded. Please
                                    try again or email me.
                                </p>
                                <p className="book-mail">
                                    <button
                                        type="button"
                                        className="book-mail-open"
                                        onClick={() => {
                                            dialog.current?.close();
                                            openContact();
                                        }}
                                    >
                                        Send a message instead
                                    </button>
                                </p>
                            </div>
                        )}

                        {state === "none" && (
                            <div className="book-note">
                                <p>
                                    There are no available times in the current
                                    booking window. Email me to arrange a call.
                                </p>
                                <p className="book-mail">
                                    <button
                                        type="button"
                                        className="book-mail-open"
                                        onClick={() => {
                                            dialog.current?.close();
                                            openContact();
                                        }}
                                    >
                                        Send a message instead
                                    </button>
                                </p>
                            </div>
                        )}

                        {state === "pick" && (
                            <>
                                <p className="ask-invite">
                                    Choose a day, then a time. Times are shown
                                    in {label}.
                                </p>
                                <div className="book-pick">
                                    <div className="book-month">
                                        <div className="book-month-head">
                                            <p className="book-month-name">
                                                {monthName(month)}
                                            </p>
                                            <div className="book-step">
                                                <button
                                                    type="button"
                                                    aria-label="Previous month"
                                                    disabled={atMonth <= 0}
                                                    onClick={() =>
                                                        setMonth(
                                                            months[atMonth - 1]
                                                        )
                                                    }
                                                >
                                                    ‹
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label="Next month"
                                                    disabled={
                                                        atMonth >=
                                                        months.length - 1
                                                    }
                                                    onClick={() =>
                                                        setMonth(
                                                            months[atMonth + 1]
                                                        )
                                                    }
                                                >
                                                    ›
                                                </button>
                                            </div>
                                        </div>
                                        <div
                                            className="book-grid"
                                            ref={grid}
                                            onKeyDown={onGridKey}
                                        >
                                            {WEEKDAYS.map((w, i) => (
                                                <span
                                                    className="book-wd"
                                                    key={i}
                                                    aria-hidden="true"
                                                >
                                                    {w}
                                                </span>
                                            ))}
                                            {monthCells(month).map((key, i) => {
                                                const free = key
                                                    ? open.get(key)
                                                    : 0;
                                                const number = key
                                                    ? Number(key.slice(-2))
                                                    : "";
                                                const marks = [
                                                    key === today
                                                        ? "today"
                                                        : "",
                                                    key === day ? "on" : "",
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ");
                                                if (!free) {
                                                    return (
                                                        <span
                                                            key={key ?? `x${i}`}
                                                            className={`book-off ${marks}`}
                                                        >
                                                            {number}
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        data-day={key}
                                                        className={marks}
                                                        aria-pressed={
                                                            key === day
                                                        }
                                                        aria-label={`${dayLabel(
                                                            byDay.get(key)[0]
                                                                .start,
                                                            zone
                                                        )}, ${free} ${
                                                            free === 1
                                                                ? "time"
                                                                : "times"
                                                        } free`}
                                                        tabIndex={
                                                            key === day ? 0 : -1
                                                        }
                                                        onClick={() => {
                                                            setDay(key);
                                                            setSlot("");
                                                        }}
                                                    >
                                                        {number}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="book-slots">
                                        {byDay.get(day)?.length ? (
                                            <p className="book-chosen">
                                                {dayLabel(
                                                    byDay.get(day)[0].start,
                                                    zone
                                                )}
                                            </p>
                                        ) : (
                                            <p className="book-chosen">
                                                Pick a day with times on it
                                            </p>
                                        )}
                                        <ul className="ask-suggestions book-times">
                                            {(byDay.get(day) ?? []).map((s) => (
                                                <li key={s.start}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSlot(s.start);
                                                            setState("details");
                                                        }}
                                                    >
                                                        <span>
                                                            {clock(
                                                                s.start,
                                                                zone
                                                            )}{" "}
                                                            {label}
                                                        </span>
                                                        {elsewhere && (
                                                            <span className="book-local">
                                                                {clock(
                                                                    s.start,
                                                                    here()
                                                                )}{" "}
                                                                your time
                                                            </span>
                                                        )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </>
                        )}

                        {state === "details" && (
                            <>
                                <p className="ask-invite">
                                    {dayLabel(slot, zone)}, {clock(slot, zone)}{" "}
                                    {label}
                                    {elsewhere
                                        ? `, which is ${clock(slot, here())} where you are`
                                        : ""}
                                    .{" "}
                                    <button
                                        className="book-back"
                                        type="button"
                                        onClick={() => setState("pick")}
                                    >
                                        Choose another time
                                    </button>
                                </p>
                                <form className="book-form" onSubmit={submit}>
                                    <label>
                                        <span>Your name</span>
                                        <input
                                            type="text"
                                            value={form.name}
                                            required
                                            maxLength={80}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    name: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                    <label>
                                        <span>Email for the invitation</span>
                                        <input
                                            type="email"
                                            value={form.email}
                                            required
                                            maxLength={200}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    email: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                    <label>
                                        <span>
                                            What would you like to discuss?
                                            (optional)
                                        </span>
                                        <textarea
                                            rows={3}
                                            value={form.note}
                                            maxLength={600}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    note: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                    {problem && (
                                        <p className="ask-error">{problem}</p>
                                    )}
                                    <div className="book-send">
                                        <button
                                            type="submit"
                                            disabled={sending}
                                        >
                                            {sending
                                                ? "Booking"
                                                : "Book the call"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {state === "done" && booked && (
                            <div className="book-note">
                                <p className="book-when">
                                    {dayLabel(booked.start, zone)},{" "}
                                    {clock(booked.start, zone)} {label}
                                    {elsewhere
                                        ? `, ${clock(booked.start, here())} your time`
                                        : ""}
                                </p>
                                <p>
                                    {booked.synced === false
                                        ? `Your request is with me. I will confirm it by email to ${form.email}.`
                                        : `Your call is booked. The invitation to ${form.email} includes the video link.`}
                                </p>
                                {booked.meet && (
                                    <p className="book-mail">
                                        <a
                                            href={booked.meet}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {booked.meet.replace(
                                                "https://",
                                                ""
                                            )}
                                        </a>
                                    </p>
                                )}
                                <p>
                                    If something changes, reply to that mail or
                                    write to {EMAIL}.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </dialog>
    );
}

export default Booking;
