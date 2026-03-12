# DEMO RUNBOOK

## Scope

This runbook now documents the stable public demo line after deployment
convergence. It is not the pilot web runbook.

## Stable Public Demo Line

- Vercel project: `ai-gym-updated-web`
- Production Branch: `codex/public-demo-stable`
- Stable commit: `c39729f`
- Status: stable

This line is intentionally separate from pilot web.

## What This Runbook Is For

Use this document when you need to:

- verify the frozen public demo
- hand off demo operations to another operator
- roll public demo back to the known stable target

Do not use this document as the pilot deployment runbook.

## Public Demo Rollback Target

- Branch: `codex/public-demo-stable`
- Commit: `c39729f`

If the public demo regresses, return the old public demo project to this exact
line first.

## Minimal Public Demo Smoke Checklist

1. Homepage opens.
2. `API health` opens the correct Railway URL for the public demo project.
3. The app does not open `localhost:3001` or `localhost:3001/health`.
4. Public demo env is not contaminated by pilot env.

## Local Demo Baseline

For local demo verification, the known lookup pair remains:

- phone: `0911111111`
- email: `ming@example.com`

Admin baseline:

- username: `admin`
- password: `admin123456`

## Local Reset And Startup

Reset demo data:

```powershell
pnpm demo:reset
```

Start local demo services:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
PowerShell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

## Demo Flow Reminder

Minimal operator flow:

1. Open homepage.
2. Verify `API health`.
3. Run booking lookup.
4. Reschedule once.
5. Cancel once.
6. Check admin dashboard.

## Important Boundary

Do not confuse the public demo line with the pilot web line:

- Public demo stable line: `codex/public-demo-stable` / `c39729f`
- Pilot deploy line: `codex/deploy-demo` / `c5cbb90`
