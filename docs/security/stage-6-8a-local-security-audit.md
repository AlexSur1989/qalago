# Stage 6.8A — Local Security Readiness Audit

**Date:** 2026-09-11  
**Baseline commit:** `e930526af65fc77f41804fe70ed76fec64e43c6c`  
**Mode:** Read-only audit (no hardening implemented in this stage)

## Executive summary

QalaGo has **meaningful security foundations** for an MVP: server-side RBAC via `BusinessAccessService`, JWT guard **re-loads role and `isActive` from PostgreSQL** (JWT role claim is not authoritative), production env validation blocks dev auth flags, OTP hashing + rate limits, monetization purchase integrity (6.7B/C), IDOR tests on several onboarding flows, audit logging on sensitive business/monetization actions, and Flutter **secure storage** for tokens.

**No committed live production secrets** were found in tracked files; `.env` is gitignored and has no git history in this repo. **Placeholder/example secrets** exist in `infra/env/*.example`, compose templates, CI env, and local `.env` (dev-only fingerprints — not reproduced here).

**Primary gaps before public Internet deployment:** dependency CVEs (Next.js critical chain), **misconfiguration risk** (dev login / weak JWT / AI service token), **7-day bearer tokens without refresh/revocation**, **Admin/Business Web tokens in `localStorage` (XSS theft)**, in-memory rate limits, upload content validation depth, missing security headers (Helmet/CSP), and **no production backup/incident runbooks in repo**.

**Verdict:** Hardening required before production; no single repo defect forces **STAGE 6.8A BLOCKED**, provided production is not exposed with dev defaults.

## Scope & method

Monorepo review: `catalog-api`, `ai-orchestrator`, `admin-web`, `business-web`, `mobile`, `packages/*`, `infra/*`, `.github/workflows`, Prisma schema/migrations, dev scripts.

Commands run: `git` baseline, `npm audit`, `npx prisma validate`, targeted code search (secrets, raw SQL, XSS, DEV login, CORS, uploads), review of existing security-related unit tests.

Git history: no tracked `services/catalog-api/.env` commits observed.

---

## Environment separation

| Environment | Status |
|-------------|--------|
| **LOCAL** | Fully wired; dev scripts enable `DEV_LOGIN_ENABLED`, `QALAGO_DEV_LOGIN`, weak internal service token in `scripts/dev/start-all.ps1`. |
| **TEST/CI** | CI uses placeholder `JWT_SECRET`, `OTP_DEBUG=true` (CI only). |
| **STAGING** | `docker-compose.staging.yml` + `.env.staging.example` (placeholders). |
| **PRODUCTION** | `assertProductionConfig` (Joi custom) **fails startup** if `OTP_DEBUG`, `DEV_LOGIN_ENABLED`, `MOCK_PLAN_CHECKOUT_ENABLED`, weak JWT, empty/wildcard CORS, or no auth method enabled. |

**Gap:** `docker-compose.prod.yml` sets `OTP_DEBUG: false` but does not explicitly set `DEV_LOGIN_ENABLED=false` (relies on app default `false` + validation when `NODE_ENV=production`).

---

## Risk register

Severity: **CRITICAL / HIGH / MEDIUM / LOW / INFO**.  
Class: **A** = exploitable local/dev now · **B** = dangerous if deployed as-is · **C** = missing production control · **D** = architectural.

