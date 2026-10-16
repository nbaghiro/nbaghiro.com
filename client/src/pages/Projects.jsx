import { PRODUCTS, ALSO } from "../data/products";
import PageArt from "../components/PageArt";
import "./Projects.css";

function Projects() {
    return (
        <article className="page">
            <PageArt seed="projects" count={3} />
            <header className="page-head">
                <h1>Projects</h1>
                <p>
                    The products and tools I’m building, with a short
                    description and the current status of each.
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
                {ALSO.map((p) => (
                    <li key={p.id}>
                        <div className="row">
                            <h2>{p.name}</h2>
                            <p className="row-note">{p.note}</p>
                            <p className="row-side">
                                <span className="state">{p.state}</span>
                                <span className="detail">{p.detail}</span>
                            </p>
                        </div>
                    </li>
                ))}
            </ul>

            <figure className="quote">
                <img src="/img/band.webp" alt="" />
                <figcaption>
                    <blockquote>
                        I use coding agents throughout development. My work also
                        includes understanding what people need, deciding what
                        to build and supporting the products day to day.
                    </blockquote>
                </figcaption>
            </figure>
        </article>
    );
}

export default Projects;
