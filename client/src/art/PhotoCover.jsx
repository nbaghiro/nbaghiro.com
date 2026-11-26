import DailiesCover from "./DailiesCover";
import credits from "../data/photo-credits.json";
import { COVER_WORDS } from "./cover-words";

/**
 * An article's cover: one photograph, full bleed, at whatever shape it is asked for.
 *
 * Nothing is drawn on it for the page: the line is laid on in HTML, where it can be aligned to
 * the text column and sized for the screen. `words` is for the social preview alone, which
 * travels on its own into a chat window with no page around it, so the scrim and the line have
 * to be in the pixels.
 */
export default function PhotoCover({ post, w = 600, h = 400, words = false }) {
    if (post.slug === "dailies-from-product-demo-to-ad-campaign") {
        return <DailiesCover post={post} w={w} h={h} words={words} />;
    }
    const has = Boolean(credits[post.slug]);
    const line = words ? (COVER_WORDS[post.slug] ?? "") : "";
    const pad = w * 0.062;
    // sized for the ~600px a chat window gives a preview, not for the file's own width
    const size = Math.min(17 * (w / 600), (w - pad * 2) / (line.length * 0.63 || 1));
    return (
        <svg
            viewBox={`0 0 ${w} ${h}`}
            className="ph-cover"
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label={post.title}
        >
            <defs>
                <linearGradient id={`og-${post.slug}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="30%" stopColor="#0d1a18" stopOpacity="0" />
                    <stop offset="76%" stopColor="#0d1a18" stopOpacity="0.46" />
                    <stop offset="100%" stopColor="#0d1a18" stopOpacity="0.92" />
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
                    <rect width={w} height={h} fill={`url(#og-${post.slug})`} />
                    <text
                        x={pad}
                        y={h - pad * 0.8}
                        style={{
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontSize: `${size}px`,
                            letterSpacing: "0.01em",
                            fill: "#f4f7f6",
                        }}
                    >
                        {line}
                    </text>
                </>
            )}
        </svg>
    );
}
