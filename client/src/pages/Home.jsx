import { Link } from "react-router-dom";
import { POSTS, readableDate } from "../data/writing";
import Ask, { openAsk } from "../components/Ask";
import PageArt from "../components/PageArt";
import "./Home.css";

const EMAIL = "naib.baghirov@gmail.com";

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
                        I’m a software engineer and founder. I build and run
                        software products, and share what I learn along the way.
                    </p>
                    <button
                        className="hero-ask"
                        type="button"
                        onClick={openAsk}
                    >
                        Talk to my agent
                    </button>
                </div>
            </header>

            <section className="entry" aria-label="Where to go">
                <PageArt seed="home" count={2} />
                <div className="entry-side">
                    <p className="entry-note">
                        My work covers development, infrastructure, billing and
                        customer support. Here I write about how the products
                        work, the decisions behind them and what I learn from
                        running them.
                    </p>

                    <nav className="doors" aria-label="Sections">
                        <Link className="door" to="/blogs">
                            <h2>Writing</h2>
                            <p>
                                Technical articles about building and running
                                the products.
                            </p>
                        </Link>
                        <Link className="door" to="/projects">
                            <h2>Projects</h2>
                            <p>
                                What I’m building, who it’s for and its current
                                status.
                            </p>
                        </Link>
                        <Link className="door" to="/about">
                            <h2>Résumé</h2>
                            <p>My experience and previous work.</p>
                        </Link>
                        <a className="door" href={`mailto:${EMAIL}`}>
                            <h2>Contact</h2>
                            <p>{EMAIL}</p>
                        </a>
                    </nav>
                </div>
            </section>

            {POSTS.length > 0 && (
                <section className="strip" aria-labelledby="recent-writing">
                    <div className="strip-head">
                        <h2 id="recent-writing">Recent writing</h2>
                        <Link to="/blogs">All {POSTS.length} articles</Link>
                    </div>
                    {/* a row rather than a column, so several covers are in view at once */}
                    <ul className="films">
                        {POSTS.map((post) => (
                            <li key={post.slug}>
                                <Link
                                    className="film"
                                    to={`/blogs/${post.slug}`}
                                >
                                    {post.card && (
                                        <img
                                            src={post.card}
                                            alt=""
                                            loading="lazy"
                                        />
                                    )}
                                    <h3>{post.title}</h3>
                                    <p className="film-meta">
                                        {post.about} · {readableDate(post.date)}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className="ask-band" aria-labelledby="ask-title">
                <div className="ask-inner">
                    <div className="ask-head">
                        <h2 id="ask-title">Talk to my agent</h2>
                        <p className="ask-lede">
                            An AI assistant that can read the project code and
                            its history. Ask how a feature works, why it was
                            built that way or what has changed.
                        </p>
                    </div>
                    <Ask />
                </div>
            </section>

            <footer className="site-foot">
                <img src="/img/foot.webp" alt="" loading="lazy" />
                <div className="foot-inner">
                    <div className="foot-left">
                        <div className="foot-mark">
                            <img src="/img/portrait.webp" alt="" />
                            <div>
                                <p className="foot-name">Naib Baghirov</p>
                                <p className="foot-line">
                                    Software engineer and founder.
                                </p>
                            </div>
                        </div>
                        <p className="foot-mail">
                            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                        </p>
                    </div>

                    <nav className="foot-cols" aria-label="Site">
                        <div>
                            <p className="foot-label">Pages</p>
                            <Link to="/blogs">Writing</Link>
                            <Link to="/projects">Projects</Link>
                            <Link to="/about">Résumé</Link>
                        </div>
                        <div>
                            <p className="foot-label">Elsewhere</p>
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
                        </div>
                    </nav>
                </div>
            </footer>
        </>
    );
}

export default Home;
