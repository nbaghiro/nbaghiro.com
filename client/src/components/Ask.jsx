import { useState } from "react";
import { useChat } from "./ProjectChat";
import AnswerText from "./AnswerText";
import "./Ask.css";

const SUGGESTIONS = [
    "What are you working on right now?",
    "How does Galleo keep an export identical to the screen?",
    "What runs Clientbridge's sales tax?",
];

// The repo agent, kept to one input and one answer. The full tool log and the project
// picker that used to surround it are gone: this is a quiet corner of the page, not the
// subject of it.
function Ask() {
    const { turns, busy, ask } = useChat("/api/agent/chat");
    const [text, setText] = useState("");

    const send = (event) => {
        event.preventDefault();
        const question = text.trim();
        if (!question || busy) return;
        setText("");
        ask(question);
    };

    const answered = turns.length > 0;
    const last = turns[turns.length - 1];
    const activity =
        busy && last?.activity?.length
            ? last.activity[last.activity.length - 1]
            : "";

    return (
        <div className="ask">
            <form className="ask-form" onSubmit={send}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ask about any of it"
                    aria-label="Ask about the work"
                    disabled={busy}
                />
                <button type="submit" disabled={busy || !text.trim()}>
                    {busy ? "Thinking" : "Ask"}
                </button>
            </form>

            {!answered && (
                <ul className="ask-suggestions">
                    {SUGGESTIONS.map((s) => (
                        <li key={s}>
                            <button
                                type="button"
                                onClick={() => ask(s)}
                                disabled={busy}
                            >
                                {s}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {answered && (
                <div className="ask-thread">
                    {turns.map((turn, i) =>
                        turn.role === "user" ? (
                            <p className="ask-q" key={i}>
                                {turn.content}
                            </p>
                        ) : (
                            <div className="ask-a" key={i}>
                                {turn.error ? (
                                    <p className="ask-error">{turn.error}</p>
                                ) : (
                                    <AnswerText text={turn.content} />
                                )}
                            </div>
                        )
                    )}
                    {activity && <p className="ask-activity">{activity}</p>}
                </div>
            )}
        </div>
    );
}

export default Ask;
