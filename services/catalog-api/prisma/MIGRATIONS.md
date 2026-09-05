# Prisma migrations — QalaGo catalog-api

## Context

Historically the project used `prisma db push` without versioned migrations.
The database may already contain all pre-monetization tables from push/seed.

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
