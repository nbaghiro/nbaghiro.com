import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import posts from "./vite-posts";

export default defineConfig({
    plugins: [react(), posts()],
    server: {
        port: 5283,
        proxy: {
            "/api": {
                target: process.env.API_TARGET || "http://localhost:3100",
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: "dist",
        sourcemap: false,
    },
});
