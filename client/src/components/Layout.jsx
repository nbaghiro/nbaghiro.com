import { Outlet, Link } from "react-router-dom";
import ParticleBackground from "./ParticleBackground";
import "./Layout.css";

function Layout() {
    return (
        <div className="layout">
            <ParticleBackground />
            <header className="header">
                <div className="container">
                    <Link to="/" className="logo">
                        nb
                    </Link>
                    <nav className="nav">
                        <Link to="/">Weeklies</Link>
                        <Link to="/yearlies">Yearlies</Link>
                        <Link to="/random">Random</Link>
                        <Link to="/about">About</Link>
                    </nav>
                </div>
            </header>
            <main className="main">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