| ID | Sev | Class | Component | Finding | Impact | Remediation stage |
|----|-----|-------|-----------|---------|--------|-------------------|
| SEC-001 | HIGH | B | deps / Next.js | npm audit: **1 critical**, multiple Next.js advisories (SSRF/RCE/DoS classes) on pinned Next 15.x tree | Compromise of admin/business web host | 6.8B |
| SEC-002 | HIGH | B | deps | **multer** DoS/CVE chain via `@nestjs/platform-express` | API availability / upload abuse | 6.8B |
| SEC-003 | HIGH | B | deps | **sharp/postcss/prisma/deepmerge-ts/joi** high/moderate advisories | Varies; mostly build-time / DoS | 6.8B |
| SEC-004 | HIGH | B | auth | Single **JWT access token ~7d**, no refresh rotation/revocation | Stolen token valid until expiry | 6.8B |
| SEC-005 | HIGH | B | admin/business-web | Bearer token in **`localStorage`** | XSS → account takeover | 6.8B / 6.8C |
| SEC-006 | HIGH | B | ai-orchestrator | If `QALAGO_INTERNAL_SERVICE_TOKEN` unset and `NODE_ENV≠production`, **`verifyServiceToken` allows all requests** | Open AI/mod endpoints on LAN if port exposed | 6.8B |
| SEC-007 | HIGH | B | ai-orchestrator | Default **`CORS_ORIGIN=*`** | Browser abuse if token leaked/missing | 6.8B |
| SEC-008 | HIGH | B | infra | `docker-compose.dev.yml` **Postgres password `qalago_dev` on 5432** | Credential leak if host firewall open | 6.8C (VPS) |
| SEC-009 | MEDIUM | B | dev scripts | Hardcoded **`dev-internal-service-token-change-me`** in `start-all.ps1` | Service impersonation if reused in prod | 6.8B |
| SEC-010 | MEDIUM | B | auth | **`POST /auth/dev-login`** returns 404 when disabled (good), but **any phone → JWT** when enabled | Full account impersonation if flag on in prod | 6.8B (guard + deploy) |
| SEC-011 | MEDIUM | C | auth | **No refresh tokens**; logout is client-side token discard | Cannot invalidate stolen sessions | 6.8B |
| SEC-012 | MEDIUM | C | rate-limit | **In-memory** sliding windows (OTP, analytics, ads, onboarding) | Bypass under multi-instance / restart | 6.8B |
| SEC-013 | MEDIUM | B | uploads | MIME allowlist only; **no magic-byte** check; extension from client name | Polyglot/mislabeled uploads | 6.8B |
| SEC-014 | MEDIUM | B | uploads | `POST /uploads` any **BUSINESS** role user can upload **without business scoping** | Storage DoS / orphan files | 6.8B |
| SEC-015 | MEDIUM | C | API | **No Helmet** / CSP / HSTS in Nest `main.ts` | Browser-side attack surface | 6.8C |
| SEC-016 | MEDIUM | C | CORS | Requests **without `Origin`** always allowed (mobile/server) | Expected for mobile; document for web | 6.8C |
| SEC-017 | LOW | C | redis | Redis in compose **unused** by API; rate limits not distributed | Future scaling gap | 7.x |
| SEC-018 | LOW | B | docker | API Dockerfile runs as **root**; no non-root USER | Container escape impact | 6.8C |
| SEC-019 | LOW | C | logging | No centralized **log redaction** policy for Authorization headers | Secret leakage in logs | 6.8B |
| SEC-020 | LOW | C | backup | No automated **backup/restore runbook** in repo | Data loss recovery | 6.8C / 7.x |
| SEC-021 | INFO | D | swagger | No Swagger exposed | Lower doc leakage risk | — |
| SEC-022 | INFO | A | mobile | Access token in **FlutterSecureStorage** | Good baseline for store release | 6.8B verify |
| SEC-023 | MEDIUM | C | social auth | Google/Apple scaffold with **AuthIdentity** + tombstones; email auto-link rules in `SocialAuthLoginService` | Must harden before 6.8D | 6.8D |
| SEC-024 | LOW | B | JWT | Guard uses **`verifyAsync` + DB role** | Mitigates JWT role tampering | Keep in 6.8B tests |
| SEC-025 | MEDIUM | C | abuse | No global API rate limit; monetization order create not separately throttled | Abuse / cost | 6.8B |

Evidence pointers: `jwt-auth.guard.ts`, `production-config.util.ts`, `auth.service.ts`, `main.ts`, `uploads.service.ts`, `service-auth.ts`, `start-all.ps1`, `docker-compose.dev.yml`, `.gitignore`, `npm audit` output (19 vulns).

---

## Existing strong controls

- **Production config gate:** `validation.schema.ts` + `assertProductionConfig`.
- **JWT:** HS256 via `@nestjs/jwt`; inactive users rejected on each request.
- **DEV login:** Hidden as 404 when disabled; cannot select admin role via dev-login body.
- **OTP:** SHA-256 hashed at rest; send/verify rate limits; debug code only if `OTP_DEBUG`.
- **RBAC:** `RolesGuard` + `BusinessAccessService` / `MonetizationAccessService` / `SystemAccessService`.
- **Monetization:** Server-side pricing, snapshots, idempotency, purchase-states; tests in 6.7B/C/QA.
- **IDOR tests:** business applications, ownership claims, uploads delegation, analytics export auth.
- **CSV export:** Stage 6.6F formula-injection mitigations (see existing specs).
- **Analytics:** Pseudonymous visitor handling documented; manager permission gates.
- **Prisma:** Parameterized `$executeRaw` advisory locks only (no `*Unsafe` in app code).
- **SSRF:** No generic user-URL fetch in catalog-api; AI orchestrator calls catalog API with server-side client (review in 6.8B).

---

## Authentication & JWT (summary)

