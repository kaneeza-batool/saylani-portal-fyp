import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Fixed, distinct from Student Portal's client (5173) and this project's
  // own backend (5002) — see README.md for the full port map. Without this,
  // whichever of the two Vite dev servers starts second silently grabs a
  // different port, which breaks the /login page's assumption about where
  // Student Portal actually lives.
  server: {
    port: 5175,
  },
});