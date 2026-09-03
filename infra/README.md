# Infra

## Local dev (Postgres + Redis only)

```powershell
npm run dev:infra
```

See `docker/docker-compose.dev.yml` and `env/.env.example`.

## Docker staging (API + Postgres, production-like)

Runs catalog-api on **http://localhost:3002** (same port as local dev API).

```powershell
npm run staging:up      # build & start containers
npm run staging:seed    # prisma push + seed (first time)
npm run staging:down    # stop containers
```

Postgres host port **5433** (avoids conflict with dev Postgres on 5432).

Env template: `env/.env.staging.example`

## Production

See [docs/deploy.md](../docs/deploy.md) and `docker/docker-compose.prod.yml`.
