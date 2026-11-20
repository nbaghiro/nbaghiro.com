import { BY_ID, compositionFromSlug, compositionsFor } from "./plates";

/**
 * One cover per article: which plate it gets, the shape of its line, and the few words set on
 * it. The plate is assigned by subject rather than by seed, which is the whole of the design:
 * the fern goes to the pieces about threads and fronds, the teasel to the ones that count, the
 * birch to the ones that recover.
 *
 * The line is a motif, not a measurement. It carries the shape of the story (a dip and a
 * recovery, a step down, a cycle that repeats) and nothing is claimed by it. Where a piece has
 * real numbers worth drawing, swap its motif for the series and say so on the page.
 */

export const MOTIFS = {
    // a dip that recovers past where it started
    recover: [0.52, 0.44, 0.3, 0.2, 0.26, 0.4, 0.36, 0.5, 0.64, 0.58, 0.76, 0.9],
    // a steady climb
    rise: [0.14, 0.2, 0.26, 0.3, 0.4, 0.44, 0.54, 0.6, 0.68, 0.76, 0.84, 0.92],
    // plateaus, each lower than the last
    step: [0.88, 0.88, 0.88, 0.6, 0.6, 0.6, 0.34, 0.34, 0.34, 0.14, 0.14, 0.14],
    // plateaus, each higher than the last
    stepUp: [0.14, 0.14, 0.14, 0.38, 0.38, 0.38, 0.62, 0.62, 0.62, 0.88, 0.88, 0.88],
    // the same thing happening again and again
    cycle: [0.2, 0.78, 0.26, 0.74, 0.22, 0.8, 0.24, 0.76, 0.2, 0.78, 0.26, 0.74],
    // flat, one event, flat again
    spike: [0.26, 0.26, 0.26, 0.26, 0.9, 0.9, 0.3, 0.26, 0.26, 0.26, 0.26, 0.26],
    // noise that settles onto a line
    settle: [0.2, 0.84, 0.3, 0.74, 0.38, 0.66, 0.44, 0.58, 0.48, 0.52, 0.5, 0.5],
    // steady, with one gap in it
    hold: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
};


/**
 * Where each plate sits. One box cannot serve all nine: the fern and the birch lean down and to
 * the left, so a box that suits an upright teasel puts their tips through the words. Each is
 * anchored to the top right of its own box and sized to clear the band the line and the words
 * use, which starts at about y 300 of 400.
 *
 * [x, y, width, height] in the 600 by 400 cover.
 */
export const PLACEMENT = {
    birch: [330, -38, 270, 300],
    branch: [350, -28, 250, 240],
    cattails: [400, -18, 190, 350],
    cone: [398, -28, 192, 330],
    cones: [380, -36, 210, 336],
    fern: [360, -22, 230, 296],
    firsprig: [370, -22, 220, 300],
    seedhead: [400, -18, 190, 350],
    seedling: [388, -22, 202, 330],
};

