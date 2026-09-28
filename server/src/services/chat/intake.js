/**
 * Project intake for Careful Labs, handled by the site agent
 * When a visitor wants something built, the agent gathers a few details and
 * calls submit_brief; the visitor emails the brief to Careful Labs from their
 * own email app. Nothing is stored or sent by the server.
 */

// What Careful Labs offers, from the Careful Labs site copy
const SERVICES = [
    "Web applications",
    "Mobile applications (iOS and Android from one codebase)",
    "New product builds, idea to production",
    "AI product engineering: agents, tool use, retrieval, verification",
    "Payments and money movement",
    "Offline and local-first apps",
    "Design systems across web and native",
    "Platform and infrastructure",
];

const ENGAGEMENTS = [
    "Build the product: Careful Labs owns delivery, design and engineering on one team.",
    "Join your team: senior engineers inside the client's repository, process and standups.",
    "Discovery sprint: four to six weeks that end in running software, not a slide deck.",
    "Rescue: restore tests and boundaries in a codebase that has stopped being safe to change.",
];

export const INTAKE_TOOLS = [
    {
        name: "submit_brief",
        description:
            "Show the visitor a finished project brief they can email to Careful Labs. Call it once you know what they want built, where it stands and roughly when they need it. Keep every field short and in the visitor's own terms.",
        eager_input_streaming: true,
        input_schema: {
            type: "object",
            properties: {
                title: { type: "string", description: "A short name for the project, under 8 words." },
                what: { type: "string", description: "What they want built and for whom, one or two sentences." },
                stage: { type: "string", description: "Where it stands today: idea, prototype, live product, existing codebase with problems, and so on." },
                timeline: { type: "string", description: "When they need it, as they said it." },
                fit: { type: "string", description: "Which way of working fits best: Build the product, Join your team, Discovery sprint or Rescue." },
                notes: { type: "string", description: "Anything else useful: budget if they mentioned it, stack, constraints. Empty if nothing." },
            },
            required: ["title", "what", "stage", "timeline", "fit"],
        },
    },
];

const LIMITS = { title: 80, what: 600, stage: 300, timeline: 200, fit: 60, notes: 600 };

/** Validate a submitted brief; returns the cleaned brief or null */
export function cleanBrief(input) {
    if (!input || typeof input !== "object") return null;
    const brief = {};
    for (const [key, max] of Object.entries(LIMITS)) {
        const value = input[key];
        if (value === undefined && key === "notes") continue;
        if (typeof value !== "string" || (!value.trim() && key !== "notes")) return null;
        brief[key] = value.trim().slice(0, max);
    }
    return brief;
}

/** Instructions for taking a project inquiry, included in the site agent's prompt */
export function intakeGuidance() {
    return `## When someone wants to hire Naib or get something built

Naib co-founded Careful Labs, a software studio in Vancouver, and client work goes through it. When a visitor wants to hire Naib, work with him, or get something built, switch to taking their project inquiry for Careful Labs.

You need four things: what they want built and for whom, where it stands today, roughly when they need it, and which way of working fits. Ask for one missing thing at a time, in a sentence or two, and do not ask again for anything they already told you. Once you have them, or after three or four exchanges, call submit_brief. It shows them a brief with a button to email it to Careful Labs from their own email app.

Never quote prices, rates, estimates or delivery dates, and never promise the work will be taken; say the team will reply after reading the brief. If they want something Careful Labs does not do, say so kindly. Do not ask for their email or phone number.

What Careful Labs does:
${SERVICES.map((s) => `- ${s}`).join("\n")}

Ways of working:
${ENGAGEMENTS.map((e) => `- ${e}`).join("\n")}`;
}
