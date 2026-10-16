import { PRODUCTS, ALSO } from "../data/products";
import "./Projects.css";

function Projects() {
    return (
        <article className="page">
            <header className="page-head">
                <h1>Projects</h1>
                <p>
                    The products I build and run. Each one is live, in testing
                    or in progress; where it stands is noted beside it.
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

            <h2 className="also-head">Also built</h2>
            <ul className="rows">
                {ALSO.map((p) => (
                    <li key={p.id}>
                        <div className="row">
                            <h3>{p.name}</h3>
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
