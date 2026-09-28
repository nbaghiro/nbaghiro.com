import { useEffect, useRef, useState } from "react";
import AnswerText from "./AnswerText";

export const TOOL_LABELS = {
    list_files: "Listing",
    read_file: "Reading",
    search_code: "Searching",
    git_log: "Reading the history of",
    contributors: "Checking who worked on",
    list_projects: "Listing projects",
};

/**
 * Read a Server-Sent Events response and call onEvent for each JSON event
 */
async function readEvents(response, onEvent) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let split;
        while ((split = buffer.indexOf("\n\n")) !== -1) {
            const chunk = buffer.slice(0, split);
            buffer = buffer.slice(split + 2);
            if (chunk.startsWith("data: ")) onEvent(JSON.parse(chunk.slice(6)));
        }
    }
}

/**
 * Chat state and streaming for a server-side agent. History stays in the page.
 * `labels` turns tool events into the short status line shown while it works.
 */
export function useChat(endpoint, labels = TOOL_LABELS) {
    const [turns, setTurns] = useState([]); // { role, content, files?, activity?, error? }
    const [busy, setBusy] = useState(false);
    const abortRef = useRef(null);

    useEffect(() => () => abortRef.current?.abort(), []);

    const updateLast = (patch) =>
        setTurns((prev) => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, ...patch(last) }];
        });

    const ask = async (question) => {
        const text = question.trim();
        if (!text || busy) return;
        setBusy(true);

        // Only answered question/answer pairs go back to the server
        const history = [];
        for (let i = 0; i + 1 < turns.length; i += 2) {
            const [q, a] = [turns[i], turns[i + 1]];
            if (a.content && !a.error) history.push({ role: "user", content: q.content }, { role: "assistant", content: a.content });
        }
        history.push({ role: "user", content: text });
        setTurns((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "", activity: [], files: [] }]);

        const abort = new AbortController();
        abortRef.current = abort;
        let needsBreak = false;

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history }),
                signal: abort.signal,
            });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error || "The chat is not available right now.");
            }
            await readEvents(response, (event) => {
                if (event.type === "text") {
                    const sep = needsBreak ? "\n\n" : "";
                    needsBreak = false;
                    updateLast((t) => ({ content: t.content + sep + event.text }));
                } else if (event.type === "tool") {
                    needsBreak = true;
                    updateLast((t) => ({ activity: [...t.activity, `${labels[event.name] || event.name}${event.detail ? ` ${event.detail}` : ""}`] }));
                } else if (event.type === "error") {
                    updateLast(() => ({ error: event.message }));
                } else if (event.type === "brief") {
                    updateLast(() => ({ brief: event.brief }));
                } else if (event.type === "done") {
                    updateLast(() => ({ files: event.files }));
                }
            });
        } catch (error) {
            if (error.name !== "AbortError") updateLast(() => ({ error: error.message }));
        } finally {
            setBusy(false);
        }
    };

    return { turns, busy, ask };
}

/** The project popup's chat: intro, suggestions, log and input */
export function ChatPanel({ endpoint, intro, suggestions, placeholder, inputLabel }) {
    const { turns, busy, ask } = useChat(endpoint);
    const [input, setInput] = useState("");
    const logRef = useRef(null);

    useEffect(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
    }, [turns]);

    const submit = (text) => {
        setInput("");
        ask(text);
    };

    return (
        <div className="chat" role="tabpanel">
            <p className="chat-intro">{intro}</p>

            {turns.length === 0 && (
                <div className="suggestions">
                    {suggestions.map((q) => (
                        <button key={q} type="button" onClick={() => submit(q)} disabled={busy}>
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {turns.length > 0 && (
                <div className="chat-log" ref={logRef} aria-live="polite">
                    {turns.map((turn, i) =>
                        turn.role === "user" ? (
                            <p key={i} className="bubble bubble-user">
                                {turn.content}
                            </p>
                        ) : (
                            <div key={i} className="bubble bubble-answer">
                                {turn.activity?.length > 0 && (
                                    <p className="activity">
                                        {busy && i === turns.length - 1 && !turn.files?.length
                                            ? turn.activity[turn.activity.length - 1]
                                            : `Read the code in ${turn.activity.length} steps`}
                                    </p>
                                )}
                                {turn.content ? (
                                    <AnswerText text={turn.content} />
                                ) : (
                                    !turn.error && <p className="thinking">Looking through the code...</p>
                                )}
                                {turn.error && <p className="chat-error">{turn.error}</p>}
                            </div>
                        )
                    )}
                </div>
            )}

            <form
                className="chat-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    submit(input);
                }}
            >
                <label htmlFor="chat-input" className="visually-hidden">
                    {inputLabel}
                </label>
                <input
                    id="chat-input"
                    type="text"
                    value={input}
                    maxLength={500}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                    disabled={busy}
                />
                <button type="submit" disabled={busy || !input.trim()}>
                    Ask
                </button>
            </form>
            <p className="chat-note">Answers can be wrong. Limited to a few questions per visitor each day.</p>
        </div>
    );
}

/** "Ask the code" tab: Claude reads this project's public repo on the server */
function ProjectChat({ project }) {
    return (
        <ChatPanel
            endpoint={`/api/projects/${project.id}/chat`}
            intro={`Questions are answered by Claude, which reads the public source of ${project.name} on GitHub and links the files it used.`}
            suggestions={project.questions}
            placeholder={`Ask about the ${project.name} source`}
            inputLabel={`Ask about ${project.name}`}
        />
    );
}

export default ProjectChat;
