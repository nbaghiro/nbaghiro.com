/**
 * Projects shown on the overworld. Only these repos can be read by the
 * project chat, so a request can never point the tools at another repo.
 */

export const PROJECTS = {
    galleo: { name: "Galleo", repo: "nbaghiro/galleo" },
    flowmaestro: { name: "FlowMaestro", repo: "nbaghiro/flowmaestro" },
    llamatrade: { name: "LlamaTrade", repo: "nbaghiro/llamatrade" },
    lumischool: { name: "Lumischool", repo: "nbaghiro/lumischool" },
    clientbridge: { name: "Clientbridge", repo: "nbaghiro/clientbridge" },
    sourcewell: { name: "Sourcewell", repo: "nbaghiro/sourcewell" },
    branchpad: { name: "BranchPad", repo: "nbaghiro/branchpad" },
};

export function getProject(id) {
    return Object.hasOwn(PROJECTS, id) ? PROJECTS[id] : null;
}
