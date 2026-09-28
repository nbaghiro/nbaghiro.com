/**
 * Projects on the overworld. `x`/`y` place each island on a 1440x828 stage
 * (converted to percentages, so the scene scales with the window).
 * Text comes from each repo's README, docs and layout.
 */

export const STAGE = { width: 1440, height: 828 };

export const HOME = { x: 720, y: 398 };

export const PROJECTS = [
    {
        id: "galleo",
        name: "Galleo",
        x: 270,
        y: 158,
        color: "#FFD64A",
        variant: "spark",
        status: "live",
        liveUrl: "https://galleo.app",
        updated: "Sep 2026",
        summary: "AI content-creation tool where one block tree renders as a deck, a document or a website.",
        details:
            "A framework-free TypeScript layout engine computes geometry once, and DOM, 2D-canvas and PDF backends draw that same output for editing, presenting, thumbnails and export. A Hono backend runs a streamed LLM pipeline with a tool-calling chat agent and a metered credit gate.",
        highlights: [
            "Custom layout engine is the single source of geometry",
            "ESLint-enforced layer order: model, canvas, ui, editor, app",
            "DOM, 2D-canvas and PDF render backends share engine output",
            "Tool-calling chat agent with streamed generation and metered credits",
        ],
        stack: ["TypeScript", "SolidJS", "Vite", "Hono", "Postgres + Drizzle", "Vercel AI SDK"],
        structure: "model, canvas, ui, editor, services, app, website, publish",
        questions: [
            "How does export stay pixel-identical to the editor?",
            "How is the layer dependency order enforced?",
            "How does the chat agent edit a section?",
        ],
    },
    {
        id: "branchpad",
        name: "BranchPad",
        x: 720,
        y: 78,
        color: "#B9A7F5",
        variant: "base",
        status: "desktop app",
        liveUrl: null,
        updated: "Jul 2026",
        summary: "macOS desktop workbench for running terminals and coding agents across stacked git worktrees.",
        details:
            "An Electron shell sits over a headless supervisor that owns git, processes, SQLite and the keychain. A workspace is a stack of worktree layers, and committing low in the stack restacks the layers above, with conflicts freezing only their subtree.",
        highlights: [
            "Workspace modeled as a stack of git worktree layers",
            "One SupervisorApi contract with real and in-memory demo implementations",
            "Terminals via node-pty with a reaper for orphaned processes",
            "Checkpoints snapshot tracked and untracked files to shadow refs",
        ],
        stack: ["TypeScript", "Electron", "React", "node-pty", "node:sqlite", "Vitest + Playwright"],
        structure: "apps (desktop, devtools, mcp-server), packages (protocol, supervisor, harness, context, ui, theme, test-kit)",
        questions: [
            "How does restacking work across worktree layers?",
            "How does the app run as a browser demo?",
            "How are orphaned terminal processes prevented?",
        ],
    },
    {
        id: "flowmaestro",
        name: "FlowMaestro",
        x: 1170,
        y: 158,
        color: "#F7AA57",
        variant: "sound",
        status: "live",
        liveUrl: "https://flowmaestro.ai",
        updated: "Sep 2026",
        summary: "Platform for building AI workflows on a visual canvas and creating agents with tools and memory.",
        details:
            "A React Flow canvas defines multi-step workflows that run as durable Temporal workflows behind a Fastify API, with live updates over WebSockets and SSE. Agents use buffer, summary and vector memory with RAG over pgvector, and integrations are wrapped as MCP-compatible tools.",
        highlights: [
            "Temporal provides retries, timeouts and failure recovery for workflows",
            "20+ node types including LLM, HTTP, loop and conditional",
            "JavaScript and Python SDKs, a CLI and a Chrome extension",
            "Deployed to GKE with Pulumi infrastructure as code",
        ],
        stack: ["TypeScript", "React Flow", "Fastify", "Temporal", "PostgreSQL + pgvector", "Redis"],
        structure: "frontend, backend, shared, cli, sdks, extensions, marketing, documentation, infra",
        questions: [
            "How are workflows executed durably with Temporal?",
            "How does agent vector memory work?",
            "How are integrations exposed as MCP tools?",
        ],
    },
    {
        id: "lumischool",
        name: "Lumischool",
        x: 220,
        y: 468,
        color: "#F39CBF",
        variant: "lens",
        status: "live",
        liveUrl: "https://lumischool.ai",
        updated: "Sep 2026",
        summary: "Homeschool platform for children aged 5 to 10 and the adults who teach them.",
        details:
            "Lessons are written in a small text notation that compiles into a typed tree and is checked for every value a question can take before a child sees it. Drawings render in one hand-drawn style on squared paper, on screen and in print, from one shared parts catalogue.",
        highlights: [
            "Custom lesson notation with a registry-based type system",
            "Append-only event log; progress is derived, never stored",
            "Every family table has forced Postgres row-level security",
            "Import boundaries declared in one file and checked in the build",
        ],
        stack: ["TypeScript", "SolidJS", "Vite", "Node.js", "Postgres + Drizzle", "Rough.js"],
        structure: "apps (kids, home, site), engine, school, server, content, tools",
        questions: [
            "How is the lesson notation parsed and checked?",
            "How does answer sync work from a child's device?",
            "How is progress derived from events?",
        ],
    },
    {
        id: "llamatrade",
        name: "LlamaTrade",
        x: 1220,
        y: 468,
        color: "#8CC7EF",
        variant: "base",
        status: "live",
        liveUrl: "https://llamatrade.ai",
        updated: "Sep 2026",
        summary: "Algorithmic trading platform for building strategies, backtesting them and trading through Alpaca Markets.",
        details:
            "Nine Python services talk over gRPC and Connect, and one shared strategy runtime drives both backtests and live trading. Fills flow through Kafka into a portfolio service that keeps an event-sourced, double-entry ledger with per-strategy sleeves and lots.",
        highlights: [
            "S-expression strategy DSL with a parser and evaluator",
            "Shared runtime keeps backtest and live execution in parity",
            "Double-entry ledger is the book of record for positions",
            "Postgres row-level security enforces tenant isolation",
        ],
        stack: ["Python + FastAPI", "React + TypeScript", "gRPC / Connect", "PostgreSQL", "Kafka", "Kubernetes + Terraform"],
        structure: "apps (web, mobile, core), services (9 Python services), libs, infrastructure",
        questions: [
            "How does the strategy DSL get compiled?",
            "How do backtests and live trading share code?",
            "How does the ledger record a fill?",
        ],
    },
    {
        id: "clientbridge",
        name: "Clientbridge",
        x: 520,
        y: 618,
        color: "#93D5B3",
        variant: "cap",
        status: "in development",
        liveUrl: null,
        updated: "Jul 2026",
        summary: "Business operating system for solo and small service providers: booking, invoicing, payments, tax and CRM.",
        details:
            "Screens read from an on-device SQLite replica that PowerSync fills from the Postgres WAL, while writes stay server-authoritative through a FastAPI backend. Web and mobile apps share one view-model layer of hooks, and the client schema and API client are generated from the backend.",
        highlights: [
            "Local-first reads via PowerSync replicating the Postgres WAL",
            "Money writes run as atomic, audited, idempotent commands",
            "Web and Expo mobile share one view-model package",
            "Payments through Stripe Connect; 90% branch coverage gate in CI",
        ],
        stack: ["Python + FastAPI", "PostgreSQL", "PowerSync", "React + Vite", "Expo React Native", "Stripe Connect"],
        structure: "backend, frontend (apps/web, apps/mobile, packages), infra",
        questions: [
            "How does offline sync with PowerSync work?",
            "How are tenant queries scoped to a business?",
            "How do web and mobile share view-models?",
        ],
    },
    {
        id: "sourcewell",
        name: "Sourcewell",
        x: 920,
        y: 618,
        color: "#FF8F7A",
        variant: "orbit",
        status: "in development",
        liveUrl: null,
        updated: "Aug 2026",
        summary: "AI-agent platform for automated outbound outreach, starting with recruiting.",
        details:
            "A FastAPI modular monolith writes state, and a single worker polls due enrollments from Postgres with FOR UPDATE SKIP LOCKED to advance each outreach state machine. LLM agents and external providers sit behind interfaces, so the pipeline runs deterministically with fakes in tests.",
        highlights: [
            "Postgres is the job queue; no separate broker",
            "Agents for sourcing, ranking, outreach writing and chat",
            "Adapters for Apollo, Hunter, PDL, Unipile and Resend",
            "Shared targeting case table pinned by backend and frontend tests",
        ],
        stack: ["Python + FastAPI", "PostgreSQL + pgvector", "SQLAlchemy", "Claude", "React + Vite", "Tailwind CSS"],
        structure: "backend (api, services, agents, core, ext, worker), frontend, shared, infra",
        questions: [
            "How does the worker pick up due enrollments?",
            "How are LLM agents swapped for fakes in tests?",
            "How are people-data providers integrated?",
        ],
    },
];

export function repoUrl(project) {
    return `https://github.com/nbaghiro/${project.id}`;
}
