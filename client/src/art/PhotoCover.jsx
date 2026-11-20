import credits from "../data/photo-credits.json";
import { COVER_WORDS } from "./cover-words";

/**
 * An article's cover: one photograph, full bleed, with a short line over it.
 *
 * The line is not the title. The title sits beside the card in the index and above the
 * photograph on the article, so repeating it would be the same words twice; this says what the
 * piece turns on instead.
 *
 * Both crops are drawn by this one component, and the type is sized for the size each is
 * *shown* at rather than the size it is rendered at. The card is rendered 1200 wide and shown
 * 220 wide in the index, a five and a half times reduction, so type that looks right in the
 * file would arrive at about five pixels. The wide cover is shown near its own width and needs
 * the opposite correction.
 */

// how wide each crop is actually shown, and the type size wanted there, in css pixels
const SHOWN = {
    card: { width: 220, type: 13 },
    wide: { width: 1280, type: 31 },
};

export default function PhotoCover({ post, w = 600, h = 400 }) {
    const has = Boolean(credits[post.slug]);
    const line = COVER_WORDS[post.slug] ?? "";
    const shape = w / h > 2 ? "wide" : "card";
    const shown = SHOWN[shape];
    const pad = w * 0.062;
    // the wide band is cropped from the top, so the line sits closer to its foot than the
    // card's does; otherwise the crop leaves a stretch of empty scrim beneath it
    const foot = shape === "wide" ? pad * 0.52 : pad * 0.95;
    // the size that lands at `type` once the browser scales the file down to `width`
    const wanted = shown.type * (w / shown.width);
    // a long phrase is set down to fit rather than run past the edge; mono advance is ~0.6em
    const fits = line.length > 0 ? (w - pad * 2) / (line.length * 0.63) : wanted;
    const size = Math.min(wanted, fits);
    const id = `pc-${post.slug}-${shape}`;
    return (
        <svg
            viewBox={`0 0 ${w} ${h}`}
            className="ph-cover"
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label={line ? `${post.title}: ${line}` : post.title}
        >
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="38%" stopColor="#0f1d1b" stopOpacity="0" />
                    <stop offset="78%" stopColor="#0f1d1b" stopOpacity="0.58" />
                    <stop offset="100%" stopColor="#0f1d1b" stopOpacity="0.82" />
                </linearGradient>
            </defs>
            <rect width={w} height={h} fill="#dfe4e2" />
            {has && (
                <image
                    href={`/img/photo/toned/${post.slug}.webp`}
                    x="0"
                    y="0"
                    width={w}
                    height={h}
                    preserveAspectRatio="xMidYMid slice"
                />
            )}
            {line && (
                <>
                    <rect width={w} height={h} fill={`url(#${id})`} />
                    <text
                        x={pad}
                        y={h - foot}
                        style={{
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontSize: `${size}px`,
                            letterSpacing: "0.04em",
                            fill: "#f6f8f7",
                        }}
                    >
                        {line}
                    </text>
                </>
            )}
        </svg>
    );
}
