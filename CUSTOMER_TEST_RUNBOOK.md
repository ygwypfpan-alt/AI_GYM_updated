# CUSTOMER TEST RUNBOOK

## Goal

Operate the app as a limited external customer-test build on top of the
`v0.3.1-final-handoff` baseline.

## Intended Posture

- small customer cohort only
- manual support available during the test window
- resettable environment
- not a production release

## Reset And Seed

Use either command before a new round of testing:

```powershell
pnpm demo:reset
pnpm customer-test:reset
```

Expected seeded records after reset:

- lookup account: `0911111111 / ming@example.com`
- admin account: `admin / admin123456`
- booking states for lookup testing:
  - upcoming `BOOKED`
  - future `CANCELLED`
  - past `COMPLETED`

## Test Focus

Use this branch to verify these external-trial flows:

1. Homepage loads and service data renders.
2. Lookup works with `phone + email`.
3. Upcoming bookings can be rescheduled.
4. Upcoming bookings can be cancelled.
5. Cancelled or past bookings are shown as view-only.
6. Admin can search bookings by customer/service/staff text.
7. Admin can filter bookings by status.

## Quick Verification

```powershell
(Invoke-WebRequest http://localhost:3001/health).StatusCode
(Invoke-WebRequest http://localhost:3000).StatusCode
(Invoke-WebRequest http://localhost:3000/admin).StatusCode
pnpm test
```

Expected:

- all HTTP checks return `200`
- e2e tests pass

## Known Boundaries

- no payment flow
- no LINE integration
- no production-grade RBAC
- no analytics
- no large AI expansion

## Recovery Path

If customer testing leaves the data in an unknown state, run:

```powershell
pnpm customer-test:reset
```

Then re-check:

- homepage
- lookup
- reschedule
- cancel
- admin filter
