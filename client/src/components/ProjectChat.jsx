import { useSyncExternalStore } from "react";
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

// Conversations live in memory for the life of the page, one per endpoint, so closing
// a chat and coming back later picks up where it left off. A reload or a new tab starts
// fresh; nothing is stored in the browser or on the server.
const sessions = new Map(); // endpoint -> { state: { turns, busy }, listeners }

function sessionFor(endpoint) {
    if (!sessions.has(endpoint)) sessions.set(endpoint, { state: { turns: [], busy: false }, listeners: new Set() });
    return sessions.get(endpoint);
}

function setSession(session, patch) {
    session.state = { ...session.state, ...patch(session.state) };
    session.listeners.forEach((listener) => listener());
}

/** True when this endpoint already has a conversation in this page */
export function hasChat(endpoint) {
    return (sessions.get(endpoint)?.state.turns.length ?? 0) > 0;
}

/**
 * Chat state and streaming for a server-side agent, kept per endpoint (see above).
 * An answer keeps streaming if the chat is closed while it is being written.
 * `labels` turns tool events into the short status line shown while it works.
 */
export function useChat(endpoint, labels = TOOL_LABELS) {
    const session = sessionFor(endpoint);
    const { turns, busy } = useSyncExternalStore(
        (listener) => {
            session.listeners.add(listener);
            return () => session.listeners.delete(listener);
        },
        () => session.state,
    );

    const updateLast = (patch) =>
        setSession(session, ({ turns }) => {
            const last = turns[turns.length - 1];
            return { turns: [...turns.slice(0, -1), { ...last, ...patch(last) }] };
        });

    const ask = async (question) => {
        const text = question.trim();
        if (!text || session.state.busy) return;

        // Only answered question/answer pairs go back to the server
        const history = [];
        const previous = session.state.turns;
        for (let i = 0; i + 1 < previous.length; i += 2) {
            const [q, a] = [previous[i], previous[i + 1]];
            if (a.content && !a.error) history.push({ role: "user", content: q.content }, { role: "assistant", content: a.content });
        }
        history.push({ role: "user", content: text });
        setSession(session, ({ turns }) => ({
            busy: true,
            turns: [...turns, { role: "user", content: text }, { role: "assistant", content: "", activity: [], files: [] }],
        }));

        let needsBreak = false;

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history }),
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
            updateLast(() => ({ error: error.message }));
        } finally {
            setSession(session, () => ({ busy: false }));
        }
    };

    return { turns, busy, ask };
}

export const chatEndpoint = (project) => `/api/projects/${project.id}/chat`;

/** "Ask the code" tab: Claude reads this project's public repo on the server */
function ProjectChat({ project }) {
    const { turns, busy, ask } = useChat(chatEndpoint(project));
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
