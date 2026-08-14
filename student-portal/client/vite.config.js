import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed, not left to Vite's default — the sibling Titan-EMS public
  // website's /login page redirects here assuming this exact port
  // (VITE_STUDENT_PORTAL_URL). Without pinning it, whichever Vite dev
  // server starts first claims the port and this one silently falls back to
  // a different one, breaking that redirect. Reassigned to 5273 as part of
  // the phase-1 portal integration — 5173 now belongs to the main app's
  // client (see /public-website's Login.jsx / VerifyCertificate.jsx, which
  // must point their VITE_STUDENT_PORTAL_URL* vars at this same port).
  server: {
    port: 5273,
  },
})
