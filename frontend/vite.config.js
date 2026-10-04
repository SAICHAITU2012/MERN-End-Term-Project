import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173,
        proxy: {
            // dev convenience: same-origin /api → backend (no CORS juggling),
            // production uses VITE_API_URL instead
            "/api": { target: "http://localhost:5050", changeOrigin: false },
            "/uploads": { target: "http://localhost:5050", changeOrigin: false },
        },
    },
});