- **Transport:** Bearer JWT in `Authorization` header (not cookie-based) → **CSRF risk low** for API; XSS still critical for web clients.
- **Lifetime:** `JWT_EXPIRES_IN` default **7d** (`validation.schema.ts`).
- **Refresh:** Not implemented.
- **Revocation:** Deactivate user blocks new requests; no token blacklist.

## DEV login (summary)

- Backend: `DEV_LOGIN_ENABLED` + `@Public() POST /auth/dev-login`.
- Frontends: `NEXT_PUBLIC_QALAGO_DEV_LOGIN`, Flutter `QALAGO_DEV_LOGIN` dart-define.
- **Misconfig risk (B):** Production startup should fail if enabled; still require deploy checklist.

## IDOR / BOLA (summary)

Pattern: sensitive modules use `assertCanManageBusiness`, `assertOrderAccess`, membership checks. Explicit IDOR denial tests exist for applications and ownership claims. **Recommendation for 6.8B:** systematic controller audit checklist (not repeated here per endpoint).

## Uploads (summary)

- Allowed: JPEG/PNG/WebP/GIF; 5MB; UUID filename.
- Gaps: no SVG (good), no content sniffing, public `/uploads/` static serving (verify nginx path in deploy docs).

## Docker / compose (summary)

- **Dev:** Postgres/Redis published to host — **acceptable LOCAL (A)**, never copy to public VPS (B).
- **Prod compose:** JWT required; uploads volume; Postgres **not** published (good).

## Dependency audit (2026-09-11)

`npm audit`: **19 vulnerabilities (1 critical, 11 high, 7 moderate)**. Do not blind `audit fix --force` (multer breaking).

## Mobile / Android

- **Release manifest:** no cleartext flag (debug manifest may — intentional local drift, not for release).
- Tokens: `flutter_secure_storage` via `AuthStorage`.

## CI / GitHub

- Workflow: checkout@v4, setup-node@v4, minimal secrets (`JWT_SECRET` test placeholder only).
- No `pull_request_target` observed.
- Branch protection not verifiable from repo.

---

## Release blockers

### Must fix before any public Internet deployment

1. Strong unique **`JWT_SECRET`**, **`DEV_LOGIN_ENABLED=false`**, **`OTP_DEBUG=false`**, explicit **`CORS_ORIGINS`**, **`QALAGO_INTERNAL_SERVICE_TOKEN`** for AI.
2. Do not expose Postgres/Redis/dev compose ports publicly.
3. Address **critical/high** dependency advisories on exposed web surfaces (Next.js chain).
4. Confirm AI orchestrator **not reachable** without service token in production.
5. Remove/replace default internal service token from any production env.

### Must fix before App Store / Google Play

1. **Secure token storage** (Flutter — already using secure storage; verify release config).
2. No **DEV login** in release builds (`QALAGO_DEV_LOGIN=false`).
3. **HTTPS-only** API URLs in release; ATS/Android network security.
4. Privacy/account deletion behavior aligned with store policies (legal 6.9).

### Can defer after MVP

- Refresh tokens / session revocation UX
- Redis-backed rate limits
- Helmet/CSP fine-tuning
- Object storage signed URLs
- Full incident response playbook
- PostgreSQL least-privilege runtime user split from migrator

---

## Recommended Stage 6.8B order

1. **Secrets & production env guards** — deploy checklist, AI token required, remove dev tokens from prod paths.
2. **Dependency upgrades** — Next.js/multer/sharp/postcss triage with tests.
3. **Token model** — refresh rotation or shorter access + secure web storage migration plan.
4. **RBAC/IDOR pass** — controller audit + regression tests for remaining ID parameters.
5. **Rate limiting** — Redis-backed shared limiter for auth/analytics/orders.
6. **Upload hardening** — magic bytes, business-scoped upload quota, orphan cleanup.
7. **Security headers & CORS policy** — Nest Helmet; tighten AI CORS.
8. **Logging redaction & audit coverage gap analysis**.
9. **Backup/restore documentation** for PostgreSQL + uploads volume.

## Deferred

- **6.8C:** VPS, TLS, firewall, WAF, Docker non-root, backup automation.
- **6.8D:** Google/Apple production hardening, email linking policy tests.
- **6.9:** Legal/privacy completeness.
- **7.x:** Advanced fraud, WAF rules, penetration test.

---

## Audit commands run

```text
git status / rev-parse
npm audit
npx prisma validate (catalog-api)
Code search: secrets, raw SQL, DEV_LOGIN, CORS, uploads, localStorage, dangerouslySetInnerHTML
```

No lockfile changes. No production infrastructure changes.
