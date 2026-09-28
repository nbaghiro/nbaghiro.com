import express from "express";
import { getProject } from "../../data/projects.js";
import { answerAgent, answerQuestion } from "../../services/chat/chatService.js";
import { checkLimits } from "../../services/chat/budget.js";

const router = express.Router();

const MAX_QUESTION_CHARS = 500;
const MAX_HISTORY_TURNS = 7; // odd, so the trimmed history still starts with a user turn

/**
 * Validate the conversation sent by the browser
 * Only plain-text turns are accepted; tool traffic stays on the server.
 */
function parseHistory(body) {
    let turns = Array.isArray(body?.messages) ? body.messages.slice(-MAX_HISTORY_TURNS) : [];
    if (turns.length % 2 === 0) turns = turns.slice(1);
    if (turns.length === 0) return null;
    for (const [i, turn] of turns.entries()) {
        const expected = (turns.length - i) % 2 === 1 ? "user" : "assistant";
        if (turn?.role !== expected || typeof turn.content !== "string" || !turn.content.trim()) return null;
        if (turn.role === "user" && turn.content.length > MAX_QUESTION_CHARS) return null;
    }
    return turns.map((t) => ({ role: t.role, content: t.content.slice(0, 8000) }));
}

/**
 * Shared handler: validate, check limits, then stream the answer as Server-Sent Events
 * @param {(history: Object[], emit: Function, signal: AbortSignal) => Promise<void>} answer
 */
async function streamAnswer(req, res, label, answer) {
    const history = parseHistory(req.body);
    if (!history) {
        return res.status(400).json({
            error: `Send messages alternating user and assistant, ending with a user question of at most ${MAX_QUESTION_CHARS} characters`,
        });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({ error: "The chat is not configured on this server" });
    }

    const limits = await checkLimits(req.ip);
    if (!limits.ok) {
        return res.status(429).json({ error: limits.reason });
    }

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
    });
    const emit = (event) => {
        // House style: no em-dashes in anything shown to visitors, whatever the model writes
        if (event.type === "text") event = { ...event, text: event.text.replace(/\s*\u2014\s*/g, ", ") };
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        res.flush?.();
    };

    const abort = new AbortController();
    res.on("close", () => abort.abort());

    try {
        await answer(history, emit, abort.signal);
    } catch (error) {
        if (!abort.signal.aborted) {
            console.error(`[Chat] Error answering (${label}):`, error);
            emit({ type: "error", message: "Something went wrong while answering. Please try again." });
            emit({ type: "done", files: [] });
        }
    }
    res.end();
}

// Ask a question about one project's source code
router.post("/projects/:id/chat", (req, res) => {
    const project = getProject(req.params.id);
    if (!project) {
        return res.status(404).json({ error: "Unknown project" });
    }
    return streamAnswer(req, res, project.repo, (history, emit, signal) => answerQuestion(project, history, emit, signal));
});

// Ask Naib's agent about his work (projects, history, résumé) or start a project with Careful Labs
router.post("/agent/chat", (req, res) => streamAnswer(req, res, "agent", answerAgent));

export default router;
