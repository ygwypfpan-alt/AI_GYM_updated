# DEPLOYMENT

## Deployment Posture

This repo is in deployment stabilization / convergence, not feature work.

There are two distinct web deployment lines:

- Public demo line: `codex/public-demo-stable` at `c39729f`
- Pilot web line: `codex/deploy-demo` at `c5cbb90`

Do not mix these two lines in Vercel or in env management.

## Deployment Map

### Public demo

- Vercel project: `ai-gym-updated-web`
- Production Branch: `codex/public-demo-stable`
- Stable rollback target: `c39729f`
- Purpose: frozen public demo

### Pilot web

- Vercel project: `ai-gym-updated-pilot-web`
- Deploy branch: `codex/deploy-demo`
- Stable deploy target: `c5cbb90`
- Verified API health target:
  `https://aigymupdated-pilot.up.railway.app/health`
- Purpose: active pilot-facing web line

## Required Separation

Public demo and pilot web are separate deployment lines.

- Do not point both Vercel projects at the same branch.
- Do not share web env values between the two projects.
- Do not assume a public demo rollback also rolls back pilot web.

## Convergence Facts Closed In This Round

The deployment stabilization work closed four already-confirmed failure points:

1. public API base fallback was too broad
2. `sync-env` could write incorrect deployment values
3. `apps/web` contained localhost hardcoding / fallback on the web path
4. `apps/web` build-time guard now blocks localhost API targets in Vercel
   preview / production

If a similar regression returns, start with those four areas. Do not restart
from scratch by re-tracing the old localhost symptom first.

## Minimal Rollback Guide

### Roll back public demo

Target:

- Branch: `codex/public-demo-stable`
- Commit: `c39729f`

Use this when the old public demo project needs to be restored to the frozen
stable line.

### Roll back or re-stabilize pilot web

Target:

- Branch: `codex/deploy-demo`
- Commit: `c5cbb90`

Use this when the pilot web project needs to return to the last verified stable
deployment line.

## Minimal Smoke Checklist

Run this after any deploy, rollback, or branch change:

1. Homepage opens.
2. `API health` opens the correct Railway URL for that project.
3. No page or health link falls back to `localhost:3001` or
   `localhost:3001/health`.
4. Public demo and pilot web env values remain isolated.

## Ownership Notes

- Public demo project owner should treat `codex/public-demo-stable` as frozen.
- Pilot web project owner should treat `codex/deploy-demo` as the active deploy
  line.
- This document is the handoff baseline for rollback and maintenance, not a
  feature roadmap.
