import { useState } from "react";
import { Link } from "react-router-dom";
import { POSTS, readableDate } from "../data/writing";
import PageArt from "../components/PageArt";
import "./Writing.css";

function Writing() {
    const [category, setCategory] = useState("All writing");
    const categories = ["All writing", "Product notes", "Industry & practice"];
    const visible =
        category === "All writing"
            ? POSTS
            : POSTS.filter((post) => post.category === category);
    return (
        <article className="page">
            <PageArt seed="writing" count={2} />
            <header className="page-head">
                <h1>Writing</h1>
                <p>
                    Notes on building products, understanding how they work, and
                    the wider questions that shape those decisions.
                </p>
            </header>
            <div
                className="writing-filters"
                role="group"
                aria-label="Filter articles"
            >
                {categories.map((name) => (
                    <button
                        key={name}
                        type="button"
                        aria-pressed={category === name}
                        onClick={() => setCategory(name)}
                    >
                        {name}{" "}
                        <span>
                            {name === "All writing"
                                ? POSTS.length
                                : POSTS.filter((post) => post.category === name)
                                      .length}
                        </span>
                    </button>
                ))}
            </div>
            <p className="writing-count" aria-live="polite">
                {visible.length} articles
            </p>
            <ul className="post-list">
                {visible.map((post) => (
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

export default Writing;
