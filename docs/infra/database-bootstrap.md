# Database bootstrap and migration strategy (QalaGo catalog-api)

**Status:** Agreed technical runbook (2026-10-06 Stage 2). Not applied to production VPS.

## Problem

The migration chain **starts** at `20260905120000_monetization_campaign_architecture` with
`ALTER TYPE "AnalyticsEventType" …`, but **no migration creates** `AnalyticsEventType` or the
pre-monetization tables. Those came from historical `prisma db push`.

Therefore **`prisma migrate deploy` on an empty database fails** (P3018 / PostgreSQL 42704).

Existing developer/production-like databases created via push + incremental `migrate deploy`
are fine **once baselined** in `_prisma_migrations`.

## Two deployment personas

| Persona | Database state | Strategy |
|---------|----------------|----------|
| **Existing** | Restored backup or long-lived dev DB with data | `migrate deploy` for **pending** folders only; use **postgres** OS user if enum ownership blocks `qalago` |
| **Greenfield** | Empty VPS PostgreSQL | **Do not** run raw `migrate deploy` from zero; bootstrap first (below) |

## Scenario B — restore backup then upgrade (verified 2026-10-06)

Isolated rehearsal (not `qalago_dev`):

1. **Dump** (read-only on source):  
   `pg_dump -Fc -U qalago … -f stage2-from-qalago_dev.dump qalago_dev`
2. **Create** empty DB (requires OS superuser):  
   `CREATE DATABASE qalago_stage2_restore OWNER qalago;`
3. **Restore** as **postgres** (PostGIS extension needs superuser):  
   `pg_restore -U postgres -d qalago_stage2_restore --single-transaction --no-owner --no-acl …dump`
4. **Grants** (optional for app user):  
   `GRANT ALL ON SCHEMA public TO qalago;` (+ tables/sequences)
5. **Status:**  
   `DATABASE_URL=…/qalago_stage2_restore npx prisma migrate status`  
   Expect **one pending** legal migration if source matched pre-legal dev.
6. **Deploy pending** as **postgres** if app role lacks enum ownership:  
   `DATABASE_URL=postgresql://postgres@host/db npx prisma migrate deploy`  
   If a prior attempt failed:  
   `npx prisma migrate resolve --rolled-back <name>` then redeploy.
7. **Verify:** `migrate status` → all folders applied; spot-check `AuthSession.mfaEnrollOnly`,
   `LegalDocumentType` includes `PUBLIC_OFFER` / `PERSONAL_DATA_CONSENT` after legal migration.

**Local application DB (`qalago_dev`):** **57/57** migrations applied (2026-10-06 Stage 7.1); auth
migration applied manually earlier — **do not re-apply**; legal enum migration applied as **`qalago`**.
Use **postgres** role on other hosts if deploy fails with “must be owner of type LegalDocumentType”.

**Backup restore drill:** custom-format dump restore **succeeded** on `qalago_stage2_restore`;
original `before-auth.dump` restore was **not** re-tested in Stage 2 (use fresh dump above as template).

**Stage 10 (2026-10-06):** Repeatable local rehearsal —  
`node scripts/dev/_stage10-backup-rehearsal.mjs`  
(`pg_dump` as app user; **postgres** OS user for `createdb` / `pg_restore` / grants; target
`qalago_stage10_restore`). Verified **57** finished migration rows match `qalago_dev`.
Set `PG_BIN`, `STAGE10_PG_ADMIN_USER`, `STAGE10_PG_ADMIN_PASSWORD` when paths differ.
Docker staging compose was **not** available on the operator Windows host (Stage 10).

## Scenario A — greenfield (empty DB)

Verified partial path on `qalago_stage2_greenfield`:

1. `CREATE DATABASE … OWNER qalago;`
2. `CREATE EXTENSION IF NOT EXISTS postgis;` (**postgres**)
3. **`npx prisma migrate deploy`** → **fails** on first migration (expected).
4. **Bootstrap schema** to match **released** `schema.prisma` at git tag (not dirty legal WIP):  
   `npx prisma db push --schema <committed-schema.prisma> --accept-data-loss`  
   Requires PostGIS first.
5. **Do not** blindly `migrate resolve --applied` for all folders unless every migration SQL is
   reflected in the pushed schema. Marking `20261006120000_auth_session_mfa_restriction` applied
   **without** running its SQL leaves **`mfaEnrollOnly` missing** while Prisma reports “up to date”
   (demonstrated in Stage 2).

### Recommended greenfield sequence (VPS first deploy)

1. PostGIS extension (postgres).
2. `db push` using the **same commit** as the API image (`schema.prisma` at that tag).
3. For each migration **not** fully represented in push (e.g. auth additive SQL only):  
   run that migration’s `migration.sql` **or** `migrate deploy` for that folder only **before**
   marking it applied.
4. Mark historical migrations applied only when SQL is redundant:  
   `node scripts/dev/mark-migrations-applied.mjs` (isolated DB only; requires `DATABASE_URL`).
5. Run `npx prisma migrate deploy` — should apply **zero or only** new migrations after the tag.
6. `npm run seed` / bootstrap super-admin **only** on empty intentional environments (never prod data refresh).

**Future hardening (deferred):** add a true **`0_baseline`** migration SQL (pre-20260905) so
`migrate deploy` works from empty without `db push`. Must not rewrite checksums of migrations
already applied on existing DBs.

## Legal / schema drift (working tree)

- Pending migration `20261004120000_stage_6_15l2_legal_document_types` adds enum values (safe additive).
- **Dirty** `schema.prisma` removes `PUBLIC_OFFER` / `PERSONAL_DATA_CONSENT` — **conflicts** with
  HEAD and pending migration. Reconcile before treating working tree as release schema (6.19A.1).

## Rollback

- **Before migrate deploy on prod:** take `pg_dump -Fc` (store off-repo).
- **Failed migration:** `prisma migrate resolve --rolled-back <name>`, fix cause, redeploy.
- **Do not** `migrate reset` or `db push --force-reset` on shared/production databases.

## Local dev pitfall — shell `DATABASE_URL` overrides `.env`

Nest/Prisma load **`process.env.DATABASE_URL` first**. If a terminal still exports a
Stage 2 isolated URL (e.g. `qalago_stage2_greenfield`) after `migrate status` or restore
drills, **`npm run start:dev` will hit the wrong database** even though
`services/catalog-api/.env` points at `qalago_dev`. Symptom: dev-login **500** with
`The column mfaEnrollOnly does not exist` on a DB where migrations were resolve-only.

**Fix:** unset the override before starting the API (`Remove-Item Env:DATABASE_URL` in
PowerShell) or set `DATABASE_URL` explicitly to the application DB from `.env`.

## Commands reference

```powershell
cd services/catalog-api
$env:DATABASE_URL = "postgresql://postgres@localhost:5432/<db>?schema=public"
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate resolve --rolled-back <migration_folder_name>
node scripts/dev/mark-migrations-applied.mjs   # isolated greenfield only
```

See also `services/catalog-api/prisma/MIGRATIONS.md`.
