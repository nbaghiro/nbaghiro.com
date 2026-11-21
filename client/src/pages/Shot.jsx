import { useSearchParams } from "react-router-dom";
import { POSTS } from "../data/writing";
import PhotoCover from "../art/PhotoCover";

/**
 * One cover, alone on the page at an exact pixel size, for scripts/article-covers.mjs to
 * photograph. Build tooling rather than a page: nothing links to it, and it is the reason the
 * cover in the index and the cover in the file are the same drawing.
 */
export default function Shot() {
    const [params] = useSearchParams();
    const slug = params.get("slug");
    const w = Number(params.get("w") ?? 1200);
    const h = Number(params.get("h") ?? 800);
    const words = params.get("words") === "1";
    const post = POSTS.find((p) => p.slug === slug);
    if (!post) return <main data-shot="missing" />;
    return (
        <main data-shot="ready" style={{ width: `${w}px`, height: `${h}px`, overflow: "hidden" }}>
            <PhotoCover post={post} w={w} h={h} words={words} />
        </main>
    );
}
