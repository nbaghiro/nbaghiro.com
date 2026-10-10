import { Routes, Route } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import Overworld from "./pages/Overworld";
import About from "./pages/About";
import Ads from "./pages/ads/Ads";

function App() {
    return (
        <Routes>
            <Route path="/" element={<SiteLayout />}>
                <Route index element={<Overworld />} />
                <Route path="about" element={<About />} />
            </Route>
            {/* The ad studios: unlinked, with their own chrome (pages/ads/Ads.jsx) */}
            <Route path="/ads/*" element={<Ads />} />
        </Routes>
    );
}

export default App;
