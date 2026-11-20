import { lazy, Suspense } from "react";
import { Navigate, Routes, Route, useParams } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import DarkLayout from "./components/DarkLayout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

/**
 * The landing page and the two layouts are in the first bundle; every other page is fetched
 * when it is first opened. Three of them are worth the seam: an article carries every
 * diagram on the site, and the ad studios and the dark overworld are each their own
 * application that almost nobody opens. The layouts hold the Suspense boundary around their
 * outlet, so the header stays put while the next page arrives.
 */
const Projects = lazy(() => import("./pages/Projects"));
const Writing = lazy(() => import("./pages/Writing"));
const Post = lazy(() => import("./pages/Post"));
const Resume = lazy(() => import("./pages/Resume"));
const Overworld = lazy(() => import("./pages/Overworld"));
const Ads = lazy(() => import("./pages/ads/Ads"));

/* Five design options for a new version of the site, unlinked from it. Each is a whole page
   with its own chrome, so like the ad studios they sit outside the site layout. */
const Art = lazy(() => import("./pages/Art"));
const Shot = lazy(() => import("./pages/Shot"));
const Images = lazy(() => import("./pages/Images"));

function Option({ children }) {
    return <Suspense fallback={null}>{children}</Suspense>;
}

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
                <Route path="resume" element={<Resume />} />
                {/* the page moved from /about; anything already linked still lands */}
                <Route
                    path="about"
                    element={<Navigate to="/resume" replace />}
                />
                {/* anything else under the site's chrome, so a bad link lands somewhere */}
                <Route path="*" element={<NotFound />} />
            </Route>
            {/* The first version of the site, kept for anyone who liked it; the ad studios
                wear the same skin */}
            <Route path="/dark" element={<DarkLayout />}>
                <Route index element={<Overworld />} />
            </Route>
            {/* The ad studios: unlinked, with their own chrome (pages/ads/Ads.jsx) */}
            <Route
                path="/ads/*"
                element={
                    <Suspense fallback={null}>
                        <Ads />
                    </Suspense>
                }
            />
            {/* every ground that can sit behind an article, internal */}
            <Route
                path="/images"
                element={
                    <Option>
                        <Images />
                    </Option>
                }
            />
            {/* four covers built for the thumbnail, internal */}
            {/* five cover styles that try to read as engineering, internal */}
            {/* the plate catalogue, internal: nothing in the navigation points at it */}
            <Route
                path="/art"
                element={
                    <Option>
                        <Art />
                    </Option>
                }
            />
            {/* tooling: one cover at an exact size, for scripts/plate-covers.mjs */}
            <Route
                path="/art/shot"
                element={
                    <Option>
                        <Shot />
                    </Option>
                }
            />
        </Routes>
    );
}

export default App;
