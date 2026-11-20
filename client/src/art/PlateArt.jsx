import { BY_ID } from "./plates";

/**
 * One composition drawn into a frame. Everything is expressed against the frame's own box, so
 * the same composition works at a 220px card and across a 2000px header without a second set of
 * numbers.
 *
 * The plates are 520 by 780 (the branch is 520 by 483), drawn on transparency, so they can be
 * placed over any ground. A `detail` composition scales the plate past the frame and lets the
 * clip do the cropping, which is how one drawing gives several different pictures.
 */
export default function PlateArt({ comp, w, h, clipId }) {
    const c = typeof comp === "string" ? BY_ID[comp] : comp;
    if (!c) return null;
    const tall = c.plate !== "branch";
    const ratio = tall ? 520 / 780 : 520 / 483;
    const height = h * c.size * (c.detail || 1);
    const width = height * ratio;

    // A detail is the plate scaled past the frame, so it has to be pinned by its left edge in the
    // right half: computed from the right the way the whole plates are, it would grow across the
    // words in the bottom left.
    const pos = c.detail
        ? [w * 0.44, -height * 0.1]
        : {
        tr: [w - width + width * 0.08, -height * 0.06],
        tl: [-width * 0.08, -height * 0.06],
        br: [w - width + width * 0.08, h - height * 0.94],
        bl: [-width * 0.08, h - height * 0.94],
      }[c.corner] ?? [w - width, 0];

    const cx = pos[0] + width / 2;
    const cy = pos[1] + height / 2;
    const transform = [
        c.turn ? `rotate(${c.turn} ${cx} ${cy})` : "",
        c.flip ? `translate(${2 * cx} 0) scale(-1 1)` : "",
    ]
        .filter(Boolean)
        .join(" ");

    const img = (extra = {}) => (
        <image
            href={`/img/edge-${c.plate}.webp`}
            x={pos[0]}
            y={pos[1]}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid meet"
            {...extra}
        />
    );

    return (
        <g transform={transform} clipPath={clipId ? `url(#${clipId})` : undefined}>
            {c.ghost && (
                <g opacity="0.3" transform={`translate(${-width * 0.22} ${height * 0.06}) rotate(-7 ${cx} ${cy})`}>
                    {img()}
                </g>
            )}
            {img()}
        </g>
    );
}
