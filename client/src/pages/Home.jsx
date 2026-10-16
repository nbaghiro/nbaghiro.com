import { Link } from "react-router-dom";
import { POSTS, readableDate } from "../data/writing";
import Ask from "../components/Ask";
import "./Home.css";

const EMAIL = "naib.baghirov@gmail.com";
const latest = POSTS.slice(0, 2);

function Home() {
    return (
        <>
            <header className="hero">
                <picture>
                    <source
                        media="(max-width: 700px)"
                        srcSet="/img/hero-tall.webp"
                    />
                    <img src="/img/hero.webp" alt="" fetchPriority="high" />
                </picture>
                <div className="hero-copy">
                    <h1>Naib Baghirov</h1>
                    <p>
                        I build software products and run them. The writing here
                        is about how they work and what keeping them running
                        involves.
                    </p>
                </div>
            </header>

            <section className="entry" aria-label="Where to go">
                <p className="entry-note">
                    Each of these is run by one person, so the work includes the
                    code, the servers, billing, support and sales. The writing
                    here is mostly about the parts that are not code.
                </p>

                <nav className="doors" aria-label="Sections">
                    <Link className="door" to="/blogs">
                        <h2>Writing</h2>
                        <p>How the things underneath are built, in detail.</p>
                    </Link>
                    <Link className="door" to="/projects">
                        <h2>Projects</h2>
                        <p>
                            What each product is, who uses it, and where it
                            stands.
                        </p>
                    </Link>
                    <Link className="door" to="/about">
                        <h2>Résumé</h2>
                        <p>The working history, as a page or a PDF.</p>
                    </Link>
                    <a className="door" href={`mailto:${EMAIL}`}>
                        <h2>Contact</h2>
                        <p>{EMAIL}</p>
                    </a>
                </nav>

                {latest.length > 0 && (
                    <ul className="latest">
                        {latest.map((post) => (
                            <li key={post.slug}>
                                <Link to={`/blogs/${post.slug}`}>
                                    {post.card && (
                                        <img
                                            src={post.card}
                                            alt=""
                                            loading="lazy"
                                        />
                                    )}
                                    <span>
                                        <span className="latest-title">
                                            {post.title}
                                        </span>
                                        <span className="latest-meta">
                                            {post.about} ·{" "}
                                            {readableDate(post.date)}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="ask-band" aria-labelledby="ask-title">
                <div className="ask-inner">
                    <h2 id="ask-title">Ask about the work</h2>
                    <p className="ask-lede">
                        An agent with read access to the repositories and their
                        history. It answers from the code rather than from a
                        summary.
                    </p>
                    <Ask />
                </div>
            </section>

            <footer className="site-foot">
                <img src="/img/foot.webp" alt="" loading="lazy" />
                <div className="foot-inner">
                    <nav className="foot-links" aria-label="Elsewhere">
                        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                        <a
                            href="https://www.linkedin.com/in/naibbaghirov/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            LinkedIn
                        </a>
                        <a
                            href="https://github.com/nbaghiro"
                            target="_blank"
                            rel="noreferrer"
                        >
                            GitHub
                        </a>
                        <Link to="/dark">The old site</Link>
                    </nav>
                </div>
            </footer>
        </>
    );
}

export default Home;
