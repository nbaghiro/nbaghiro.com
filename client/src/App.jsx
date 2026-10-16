import { Navigate, Routes, Route, useParams } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import DarkLayout from "./components/DarkLayout";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import { Writing, Post } from "./pages/Writing";
import Overworld from "./pages/Overworld";
import About from "./pages/About";
import Ads from "./pages/ads/Ads";

function WritingRedirect() {
    const { slug } = useParams();
    return <Navigate to={`/blogs/${slug}`} replace />;
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<SiteLayout />}>
                <Route index element={<Home />} />
                <Route path="projects" element={<Projects />} />
                <Route path="blogs" element={<Writing />} />
                <Route path="blogs/:slug" element={<Post />} />
                {/* the section moved from /writing; anything already linked still lands */}
                <Route
                    path="writing"
                    element={<Navigate to="/blogs" replace />}
                />
                <Route path="writing/:slug" element={<WritingRedirect />} />
                <Route path="about" element={<About />} />
            </Route>
            {/* The first version of the site, kept for anyone who liked it; the ad studios
                wear the same skin */}
            <Route path="/dark" element={<DarkLayout />}>
                <Route index element={<Overworld />} />
            </Route>
            {/* The ad studios: unlinked, with their own chrome (pages/ads/Ads.jsx) */}
            <Route path="/ads/*" element={<Ads />} />
        </Routes>
    );
}

export default App;
