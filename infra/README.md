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

Or one-shot (requires Docker Desktop running):

```powershell
.\scripts\dev\staging.ps1
```

## Local dev — all services

```powershell
npm run dev:all
```

Opens API, AI, admin, business, and mobile in separate PowerShell windows.

Postgres host port **5433** (avoids conflict with dev Postgres on 5432).

**Windows:** Docker Desktop install via winget needs **admin (UAC)** approval:

```powershell
winget install -e --id Docker.DockerDesktop
```

After install: restart terminal, start Docker Desktop, then `.\scripts\dev\staging.ps1`.

Env template: `env/.env.staging.example`

## Production

See [docs/deploy.md](../docs/deploy.md) and `docker/docker-compose.prod.yml`.
