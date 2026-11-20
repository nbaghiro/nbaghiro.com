import { Link } from "react-router-dom";
import PageArt from "../components/PageArt";

/**
 * Anything the router does not match. Without it React renders nothing and the address bar is
 * the only clue the page is wrong, which is what a visitor following an old or truncated link
 * would have seen.
 */
function NotFound() {
    return (
        <article className="page">
            <PageArt seed="not-found" count={2} />
            <header className="page-head">
                <h1>Page not found</h1>
                <p>
                    This address doesn’t match a page on the site. It may have
                    moved, or the link may be incomplete.{" "}
                    <Link to="/">Go to the home page</Link>, or{" "}
                    <Link to="/blogs">browse the articles</Link>.
                </p>
            </header>
        </article>
    );
}

export default NotFound;
