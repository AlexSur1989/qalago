# Prisma migrations — QalaGo catalog-api

## Context

Historically the project used `prisma db push` without versioned migrations.
The database may already contain all pre-monetization tables from push/seed.

## Deployment blocker (verified 2026-10-06)

On a **fresh empty PostgreSQL database**, `npx prisma migrate deploy` fails on the
**first** migration in the chain:

- `20260905120000_monetization_campaign_architecture`
- Prisma **P3018** / PostgreSQL **42704**: type **`AnalyticsEventType`** does not exist
  (migration only `ALTER TYPE ... ADD VALUE`, assuming prior enum creation from `db push`).

**Implication:** the versioned migration history is **not** a full bootstrap from zero.
Greenfield VPS/staging requires an agreed **baseline** (squash, baseline migration, or
one-time schema snapshot + `migrate resolve`) before `deploy` is safe.

**Local application DB (`qalago_dev`):** **57/57** migrations applied (2026-10-06 Stage 7.1);
legal enum **`PERSONAL_DATA_CONSENT`**, **`PUBLIC_OFFER`** present.
Auth additive migration `20261006120000_auth_session_mfa_restriction` was applied
locally via explicit SQL + `migrate resolve --applied` (see `docs/changelog.md`) —
**do not re-apply** on that database.

**Working-tree `schema.prisma` drift:** may combine correct auth fields with edits
that remove legal enum members; **HEAD committed schema** + pending legal migration
SQL remain the reference until legal WIP is reconciled (6.19A.1).

## Stage 2 isolated proofs (2026-10-06)

| Scenario | DB | Result |
|----------|-----|--------|
| A — empty `migrate deploy` | `qalago_stage2_empty` | **FAIL** P3018 / 42704 (expected) |
| B — restore + upgrade | `qalago_stage2_restore` | **PASS** after postgres restore + legal deploy |
| Greenfield bootstrap | `qalago_stage2_greenfield` | **PASS** PostGIS + HEAD `db push`; resolve-all without auth SQL **unsafe** |

Full procedure: **`docs/infra/database-bootstrap.md`**. Dev helper (isolated only):
`scripts/dev/mark-migrations-applied.mjs`.

## First migration: `20260905120000_monetization_campaign_architecture`

This migration is **additive only**:
- New enums and tables for campaign-based advertising
- Nullable columns on `AnalyticsEvent` (`campaignId`, `placementId`, `sessionId`)
- New `AnalyticsEventType` values (AD_*)

It does **not** drop or rename existing monetization fields (`Business.planTier`, `PlanPayment`, etc.).

## Safe apply (dev/staging)

1. Review SQL in `migrations/20260905120000_monetization_campaign_architecture/migration.sql`
2. Backup database
3. Apply:
   ```powershell
   cd services/catalog-api
   npx prisma migrate deploy
   ```
4. Seed monetization catalog (optional):
   ```powershell
   npm run seed
   ```

## Baseline for existing DB (production)

If the DB was created via `db push` and `_prisma_migrations` table is empty:

**Option A — mark baseline then deploy new migration**
1. Create empty baseline migration from current pre-change schema (one-time, manual)
2. `npx prisma migrate resolve --applied <baseline_name>`
3. `npx prisma migrate deploy`

**Option B — diff-only apply (dev)**
1. Run the generated SQL manually or via `migrate deploy` if `_prisma_migrations` is initialized

Do **not** run `migrate dev` without shadow DB permissions unless `shadowDatabaseUrl` is configured.

## Shadow database

`prisma migrate dev --create-only` requires CREATE DATABASE permission.
This repo generates migration SQL via:

```powershell
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
```
