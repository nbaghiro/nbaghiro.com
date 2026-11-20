/**
 * The plate vocabulary.
 *
 * There are nine botanical drawings in the site's own art, and no more are going to appear by
 * writing code, so the variation comes from composition rather than from new specimens: which
 * corner a plate hangs from, whether it is mirrored, how far it is turned, how much of the frame
 * it takes, whether a second pale copy sits behind it, and whether it is shown whole or as a
 * detail. That gives a set large enough that no two pieces in the index need look alike while
 * every drawing on the page is still a real illustration.
 *
 * A composition is data, so a cover, a header and this catalogue all draw the same thing.
 */

export const PLATES = [
    { id: "birch", name: "Birch", shape: "leaning", note: "a branch with four leaves, entering from the corner" },
    { id: "branch", name: "Bare branch", shape: "wide", note: "the widest plate, 520 by 483 rather than 520 by 780" },
    { id: "cattails", name: "Cattails", shape: "upright", note: "three stems at different heights" },
    { id: "cone", name: "Cone", shape: "upright", note: "one cone on its stem" },
    { id: "cones", name: "Two cones", shape: "leaning", note: "a pair hanging from one sprig" },
    { id: "fern", name: "Fern", shape: "leaning", note: "one frond, leaning down and left" },
    { id: "firsprig", name: "Fir sprig", shape: "upright", note: "a short needled sprig" },
    { id: "seedhead", name: "Teasel", shape: "upright", note: "a seed head on a long stem" },
    { id: "seedling", name: "Seedling", shape: "upright", note: "a young shoot" },
];

export const PLATE_IDS = PLATES.map((p) => p.id);

/**
 * One composition. `corner` is where the plate hangs from, `size` is its height as a fraction of
 * the frame, `turn` is degrees, `flip` mirrors it, `ghost` puts a pale second copy behind, and
 * `detail` draws it oversized so only part of it is in frame.
 *
 * The bottom left corner is never used: the words and the line live there.
 */
const C = (id, plate, opts = {}) => ({
    id,
    plate,
    corner: "tr",
    size: 0.82,
    turn: 0,
    flip: false,
    ghost: false,
    detail: 0,
    ...opts,
});

export const COMPOSITIONS = [
    // birch, which leans down and to the left
    C("birch-fall", "birch", { size: 0.78 }),
    C("birch-fall-wide", "birch", { size: 1.02, turn: -8 }),
    C("birch-mirror", "birch", { corner: "tl", flip: true, size: 0.66 }),
    C("birch-low", "birch", { corner: "br", size: 0.62, turn: 6 }),
    C("birch-detail", "birch", { detail: 1.8, size: 0.9 }),
    C("birch-ghost", "birch", { size: 0.76, ghost: true }),

    // the bare branch, the wide plate
    C("branch-reach", "branch", { size: 0.58 }),
    C("branch-mirror", "branch", { corner: "tl", flip: true, size: 0.54 }),
    C("branch-turn", "branch", { size: 0.62, turn: -14 }),
    C("branch-low", "branch", { corner: "br", size: 0.5, flip: true }),
    C("branch-ghost", "branch", { size: 0.6, ghost: true, turn: 5 }),

    // cattails, upright, happy to run to the rule
    C("cattails-stand", "cattails", { size: 0.92 }),
    C("cattails-mirror", "cattails", { flip: true, size: 0.88 }),
    C("cattails-pair", "cattails", { corner: "tl", size: 0.6, flip: true }),
    C("cattails-lean", "cattails", { size: 0.86, turn: 9 }),
    C("cattails-detail", "cattails", { detail: 1.7, size: 0.95 }),

    // one cone
    C("cone-stand", "cone", { size: 0.86 }),
    C("cone-turn", "cone", { size: 0.8, turn: -11 }),
    C("cone-small", "cone", { corner: "tl", size: 0.5 }),
    C("cone-low", "cone", { corner: "br", size: 0.68, flip: true }),
    C("cone-detail", "cone", { detail: 1.7, size: 0.9 }),

    // the pair of cones
    C("cones-hang", "cones", { size: 0.84 }),
    C("cones-mirror", "cones", { flip: true, size: 0.8 }),
    C("cones-turn", "cones", { size: 0.78, turn: 12 }),
    C("cones-ghost", "cones", { size: 0.82, ghost: true }),
    C("cones-detail", "cones", { detail: 1.7, size: 0.92 }),

    // the fern
    C("fern-fall", "fern", { size: 0.74 }),
    C("fern-mirror", "fern", { flip: true, size: 0.74 }),
    C("fern-upright", "fern", { size: 0.86, turn: -22 }),
    C("fern-corner", "fern", { corner: "tl", flip: true, size: 0.58 }),
    C("fern-low", "fern", { corner: "br", size: 0.6, turn: 10 }),
    C("fern-detail", "fern", { detail: 1.8, size: 0.9 }),

    // the fir sprig
    C("firsprig-stand", "firsprig", { size: 0.76 }),
    C("firsprig-turn", "firsprig", { size: 0.72, turn: 14 }),
    C("firsprig-small", "firsprig", { corner: "tl", size: 0.46 }),
    C("firsprig-ghost", "firsprig", { size: 0.78, ghost: true, flip: true }),
    C("firsprig-detail", "firsprig", { detail: 1.8, size: 0.88 }),

    // the teasel
    C("seedhead-stand", "seedhead", { size: 0.94 }),
    C("seedhead-turn", "seedhead", { size: 0.88, turn: -9 }),
    C("seedhead-mirror", "seedhead", { flip: true, size: 0.9 }),
    C("seedhead-small", "seedhead", { corner: "tl", size: 0.52 }),
    C("seedhead-detail", "seedhead", { detail: 1.7, size: 0.92 }),

    // the seedling
    C("seedling-stand", "seedling", { size: 0.8 }),
    C("seedling-mirror", "seedling", { flip: true, size: 0.76 }),
    C("seedling-turn", "seedling", { size: 0.74, turn: 12 }),
    C("seedling-low", "seedling", { corner: "br", size: 0.64 }),
    C("seedling-detail", "seedling", { detail: 1.8, size: 0.9 }),
];

export const BY_ID = Object.fromEntries(COMPOSITIONS.map((c) => [c.id, c]));

export const compositionsFor = (plate) => COMPOSITIONS.filter((c) => c.plate === plate);

/** A stable pick for anything that has not been paired by hand yet. */
export function compositionFromSlug(slug) {
    let h = 0;
    for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) % 99991;
    return COMPOSITIONS[h % COMPOSITIONS.length];
}
