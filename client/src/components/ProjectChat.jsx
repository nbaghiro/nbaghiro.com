import { useEffect, useRef, useState } from "react";
import ChatThread from "./ChatThread";

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

/** "Ask the code" tab: Claude reads this project's public repo on the server */
function ProjectChat({ project }) {
    const { turns, busy, ask } = useChat(`/api/projects/${project.id}/chat`);
    return (
        <div role="tabpanel" className="project-chat">
            <ChatThread
                turns={turns}
                busy={busy}
                onSend={ask}
                greeting={`Ask me how ${project.name} is built. I read its public source on GitHub before answering, and link the files I used.`}
                suggestions={project.questions}
                placeholder={`Ask about the ${project.name} source`}
                note="Answers come from an AI and can be wrong. A few questions per visitor each day."
                variant="embedded"
            />
        </div>
    );
}

export default ProjectChat;
