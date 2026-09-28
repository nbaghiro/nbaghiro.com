import { Routes, Route } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import Overworld from "./pages/Overworld";
import About from "./pages/About";

function App() {
    return (
        <Routes>
            <Route path="/" element={<SiteLayout />}>
                <Route index element={<Overworld />} />
                <Route path="about" element={<About />} />
            </Route>
        </Routes>
    );
}

export default App;
