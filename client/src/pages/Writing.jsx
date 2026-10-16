import { Link, useParams } from "react-router-dom";
import { POSTS, postBySlug, readableDate } from "../data/writing";
import Prose from "../components/Prose";
import "./Writing.css";

export function Writing() {
    return (
        <article className="page">
            <header className="page-head">
                <h1>Writing</h1>
                <p>
                    How the parts underneath are built: the decisions, what they
                    cost, and what I would do differently.
                </p>
            </header>
            <ul className="post-list">
                {POSTS.map((post) => (
                    <li key={post.slug}>
                        <Link to={`/writing/${post.slug}`}>
                            <h2>{post.title}</h2>
                            <p className="post-summary">{post.summary}</p>
                            <p className="post-meta">
                                {post.about} · {readableDate(post.date)}
                            </p>
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
                    <h1>Not here</h1>
                    <p>
                        That piece does not exist.{" "}
                        <Link to="/writing">The rest of them.</Link>
                    </p>
                </header>
            </article>
        );
    }
    return (
        <article className="page post">
            <header className="page-head">
                <h1>{post.title}</h1>
                <p className="post-meta">
                    {post.about} · {readableDate(post.date)}
                </p>
            </header>
            <Prose text={post.body} />
            <p className="post-back">
                <Link to="/writing">More writing</Link>
            </p>
        </article>
    );
}
