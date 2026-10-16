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
        state: "Waitlist",
        note: "Booking, invoicing, card payments and provincial sales tax for Canadian service businesses.",
        detail: "For independent providers and small teams.",
    },
    {
        id: "galleo",
        name: "Galleo",
        url: "https://galleo.app",
        state: "Live",
        note: "Create decks, documents and websites using a shared set of content blocks.",
        detail: "A shared layout engine supports the editor and exports.",
    },
    {
        id: "lumischool",
        name: "Lumischool",
        url: "https://lumischool.ai",
        state: "Live",
        note: "Illustrated lessons for children aged 5 to 12, with an interactive map to explore.",
        detail: "Built for families learning at home.",
    },
    {
        id: "flowmaestro",
        name: "FlowMaestro",
        url: "https://flowmaestro.ai",
        state: "Demo available",
        note: "Build and run AI workflows and agents with shared integrations, tools and memory.",
        detail: "A visual workflow builder with agent tools and integrations.",
    },
    {
        id: "llamatrade",
        name: "LlamaTrade",
        url: "https://llamatrade.ai",
        state: "Personal use",
        note: "Define trading strategies, backtest them on historical data and run them through a broker.",
        detail: "Built for my own trading research and use.",
    },
];

/** Built earlier and still running, kept off the public posts but not hidden. */
export const ALSO = [
    {
        id: "branchpad",
        name: "BranchPad",
        state: "Desktop app",
        note: "A macOS app for managing terminals, coding agents and stacked Git worktrees.",
        detail: "A tool I use in my own development workflow.",
    },
    {
        id: "sourcewell",
        name: "Sourcewell",
        state: "In development",
        note: "An agent platform for recruiting outreach, with contact records, message sequences and reply tracking.",
        detail: "Starting with recruiting workflows.",
    },
];
