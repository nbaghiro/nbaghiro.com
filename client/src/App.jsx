import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Yearlies from "./pages/Yearlies";
import Random from "./pages/Random";
import "./App.css";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="yearlies" element={<Yearlies />} />
                <Route path="random" element={<Random />} />
            </Route>
        </Routes>
    );
}

export default App;
