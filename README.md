# MedMate — the family medication adherence companion

**Never miss a dose that matters.**

MedMate watches the clock so your family can watch over the people they love.
It reminds elderly family members to take their medicines on time, confirms
every dose with one tap, alerts caregivers when a dose goes unconfirmed, warns
before a medicine strip runs out, and produces a doctor-visit adherence report —
all in the family's own timezone.

---

## Problem Statement

Families in India (and everywhere) manage elderly parents' medications through
paper pillboxes and WhatsApp reminders. The failures are predictable:

- **Missed doses stay invisible.** An elderly parent forgets a dose; the adult
  child in another city finds out days later — often after a health scare.
- **Double-dosing happens.** "Did I take the morning tablet?" has no reliable answer.
- **Stock runs out silently.** Nobody notices the strip is empty until the pharmacy is closed.
- **Doctors get guesses.** "He takes his medicines regularly… mostly" is not adherence data.

## Target Users

- **Caregivers** — adult children or family members managing medication for
  elderly parents, from the same home or a different city.
- **Members** — the person taking the medicines. MedMate gives them a
  deliberately simple, large-button screen designed for aging eyes and hands.

## Solution

One family circle, four automatic loops:

```text
            ┌──────────────────────────────────────────────────┐
            │  Scheduler (cron tick every minute, family-tz)   │
            └──────────────────────────────────────────────────┘
                 │ due            │ grace elapsed       │ stock low
                 ▼                ▼                     ▼
          Dose becomes      Escalation: dose         Refill alert to
          visible + fires   marked MISSED + all      all caregivers
          a reminder        caregivers notified
                 │
                 ▼
   Member taps "I took it" (or caregiver confirms on their behalf)
                 │
                 ▼
   Stock decrements → adherence recomputed → weekly digest on Sunday
```

1. **Reminder loop** — every scheduled dose materialises at its exact time in
   the family's timezone and fires in-app + browser notifications.
2. **Escalation loop** — if a dose isn't confirmed within the family's grace
   window (default 60 min), it is marked *missed* and every caregiver is
   notified (in-app, and by email when SMTP is configured). Escalation is
   one-shot per dose.
3. **Stock loop** — every *taken* confirmation decrements the medicine's stock.
   When stock ≤ threshold, caregivers get one refill alert (cleared by refilling).
4. **Reporting loop** — 7/30/90-day adherence with streaks, a daily heatmap and
   a per-medication breakdown, printable as a PDF to carry to the doctor, plus
   a Sunday-evening weekly digest notification.

## Key Features

- Family circle with **two roles**: caregivers (manage) and members (confirm
  their own doses; they see *only* their own data)
- Caregiver **dashboard**: due-right-now doses with Taken / Skip / Snooze (15 min × 3),
  missed-dose strip, refill alerts, 7-day adherence rings per member
- **Medication manager**: dose times, days-of-week, dosage form, instructions,
  stock + threshold, stop/resume (future doses cancel cleanly)
- **Member self-view** — large-touch "My Medicines" screen with browser notifications
- **Demo control room** — `POST /api/demo/tick` drives a real reminder or a forced
  escalation on demand, so missed-dose alerting can be shown live in the demo video
- **Adherence reports** — heatmap, per-medication bars, best/worst insight,
  streaks, print/PDF for doctor visits
- **Invite system** — caregivers join via a family invite code
- Notification center with unread badge; optional email alerts (SMTP)

## Tech Stack

| Layer | Choices |
|---|---|
| Backend | Node.js, **Express 5**, **Mongoose 9** (MongoDB), JWT in **httpOnly cookies**, bcrypt, helmet, express-rate-limit |
| Scheduling | **node-cron** minute tick, timezone math via `Intl` (DST-safe), one-shot escalations |
| Frontend | **React 19**, **Vite**, **Redux Toolkit** (@reduxjs/toolkit) for live schedule + notification state, **axios** with credentials, **React Router 7**, **Tailwind CSS 4** |
| Files | Multer uploads; Cloudinary when configured, local `/uploads` fallback |
| Email (optional) | Nodemailer |
| Testing | 21-check end-to-end smoke suite on in-memory MongoDB (`npm run smoke`) |

## Architecture

