# TITAN Marketing Site

The public marketing site for TITAN (Taj Institute of Technology and Applied
Networks) — React/Vite client with a small Express/MongoDB backend for the
Contact form and the Enroll Now application flow.

## Ports

This project is one of several standalone TITAN apps that run side by side
on the same machine during local dev (this repo, plus the sibling
`titan-portals` repo's Student Portal and Super Admin Portal). Each app's
Vite dev server defaults to port 5173 if left unconfigured, so running more
than one at once causes a collision — whichever starts second either fails
to bind or silently falls back to a different port, which then breaks
anything (like this project's `/login` redirect) that assumes a fixed URL
for another app.

To avoid that, ports here are pinned explicitly rather than left to Vite's
default/auto-increment behavior:

| App | Port | Where it's set |
|---|---|---|
| **This project — client** | `5175` | `client/vite.config.js` (`server.port`) |
| **This project — server** | `5002` | `server/.env` (`PORT`) |
| Student Portal — client | `5173` | `titan-portals/portals/student-portal/client/vite.config.js` (`server.port`) |
| Student Portal — server | `5001` | `titan-portals/portals/student-portal/server/.env` (`PORT`) |

Both clients are now pinned explicitly rather than left to Vite's
default/auto-increment behavior, so this project's `/login` redirect
(`VITE_STUDENT_PORTAL_URL`, pointing at `http://localhost:5173`) can rely
on Student Portal actually being there.

## Running locally

```bash
# Backend (MongoDB must be running locally on 27017)
cd server
npm install
npm run dev        # http://localhost:5002

# Frontend
cd client
npm install
npm run dev         # http://localhost:5175
```

Copy `client/.env.example` to `client/.env` and `server/.env.example` to
`server/.env`, adjusting values if your local setup differs from the
defaults above.

## Environment variables

**`client/.env`**
- `VITE_API_URL` — this project's own backend (default `http://localhost:5002`)
- `VITE_STUDENT_PORTAL_URL` — where the `/login` page redirects to (default `http://localhost:5173/login`, matching Student Portal's pinned port above)

**`server/.env`**
- `MONGO_URI` — local MongoDB connection string
- `PORT` — this project's backend port (`5002`)
- `CLIENT_URL` — this project's frontend origin, used for CORS (`http://localhost:5175`)
