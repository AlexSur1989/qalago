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
| `JWT_SECRET` | min 32 chars |
| `CORS_ORIGINS` | `https://admin.yourdomain.kz` |
| `OTP_DEBUG` | `false` |

## 2. Build & run API

From repo root:

```bash
docker compose -f infra/docker/docker-compose.prod.yml --env-file .env.prod up -d --build
```

Apply schema and seed (first deploy):

```bash
docker compose -f infra/docker/docker-compose.prod.yml exec api npx prisma db push
docker compose -f infra/docker/docker-compose.prod.yml exec api npm run seed
```

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

For stores: configure signing, app icons, and FCM (push — phase 3).

## 6. Reverse proxy (recommended)

Use Nginx or Caddy in front of API:

- `/api` → catalog-api:3000
- `/uploads` → catalog-api:3000
- TLS via Let's Encrypt

## 7. Backup

- Daily `pg_dump` of PostgreSQL volume
- Sync `uploads` volume to object storage (S3) for production

## Local dev (without Docker)

See [scripts/dev/SETUP.md](../scripts/dev/SETUP.md).
