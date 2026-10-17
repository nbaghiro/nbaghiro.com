import "./PageArt.css";

/**
 * Botanical plates for the margins, photographed in the same fog as the hero and printed
 * the way a pressed specimen is: the background of each file is already transparent, so
 * only the subject lands on the paper and nothing is ever cut off at a straight edge.
 *
 * Which plates a page gets is drawn from its own key, so a page keeps the same margin
 * across reloads while no two pages share an arrangement, and a plate is never used twice
 * on one page. A plate that hangs from a branch reads best near the top of a column, so
 * those take the first band.
 */
const PLATES = [
    { src: "/img/edge-fern.webp", wide: 230 },
    { src: "/img/edge-cones.webp", wide: 200, hang: true },
    { src: "/img/edge-cattails.webp", wide: 180 },
    { src: "/img/edge-seedling.webp", wide: 170 },
    { src: "/img/edge-branch.webp", wide: 250, hang: true },
    { src: "/img/edge-cone.webp", wide: 150 },
    { src: "/img/edge-birch.webp", wide: 230, hang: true },
    { src: "/img/edge-seedhead.webp", wide: 160 },
    { src: "/img/edge-firsprig.webp", wide: 190 },
];

// FNV-1a, so the same key always draws the same margin
function hash(key) {
    let h = 0x811c9dc5;
    for (let i = 0; i < key.length; i += 1) {
        h ^= key.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h;
}

function chosen(key, count) {
    let h = hash(key);
    // The low bits of an LCG with a power-of-two modulus have a period of two, so the raw
    // value is mixed before it is used. Taking `% 2` off the bare state made every plate on
    // a page land on the same side.
    const next = () => {
        h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
        return (h ^ (h >>> 16)) >>> 0;
    };
    const pool = PLATES.map((p, i) => ({ ...p, i }));
    const out = [];
    // Sides alternate down the page rather than being drawn each time, so a column is never
    // all on one side however the draw falls; which side it opens on is the page's own.
    const opens = next() % 2 ? "right" : "left";
    for (let slot = 0; slot < count && pool.length; slot += 1) {
        // the first plate in a column hangs from above where one is available
        const wants = slot === 0;
        const from = pool.filter((p) => !!p.hang === wants);
        const list = from.length ? from : pool;
        const pick = list[next() % list.length];
        pool.splice(pool.indexOf(pick), 1);
        out.push({
            ...pick,
            side: slot % 2 === 0 ? opens : opens === "left" ? "right" : "left",
            top: 170 + slot * 760 + (next() % 220),
        });
    }
    return out;
}

function PageArt({ seed, count = 3 }) {
    if (!seed) return null;
    return (
        <>
            {chosen(seed, count).map((plate) => (
                <div
                    key={plate.src}
                    // a specimen leans into the column from whichever margin it stands in
                    className={`page-art ${plate.side}${plate.side === "right" ? " flip" : ""}`}
                    style={{
                        top: `${plate.top}px`,
                        "--plate-w": `${plate.wide}px`,
                    }}
                    aria-hidden="true"
                >
                    <img src={plate.src} alt="" loading="lazy" />
                </div>
            ))}
        </>
    );
}

export default PageArt;
