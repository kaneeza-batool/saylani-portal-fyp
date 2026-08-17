# TITAN Portal

A multi-portal campus management system for Saylani Institute, built as a Final Year Project.

TITAN replaces a single-view admin panel with role-separated portals: a super admin who oversees every campus, campus managers scoped to one campus each, students, trainers, and a job placement portal. Campus isolation is enforced server-side at every layer — REST, real-time sockets, and the audit trail.

---

## Tech stack

**Frontend** — React 18 + Vite, Tailwind CSS, React Router, TanStack Query, Framer Motion, Socket.io client

**Backend** — Node.js, Express, MongoDB + Mongoose, JWT auth via httpOnly cookies, Socket.io, node-cron

**Other** — logistic regression dropout model (custom, no ML framework), Nodemailer, Cloudinary

---

## Quick start

**Prerequisites:** Node.js 18+, MongoDB running locally

```bash
git clone https://github.com/kaneeza-batool/saylani-portal-fyp.git
cd saylani-portal-fyp

cd server && npm install
cd ../client && npm install
```

Create `server/.env`:

```
MONGO_URI=mongodb://localhost:27017/titan-portal
JWT_SECRET=<your secret>
JWT_REFRESH_SECRET=<your secret>
PORT=5000
CLIENT_URL=http://localhost:5173
```

Seed the database:

```bash
cd server
node utils/seedSuperAdmin.js
node utils/seedCampusAndSubAdmin.js
node utils/seedDemoData.js
node utils/seedFeedback.js
```

Run both servers:

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

Frontend at `http://localhost:5173`, API at `http://localhost:5000`.

### Test accounts

| Role | Email | Password | Scope |
|---|---|---|---|
| Super Admin | `admin@titan.com` | `Admin123!` | All campuses |
| Campus Manager | `subadmin.sukkur@titan.com` | `SubAdmin123!` | Sukkur campus only |

---

## Portals

### Super Admin
Full system oversight across every campus. Students, trainers, batches, courses, campuses, the Job Portal, the Donor Portal, employers, quizzes. Includes a campus map, AI insights dashboard, dropout risk predictions, real-time alerts, dark mode, a command palette, CSV/PDF export, and QR-scan attendance (see Architecture).

### Campus Manager (Sub-Admin)
Scoped to exactly one campus. Every query, socket event, and audit entry is filtered to that campus server-side.

| Page | What it does |
|---|---|
| Dashboard | Live KPIs — roster size, pending admissions, active batches, 30-day attendance. Batch capacity overview. |
| Students | Campus roster with batch and payment status. Excludes applicants. |
| Admissions Queue | Approve or reject applicants. An applicant is a `Student` with `status: 'pending'` — no separate collection. |
| Trainers | Campus trainer directory, read-only. |
| Batches | Batch list with trainer, schedule, seats, and live student count. |
| Attendance Reports | Per-student attendance over a date range, filterable by batch. |
| Feedback | Student feedback with per-trainer average ratings. |
| Alerts | Real-time attendance and payment alerts, campus-scoped. |
| Audit Log | Who changed what, when — every write path in the system. |

### Student
Course-scoped dashboard, quizzes with integrity mode, leaderboard, verifiable certificates, notifications, resource library, skill passport, and Ask-a-Doubt. Lives as a standalone app under `student-portal/` (see below), not inside `client/`.

### Trainer
Self-service registration (`/trainer/register`) creates a linked `User{role:'trainer'}` + `Trainer` doc — no seed script provisions trainer accounts. Once logged in: Dashboard (batches from `Slot.trainer` name-matched against the trainer), Batches, Attendance (read-only roster view — attendance itself is marked by Super Admin/Sub-Admin scanning a Student or Trainer ID card, see Architecture), Quizzes, Assignments (create + review submissions, via `trainerDashboardRoutes.js` → `trainerAssignmentController.js`), Students (real roster with per-student grading), Profile.

