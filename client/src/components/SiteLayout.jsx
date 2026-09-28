import { Link, Outlet } from "react-router-dom";
import Mark from "./Mark";
import "./SiteLayout.css";

function SiteLayout() {
    return (
        <div className="site">
            <header className="site-header">
                <Link to="/" className="site-logo">
                    <Mark size={40} />
                    <span>nbaghiro</span>
                </Link>
                <nav className="site-nav" aria-label="Primary">
                    <Link to="/about">About</Link>
                    <a href="https://github.com/nbaghiro" target="_blank" rel="noreferrer">
                        GitHub
                    </a>
                </nav>
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
}

export default SiteLayout;
