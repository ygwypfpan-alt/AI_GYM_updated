# HANDOFF

## Final Deployment Convergence Status

This round is closed as deployment stabilization / convergence, not feature
work.

Two separate web deployment lines are now the source of truth:

- Public demo stable line: `codex/public-demo-stable` / `c39729f`
- Pilot deploy line: `codex/deploy-demo` / `c5cbb90`

## Stable Deployment Ownership

### Public demo

- Vercel project: `ai-gym-updated-web`
- Production Branch: `codex/public-demo-stable`
- Stable rollback target: `c39729f`
- Status: stable

### Pilot web

- Vercel project: `ai-gym-updated-pilot-web`
- Deploy branch: `codex/deploy-demo`
- Stable deploy target: `c5cbb90`
- Verified API health target:
  `https://aigymupdated-pilot.up.railway.app/health`
- Status: stable

## What Was Actually Fixed

The deployment convergence was the combined result of four fixes:

1. public API base fallback no longer allows an over-broad deployment fallback
2. `scripts/sync-env.mjs` no longer pollutes deployed env values
3. the `apps/web` path no longer hardcodes or silently falls back to localhost
4. `apps/web` build-time validation now blocks localhost API targets in Vercel

## Do Not Restart From The Old Symptom

Do not begin future debugging by re-running the original localhost root-cause
search from zero.

If a similar regression appears again, first inspect these already-fixed areas:

1. public API base fallback logic
2. `scripts/sync-env.mjs`
3. `apps/web/app/page.tsx` and `apps/web/lib/api.ts`
4. `apps/web/next.config.mjs`

This should be the default first-pass triage order for any future regression
that smells like env drift or localhost fallback.

## Minimal Rollback Guide

### Public demo rollback

- Branch: `codex/public-demo-stable`
- Commit: `c39729f`

### Pilot web stable deploy target

- Branch: `codex/deploy-demo`
- Commit: `c5cbb90`

## Minimal Smoke Checklist

Use this after deployment, rollback, or branch changes:

1. Homepage opens.
2. `API health` opens the correct Railway URL.
3. The deployment does not fall back to `localhost:3001` or
   `localhost:3001/health`.
4. Public demo and pilot web do not contaminate each other's env values.

## Handoff Reminder

- Public demo and pilot web are different deployment lines.
- Do not mix their branches, env values, or rollback targets.
- This handoff is the operational baseline for maintenance and rollback.
