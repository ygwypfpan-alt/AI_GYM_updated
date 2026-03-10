# NEXT STEP API CONTRACT

This file locks the Day 1 contract for `codex/feat/next-step`.

## Scope

- Add minimal admin auth with env-based credentials and JWT
- Add booking lookup by `phone + email`
- Keep existing booking reschedule / cancel flows and reuse them from the new lookup UI
- Do not add full user auth, RBAC, refresh tokens, or external integrations in this iteration

## Environment Variables

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
ADMIN_JWT_SECRET=change-this-to-a-long-random-string
```

## Admin Login

```http
POST /api/admin/login
Content-Type: application/json
```

Request:

```json
{
  "username": "admin",
  "password": "secret"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "token": "<jwt-token>"
  }
}
```

Failure response:

```json
{
  "success": false,
  "error": {
    "message": "Invalid admin credentials."
  }
}
```

## Admin Me

```http
GET /api/admin/me
Authorization: Bearer <jwt-token>
```

Success response:

```json
{
  "success": true,
  "data": {
    "username": "admin"
  }
}
```

Unauthorized response:

```json
{
  "success": false,
  "error": {
    "message": "Unauthorized."
  }
}
```

## Admin Dashboard

Existing endpoint stays in place:

```http
GET /api/admin/dashboard?businessSlug=ai-gym-demo
Authorization: Bearer <jwt-token>
```

Behavior change:

- Return `401` when the bearer token is missing or invalid
- Return the current dashboard payload when authenticated

## Booking Lookup

```http
POST /api/bookings/lookup
Content-Type: application/json
```

Request:

```json
{
  "phone": "0911111111",
  "email": "ming@example.com"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "booking-id",
        "status": "BOOKED",
        "serviceName": "Group Burn Class",
        "staffName": "Coach Bob",
        "startAt": "2026-03-10T10:00:00.000Z",
        "endAt": "2026-03-10T10:45:00.000Z",
        "customerName": "Alex Wang"
      }
    ]
  }
}
```

Rules:

- Normalize `phone` before lookup
- Trim and lowercase `email` before lookup
- Return an empty array when no matching booking exists
- Keep cancelled bookings visible in the result with their current `status`
- Sort results with the nearest upcoming booking first

## Existing Booking Actions

These endpoints stay unchanged and will be reused by the lookup flow:

```http
PATCH /api/bookings/:bookingId/reschedule
PATCH /api/bookings/:bookingId/cancel
```

## Out of Scope

- Full user registration / login
- Multiple admin accounts
- Refresh token / forgot password
- Chat engine redesign
- External LLM, LINE, email, SMS, Docker, deployment
