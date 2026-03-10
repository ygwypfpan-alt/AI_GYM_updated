# CHANGELOG

## v0.2.0-mvp-plus

- Added minimal admin login with env-based credentials and JWT protection for `/api/admin/*`
- Added booking lookup by `phone + email`
- Added homepage "My bookings" flow with direct reschedule and cancel actions
- Added e2e coverage for admin login, unauthorized admin access, booking lookup, reschedule, and cancel
- Stabilized local scripts so setup, dev, and test can start PostgreSQL automatically
- Updated admin login copy to point to the real `.env` credentials

## v0.1.0-mvp

- Initial local demo baseline with chat booking flow, admin dashboard, seed data, and cold-start validation
