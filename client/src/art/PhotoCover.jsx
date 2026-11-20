import credits from "../data/photo-credits.json";

/**
 * An article's cover: one photograph, full bleed.
 *
 * One per piece, picked by hand, and toned into the site's palette by scripts/photos/tone.mjs
 * so a column of them reads as one site rather than as stock. No words are drawn on it: in the
 * index the title sits beside the card at full size, and on the article the heading is directly
 * beneath, so type on the image would only be the same words a second time, too small to read.
 */
export default function PhotoCover({ post, w = 600, h = 400 }) {
    const has = Boolean(credits[post.slug]);
    return (
        <svg
            viewBox={`0 0 ${w} ${h}`}
            className="ph-cover"
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label={post.title}
        >
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
        </svg>
    );
}
