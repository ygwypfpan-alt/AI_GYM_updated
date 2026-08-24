# FEEDBACK TRIAGE

## Scope

This file records internal-test readiness findings after deployment
stabilization. It is not a feature backlog.

## Blocker

- None currently confirmed after the latest deployment convergence fixes.

## Bug

- `tests/e2e/health.spec.ts`
  - The admin tests logged in with the literal string `change-me`, which is the
    fallback in `apps/api/src/config.ts` when `ADMIN_PASSWORD` is unset.
  - They therefore passed only in a shell with no admin env set, and returned
    401 as soon as `ADMIN_PASSWORD` was exported.
  - Fixed: the spec now logs in with `config.adminUsername` /
    `config.adminPassword`, and the invalid-login case derives a password that
    is guaranteed to differ from the configured one.
  - Verified passing with the admin env unset, with `ADMIN_PASSWORD` set, and
    with both `ADMIN_USERNAME` and `ADMIN_PASSWORD` set.
- `apps/web/components/chat-widget.tsx`
  - Previously recorded as "client-facing Chinese copy is still visibly
    garbled in multiple places". Not reproducible.
  - The source file is clean UTF-8, and a repo-wide scan for mojibake byte
    pairs and U+FFFD over `apps/`, `scripts/` and `tests/` returns no hits.
  - End-to-end check against a locally served production build: `/` and
    `/admin` are served as `text/html; charset=utf-8` with
    `<html lang="zh-Hant">`, and both pages plus the API's Chinese error
    payloads decode as UTF-8 with zero replacement characters.
  - Treat the original report as a viewer-side encoding problem (editor or
    console codepage), not as repo content.

## Polish

- `apps/web/components/chat-widget.tsx`
  - Resolved. The residual `console.error('Failed to load services:', error)`
    is gone.
  - The failure is now surfaced to the user instead of being swallowed: a
    `servicesError` state renders a Chinese notice, and the previously silent
    non-success API response is handled as well.
- `apps/api/src/app.ts` and `apps/api/src/index.ts`
  - Resolved. Both now log through `apps/api/src/lib/logger.ts`
    (`logUnhandledError`, `logStartup`) with an `[ai-gym-api]` prefix, so the
    remaining console output is deliberate operational logging rather than
    debug drift.
- `apps/web/app/page.tsx`
  - Demo-oriented copy such as `Demo flow` and `Demo shortcuts` remains.
  - This is expected for the public demo line, but should not be mistaken for
    generic product copy.

## Lint Debt Closed In This Round

`pnpm lint` runs with `--max-warnings=0` and had been failing on both the
pilot stable target `c5cbb90` and the branch head `594b671`, so it could not
distinguish the two commits:

- `apps/api/src/app.ts` — `'_next' is defined but never used`. The argument
  cannot be dropped, because Express only treats a middleware as an error
  handler when it takes four arguments. `eslint.config.mjs` now configures
  `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: '^_'`, matching
  the `_req` / `_next` convention already used in the codebase.
- `apps/web/components/admin-dashboard.tsx` — `react-hooks/exhaustive-deps` on
  the dashboard load effect. `loadDashboard` is now a `useCallback` keyed on
  `token`, and `onUnauthorized` is held in a ref so that a parent re-render
  does not retrigger the fetch.

## Reset And Test Data Notes

- Demo reset command: `pnpm demo:reset`
- Test runner baseline: `PowerShell -ExecutionPolicy Bypass -File .\scripts\test.ps1`
- `scripts/test.ps1` now resets demo data before running tests so the internal
  smoke path starts from a known dataset.
- `scripts/reset-demo.ps1` and `scripts/test.ps1` are PowerShell-only. On a
  Linux checkout the equivalent smoke path is
  `pnpm --filter @ai-gym/db exec prisma migrate deploy`,
  `pnpm --filter @ai-gym/db prisma:seed`, then `pnpm test`, against a local
  PostgreSQL matching `DATABASE_URL`.
