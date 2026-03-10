# RELEASE NOTES

## AI_GYM v0.2.0-mvp-plus

Release date: 2026-03-10
Tag: `v0.2.0-mvp-plus`
Base: `v0.1.0-mvp`

## What Changed

- Added admin login with env-based credentials and JWT token auth
- Protected admin APIs and required auth for dashboard access
- Added booking lookup by `phone + email`
- Added direct reschedule and cancel actions from the homepage lookup flow
- Added automated coverage for the new admin and booking lookup flows
- Hardened local setup/dev/test scripts for the Windows + PostgreSQL environment

## Verified In This Release

- `PowerShell -ExecutionPolicy Bypass -File .\scripts\setup.ps1`
- `PowerShell -ExecutionPolicy Bypass -File .\scripts\dev.ps1`
- `PowerShell -ExecutionPolicy Bypass -File .\scripts\test.ps1`
- `pnpm test`
- Live API checks for:
  - `/health`
  - `/api/admin/login`
  - `/api/admin/dashboard`
  - `/api/bookings/lookup`
- Manual acceptance completed by the user for:
  - admin login
  - admin dashboard viewing
  - booking lookup
  - reschedule
  - cancel

## Config Notes

- Admin username is controlled by `ADMIN_USERNAME`
- Admin password is controlled by `ADMIN_PASSWORD`
- Admin JWT secret is controlled by `ADMIN_JWT_SECRET`

## Known Scope Boundaries

- This is still a local MVP+ build, not a production release
- Admin auth is single-account env-based auth, not a full user system
- Booking lookup uses `phone + email`, not a production-grade identity flow
- No deployment, Docker, payment, messaging, or external AI integration is included
