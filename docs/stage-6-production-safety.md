# Stage 6.0.1 — Production Safety Prerequisites

Status: implemented in code (Stage 6.0.1). Infrastructure and store release items remain open.

## Implemented (code-level)

| Area | Behavior |
|------|----------|
| CORS | Production requires explicit `CORS_ORIGINS`; empty/wildcard fails startup |
| OTP | Send/verify rate limits (phone + IP, cooldown, attempt caps) |
| OTP security | Hash storage, expiry, replay prevention, `OTP_DEBUG` gated |
| Mock checkout | Blocked in `NODE_ENV=production`; dev requires `MOCK_PLAN_CHECKOUT_ENABLED=true` |
| Flutter/Business Web | Mock checkout UI disabled unless explicit dev compile-time/env flags |
| Account deletion | `DELETE /users/me` — hybrid anonymize + deactivate |
| Bootstrap | `npm run bootstrap:super-admin` — one-shot, env phone, no demo data |
| Analytics ingest | IP rate limit on `POST /analytics/events` |
| DEV flags | `OTP_DEBUG`, `DEV_LOGIN_ENABLED`, `MOCK_PLAN_CHECKOUT_ENABLED` fail startup in production |

## Production deploy checklist

1. `prisma migrate deploy` — **not** `npm run seed`
2. `BOOTSTRAP_SUPER_ADMIN_PHONE=+7701… npm run bootstrap:super-admin` (once)
3. Set `CORS_ORIGINS`, strong `JWT_SECRET`, all dev flags `false`
4. Build mobile with `QALAGO_API_BASE_URL` only (no dev/mock flags)
5. Build Business Web without `NEXT_PUBLIC_QALAGO_MOCK_PLAN_CHECKOUT`

## Remaining P0 (not in Stage 6.0.1)

- Real SMS provider integration
- Privacy policy / terms of service content
- Android release signing configuration
- iOS release signing configuration
- Production API build pipeline (dart-define dependency)
- S3 / shared uploads for multi-instance
- Store purchase strategy (IAP / Play Billing)

## Remaining P1

- Nginx / TLS termination
- Backup automation
- Security headers (CSP, HSTS)
- Monitoring / alerting
- Flutter legacy failing tests (pre-existing)
- Upload / photo permission hardening
- Abuse reporting workflow

## Account deletion policy (technical)

- Ordinary users: favorites, reviews, notifications removed; account deactivated
- Managers: membership revoked; business preserved
- Co-owners: membership revoked; business preserved
- Sole owners: blocked with 409 until ownership transferred
- Pending applications/claims: cancelled
- Orders, payments, audit logs: preserved (no PII beyond existing records)
- Post-delete: JWT invalid via `isActive` check
