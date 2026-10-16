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
                        I build software products and run them, and write about
                        the decisions along the way.
                    </p>
                </div>
            </header>

            <section className="entry" aria-label="Where to go">
                <p className="entry-note">
                    Five products, most with a handful of people using them who
                    found them on their own. I am working out which one should
                    get all of the time.
                </p>

                <nav className="doors" aria-label="Sections">
                    <Link className="door" to="/writing">
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
                                <Link to={`/writing/${post.slug}`}>
                                    <span className="latest-title">
                                        {post.title}
                                    </span>
                                    <span className="latest-meta">
                                        {post.about} · {readableDate(post.date)}
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
