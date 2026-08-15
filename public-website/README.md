# TITAN Marketing Site

The public marketing site for TITAN (Taj Institute of Technology and Applied
Networks) — React/Vite client with a small Express/MongoDB backend for the
Contact form and the Enroll Now application flow.

## Ports

This project is one of three standalone TITAN apps that run side by side on
the same machine during local dev, all in this same repo: this app, the root
`client`/`server` (Super Admin, Campus Manager, Trainer portals), and
`student-portal/`. Each app's Vite dev server defaults to port 5173 if left
unconfigured, so running more than one at once causes a collision — whichever
starts second either fails to bind or silently falls back to a different
port, which then breaks anything (like this project's `/login` redirect)
that assumes a fixed URL for another app.

To avoid that, ports here are pinned explicitly rather than left to Vite's
default/auto-increment behavior:

| App | Port | Where it's set |
|---|---|---|
| **This project — client** | `5373` | `client/vite.config.js` (`server.port`) |
| **This project — server** | `5200` | `server/.env` (`PORT`) |
| Root app — client | `5173` | Vite default, `client/vite.config.js` |
| Root app — server | `5000` | `server/.env` (`PORT`) |
| Student Portal — client | `5273` | `student-portal/client/vite.config.js` (`server.port`) |
| Student Portal — server | `5100` | `student-portal/server/.env` (`PORT`) |

so this project's `/login` redirect (`VITE_STUDENT_PORTAL_URL`, pointing at
`http://localhost:5273`) can rely on Student Portal actually being there.

## Running locally

```bash
# Backend (MongoDB must be running locally on 27017)
cd server
npm install
npm run dev        # http://localhost:5200

# Frontend
cd client
npm install
npm run dev         # http://localhost:5373
```

Copy `client/.env.example` to `client/.env` and `server/.env.example` to
`server/.env`, adjusting values if your local setup differs from the
defaults above.

## Environment variables

**`client/.env`**
- `VITE_API_URL` — this project's own backend (default `http://localhost:5200`)
- `VITE_STUDENT_PORTAL_URL` / `VITE_STUDENT_PORTAL_URL_BASE` — where the `/login` and cert-verification pages redirect to (default `http://localhost:5273`, matching Student Portal's pinned port above)

**`server/.env`**
- `MONGO_URI` — the **shared** `titan-portal` MongoDB database (also used by the root app and Student Portal) — get the real value from a teammate, never invent one
- `PORT` — this project's backend port (`5200`)
- `CLIENT_URL` — this project's frontend origin, used for CORS (`http://localhost:5373`)
