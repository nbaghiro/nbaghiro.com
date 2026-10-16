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
        detail: "Newest, and where most of my time goes.",
    },
    {
        id: "galleo",
        name: "Galleo",
        url: "https://galleo.app",
        state: "Live",
        note: "Decks, documents and websites from one set of blocks, where one layout engine draws both the screen and the exported file.",
        detail: "Used mostly by people working alone who need a sales or marketing deck.",
    },
    {
        id: "lumischool",
        name: "Lumischool",
        url: "https://lumischool.ai",
        state: "Live",
        note: "Lessons for children aged 5 to 10 across nine subjects, drawn in one hand-drawn style, every question checked by a program before a child sees it.",
        detail: "The people using it are families.",
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
        detail: "Public as a waitlist; so far the only person using it is me.",
    },
];

/** Built earlier, still running, not the ones I write about. */
export const ALSO = [
    {
        name: "BranchPad",
        note: "a macOS workbench for running coding agents across stacked git worktrees",
    },
    {
        name: "Sourcewell",
        note: "a reader that turns long source material into something you can follow",
    },
];
