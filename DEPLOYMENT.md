# DEPLOYMENT

## Status

The codebase has passed external demo validation and is suitable for a public
demo environment. This document records the deployment shape and the manual
platform steps needed to recreate or update that environment.

## Chosen Deployment Path

- Web: Vercel
- API + PostgreSQL: Railway

This path keeps the current architecture intact and avoids a rebuild.

## What Must Be Deployed

### Web app

- Folder: `apps/web`
- Runtime: Next.js
- Required env:
  - `NEXT_PUBLIC_API_BASE_URL`

### API app

- Folder: `apps/api`
- Runtime: Node.js
- Required env:
  - `DATABASE_URL`
  - `API_PORT`
  - `CORS_ORIGIN`
  - `DEFAULT_BUSINESS_SLUG`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `ADMIN_JWT_SECRET`

### Database

- PostgreSQL
- After provisioning, run:

```powershell
pnpm --filter @ai-gym/db exec prisma migrate deploy
pnpm --filter @ai-gym/db prisma:seed
```

## Manual Steps

### 1. Push the demo-ready branch to a Git remote

This requires a human-owned GitHub or Git provider account.

### 2. Provision PostgreSQL in Railway

1. Create a new Railway project.
2. Add PostgreSQL.
3. Copy the Railway PostgreSQL connection string.
4. Save it as `DATABASE_URL` for the API service.

### 3. Deploy the API in Railway

1. Create a service from the repo.
2. Set the root directory to the repo root.
3. Use these commands:
   - Build: `pnpm install && pnpm --filter @ai-gym/shared build && pnpm --filter @ai-gym/db build && pnpm --filter @ai-gym/api build`
   - Start: `node apps/api/dist/index.js`
4. Add env vars:
   - `DATABASE_URL=<railway postgres url>`
   - `API_PORT=3001`
   - `CORS_ORIGIN=<vercel web url>`
   - `DEFAULT_BUSINESS_SLUG=ai-gym-demo`
   - `ADMIN_USERNAME=admin`
   - `ADMIN_PASSWORD=admin123456`
   - `ADMIN_JWT_SECRET=<generate a long random secret>`
5. Run Prisma migration and seed once in Railway shell:

```powershell
pnpm --filter @ai-gym/db exec prisma migrate deploy
pnpm --filter @ai-gym/db prisma:seed
```

### 4. Deploy the web app in Vercel

1. Import the same repo into Vercel.
2. Set the root directory to `apps/web`.
3. Framework preset: Next.js.
4. Add env var:
   - `NEXT_PUBLIC_API_BASE_URL=<railway api base url>`
5. Deploy.

### 5. Smoke test the public demo

Verify:

- `/`
- `/admin`
- API `/health`
- admin login
- booking lookup
- reschedule
- cancel

## Human-Required Platform Ownership

Deployment from this local environment still requires human-controlled access to:

- hosting account login
- Git remote ownership and repo push
- PostgreSQL provisioning in Railway
- Vercel project creation
- production secret generation and storage
- optional custom domain and billing decisions

## Recommended Public Demo Posture

- Keep this as a time-boxed demo environment.
- Do not present it as a production system.
- Reset demo data before demos.
- Rotate `ADMIN_JWT_SECRET` before public exposure.

## Customer-Test Posture

For the `customer-test-ready` branch, keep the same hosting shape but change the
operating posture slightly:

- treat the environment as limited external trial, not production
- run `pnpm customer-test:reset` before each new customer cohort or scripted QA pass
- keep the seeded admin account temporary and rotate it after each external round
- verify booking lookup, reschedule, cancel, and admin booking filters after each deploy
- expect manual support for failed requests; there is still no payment, messaging, or RBAC layer