// slug: [plate, motif, the words on the cover]
export const COVERS = {
    "a-comment-that-moves": ["fern", "step", "the anchor degrades"],
    "a-language-for-portfolio-allocations": ["branch", "stepUp", "a tree of allocations"],
    "an-order-submitted-once": ["cones", "spike", "the same id, once"],
    "before-the-first-order": ["firsprig", "rise", "enough history first"],
    "calendar-membership-and-incremental-sync": ["fern", "cycle", "membership, then changes"],
    "cancelling-an-ai-task": ["cattails", "spike", "stop, and account for it"],
    "checking-a-model-change": ["firsprig", "settle", "fixed tasks, repeated runs"],
    "checking-an-agents-results": ["firsprig", "settle", "check the records"],
    "checking-ledger-balances-after-a-fill": ["seedhead", "settle", "balanced, then checked"],
    "checking-pdf-reading-order": ["branch", "step", "seen and read differ"],
    "choosing-an-export-for-the-next-person": ["seedling", "stepUp", "for the next person"],
    "code-execution-in-containers": ["cone", "spike", "a container per run"],
    "deciding-what-runs-next": ["branch", "stepUp", "what the trigger reaches"],
    "deploying-with-background-jobs-running": ["cattails", "settle", "old workers, new payloads"],
    "every-version-checked": ["seedhead", "cycle", "every variant proved"],
    "fetching-user-provided-urls": ["cattails", "spike", "a URL you do not control"],
    "invoice-arithmetic-down-to-the-cent": ["seedhead", "settle", "down to the cent"],
    "learning-after-ai-help": ["seedling", "step", "after the help is removed"],
    "maintaining-a-design-refresh": ["fern", "stepUp", "one set of tokens"],
    "making-stripe-subscriptions-repeatable": ["cones", "cycle", "the catalogue, rebuilt"],
    "map-on-one-canvas": ["cone", "rise", "one canvas, less memory"],
    "measuring-a-notation-against-json": ["branch", "step", "four per cent of a module"],
    "mux-videojs-and-the-cost-of-video": ["cattails", "rise", "what video costs"],
    "one-account-many-strategies": ["cones", "cycle", "one account, many sleeves"],
    "one-engine-every-game": ["cone", "cycle", "one renderer, every game"],
    "one-integration-two-callers": ["cones", "cycle", "one integration, two callers"],
    "one-layout-engine": ["cone", "rise", "one solver, three formats"],
    "one-screen-writes-offline": ["cattails", "step", "reads local, writes server"],
    "ordering-collaborative-edits": ["cattails", "cycle", "in order, eventually"],
    "permissions-before-cached-exports": ["firsprig", "hold", "check before serving"],
    "preserving-a-strategy-through-the-editor": ["branch", "step", "the same tree, both ways"],
    "recovering-ai-credit-reservations": ["seedhead", "spike", "reserve, then settle"],
    "recurring-appointments-and-clock-changes": ["firsprig", "cycle", "the local hour wins"],
    "remembering-after-practice": ["seedling", "step", "a week later"],
    "resuming-an-ai-response": ["cattails", "recover", "resume from the last id"],
    "running-clientbridge-on-stripe-connect": ["cones", "rise", "one platform, many accounts"],
    "search-results-and-changing-permissions": ["fern", "step", "results follow access"],
    "serving-pages-on-customer-domains": ["branch", "stepUp", "their domain, our pages"],
    "sharing-datasets-between-backtests": ["birch", "recover", "one snapshot, two runs"],
    "stock-movements-and-repeated-events": ["seedhead", "spike", "repeated, counted once"],
    "tenant-isolation-in-postgresql": ["fern", "hold", "the boundary holds"],
    "terraform-and-pulumi": ["branch", "hold", "two tools, three projects"],
    "the-cost-of-switching": ["seedling", "rise", "the cost of moving"],
    "the-search-behind-a-backtest": ["seedhead", "cycle", "count the attempts"],
    "undoing-a-change-across-services": ["cattails", "settle", "rollback is not enough"],
    "what-a-backtest-predicts": ["birch", "recover", "the decision transfers"],
    "what-a-refund-costs": ["seedhead", "step", "the fee does not return"],
    "what-account-deletion-needs-to-cover": ["seedling", "step", "what deletion must reach"],
    "what-an-agent-can-change": ["firsprig", "step", "read, draft, send"],
    "when-a-payment-times-out": ["cattails", "spike", "confirm before retrying"],
    "when-a-slot-is-free": ["fern", "cycle", "four checks, in order"],
    "when-shared-code-becomes-a-tool": ["cone", "stepUp", "when to extract it"],
    "when-software-factories-help": ["cone", "rise", "when the work repeats"],
    "why-i-stopped-pursuing-a-software-factory": ["seedling", "step", "why I stopped"],
};

// The plate carries the meaning and is chosen by hand above. Which composition of that plate a
// piece gets is taken from its slug, so two articles sharing a plate do not share a picture and
// nobody has to hand-write fifty compositions. Pass a composition id as a fourth entry to pin one.
export function coverFor(post) {
    const row = COVERS[post.slug];
    const plate = row ? row[0] : null;
    if (plate) {
        const options = compositionsFor(plate);
        let h = 0;
        for (const ch of post.slug) h = (h * 31 + ch.charCodeAt(0)) % 99991;
        const comp = row[3] ? BY_ID[row[3]] : options[h % options.length];
        return { plate, composition: comp.id, motif: row[1], words: row[2], paired: true };
    }
    const comp = compositionFromSlug(post.slug);
    return {
        plate: comp.plate,
        composition: comp.id,
        motif: "settle",
        words: (post.about || "Engineering").toLowerCase(),
        paired: false,
    };
}
