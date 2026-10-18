import { Link, useParams } from "react-router-dom";
import { postBySlug, readableDate } from "../data/writing";
import { bodyFor } from "../data/post-body";
import Prose from "../components/Prose";
import PageArt from "../components/PageArt";
import "./Writing.css";

/**
 * One written piece. It sits apart from the index because it is what pulls in Prose and
 * with it every diagram on the site, which is the largest thing in the build: keeping the
 * two pages in one file put the diagrams in front of everyone who opened the list.
 */
function Post() {
    const { slug } = useParams();
    const post = postBySlug(slug);
    if (!post) {
        return (
            <article className="page">
                <header className="page-head">
                    <h1>Article not found</h1>
                    <p>
                        This article may have moved or is no longer available.{" "}
                        <Link to="/blogs">Browse all articles.</Link>
                    </p>
                </header>
            </article>
        );
    }
    return (
        <article className="post">
            {post.cover && (
                <figure className="post-cover">
                    <img className="cover-bg" src={post.coverBg} alt="" />
                    <img
                        className="cover-art"
                        src={post.coverArt}
                        alt=""
                        fetchpriority="high"
                    />
                    {post.card && (
                        <img className="cover-card" src={post.card} alt="" />
                    )}
                </figure>
            )}
            <div className="page">
                <PageArt seed={post.slug} count={4} />
                <header className="page-head">
                    <h1>{post.title}</h1>
                    <p className="post-meta">
                        {post.about} · {readableDate(post.date)}
                    </p>
                </header>
                <Prose text={bodyFor(post.slug)} />
                <p className="post-back">
                    <Link to="/blogs">More writing</Link>
                </p>
            </div>
        </article>
    );
}

export default Post;
