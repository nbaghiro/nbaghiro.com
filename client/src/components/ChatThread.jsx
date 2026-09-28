import { useEffect, useRef, useState } from "react";
import AnswerText from "./AnswerText";
import "./ChatThread.css";

// Where finished project briefs go
const BRIEF_EMAIL = "naib.baghirov@gmail.com";

function briefMailto(brief) {
    const body = [
        `What: ${brief.what}`,
        `Stage: ${brief.stage}`,
        `Timeline: ${brief.timeline}`,
        `Best fit: ${brief.fit}`,
        brief.notes ? `Notes: ${brief.notes}` : null,
        "",
        "Sent from the project intake on nbaghiro.com",
    ]
        .filter((line) => line !== null)
        .join("\n");
    return `mailto:${BRIEF_EMAIL}?subject=${encodeURIComponent(`Project: ${brief.title}`)}&body=${encodeURIComponent(body)}`;
}

function BriefCard({ brief }) {
    const [copied, setCopied] = useState(false);
    const rows = [
        ["What", brief.what],
        ["Stage", brief.stage],
        ["Timeline", brief.timeline],
        ["Best fit", brief.fit],
        ["Notes", brief.notes],
    ].filter(([, value]) => value);

    const copy = async () => {
        const text = `${brief.title}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="brief">
            <p className="brief-label">Project brief</p>
            <h3 className="brief-title">{brief.title}</h3>
            <dl>
                {rows.map(([k, v]) => (
                    <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                    </div>
                ))}
            </dl>
            <div className="brief-actions">
                <a className="brief-send" href={briefMailto(brief)}>
                    Email it to Careful Labs
                </a>
                <button type="button" className="brief-copy" onClick={copy}>
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
        </div>
    );
}

/**
 * The chat itself, shared by "Ask my agent" and each project's "Ask the code" tab:
 * greeting, suggestions, messages with a working status line, project briefs,
 * and the input. `variant` only changes how it sits in its container.
 */
function ChatThread({ turns, busy, onSend, greeting, suggestions, placeholder, inputLabel, note, variant = "dialog" }) {
    const logRef = useRef(null);
    const [input, setInput] = useState("");

    useEffect(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    }, [turns]);

    const send = (text) => {
        if (!text.trim() || busy) return;
        setInput("");
        onSend(text);
    };

    return (
        <div className={`chat-thread chat-thread--${variant}`}>
            <div className="chat-thread-log" ref={logRef} aria-live="polite">
                {greeting && (
                    <div className="msg msg-naib">
                        <p>{greeting}</p>
                    </div>
                )}

                {turns.length === 0 && suggestions?.length > 0 && (
                    <div className="chat-thread-suggestions">
                        {suggestions.map((q) => (
                            <button key={q} type="button" onClick={() => send(q)}>
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {turns.map((turn, i) => {
                    if (turn.role === "user") {
                        return (
                            <div key={i} className="msg msg-visitor">
                                <p>{turn.content}</p>
                            </div>
                        );
                    }
                    const working = busy && i === turns.length - 1;
                    return (
                        <div key={i} className="msg-group">
                            <div className="msg msg-naib">
                                {turn.content && <AnswerText text={turn.content} />}
                                {!turn.content && !turn.error && (
                                    <p className="msg-status">
                                        {turn.activity?.length ? `${turn.activity[turn.activity.length - 1]}...` : "Thinking..."}
                                    </p>
                                )}
                                {turn.content && working && turn.activity?.length > 0 && <span className="msg-cursor" aria-hidden="true" />}
                                {turn.error && <p className="msg-error">{turn.error}</p>}
                            </div>
                            {turn.brief && <BriefCard brief={turn.brief} />}
                        </div>
                    );
                })}
            </div>

            <form
                className="chat-thread-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                }}
            >
                <label htmlFor={`chat-input-${variant}`} className="visually-hidden">
                    {inputLabel || placeholder}
                </label>
                <input
                    id={`chat-input-${variant}`}
                    type="text"
                    value={input}
                    maxLength={500}
                    autoComplete="off"
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M8 13 L8 3 M3.5 7.5 L8 3 L12.5 7.5" />
                    </svg>
                </button>
            </form>
            {note && <p className="chat-thread-note">{note}</p>}
        </div>
    );
}

export default ChatThread;
