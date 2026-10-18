import { Suspense, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigationType } from "react-router-dom";
import { useFavicon } from "../favicon";
import Booking from "./Booking";
import Contact from "./Contact";
import "./SiteLayout.css";

// The header floats over the hero in white, then takes the page ground once the hero has
// scrolled past. Anything other than the landing page starts solid.
function SiteLayout() {
    const { pathname, hash } = useLocation();
    const overImage = pathname === "/";
    useFavicon("photo");

    // A client-side navigation keeps the old scroll position, which lands you halfway down a
    // piece you have just opened. Going back keeps its place, and an anchor decides its own.
    const navigation = useNavigationType();
    useEffect(() => {
        if (hash || navigation === "POP") return;
        window.scrollTo(0, 0);
    }, [pathname, hash, navigation]);
    const [solid, setSolid] = useState(!overImage);

    useEffect(() => {
        if (!overImage) {
            setSolid(true);
            return undefined;
        }
        const onScroll = () =>
            setSolid(window.scrollY > window.innerHeight * 0.6);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [overImage]);

    return (
        <div className="site">
            <header className={solid ? "site-header solid" : "site-header"}>
                {/* the landing page already says the name, in the hero; the bar only
                    adds it once that has scrolled away */}
                <Link to="/" className="site-logo" aria-label="Home">
                    <img
                        src="/img/portrait.webp"
                        alt=""
                        width="34"
                        height="34"
                    />
                    <span>Naib Baghirov</span>
                </Link>
                <nav className="site-nav" aria-label="Primary">
                    <Link to="/blogs">Writing</Link>
                    <Link to="/projects">Projects</Link>
                    <Link to="/about">Résumé</Link>
                    <a
                        className="out"
                        href="https://www.linkedin.com/in/naibbaghirov/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        LinkedIn
                    </a>
                </nav>
            </header>
            <main>
                <Suspense fallback={<div className="page" />}>
                    <Outlet />
                </Suspense>
            </main>
            <Booking />
            <Contact />
        </div>
    );
}

export default SiteLayout;
