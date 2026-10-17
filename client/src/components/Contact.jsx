import { useEffect, useRef, useState } from "react";
import "./Ask.css";
import "./Booking.css";

// Any page can open it; the dialog is mounted once, in the layout. A caller may hand it a
// message to start from, which is how the agent's project brief gets here without mail.
export function openContact(message) {
    window.dispatchEvent(
        new CustomEvent("contact:open", { detail: { message } })
    );
}

const EMAIL = "naib.baghirov@gmail.com";

/**
 * The contact form. It posts to the server, which sends the message as mail with the
 * visitor's address as Reply-To. The dialog, the fields and the limiter are the booking
 * flow's, so this adds a form and nothing else.
 */
function Contact() {
    const dialog = useRef(null);
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [state, setState] = useState("form");
    const [problem, setProblem] = useState("");
    const [sent, setSent] = useState(null);

    useEffect(() => {
        const open = (event) => {
            const d = dialog.current;
            if (d && !d.open) {
                setState("form");
                setProblem("");
                setSent(null);
                const given = event.detail?.message;
                if (given) setForm((f) => ({ ...f, message: given }));
                d.showModal();
            }
        };
        window.addEventListener("contact:open", open);
        return () => window.removeEventListener("contact:open", open);
    }, []);

    const submit = async (event) => {
        event.preventDefault();
        setState("sending");
        setProblem("");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                setProblem(
                    json.error ||
                        `The message could not be sent. Please try again, or email ${EMAIL}.`
                );
                setState(res.status === 503 ? "off" : "form");
                return;
            }
            setSent(json);
            setState("done");
        } catch {
            setProblem(
                `The message could not be sent. Please try again, or email ${EMAIL}.`
            );
            setState("form");
        }
    };

    const sending = state === "sending";

    return (
        <dialog className="ask-modal" ref={dialog}>
            <div className="ask-modal-inner">
                <figure className="ask-plate">
                    <img src="/img/contact.webp" alt="" />
                    <figcaption>
                        <p className="ask-plate-title">Send a message</p>
                        <p className="ask-plate-line">
                            It goes straight to my inbox, and I reply to the
                            address you leave.
                        </p>
                    </figcaption>
                </figure>

                <div className="ask-panel book-panel">
                    <button
                        className="ask-close"
                        type="button"
                        onClick={() => dialog.current?.close()}
                        aria-label="Close"
                    >
                        Close
                    </button>

                    <div className="book-body">
                        {state === "off" && (
                            <div className="book-note">
                                <p>{problem}</p>
                                <p className="book-mail">{EMAIL}</p>
                            </div>
                        )}

                        {state === "done" && sent && (
                            <div className="book-note">
                                <p className="book-when">Message sent</p>
                                <p>
                                    Thanks, {sent.name}. I have it, and I will
                                    reply to {sent.email}.
                                </p>
                            </div>
                        )}

                        {(state === "form" || sending) && (
                            <>
                                <p className="ask-invite">
                                    Tell me what you are working on or what you
                                    need. I read everything that comes through
                                    here.
                                </p>
                                <form className="book-form" onSubmit={submit}>
                                    <label>
                                        <span>Your name</span>
                                        <input
                                            type="text"
                                            value={form.name}
                                            required
                                            maxLength={80}
                                            disabled={sending}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    name: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                    <label>
                                        <span>Your email</span>
                                        <input
                                            type="email"
                                            value={form.email}
                                            required
                                            maxLength={200}
                                            disabled={sending}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    email: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                    <label>
                                        <span>Message</span>
                                        <textarea
                                            rows={6}
                                            value={form.message}
                                            required
                                            minLength={10}
                                            maxLength={4000}
                                            disabled={sending}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    message: e.target.value,
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
                                                ? "Sending"
                                                : "Send message"}
                                        </button>
                                    </div>
                                </form>
                                <p className="book-alt">
                                    If you would rather write from your own
                                    mail, the address is {EMAIL}.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </dialog>
    );
}

export default Contact;
