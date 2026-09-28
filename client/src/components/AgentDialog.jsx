import { useEffect, useRef } from "react";
import Mark from "./Mark";
import ChatThread from "./ChatThread";
import { useChat } from "./ProjectChat";
import "./AgentDialog.css";

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

/**
 * A minimal chat with Naib's agent: questions about his work, and project inquiries
 * for Careful Labs that end in a brief the visitor can email.
 * Native <dialog>, so focus is trapped, Escape closes it and focus returns.
 */
function AgentDialog({ onClose, persona = NAIB_AGENT }) {
    const ref = useRef(null);
    const { turns, busy, ask } = useChat(persona.endpoint, persona.labels);

    useEffect(() => {
        const dialog = ref.current;
        dialog.showModal();
        // showModal focuses the first button (close); start in the message box instead
        dialog.querySelector(".chat-thread-form input")?.focus();
        return () => dialog.close();
    }, []);

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
                <ChatThread
                    turns={turns}
                    busy={busy}
                    onSend={ask}
                    greeting={persona.greeting}
                    suggestions={persona.suggestions}
                    placeholder={persona.placeholder}
                    note="Answers come from an AI and can be wrong."
                    variant="dialog"
                />
            </div>
        </dialog>
    );
}

export default AgentDialog;
