import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Fixed, distinct from Student Portal's client and this project's own
  // backend — see README.md for the full port map. Without this, whichever
  // of the two Vite dev servers starts second silently grabs a different
  // port, which breaks the /login page's assumption about where Student
  // Portal actually lives. Reassigned to 5373 as part of the phase-1 portal
  // integration (Student Portal client is now on 5273, this app's backend
  // on 5200 — see VITE_STUDENT_PORTAL_URL* in .env.example).
  server: {
    port: 5373,
  },
});