# Titan Portal

MERN stack monorepo for the Titan Portal platform.

## Structure

```
titan-portal/
├── client/                     # React app (Vite, JavaScript)
│   └── src/
│       ├── components/         # Shared/reusable UI components
│       ├── portals/
│       │   └── super-admin/    # Super Admin portal views
│       ├── layouts/            # Page/app layout shells
│       ├── hooks/               # Custom React hooks
│       ├── utils/               # Client-side helpers
│       ├── services/            # API clients (axios/react-query)
│       └── context/             # React context providers
└── server/                     # Node/Express API
    ├── config/                 # Env, DB, and app configuration
    ├── models/                 # Mongoose schemas/models
    ├── routes/                 # Express route definitions
    ├── controllers/            # Route handler logic
    ├── middleware/              # Express middleware (auth, error handling, etc.)
    └── utils/                   # Server-side helpers
```

## Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)

## Getting started

### Server

```bash
cd server
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, PORT, CLIENT_URL
npm install
npm run dev             # nodemon, http://localhost:5000
```

Health check: `GET /api/health`

### Client

```bash
cd client
npm install
npm run dev             # http://localhost:5173
```

## Tech stack

**Client:** React (Vite), Tailwind CSS, react-router-dom, axios, @tanstack/react-query, framer-motion

**Server:** Express, Mongoose, dotenv, cors, bcryptjs, jsonwebtoken, cookie-parser

## Design system

The client's `tailwind.config.js` implements the TITAN design system (brand colors, type scale, spacing, shadows). See [`components-reference.md`](./components-reference.md) at the repo root for ready-to-use class combinations, and the `TITAN * Portal.html` files for full mockups.
