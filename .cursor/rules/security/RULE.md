# Security Rules — QalaGo

**Scope:** always apply.

## Secrets

- Never commit `.env`, tokens, JWT secrets, DB passwords, API keys.
- Use `infra/env/.env.example` with placeholders only.
- Production secrets: host env / secret manager — not in repo.
- Rotate `JWT_SECRET` before any public deployment.

## Authentication

- MVP: phone OTP → JWT access token.
- **Never return OTP code in API response in production.** Dev-only via explicit `OTP_DEBUG=true`.
- Rate limit: `/auth/send-code` (e.g. 5 req / phone / 15 min).
- Normalize phone to E.164 before storage.
- Passwords: N/A for phone auth; if added later — bcrypt/argon2 only.

## Authorization

- Global JWT guard on API; `@Public()` only for auth and health.
- Role guard on admin/owner routes.
- Resource guards: owner can only mutate own `businessId`.
- `cityId` check: `CITY_ADMIN` limited to assigned cities.

## Input validation

- class-validator / Zod on all request bodies.
- `whitelist: true`, `forbidNonWhitelisted: true` in Nest ValidationPipe.
- Max upload size and allowed MIME types for images.
- Sanitize user text in reviews (XSS in web panels).

## API & transport

- HTTPS only in production.
- CORS: explicit origins, not `*` with credentials in prod.
- Security headers on web apps (CSP baseline when Next.js added).

## Data

- PII: phone, name — minimal collection.
- Logs: no tokens, no OTP, no full phone (mask: `+7***1234`).
- Backups encrypted; dev dumps anonymized.

## AI / agents

- No prod DB write tools for agents without human approval flow.
- Redact PII before LLM prompts.
- Audit log every orchestrator tool call.

## Destructive operations

Require explicit user confirmation:

- `prisma migrate reset`, `db push --force-reset`
- mass delete users/businesses
- `git push --force` to main
- dropping Docker volumes with production data

## Dependencies

- Run `npm audit` before release candidates.
- Pin major versions in services.

## Incident checklist

1. Revoke JWT secret → force re-login.
2. Disable compromised API keys.
3. Review audit logs for agent/tool abuse.
