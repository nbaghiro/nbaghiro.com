import { Link, useParams } from "react-router-dom";
import { POSTS, postBySlug, readableDate } from "../data/writing";
import Prose from "../components/Prose";
import PageArt from "../components/PageArt";
import "./Writing.css";

export function Writing() {
    return (
        <article className="page">
            <PageArt kind="cones" side="right" top={150} />
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
                    <h1>Not here</h1>
                    <p>
                        That piece does not exist.{" "}
                        <Link to="/blogs">The rest of them.</Link>
                    </p>
                </header>
            </article>
        );
    }
    return (
        <article className="post">
            {post.cover && (
                <img
                    className="post-cover"
                    src={post.cover}
                    alt=""
                    fetchPriority="high"
                />
            )}
            <div className="page">
                <PageArt kind="fern" side="left" top={420} />
                <PageArt kind="seedling" side="right" top={1700} />
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