### Job Portal
Public careers page (`/careers`) lists published, open roles with an optional application deadline, enforced both client- and server-side (a 410 with a clear message, not a silent failure or a 500). Applicants apply per job (resume + optional photo upload); `server/utils/matchScore.js` scores each application 0–100 by keyword overlap between the job's requirements/description and the applicant's skills/experience/education. Super Admin's Applications page shows that score per applicant alongside inline Shortlist/Reject actions (in addition to the fuller status set: pending, reviewed, shortlisted, hired, rejected) — every status change is audit-logged and triggers a status-update email via `server/utils/mailer.js`. Applicants can look up all of their own applications by email at `/careers/status`.

### Donor Portal
Public giving flow (`/donate`) against admin-managed campaigns, with a donor wall and per-campaign progress tracking (confirmed donations only). Card payments are simulated, not connected to a real payment processor — flagged deliberately rather than presented as live.

### Sibling standalone apps
Two more TITAN apps live in this repo as siblings to `client/`/`server/`, each with their own client, server, database connection, and `.env` — not merged into the main app's routing or auth:

| App | Client port | Server port | Notes |
|---|---|---|---|
| `public-website/` — marketing site + public enroll/donate/careers | `5373` | `5200` | `/login` and `/apply` redirect into Student Portal |
| `student-portal/` — the Student portal itself | `5273` | `5100` | Shares the main app's MongoDB (`titan-portal` db) for seed/test data, but has its own auth |

Each app also has its own `README.md` with setup instructions specific to it.

---

## Architecture

### Campus scoping

Campus isolation is the core constraint. A campus manager must never see another campus's data, and the enforcement is server-side at every layer — the client is never trusted with a campus identifier.

**REST** — `campusScope` middleware runs after auth and sets `req.campusFilter` from the authenticated user's `campus_id`. Super admins get `{}` (unrestricted); everyone else gets `{ campus: <their id> }`. Controllers merge this into every query.

**Permissions** — `checkPermission(module, action)` gates each route against the user's permission object. Modules: `STUDENT`, `TRAINER`, `BATCH`, `ADMISSIONS`, `ATTENDANCE_VIEW`, `ATTENDANCE_MARK`, `ATTENDANCE_ADD_MULTI`, `TRAINER_ATTENDANCE_MARK`, `TRAINER_ATTENDANCE_VIEW`, `FEEDBACK`, `ALERTS`, `AUDIT`. Super admins bypass.

**Standard route shape:**

```js
router.get('/',
  restrictTo('super_admin', 'sub_admin'),
  campusScope,
  checkPermission('STUDENT', 'read'),
  controller.list
);
```

**Sockets** — every connection is authenticated from the `accessToken` cookie using the same JWT verification path as the REST middleware. Unverified sockets are disconnected. Authenticated sockets join a room: `campus:<id>` for campus managers, `super-admins` for super admins. Alerts emit to the relevant rooms rather than broadcasting globally.

**Audit** — every write records the actor, action, resource, and campus. Campus resolves from the actor's `campus_id`, falling back to the affected resource's campus when the actor has none. This means a super admin editing a Sukkur student produces an entry the Sukkur manager can see.

### Data model note

`StudentAttendance.campus`, `TrainerAttendance.campus`, and `AttendanceRequest.campus` store the campus **name as a string**, not an ObjectId reference — a snapshot taken at mark time. Every other model uses a real ref.

Queries against these collections must resolve `campus_id` to a `Campus` document and match on `.name`. Passing `req.campusFilter` directly returns zero results with no error, because the filter is ObjectId-shaped and the field is a string. This is known technical debt, documented rather than migrated given project timelines.

### Dropout risk model

A logistic regression classifier scores enrolled students on dropout likelihood, from five features: attendance rate, payment status (overdue and pending as separate signals), enrollment tenure, and application status. Risk bands are low (< 0.3), medium (0.3–0.6), and high (≥ 0.6).

Retrain with `npm run train:ml` in `server/`. The trained weights live in `server/ml/dropoutModel.json`.

