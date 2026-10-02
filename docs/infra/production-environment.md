# Production environment contract (PROD.2)

Local-first contract for VPS deploy later. **No real secrets in git.** Templates: `infra/env/.env.production.example` (public production), `infra/env/.env.staging.example` (Docker QA), `infra/env/.env.example` (developer).

## Runtime profiles

| Profile | `NODE_ENV` | `QALAGO_ENV` | Validation |
|---------|------------|--------------|------------|
| Local dev | `development` | `LOCAL` (default) | Joi only; localhost defaults OK |
| Docker staging | `production` | `STAGING` | Dev bypass flags off; localhost CORS / `OTP_DEBUG` allowed for QA |
| Public production | `production` | `PRODUCTION` | Strict `assertProductionConfig` (fail-fast) |

## Default value policy

| Class | Meaning | Examples |
|-------|---------|----------|
| **SAFE PROD DEFAULT** | May omit in production | `JWT_EXPIRES_IN=20m`, `REFRESH_TOKEN_EXPIRES_DAYS=30`, log-related |
| **DEV ONLY DEFAULT** | Code/templates for local only | `localhost` URLs, dev JWT placeholder in `.env.example` |
| **NO PROD DEFAULT** | Must be set on host | `JWT_SECRET`, `DATABASE_URL`, `POSTGRES_PASSWORD`, `CORS_ORIGINS`, public HTTPS base URLs |

## Secret vs public

| Variable | Secret? | Exposure |
|----------|---------|----------|
| `JWT_SECRET` | Yes | catalog-api server only |
| `QALAGO_INTERNAL_SERVICE_TOKEN` | Yes | catalog-api + ai-orchestrator server only |
| `STAFF_MFA_ENCRYPTION_KEY` | Yes | catalog-api server only |
| `FIREBASE_PRIVATE_KEY` / Admin SDK | Yes | catalog-api server only |
| `DATABASE_URL` | Yes | server only |
| `MAPTILER_API_KEY` | Yes | server only |
| S3 keys (PROD.3) | Yes | server only |
| `NEXT_PUBLIC_*` | No | Baked into browser bundle — API URL, public site URL only |
| Flutter `QALAGO_*` dart-defines | No | Public API/base URLs + Firebase client ids |

## Canonical local dev ports

| Service | Port |
|---------|------|
| Admin Web | 3001 |
| catalog-api | 3002 |
| Business Web | 3003 |
| ai-orchestrator | 3004 |
| Consumer Web | 3005 |

Production may use different host/container ports; do not assume 3001–3005 on VPS.

## JWT TTL (canonical)

- **Access token:** `JWT_EXPIRES_IN` default **`20m`** (`validation.schema.ts`, `env.config.ts`).
- **Refresh session:** `REFRESH_TOKEN_EXPIRES_DAYS` default **`30`**.
- **Drift fixed (PROD.2):** dev template previously showed `7d`; aligned to **`20m`**.

**Rotation:** Changing `JWT_SECRET` invalidates existing access tokens; plan maintenance window.

## DATABASE_URL

Required in all environments (Joi). Strict production: non-empty `postgresql://`, no localhost host.

## REDIS_URL

Optional (empty = in-memory rate limits). **PROD.5** will define mandatory Redis for production scale; PROD.2 documents contract only.

## CORS_ORIGINS

Strict production: comma-separated **HTTPS** origins, no `*`, no localhost. Staging profile allows localhost for Docker QA.

## Public URL variables

| Variable | Owner | Role |
|----------|-------|------|
| `CONSUMER_WEB_BASE_URL` | catalog-api | Server-generated links (legal, emails) |
| `QALAGO_PUBLIC_BASE_URL` | catalog-api | Alias fallback for consumer base URL |
| `BUSINESS_WEB_BASE_URL` | catalog-api | Team invites, owner links |
| `NEXT_PUBLIC_API_URL` | Next apps | Browser API prefix (build-time) |
| `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` | Consumer Web | Canonical public site URL |
| `NEXT_PUBLIC_CONSUMER_WEB_URL` | Business Web | Legal/help links to consumer site |
| `QALAGO_API_BASE_URL` | Flutter | Mobile API (dart-define) |

Precedence (catalog-api consumer URL): `CONSUMER_WEB_BASE_URL` → `QALAGO_PUBLIC_BASE_URL` → dev localhost default.

## Dangerous flags (production `NODE_ENV`)

Must be false for any `NODE_ENV=production` stack: `DEV_LOGIN_ENABLED`, `MOCK_PLAN_CHECKOUT_ENABLED`, `TEST_AUTH_BYPASS_ENABLED`.

Strict production also requires: `OTP_DEBUG=false`, non-mock geocoding, HTTPS public base URLs.

## Object storage & SMS

- **S3:** placeholder names in `.env.production.example` only — **PROD.3** implements wiring.
- **SMS:** provider not selected; no vendor env contract until product chooses provider.

## Startup validation

catalog-api: Joi `validation.schema.ts` + `assertProductionConfig()` on boot. Errors list categories only (never echo secret values).

## Secret file hygiene

Git ignores `.env`, `.env.local`, `.env.*.local`. Tracked templates: `infra/env/.env.example`, `.env.staging.example`, `.env.production.example`.

## Rotation notes (operational, not automated)

| Secret | Impact if rotated |
|--------|-------------------|
| `JWT_SECRET` | All sessions invalidated |
| `QALAGO_INTERNAL_SERVICE_TOKEN` | Redeploy catalog-api + ai-orchestrator together |
| `STAFF_MFA_ENCRYPTION_KEY` | May require re-enrollment if encrypts persisted MFA material |
| Firebase Admin key | FCM push fails until updated |

## Env matrix (catalog-api — strict production)

| Variable | Required prod? | Secret? |
|----------|----------------|---------|
| `QALAGO_ENV=PRODUCTION` | Yes | No |
| `DATABASE_URL` | Yes | Yes |
| `JWT_SECRET` | Yes | Yes |
| `CORS_ORIGINS` | Yes | No |
| `CONSUMER_WEB_BASE_URL` | Yes | No |
| `BUSINESS_WEB_BASE_URL` | Yes | No |
| `QALAGO_GEOCODING_PROVIDER` | Yes (not `mock`) | No |
| `MAPTILER_API_KEY` | If maptiler | Yes |
| `QALAGO_INTERNAL_SERVICE_TOKEN` | If `AI_INTEGRATION_ENABLED=true` | Yes |
| `STAFF_MFA_ENCRYPTION_KEY` | If `STAFF_MFA_REQUIRED=true` | Yes |
| Firebase trio | If `PUSH_ENABLED=true` | Yes |
| `REDIS_URL` | No (until PROD.5) | Yes if set |

Web apps and Flutter validate only their own env at build/runtime — see per-app README / deploy.md.
