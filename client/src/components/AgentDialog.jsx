import { useEffect, useRef, useState } from "react";
import AnswerText from "./AnswerText";
import Mark from "./Mark";
import { useChat } from "./ProjectChat";
import "./AgentDialog.css";

// Where finished project briefs go
const BRIEF_EMAIL = "naib.baghirov@gmail.com";

const NAIB_AGENT = {
    endpoint: "/api/agent/chat",
    avatar: <Mark size="100%" />,
    title: "Naib's agent",
    subtitle: "AI · knows his code, commits and résumé",
    greeting:
        "Hi, I'm Naib's agent. Ask me what he's building, who he builds with, or where he's worked. If you want something built, I can take your project inquiry too.",
    suggestions: [
        "What is Naib building right now?",
        "Who does he build with?",
        "What does he do at Beautiful.ai?",
        "I'd like to start a project",
    ],
    placeholder: "Ask about Naib's work",
    labels: {
        list_projects: "Looking at Naib's projects",
        list_files: "Looking through",
        read_file: "Reading",
        search_code: "Searching",
        git_log: "Checking Naib's commit history on",
        contributors: "Checking who worked on",
        submit_brief: "Writing up your brief",
    },
};

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
 * A minimal chat with Naib's agent: questions about his work, and project inquiries
 * for Careful Labs that end in a brief the visitor can email.
 * Native <dialog>, so focus is trapped, Escape closes it and focus returns.
 */
function AgentDialog({ onClose, persona = NAIB_AGENT }) {
    const ref = useRef(null);
    const logRef = useRef(null);
    const inputRef = useRef(null);
    const [input, setInput] = useState("");
    const { turns, busy, ask } = useChat(persona.endpoint, persona.labels);

    useEffect(() => {
        const dialog = ref.current;
        dialog.showModal();
        inputRef.current?.focus();
        return () => dialog.close();
    }, []);

    useEffect(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    }, [turns]);

    const send = (text) => {
        if (!text.trim() || busy) return;
        setInput("");
        ask(text);
    };

    return (
        <dialog
            ref={ref}
            className="agent-chat"
            aria-labelledby="agent-chat-title"
            onClose={onClose}
            onClick={(e) => e.target === ref.current && onClose()}
        >
            <div className="agent-chat-window">
                <header className="agent-chat-head">
                    <span className="agent-chat-avatar">{persona.avatar}</span>
                    <div className="agent-chat-who">
                        <h2 id="agent-chat-title">{persona.title}</h2>
                        <p>{persona.subtitle}</p>
                    </div>
                    <button type="button" className="agent-chat-close" onClick={onClose} aria-label="Close">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                            <path d="M2 2 L14 14 M14 2 L2 14" />
                        </svg>
                    </button>
                </header>

                <div className="agent-chat-log" ref={logRef} aria-live="polite">
                    <div className="msg msg-naib">
                        <p>{persona.greeting}</p>
                    </div>

                    {turns.length === 0 && (
                        <div className="agent-chat-suggestions">
                            {persona.suggestions.map((q) => (
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
                    className="agent-chat-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        send(input);
                    }}
                >
                    <label htmlFor="agent-chat-input" className="visually-hidden">
                        {persona.placeholder}
                    </label>
                    <input
                        id="agent-chat-input"
                        ref={inputRef}
                        type="text"
                        value={input}
                        maxLength={500}
                        autoComplete="off"
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={persona.placeholder}
                    />
                    <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M8 13 L8 3 M3.5 7.5 L8 3 L12.5 7.5" />
                        </svg>
                    </button>
                </form>
                <p className="agent-chat-note">Answers come from an AI and can be wrong.</p>
            </div>
        </dialog>
    );
}

export default AgentDialog;
