import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import PageLoadBoundary from "./components/PageLoadBoundary";
import { installChunkRecovery } from "./chunk-recovery.mjs";
import "./index.css";

installChunkRecovery(window);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <PageLoadBoundary>
                <App />
            </PageLoadBoundary>
        </BrowserRouter>
    </React.StrictMode>
);
