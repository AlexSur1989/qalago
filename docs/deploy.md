# Deploy — QalaGo (MVP)

**PS.kz first VPS:** step-by-step runbook + launch gates —  
**[docs/infra/ps-kz-vps-runbook.md](./infra/ps-kz-vps-runbook.md)** and  
**[docs/infra/external-launch-checklist.md](./infra/external-launch-checklist.md)** (2026-10-06 remediation Stage 9).

## Prerequisites

- VPS with Docker + Docker Compose (Ubuntu 22.04+)
- Domain (optional) pointing to server IP
- PostgreSQL can run inside compose (included) or managed (RDS, Supabase)

## 1. Environment

Copy and edit on the server (use the production contract template, not dev defaults):

```bash
cp infra/env/.env.production.example .env.prod
# fill secrets via host env / secret manager; chmod 600; never commit
```

Canonical matrix: **`docs/infra/production-environment.md`**.

Required for **public production** (`NODE_ENV=production`, `QALAGO_ENV=PRODUCTION`):

| Variable | Example |
|----------|---------|
| `POSTGRES_PASSWORD` | strong random |
| `DATABASE_URL` | managed Postgres URL (no localhost) |
| `JWT_SECRET` | min 32 chars, not a dev placeholder |
| `CORS_ORIGINS` | HTTPS admin/business/consumer origins only |
| `CONSUMER_WEB_BASE_URL` / `BUSINESS_WEB_BASE_URL` | HTTPS public URLs |
| `QALAGO_GEOCODING_PROVIDER` | `maptiler` (+ `MAPTILER_API_KEY`) |
| `QALAGO_INTERNAL_SERVICE_TOKEN` | required if `AI_INTEGRATION_ENABLED=true` |
| `OTP_DEBUG` / `DEV_LOGIN_ENABLED` / `MOCK_PLAN_CHECKOUT_ENABLED` | all `false` |

Never expose server secrets in `NEXT_PUBLIC_*`, Flutter dart-defines, or mobile source constants.

**Local Docker staging** uses `QALAGO_ENV=STAGING` (`infra/env/.env.staging.example`) — not equivalent to public production validation.

**Production safety:** catalog-api Joi + `assertProductionConfig()` fail fast on unsafe production config (see Stage 6 production safety doc).

## 2. Build & run API

From repo root:

```bash
docker compose -f infra/docker/docker-compose.prod.yml --env-file .env.prod up -d --build
```

Apply schema on first deploy (**do not run full dev/QA seed in production**):

```bash
docker compose -f infra/docker/docker-compose.prod.yml exec api npx prisma migrate deploy
```

Bootstrap the first SUPER_ADMIN once (real phone, not seed QA numbers):

```bash
docker compose -f infra/docker/docker-compose.prod.yml exec \
  -e BOOTSTRAP_SUPER_ADMIN_PHONE=+7701XXXXXXX \
  api npm run bootstrap:super-admin
```

Then sign in via OTP in the admin panel and complete platform setup.

Use `prisma migrate deploy` (not `db push`) for production. Back up PostgreSQL before migrations — see [postgresql-backup.md](./infra/postgresql-backup.md).

`npm run seed` is for **local dev / staging QA only**. It creates known test admins, demo businesses, and fake campaigns — never run it against production.

Health check: `GET http://SERVER_IP:3000/api/v1/health`

Uploaded images: `http://SERVER_IP:3000/uploads/*`

## 3. Admin web

Build locally or on CI:

```bash
cd apps/admin-web
NEXT_PUBLIC_API_URL=https://api.yourdomain.kz/api/v1 npm run build
npm run start
```

Or deploy to Vercel with `NEXT_PUBLIC_API_URL` env var.

Default dev: `http://localhost:3001` (login as `+77000000001` or `+77000000004` for CITY_ADMIN Aktobe).

## 4. Business web (owner cabinet)

```bash
npm run dev:business
# or
cd apps/business-web
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1 npm run dev
```

Default dev: `http://localhost:3003` (login as `+77000000002`).

Features: list owned businesses, edit profile, manage promotions, view analytics summary.

## 5. Mobile

Point `AppConstants.baseUrl` / build flavors to production API URL.

**Android store/release** (Play AAB — preferred for Play Console):

```powershell
cd apps/mobile
flutter build appbundle --release `
  --dart-define=QALAGO_API_BASE_URL=https://api.qalago.kz/api/v1 `
  --dart-define=QALAGO_NATIVE_MAP_BUSINESS_LAYER=true
```

**Android store/release** (APK alternative):

```powershell
cd apps/mobile
flutter build apk --release `
  --dart-define=QALAGO_API_BASE_URL=https://api.qalago.kz/api/v1 `
  --dart-define=QALAGO_NATIVE_MAP_BUSINESS_LAYER=true
```

**iOS store/release:** use production API defines as needed, but **do not** pass
`QALAGO_NATIVE_MAP_BUSINESS_LAYER=true` until dedicated iOS physical QA passes
(see `docs/mobile/IOS_BUILD_CHECKLIST.md`). Code default for the flag remains **`false`**.

Do **not** pass `QALAGO_DEV_LOGIN=true` or `QALAGO_MOCK_PLAN_CHECKOUT=true` in store/release builds.

Self-service account deletion is available in Profile. Mock subscription checkout is disabled in production builds.

For stores: configure signing, app icons, privacy/terms, real SMS, and FCM (push — phase 3). See remaining P0 items in [stage-6-production-safety.md](./stage-6-production-safety.md).

## Remaining release blockers

See [stage-6-production-safety.md](./stage-6-production-safety.md) for unresolved P0/P1 items (SMS, signing, legal docs, S3, Nginx/TLS, store billing).

## 6. Reverse proxy (recommended)

Use Nginx or Caddy in front of API:

- `/api` → catalog-api:3000
- `/uploads` → catalog-api:3000
- TLS via Let's Encrypt

## 7. Backup

**Before STAGING/PROD migrations:** follow [docs/infra/postgresql-backup.md](infra/postgresql-backup.md) — custom-format `pg_dump`, verify file size > 0, record environment and timestamp.

Ongoing:

- Daily `pg_dump` of PostgreSQL (custom format) to off-server storage
- Sync `uploads` volume to object storage (S3) for production

## Local dev (without Docker)

See [scripts/dev/SETUP.md](../scripts/dev/SETUP.md).

## Local Docker staging

If Docker Desktop is installed:

```bash
npm run staging:up
npm run staging:seed
curl http://localhost:3002/api/v1/health
```

See [infra/README.md](../infra/README.md).