```text
medmate/
├── backend/
│   ├── index.js                 # boots: DB → HTTP → immediate tick → cron
│   ├── app.js                   # Express app (exported for tests)
│   ├── config/db.js
│   ├── models/                  # Family, User, Member, Medication,
│   │                            # DoseEvent, Notification
│   ├── controllers/             # auth, family, medication, dose,
│   │                            # notification, report
│   ├── routes/                  # /api/auth, /api/family, /api/medications,
│   │                            # /api/doses, /api/notifications, /api/reports
│   ├── middlewares/             # protect (JWT cookie), caregiverOnly,
│   │                            # error handler, multer upload
│   ├── utils/                   # timezone engine, token, mailer, cloudinary
│   ├── jobs/scheduler.js        # THE ENGINE: tick = materialise doses,
│   │                            # escalate misses, refill alerts, digest
│   └── scripts/                 # seed.js (demo data), smokeTest.mjs
└── frontend/
    └── src/
        ├── api/axios.js         # credentials-aware instance
        ├── context/AuthContext  # session + family
        ├── redux/               # scheduleSlice, notificationSlice (polling)
        ├── components/          # Layout (sidebar + notification center),
        │                        # DoseCard, MedForm, AdherenceRing, guards…
        └── pages/               # Landing, Login, Register, Onboarding,
                                 # Dashboard, MyMeds, MemberDetail,
                                 # Medications, Reports, Notifications, Settings
```

**Key engineering decisions**

- **Wall-clock vs absolute time.** Dose times are stored as family-local
  `"HH:mm"` labels; the scheduler converts them to UTC instants with a
  DST-safe `Intl`-based converter. Changing the family timezone changes
  future reminders — never history.
- **Self-healing dose materialisation.** The tick creates any of *today's*
  passed-but-unmaterialised slots (unique index keeps it idempotent), so a
  server restart never drops a dose — while a medication added mid-day does
  not retroactively "owe" earlier slots (`scheduledFor ≥ createdAt` rule).
- **DoseEvent as a state machine**: `pending → taken | skipped | missed |
  cancelled`, with `snoozeCount`, `escalatedAt` and `actedBy` capturing the
  full audit trail.
- **Family scoping everywhere**: every query filters by `req.user.family`;
  member accounts are additionally scoped to their own doses/reports.
  Verified by smoke tests (cross-family access → 404, member → own data only).

## Local Setup

Prerequisites: **Node 20+** and **MongoDB** running locally (or an Atlas URI).

```bash
# 1. backend
cd backend
npm install
cp .env.example .env          # defaults work for local MongoDB
npm run seed                  # optional: demo family with 14 days of history
npm run dev                   # → http://localhost:5050  (port 5000 is AirPlay on macOS)

# 2. frontend (new terminal)
cd frontend
npm install
npm run dev                   # → http://localhost:5173 (proxies /api → :5050)
```

Open http://localhost:5173 and log in:

| Role | Email | Password |
|---|---|---|
| Caregiver | `priya@medmate.demo` | `demo12345` |
| Member (elderly view) | `ramesh@medmate.demo` | `demo12345` |

Verify the backend test suite any time with `cd backend && npm run smoke`.

## Environment Variables

See `backend/.env.example`. Required: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`.
Optional: `PORT`, `ESCALATION_AFTER_MIN`, SMTP settings (email alerts),
Cloudinary settings (avatar storage — falls back to disk).

Secrets are never committed; `.env` is git-ignored.

## Deployment

The reference deployment splits the two apps:

- **MongoDB Atlas** — free M0 cluster
- **Backend → Render** — new Web Service from the repo, root dir `backend`,
  start command `npm start`, env vars from `.env.example` with `NODE_ENV=production`,
  `CLIENT_URL=https://your-frontend.vercel.app` and the Atlas `MONGO_URI`.
  The cookie is sent `sameSite: none; secure: true` in production, which works
  cross-domain (Render API + Vercel frontend).
- **Frontend → Vercel** — root dir `frontend`, framework Vite, env var
  `VITE_API_URL=https://your-backend.onrender.com`.

*(Deployment links are added here once the final hosting is wired up.)*

## Demo Script (3–5 min)

1. Landing page — the problem in one sentence (0:00)
2. Log in as Priya (caregiver): dashboard with today's timeline, refill alert,
   adherence rings (0:30)
3. The demo moment: a dose comes due → reminder fires → ignore it → 60 seconds
   later (compressed) the escalation alert appears for caregivers (1:30)
4. Switch to Ramesh (member): the large-button "I took it" flow → stock
   decrements live on the caregiver dashboard (2:30)
5. Reports: 30-day heatmap, per-medication breakdown → Print/Save PDF (3:30)
6. Architecture tour: the scheduler tick, the DoseEvent state machine (4:00)

## Author

Built as an end-term software project, October 2026.
