# Deploy — QalaGo (MVP)

## Prerequisites

- VPS with Docker + Docker Compose (Ubuntu 22.04+)
- Domain (optional) pointing to server IP
- PostgreSQL can run inside compose (included) or managed (RDS, Supabase)

## 1. Environment

Copy and edit on the server:

```bash
cp infra/env/.env.example .env.prod
```

Required for production:

| Variable | Example |
|----------|---------|
| `POSTGRES_PASSWORD` | strong random |
| `JWT_SECRET` | min 32 chars, not a dev placeholder |
| `QALAGO_INTERNAL_SERVICE_TOKEN` | strong random (catalog-api ↔ ai-orchestrator) |
| `CORS_ORIGINS` | `https://qalago.kz,https://www.qalago.kz,https://admin.qalago.kz,https://business.qalago.kz` |
| `OTP_DEBUG` | `false` (startup fails if `true`) |
| `DEV_LOGIN_ENABLED` | `false` (startup fails if `true`) |
| `MOCK_PLAN_CHECKOUT_ENABLED` | `false` (startup fails if `true`) |

Never expose `QALAGO_INTERNAL_SERVICE_TOKEN` in browser or mobile public env vars.

**Production safety (Stage 6.0.1):** empty `CORS_ORIGINS`, wildcard origins, weak JWT, and dangerous dev flags cause startup failure in `NODE_ENV=production`.

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

Point `AppConstants.baseUrl` / build flavors to production API URL:

```bash
flutter build apk --dart-define=QALAGO_API_BASE_URL=https://api.qalago.kz/api/v1
```

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
