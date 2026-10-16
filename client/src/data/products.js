/**
 * The products, in the order they are talked about publicly. `state` is the honest one-word
 * status; `note` is what the product does, in one sentence, matching how it is described on
 * LinkedIn so the two never drift.
 */
export const PRODUCTS = [
    {
        id: "clientbridge",
        name: "Clientbridge",
        url: "https://clientbridge.ca",
        state: "On a waitlist",
        note: "Booking, invoicing, card payments and sales tax by province, in one app, for service businesses from one person to a small team.",
        detail: "The one with the most moving parts: money, scheduling and tax.",
    },
    {
        id: "galleo",
        name: "Galleo",
        url: "https://galleo.app",
        state: "Live",
        note: "Decks, documents and websites from one set of blocks, where one layout engine draws both the screen and the exported file.",
        detail: "Used mostly by people working alone who need a deck.",
    },
    {
        id: "lumischool",
        name: "Lumischool",
        url: "https://lumischool.ai",
        state: "Live",
        note: "Lessons for children aged 5 to 10 across nine subjects, drawn in one hand-drawn style, every question checked by a program before a child sees it.",
        detail: "Made for families teaching at home.",
    },
    {
        id: "flowmaestro",
        name: "FlowMaestro",
        url: "https://flowmaestro.ai",
        state: "By demo call",
        note: "A place to build and run AI agents and the workflows around them: the runtime, the memory, the tool system and the orchestration between them.",
        detail: "The first one I built, and the hardest to run.",
    },
    {
        id: "llamatrade",
        name: "LlamaTrade",
        url: "https://llamatrade.ai",
        state: "One user",
        note: "Write a trading strategy in a small language, test it over years of data, and trade it through a broker on the same code.",
        detail: "Built for one user, me.",
    },
];

/** Built earlier and still running, kept off the public posts but not hidden. */
export const ALSO = [
    {
        id: "branchpad",
        name: "BranchPad",
        state: "Desktop app",
        note: "A macOS workbench for running terminals and coding agents across a stack of git worktrees, where committing low in the stack restacks the layers above it.",
        detail: "Built for my own work, and still what I use.",
    },
    {
        id: "sourcewell",
        name: "Sourcewell",
        state: "In development",
        note: "An agent platform for outbound work, starting with recruiting: the sequence, the replies and the record of who was contacted.",
        detail: "The one furthest from finished.",
    },
];
