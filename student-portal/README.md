# TITAN Student Portal

Standalone full-stack app — React (Vite) client + Express/Mongoose server.
Shares the main TITAN app's MongoDB database (`titan-portal`) for student data, but has its own auth and is not otherwise wired into the other TITAN portals.

## Structure

```
student-portal/
  client/   React app (Vite, plain JS)
  server/   Express + Mongoose API (CommonJS)
```

## Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)

## Setup

### Server

```bash
cd server
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET
npm run dev
```

Runs on **http://localhost:5100**. Health check: `GET /api/health` → `{ "status": "ok" }`.

### Client

```bash
cd client
npm install
cp .env.example .env   # VITE_API_URL defaults to http://localhost:5100/api
npm run dev
```

Runs on **http://localhost:5273** (pinned in `vite.config.js`, not the Vite default —
`public-website`'s `/login` page redirects here assuming this exact port).

## Ports

| App | Port |
|---|---|
| Client (Vite) | 5273 |
| Server (Express) | 5100 |

Note: the root `client`/`server` app (Super Admin, Campus Manager, Trainer portals)
runs on 5173/5000, and the sibling `public-website` app runs on 5373/5200 —
see the root `README.md` for the full port map.
