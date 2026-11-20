import credits from "../data/photo-credits.json";

/**
 * An article's cover: one photograph, full bleed, at whatever shape it is asked for.
 *
 * Nothing is drawn on it. The line that goes over a cover is laid on in the page, where it can
 * be aligned to the text column and sized for the screen it is on; drawn into the file it was
 * stuck at a fraction of the image's own width, which on a wide band put it out in the margin
 * aligned to nothing, and it had to survive the index's five and a half times reduction.
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