**Known limitations:** the model is trained on synthetic data; `attendanceRate` is computed over a student's full history with no time window, so a recent decline is diluted; and `statusPending` correlates with the target by construction rather than predicting it.

### Alert engine

A cron job runs every two minutes, flagging students with three consecutive absences (critical) or overdue payments (warning). Alerts auto-resolve when the underlying condition clears. Each alert emits to its campus room and to super admins, and notifies both the super admin and the relevant campus manager by email.

### QR attendance scanning

Every Student and Trainer ID card (`IDCardModal.jsx` / `StudentIdCardModal.jsx`) encodes a `{org, type, id, name}` QR payload. Super Admin/Sub-Admin scan it at one entry point — `server/controllers/attendanceScanController.js` auto-detects Student vs. Trainer from the payload and marks attendance (check-in/check-out for trainers) accordingly, permission-checked per type and idempotent by design, so a rapid-fire scan line never errors on an accidental repeat scan. Neither the Trainer portal nor the Student portal can mark attendance directly anymore — both are read-only views onto the same records, with a "request a correction" flow as the fallback for a disputed entry.

---

## Repository layout

```
client/src/
  components/       shared UI — modals, tables, sidebar, command palette
  context/          auth, theme, socket, command palette
  portals/
    super-admin/
    sub-admin/
    trainer/
  services/         API client per resource
  layouts/

server/
  controllers/
  middleware/       auth, campusScope, checkPermission
  models/
  routes/
  ml/               dropout model — features, training, scoring
  utils/            seeds, backfills, socket, alert engine, audit logger

public-website/      standalone marketing site (own client + server, see Portals)
student-portal/      standalone Student portal (own client + server, see Portals)
```

`client/` + `server/` at the repo root is the Super Admin / Campus Manager / Trainer app. `public-website/` and `student-portal/` are independent full-stack apps that happen to live in the same repo — each has its own `package.json`, `.env`, and dev server.

---

## Branches

| Branch | Contents |
|---|---|
| `main` | Stable |
| `dev` | Integration branch — includes `client/`+`server/`, `public-website/`, and `student-portal/` as merged subfolders |
| `feature/sub-admin-campus-portal` | Campus manager portal — fully merged into `dev`, `dev` is now ahead |
| `origin/feature/trainer-portal` (remote-only, no local branch) | Earlier trainer portal work — not yet merged into `dev`; `dev` already has its own, further-along trainer portal history |

`student-portal` and `publicwebsite`/`publicwebsite-integration` are older branches — their work has already been merged into `dev` as subfolders and they're not the current source of truth for those apps.

Branch from `dev`, merge back into `dev` via pull request.

**Shared code ownership:** `models/User.js`, the role enum, and everything in `server/middleware/` are shared across all portals. Changes there affect every portal's access control — coordinate before editing.

---

## Team

| Contributor | Area |
|---|---|
| Tooba Malik | Super Admin portal, ML model, alert engine, real-time infrastructure, Jobs portal |
| Kaneeza Batool | Campus Manager portal, campus scoping architecture, socket authentication, audit system |
| Rabbia Sachana | Student portal |
| Areeba | Trainer portal |
| Asifa Soomro | Design — UI/visual design |
| Seerat | Design — UI/visual design |

---

## Known debt

- Attendance models store campus as a cached string rather than a reference (see Architecture)
- `Slot.trainer` is free text, not a reference to `Trainer` — renaming a trainer requires updating both records, and a campus/course combo with no matching `Slot` has no trainer to assign
- The dropout model is trained on synthetic data
- `authController.register` exists but is not wired to a route
- The Job Portal's application emails (submission confirmation, status updates) send through `server/utils/mailer.js`, which falls back to a console-logged Ethereal test inbox when no real `SMTP_HOST` is configured — real delivery needs real SMTP credentials in `server/.env`
- Donor Portal card payments are simulated, not connected to a real payment processor