import { Link, useParams } from "react-router-dom";
import { POSTS, postBySlug, readableDate } from "../data/writing";
import Prose from "../components/Prose";
import PageArt from "../components/PageArt";
import "./Writing.css";

export function Writing() {
    return (
        <article className="page">
            <PageArt seed="writing" count={2} />
            <header className="page-head">
                <h1>Writing</h1>
                <p>
                    How I build and run the products, including technical
                    decisions, tradeoffs and lessons from the work.
                </p>
            </header>
            <ul className="post-list">
                {POSTS.map((post) => (
                    <li key={post.slug}>
                        <Link to={`/blogs/${post.slug}`}>
                            {post.card && (
                                <img
                                    className="post-card"
                                    src={post.card}
                                    alt=""
                                    loading="lazy"
                                />
                            )}
                            <div>
                                <h2>{post.title}</h2>
                                <p className="post-summary">{post.summary}</p>
                                <p className="post-meta">
                                    {post.about} · {readableDate(post.date)}
                                </p>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </article>
    );
}

export function Post() {
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
                <Prose text={post.body} />
                <p className="post-back">
                    <Link to="/blogs">More writing</Link>
                </p>
            </div>
        </article>
    );
}
