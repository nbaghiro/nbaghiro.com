import "./PageArt.css";

/**
 * Photographs for the margins, from the same fog the hero and the footer come from: a
 * branch close to the lens, reeds standing out of still water, a far shore and its
 * reflection. They stand in the air beside a page, never over its measure, and below the
 * width where the margin closes up the stylesheet stops drawing them.
 */
const PLATES = {
    branch: { src: "/img/edge-branch.webp", tall: 620, pos: "55% 18%" },
    reeds: { src: "/img/edge-reeds.webp", tall: 560, pos: "32% 62%" },
    shore: { src: "/img/edge-shore.webp", tall: 460, pos: "50% 48%" },
};

function PageArt({ kind, side = "right", top = 0, flip }) {
    const plate = PLATES[kind];
    if (!plate) return null;
    return (
        <div
            className={`page-art ${side}${flip ? " flip" : ""}`}
            style={{
                top: `${top}px`,
                "--plate-h": `${plate.tall}px`,
                "--plate-pos": plate.pos,
            }}
            aria-hidden="true"
        >
            <img src={plate.src} alt="" loading="lazy" />
        </div>
    );
}

export default PageArt;
