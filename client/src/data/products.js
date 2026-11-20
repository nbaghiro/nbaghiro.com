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
        state: "Live",
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
        id: "tondo",
        name: "Tondo",
        url: "https://tondo.page",
        state: "Live",
        note: "One address for a page of links, photos, a shop or a menu, in a look you choose.",
        detail: "Free to build, from $5 a month to put it online.",
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
    {
        id: "lingercam",
        name: "LingerCam",
        url: "https://lingercam.app",
        state: "Live",
        note: "A shared camera for events: guests join from a QR code and nothing is visible until the reveal.",
        detail: "The iPhone and Android app is not on the stores yet.",
    },
    {
        id: "oncesaid",
        name: "Oncesaid",
        url: "https://oncesaid.app",
        state: "Live",
        note: "A voice journal you can ask: record a moment, then hear it back in your own voice.",
        detail: "Recording, transcription and search run on the phone.",
    },
    {
        id: "readaloud",
        name: "ReadAloud",
        url: "https://readaloud.live",
        state: "Live",
        note: "An iPhone app that reads arXiv papers aloud, with the text kept in sync as it speaks.",
        detail: "ReadAloud is a working name, and readaloud.live is still a holding page.",
    },
];

/** No link to open yet: a desktop app and a waitlist. */
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
        state: "Waitlist",
        note: "An agent platform for recruiting outreach, with contact records, message sequences and reply tracking.",
        detail: "Starting with recruiting workflows.",
    },
];
