import { Suspense } from "react";
import { Link, Outlet } from "react-router-dom";
import { useFavicon } from "../favicon";
import Mark from "./Mark";
import "./DarkLayout.css";

// The first version of the site, kept at /dark: the project overworld in its own dark skin.
function DarkLayout() {
    useFavicon("mark");
    return (
        <div className="site dark-site">
            <header className="site-header">
                <Link to="/dark" className="site-logo">
                    <Mark size={40} />
                    <span>nbaghiro</span>
                </Link>
                <nav className="site-nav" aria-label="Primary">
                    <Link to="/resume">Résumé</Link>
                    <a
                        href="https://github.com/nbaghiro"
                        target="_blank"
                        rel="noreferrer"
                    >
                        GitHub
                    </a>
                </nav>
            </header>
            <main>
                <Suspense fallback={null}>
                    <Outlet />
                </Suspense>
            </main>
        </div>
    );
}

export default DarkLayout;
