import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed, not left to Vite's default — the sibling Titan-EMS public
  // website's /login page redirects here assuming this exact port
  // (VITE_STUDENT_PORTAL_URL). Without pinning it, whichever Vite dev
  // server starts first claims 5173 and this one silently falls back to a
  // different port, breaking that redirect.
  server: {
    port: 5173,
  },
})
