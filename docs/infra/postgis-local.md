# PostGIS — local & deployment readiness (Stage 6.11C.5B)

## Why QalaGo uses PostGIS

Future catalog geo queries (C.5D/E) will use **geography** + GiST for nearby, radius, and map bbox at scale. Until then, `Business.latitude` / `Business.longitude` remain the application-facing fields (hybrid architecture).

C.5B only enables the **`postgis`** extension. **C.5C** adds `Business.location`, sync, backfill, and indexes.

## Docker image

| | Image |
|---|--------|
| **Previous** | `postgres:16-alpine` |
| **Current (dev/staging/prod compose)** | `postgis/postgis:16-3.4-alpine` |
| **PostgreSQL** | 16.x |
| **PostGIS** | 3.4.x |

Pin is intentional; do not use unpinned `latest`.

## Safe local upgrade (keep data volume)

**Do not run `docker compose down -v`.** That removes `qalago_pg_data`.

1. Stop Postgres only (volume retained):
   ```powershell
   docker compose -f infra/docker/docker-compose.dev.yml stop postgres
   ```
2. Pull the new image (after compose file update):
   ```powershell
   docker compose -f infra/docker/docker-compose.dev.yml pull postgres
   ```
3. Start Postgres:
   ```powershell
   docker compose -f infra/docker/docker-compose.dev.yml up -d postgres
   ```
4. Wait for healthcheck, then apply migrations:
   ```powershell
   cd services/catalog-api
   Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
   npx prisma migrate deploy
   ```

PostgreSQL **major version stays 16**; existing data directory on `qalago_pg_data` is normally compatible with the PostGIS image.

## Rollback (image only)

1. `stop postgres`
2. Revert compose to `postgres:16-alpine`
3. `up -d postgres`

The `postgis` extension remains in the database until dropped manually (`DROP EXTENSION postgis CASCADE;` — **only if** no spatial columns depend on it). After C.5C, rollback requires a planned migration, not ad-hoc drops.

## Verify PostGIS

```powershell
docker exec -it qalago-postgres psql -U qalago -d qalago_dev -c "SELECT version();"
docker exec -it qalago-postgres psql -U qalago -d qalago_dev -c "SELECT PostGIS_Version();"
docker exec -it qalago-postgres psql -U qalago -d qalago_dev -c "SELECT extname FROM pg_extension WHERE extname = 'postgis';"
```

Smoke (no writes to `Business`):

```sql
SELECT ST_Distance(
  ST_SetSRID(ST_MakePoint(51.3865, 51.2278), 4326)::geography,
  ST_SetSRID(ST_MakePoint(51.3946, 51.2225), 4326)::geography
) AS meters;
```

Expect on the order of hundreds of meters (Uralsk QA points).

## Privileges

`CREATE EXTENSION postgis` requires a role with **`CREATE`** on the database or superuser. Docker `qalago` user is typically superuser in dev. Staging/prod: grant via DBA before `migrate deploy`.

## Prisma 6.x

No spatial fields in Prisma schema until C.5C. Extension-only migration does not change generated client types. Spatial queries will use **`$queryRaw`** / raw SQL in C.5D+; no PostGIS preview feature required for C.5B.

## Production / PS.kz

Self-hosted compose files use the same pinned PostGIS image as a **template** for future VPS deploy.

**PS.kz PostGIS availability: UNVERIFIED** — confirm managed PostgreSQL supports PostGIS 3.x on PG 16 before production cutover.

## Backup / restore

Standard `pg_dump` / `pg_restore` include extension metadata. Restore target must run a **compatible PostGIS build** on the same PostgreSQL major version.

See [postgresql-backup.md](./postgresql-backup.md).

## CI

GitHub Actions **does not** start PostgreSQL; catalog-api tests use mocks. When C.5C/D add DB integration tests, align the workflow service container with `postgis/postgis:16-3.4-alpine`.
