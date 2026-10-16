import { PRODUCTS, ALSO } from "../data/products";
import "./Projects.css";

function Projects() {
    return (
        <article className="page">
            <header className="page-head">
                <h1>Projects</h1>
                <p>
                    Five products I build and run. Most have a handful of people
                    using them who found them on their own, before any outreach
                    from me.
                </p>
            </header>

            <ul className="rows">
                {PRODUCTS.map((p) => (
                    <li key={p.id}>
                        <a
                            className="row"
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <h2>{p.name}</h2>
                            <p className="row-note">{p.note}</p>
                            <p className="row-side">
                                <span className="state">{p.state}</span>
                                <span className="detail">{p.detail}</span>
                            </p>
                        </a>
                    </li>
                ))}
            </ul>

            <p className="also">
                Also built, and still running:{" "}
                {ALSO.map((a) => (
                    <span key={a.name}>
                        <b>{a.name}</b>, {a.note}.
                    </span>
                ))}
            </p>

            <figure className="quote">
                <img src="/img/band.webp" alt="" />
                <figcaption>
                    <blockquote>
                        Coding agents write most of the code now. What they do
                        not do is find the users, decide what the product should
                        be, or keep the whole thing pointed somewhere.
                    </blockquote>
                </figcaption>
            </figure>
        </article>
    );
}

export default Projects;
