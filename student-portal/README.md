# TITAN Student Portal

Standalone full-stack scaffold — React (Vite) client + Express/Mongoose server.
Not yet wired into the other TITAN portals; has its own database and auth.

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

Runs on **http://localhost:5001**. Health check: `GET /api/health` → `{ "status": "ok" }`.

### Client

```bash
cd client
npm install
cp .env.example .env   # VITE_API_URL defaults to http://localhost:5001/api
npm run dev
```

Runs on **http://localhost:5173** (Vite default). Opening it in a browser calls
the server's `/api/health` endpoint on load and shows whether the backend is
reachable.

## Ports

| App | Port |
|---|---|
| Client (Vite) | 5173 |
| Server (Express) | 5001 |

Note: the sibling `super-admin-portal` server runs on port 5000 — 5001 was
chosen here to avoid a collision if both are running at once.
