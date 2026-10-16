import "./PageArt.css";

/**
 * Botanical plates for the margins, photographed in the same fog as the hero and printed
 * the way a pressed specimen is: the background of each file is already transparent, so
 * only the subject lands on the paper and nothing is ever cut off at a straight edge. A
 * plate is sized to the room the margin actually has, and below the width where that room
 * runs out the stylesheet stops drawing it.
 */
const PLATES = {
    fern: { src: "/img/edge-fern.webp", wide: 230 },
    cones: { src: "/img/edge-cones.webp", wide: 200 },
    cattails: { src: "/img/edge-cattails.webp", wide: 180 },
    seedling: { src: "/img/edge-seedling.webp", wide: 170 },
    branch: { src: "/img/edge-branch.webp", wide: 250 },
};

function PageArt({ kind, side = "right", top = 0, flip }) {
    const plate = PLATES[kind];
    if (!plate) return null;
    return (
        <div
            className={`page-art ${side}${flip ? " flip" : ""}`}
            style={{ top: `${top}px`, "--plate-w": `${plate.wide}px` }}
            aria-hidden="true"
        >
            <img src={plate.src} alt="" loading="lazy" />
        </div>
    );
}

export default PageArt;
