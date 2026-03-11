# DEMO RUNBOOK

## Goal

Run the AI GYM app in a stable local demo state and show the core flow in about
3 minutes.

## Current Demo Status

- External demo validation: passed
- Current posture: demo-ready, not production-ready
- Verified flows:
  - chat FAQ / handoff
  - booking lookup
  - reschedule
  - cancel
  - admin dashboard review

## Demo Environment

- Node.js: `20.x`
- PostgreSQL: local instance on `localhost:5432`
- Web: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- API health: `http://localhost:3001/health`

## Demo Credentials

- Admin username: `admin`
- Admin password: `admin123456`
- Seeded booking lookup user:
  - phone: `0911111111`
  - email: `ming@example.com`

## Reset Demo Data

Use this before every demo session if you want a known-good state:

```powershell
pnpm demo:reset
```

This does two things only:

1. applies pending Prisma migrations
2. reseeds the `ai-gym-demo` business data

The seed script replaces the existing `ai-gym-demo` records, so the homepage,
lookup flow, and admin dashboard all return to the same baseline data.

## Stable Startup

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
PowerShell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

Wait until the script prints:

- `AI GYM runtime started.`
- `Web: http://localhost:3000`
- `API: http://localhost:3001`

## 3-Minute Demo Flow

1. Open `http://localhost:3000`.
2. In chat, ask: `今晚還有團體燃脂課嗎？`
3. Book one suggested slot.
4. In `My bookings`, look up with:
   - `0911111111`
   - `ming@example.com`
5. Reschedule the booking once.
6. Cancel the booking once.
7. In chat, ask: `我要真人協助`
8. Open `http://localhost:3000/admin`
9. Sign in with:
   - `admin`
   - `admin123456`
10. Show bookings, conversations, and handoff requests.

## Smoke Checks Before Recording

```powershell
(Invoke-WebRequest http://localhost:3001/health).StatusCode
(Invoke-WebRequest http://localhost:3000).StatusCode
(Invoke-WebRequest http://localhost:3000/admin).StatusCode
```

Expected result: all three return `200`.

## Known Demo Boundaries

- This is still a demo build, not a production deployment.
- Admin auth is single-account env-based auth.
- Booking lookup uses `phone + email`, which is acceptable for demo/trial only.
- Demo reset assumes PostgreSQL is reachable on the local machine.
