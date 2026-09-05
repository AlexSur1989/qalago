# PostgreSQL backup — STAGING / PROD

**Required before any STAGING or PROD schema migration.**  
DEV snapshot counts (`scripts/stage-*-pre-migration-counts.json`) are **not** a substitute for a real database backup.

## Prerequisites

- `pg_dump` client matching server major version (PostgreSQL 15+)
- Network access to the database host
- Sufficient disk space for a custom-format dump (typically 1–3× DB size)

## 1. Record environment

```bash
export BACKUP_ENV=staging          # or prod
export BACKUP_DB=qalago_catalog
export BACKUP_TS=$(date -u +%Y%m%dT%H%M%SZ)
export BACKUP_DIR=/var/backups/qalago/${BACKUP_ENV}
mkdir -p "$BACKUP_DIR"
export BACKUP_FILE="${BACKUP_DIR}/${BACKUP_DB}_${BACKUP_ENV}_${BACKUP_TS}.dump"
```

Log the values (ticket/PR): `BACKUP_ENV`, `BACKUP_DB`, `BACKUP_FILE`, operator, migration name.

## 2. Create custom-format dump

From a host with `pg_dump` and credentials:

```bash
pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$BACKUP_FILE" \
  "$DATABASE_URL"
```

Or with explicit flags:

```bash
pg_dump -h HOST -p 5432 -U qalago -d qalago_catalog \
  --format=custom --no-owner --no-acl \
  --file="$BACKUP_FILE"
```

Docker Compose (staging/prod stack):

```bash
docker compose -f infra/docker/docker-compose.prod.yml exec -T postgres \
  pg_dump -U qalago -d qalago_catalog --format=custom --no-owner --no-acl \
  > "$BACKUP_FILE"
```

## 3. Verify backup

```bash
test -f "$BACKUP_FILE"
test -s "$BACKUP_FILE"    # size > 0
ls -lh "$BACKUP_FILE"
pg_restore --list "$BACKUP_FILE" | head
```

**Do not proceed with migration** if the file is missing or zero bytes.

## 4. Store and retention

- Copy to off-server storage (S3, object storage, secondary volume)
- Retain at least 7 daily + 1 pre-migration dump per environment
- Record checksum optional: `sha256sum "$BACKUP_FILE" >> "${BACKUP_DIR}/manifest.txt"`

## 5. Restore (disaster recovery drill)

**Destructive — run only on empty/test database or after explicit approval.**

```bash
# Drop and recreate DB (example)
dropdb -h HOST -U qalago qalago_catalog_restore_test
createdb -h HOST -U qalago qalago_catalog_restore_test

pg_restore \
  --dbname=qalago_catalog_restore_test \
  --no-owner \
  --no-acl \
  --verbose \
  "$BACKUP_FILE"
```

Verify row counts on critical tables (`Business`, `User`, `AdCampaign`, `Order`) before switching traffic.

## 6. Uploads volume

Database backup does **not** include uploaded images. Sync `uploads/` volume separately (see [deploy.md](../deploy.md)).

## Related

- [deploy.md](../deploy.md) — production deploy
- [infra/README.md](../../infra/README.md) — local/staging Docker
