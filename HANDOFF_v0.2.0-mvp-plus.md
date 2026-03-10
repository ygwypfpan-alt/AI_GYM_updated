# HANDOFF

## Version

- Release: `v0.2.0-mvp-plus`
- Base tag: `v0.1.0-mvp`

## What Was Actually Added In This Round

- Minimal admin auth
  - `POST /api/admin/login`
  - `GET /api/admin/me`
  - protected `/api/admin/dashboard`
- Booking lookup by `phone + email`
  - `POST /api/bookings/lookup`
- Homepage management flow
  - lookup existing bookings
  - reschedule from lookup results
  - cancel from lookup results
- Expanded e2e coverage for the new flows
- Script hardening for the local Windows/PostgreSQL dev environment

## Key Runtime Notes

- Admin credentials come from the root `.env`
- The local default admin config in this repo is:
  - `ADMIN_USERNAME=admin`
  - `ADMIN_PASSWORD=admin123456`
- `scripts/sync-env.mjs` copies the root `.env` into:
  - `apps/api/.env`
  - `apps/web/.env.local`
  - `packages/db/.env`

## Important Files

- API
  - `apps/api/src/routes/admin.ts`
  - `apps/api/src/routes/bookings.ts`
  - `apps/api/src/lib/auth.ts`
  - `apps/api/src/lib/contact.ts`
  - `apps/api/src/middleware/admin-auth.ts`
  - `apps/api/src/services/booking-service.ts`
- Web
  - `apps/web/app/admin/page.tsx`
  - `apps/web/components/admin-shell.tsx`
  - `apps/web/components/admin-login.tsx`
  - `apps/web/components/admin-dashboard.tsx`
  - `apps/web/components/my-bookings.tsx`
- Scripts
  - `scripts/setup.ps1`
  - `scripts/dev.ps1`
  - `scripts/test.ps1`
  - `scripts/ensure-postgres.ps1`
- Tests
  - `tests/e2e/health.spec.ts`

## What Was Verified Before Tagging

- Automated tests passed with `pnpm test`
- Live API login succeeded with the current `.env` admin credentials
- Manual acceptance was completed by the user and marked as passed

## Scope Boundaries For The Next Person

- Do not treat this as a production auth system
- Do not assume booking lookup is a secure identity model
- If you continue development, branch from `v0.2.0-mvp-plus` instead of modifying the tag directly
