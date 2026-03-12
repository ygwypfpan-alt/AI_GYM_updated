# AI GYM

## Current Status

This repo is now in deployment stabilization / convergence mode, not feature
expansion mode.

- Public demo stable line: `codex/public-demo-stable`
- Public demo stable commit: `c39729f`
- Pilot deploy line: `codex/deploy-demo`
- Pilot web stable commit: `c5cbb90`

These are two different deployment lines and must not be mixed:

- Public demo: frozen, stable, rollback-safe
- Pilot web: active deployment line for the new pilot web project

## Source Of Truth

### Public demo

- Vercel project: `ai-gym-updated-web`
- Production Branch: `codex/public-demo-stable`
- Stable target: `c39729f`
- Status: stable

### Pilot web

- Vercel project: `ai-gym-updated-pilot-web`
- Deploy line: `codex/deploy-demo`
- Stable target: `c5cbb90`
- Verified API health target:
  `https://aigymupdated-pilot.up.railway.app/health`
- Status: stable

## What This Convergence Closed

The localhost deployment regression was not a single bug. This round closed the
full deployment chain:

1. public API base fallback was too broad
2. `sync-env` could contaminate deployed env values
3. `apps/web` still had localhost hardcoding / fallback in the web path
4. `apps/web` now has a build-time guard so Vercel preview / production does
   not silently ship localhost API targets

## Rollback Targets

### Public demo rollback

- Branch: `codex/public-demo-stable`
- Commit: `c39729f`

### Pilot web stable deploy target

- Branch: `codex/deploy-demo`
- Commit: `c5cbb90`

## Minimal Smoke Checklist

Run this after any deployment change:

1. Homepage opens successfully.
2. `API health` opens the correct Railway URL for that deployment line.
3. The app does not fall back to `localhost:3001` or `localhost:3001/health`.
4. Public demo and pilot web do not share or contaminate each other's env.

## Operator Notes

- Do not treat public demo and pilot web as one shared deployment.
- Do not restart future debugging from the original localhost symptom.
- If a similar regression returns, check the four already-fixed areas first:
  - public API base fallback
  - `scripts/sync-env.mjs`
  - `apps/web/app/page.tsx` and `apps/web/lib/api.ts`
  - `apps/web/next.config.mjs`

## Primary Docs

- `DEPLOYMENT.md`
- `DEMO_RUNBOOK.md`
- `HANDOFF.md`
