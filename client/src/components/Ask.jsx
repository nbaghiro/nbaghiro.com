import { useEffect, useRef, useState } from "react";
import { useChat } from "./ProjectChat";
import AnswerText from "./AnswerText";
import "./Ask.css";

const SUGGESTIONS = [
    "What are you working on right now?",
    "How does Galleo keep an export identical to the screen?",
    "What runs Clientbridge's sales tax?",
];

// The repo agent. The band carries the invitation; the conversation itself happens in a
// dialog over the page, so an answer never pushes the footer down the screen.
function Ask() {
    const { turns, busy, ask } = useChat("/api/agent/chat");
    const [text, setText] = useState("");
    const [reply, setReply] = useState("");
    const dialog = useRef(null);
    const thread = useRef(null);

    const put = (question) => {
        const q = question.trim();
        if (!q || busy) return;
        ask(q);
        const d = dialog.current;
        if (d && !d.open) d.showModal();
    };

    // keep the newest words in view as they stream in
    useEffect(() => {
        const el = thread.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [turns]);

    const answered = turns.length > 0;
    const last = turns[turns.length - 1];
    const activity =
        busy && last?.activity?.length
            ? last.activity[last.activity.length - 1]
            : "";

    return (
        <div className="ask">
            <form
                className="ask-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    put(text);
                    setText("");
                }}
            >
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ask about any of it"
                    aria-label="Ask about the work"
                />
                <button type="submit" disabled={!text.trim()}>
                    Ask
                </button>
            </form>

            <ul className="ask-suggestions">
                {SUGGESTIONS.map((s) => (
                    <li key={s}>
                        <button type="button" onClick={() => put(s)}>
                            {s}
                        </button>
                    </li>
                ))}
            </ul>

            {answered && (
                <button
                    className="ask-resume"
                    type="button"
                    onClick={() => dialog.current?.showModal()}
                >
                    Open the conversation again
                </button>
            )}

            <dialog className="ask-modal" ref={dialog}>
                <div className="ask-modal-inner">
                    <figure className="ask-plate">
                        <img src="/img/ask.webp" alt="" />
                        <figcaption>
                            <p className="ask-plate-title">
                                Ask about the work
                            </p>
                            <p className="ask-plate-line">
                                The answers are read out of the repositories and
                                their history.
                            </p>
                        </figcaption>
                    </figure>

                    <div className="ask-panel">
                        <button
                            className="ask-close"
                            type="button"
                            onClick={() => dialog.current?.close()}
                            aria-label="Close"
                        >
                            Close
                        </button>

                        <div className="ask-thread" ref={thread}>
                            {turns.map((turn, i) =>
                                turn.role === "user" ? (
                                    <p className="ask-q" key={i}>
                                        {turn.content}
                                    </p>
                                ) : (
                                    <div className="ask-a" key={i}>
                                        {turn.error ? (
                                            <p className="ask-error">
                                                {turn.error}
                                            </p>
                                        ) : (
                                            <AnswerText text={turn.content} />
                                        )}
                                    </div>
                                )
                            )}
                            {busy && (
                                <p className="ask-activity">
                                    {activity || "Reading the code"}
                                </p>
                            )}
                        </div>

                        <form
                            className="ask-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                put(reply);
                                setReply("");
                            }}
                        >
                            <input
                                type="text"
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                placeholder={
                                    busy ? "Reading the code" : "Ask another"
                                }
                                aria-label="Ask another question"
                                disabled={busy}
                            />
                            <button
                                type="submit"
                                disabled={busy || !reply.trim()}
                            >
                                {busy ? "Thinking" : "Ask"}
                            </button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
}

export default Ask;
