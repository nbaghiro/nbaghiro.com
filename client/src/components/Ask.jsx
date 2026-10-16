import { useEffect, useRef, useState } from "react";
import { useChat } from "./ProjectChat";
import AnswerText from "./AnswerText";
import "./Ask.css";

// Anywhere on the page can open the conversation; the dialog itself stays in one place.
export function openAsk() {
    window.dispatchEvent(new Event("ask:open"));
}

const SUGGESTIONS = [
    "What are you working on right now?",
    "How does Galleo share layout between the editor and exports?",
    "How does Clientbridge calculate sales tax?",
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

    useEffect(() => {
        const open = () => dialog.current?.showModal();
        window.addEventListener("ask:open", open);
        return () => window.removeEventListener("ask:open", open);
    }, []);

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
                    placeholder="Ask about a project"
                    aria-label="Talk to my agent"
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
                    Continue the conversation
                </button>
            )}

            <dialog className="ask-modal" ref={dialog}>
                <div className="ask-modal-inner">
                    <figure className="ask-plate">
                        <img src="/img/ask.webp" alt="" />
                        <figcaption>
                            <p className="ask-plate-title">Talk to my agent</p>
                            <p className="ask-plate-line">
                                An AI assistant with access to the project code
                                and its history.
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
                            {!answered && !busy && (
                                <>
                                    <p className="ask-invite">
                                        Ask how a project works, or choose a
                                        question below.
                                    </p>
                                    <ul className="ask-suggestions">
                                        {SUGGESTIONS.map((s) => (
                                            <li key={s}>
                                                <button
                                                    type="button"
                                                    onClick={() => put(s)}
                                                >
                                                    {s}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </>
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
                                    busy
                                        ? "Reading the code"
                                        : "Ask a follow-up question"
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
