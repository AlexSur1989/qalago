# Stage 6.8B — Local Security Hardening

**Baseline:** `5e0d074` (6.8A audit)  
**Date:** 2026-09-11

## Summary

Local codebase hardening against 6.8A findings: production fail-closed config, refresh sessions, web HttpOnly refresh cookies, AI service auth, upload validation, Redis-ready rate limits, Helmet/error redaction, dependency triage.

## 6.8A disposition (SEC-001..SEC-025)

| ID | Action | Notes |
|----|--------|-------|
| SEC-001 | **MITIGATED** | Next.js bumped (admin/business build on 15.5.x); remaining postcss chain deferred |
| SEC-002 | **MITIGATED** | multer 2.x; Nest transitive chain partially remains |
| SEC-003 | **DEFERRED** | deepmerge-ts/prisma dev tooling; vitest moderate |
| SEC-004 | **FIXED** | Short access JWT + refresh rotation (`AuthSession`) |
| SEC-005 | **FIXED** | Admin/Business Web: memory access + HttpOnly refresh via BFF routes |
| SEC-006 | **FIXED** | AI token required unless `QALAGO_AI_ALLOW_UNAUTHENTICATED=true` (dev only) |
| SEC-007 | **FIXED** | AI CORS no default `*` |
| SEC-008 | **DEFERRED_6_8C** | Dev compose Postgres exposure |
| SEC-009 | **MITIGATED** | Production rejects weak internal token placeholders |
| SEC-010 | **FIXED** | DEV login off in production NODE_ENV + startup guard |
| SEC-011 | **FIXED** | Refresh sessions with hashed storage |
| SEC-012 | **MITIGATED** | `RateLimitStoreService` (Redis + in-memory fallback) |
| SEC-013 | **FIXED** | Magic-byte validation + dimension caps |
| SEC-014 | **FIXED** | Business uploads require `businessId` + PHOTOS_EDIT |
| SEC-015 | **MITIGATED** | Helmet (Nest); Next security headers — full CSP **DEFERRED_6_8C** |
| SEC-016 | **ACCEPTED_MVP** | Missing Origin allowed for mobile (documented) |
| SEC-017 | **MITIGATED** | Redis URL optional; production logs warn on in-memory limits |
| SEC-018 | **MITIGATED** | catalog-api Dockerfile runs as `node` user |
| SEC-019 | **MITIGATED** | `log-redaction.util.ts` |
| SEC-020 | **DEFERRED_7X** | Backup automation; local runbook added |
| SEC-021 | **—** | INFO |
| SEC-022 | **FIXED** | Flutter secure storage + refresh token |
| SEC-023 | **DEFERRED_6_8D** | Social auth hardening |
| SEC-024 | **FIXED** | Existing guard + session tests |
| SEC-025 | **MITIGATED** | Central rate-limit policies; partial endpoint coverage |

## Auth / session

- Access JWT default **20m** (`JWT_EXPIRES_IN`).
- Refresh **30d**, stored as **SHA-256 hash** in `AuthSession`.
- Single-use rotation; replay revokes family.
- Endpoints: `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`.
- Social/OTP/DEV use `AuthSessionService.issueQalaGoSession`.

## Web cookies

- Next.js BFF: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/establish`.
- Refresh: HttpOnly, `SameSite=Lax`, `Secure` in production, path `/api/auth`.
- Access token: in-memory only (`web-auth-token.ts`).

## AI

- `QALAGO_INTERNAL_SERVICE_TOKEN` required in production (catalog + ai-orchestrator).
- Local open mode: `QALAGO_AI_ALLOW_UNAUTHENTICATED=true` only when token unset.

## npm audit

- **Before (6.8A):** 19 (1 critical, 11 high, 7 moderate).
- **After:** 15 total at root after `npm audit fix` + Next update; admin/business workspaces ~4 moderate/high dev tooling.
- Remaining: multer via Nest peer chain, postcss/Next transitive, vitest — no blind `--force`.

## Ops docs

- `docs/security/postgres-backup-restore.md`
- `docs/security/incident-secret-leak-runbook.md`

## Remaining / deferred

- **6.8C:** VPS, TLS, WAF, full CSP, compose hardening.
- **6.8D:** Google/Apple production.
- **6.9:** Legal/privacy.
- **7.x:** Redis TLS, distributed rate limits mandatory, automated backups.

## Migration

`20260911120000_stage_6_8b_auth_sessions` — additive `AuthSession` table.

Legacy clients: old access JWTs work until expiry; then refresh or re-login required.
