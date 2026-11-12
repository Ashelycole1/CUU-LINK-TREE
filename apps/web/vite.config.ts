import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development, /api and /assets are forwarded to the API so the
    // browser sees one origin and no CORS setup is needed.
    proxy: {
      "/api": "http://localhost:4000",
      "/assets": "http://localhost:4000",
    },
  },
});
