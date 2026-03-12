# FEEDBACK TRIAGE

## Scope

This file records internal-test readiness findings after deployment
stabilization. It is not a feature backlog.

## Blocker

- None currently confirmed after the latest deployment convergence fixes.

## Bug

- `apps/web/components/chat-widget.tsx`
  - Client-facing Chinese copy is still visibly garbled in multiple places.
  - This is not a deployment blocker, but it is a real UI bug for internal
    testing quality.
- `tests/e2e/health.spec.ts`
  - Homepage and admin dashboard success coverage were previously missing.
  - This round closes that gap.

## Polish

- `apps/web/components/chat-widget.tsx`
  - Residual client `console.error('Failed to load services:', error)` remains.
  - Acceptable for now, but noisy during internal browser testing.
- `apps/api/src/app.ts`
  - `console.error('Unhandled API error:', error)` is still present.
  - Acceptable operational logging, but should stay intentional rather than
    debug drift.
- `apps/api/src/index.ts`
  - Startup `console.log(...)` remains in the API entrypoint.
  - Fine for local/internal use, but should be revisited before broader
    production posture.
- `apps/web/app/page.tsx`
  - Demo-oriented copy such as `Demo flow` and `Demo shortcuts` remains.
  - This is expected for the public demo line, but should not be mistaken for
    generic product copy.

## Reset And Test Data Notes

- Demo reset command: `pnpm demo:reset`
- Test runner baseline: `PowerShell -ExecutionPolicy Bypass -File .\scripts\test.ps1`
- `scripts/test.ps1` now resets demo data before running tests so the internal
  smoke path starts from a known dataset.
