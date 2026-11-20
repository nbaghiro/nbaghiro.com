import PlateArt from "./PlateArt";
import { coverFor, MOTIFS } from "./covers-table";
import { Rule, smooth } from "./ink";
import "./PlateCover.css";

/**
 * An article's cover: one of the nine botanical plates, a line carrying the shape of the piece,
 * and a few words set large enough to read in the index's 220px column.
 *
 * The line is a motif rather than a measurement. It says a dip recovered or a step came down and
 * claims no numbers, which is why no axis or scale is drawn next to it.
 *
 * Used live in the index and rendered to a file for the header and the link preview, so both
 * come from this one component rather than from a second drawing that has to be kept in step.
 */
export default function PlateCover({ post, w = 600, h = 400, words = true }) {
    const { plate, composition, motif, words: line } = coverFor(post);
    const series = MOTIFS[motif] ?? MOTIFS.settle;
    // the line sits in its own band above the words, so the two never cross
    const top = h * 0.3;
    const span = h * 0.32;
    const pts = series.map((v, i) => [
        w * 0.067 + (i / (series.length - 1)) * (w * 0.56),
        top + span - v * span,
    ]);
    const pad = w * 0.067;
    // the tint shifts a little per plate so the set has variety without leaving the paper range
    const tint = 38 + PLATE_TINT.indexOf(plate) * 3;
    return (
        <svg
            viewBox={`0 0 ${w} ${h}`}
            className="pl-cover"
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label={`${post.title}: a ${plate} plate over a ${motif} line`}
        >
            <rect width={w} height={h} fill={`hsl(${tint} 20% 93%)`} />
            <defs>
                <clipPath id={`pl-${post.slug}`}>
                    <rect width={w} height={h} />
                </clipPath>
            </defs>
            <PlateArt comp={composition} w={w} h={h} clipId={`pl-${post.slug}`} />
            <path className="pl-line" d={smooth(pts)} />
            {words && (
                <text
                    className="pl-words"
                    x={pad}
                    y={h - h * 0.19}
                    // a long phrase is set smaller rather than allowed to run under the plate
                    style={{ fontSize: (line.length > 27 ? 21 : line.length > 21 ? 24 : 27) * (w / 600) }}
                >
                    {line}
                </text>
            )}
            <line className="pl-hair" x1={pad} y1={h - h * 0.13} x2={w - pad} y2={h - h * 0.13} />
            <Rule w={w - pad * 2} y={h - h * 0.13} pitch={18 * (w / 600)} from={pad} className="pl-rule" />
        </svg>
    );
}

const PLATE_TINT = ["birch", "branch", "cattails", "cone", "cones", "fern", "firsprig", "seedhead", "seedling"];
