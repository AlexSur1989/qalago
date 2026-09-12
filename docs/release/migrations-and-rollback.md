# Migrations & rollback

## Pattern: expand → migrate → deploy → contract

1. Add nullable columns / new tables
2. Backfill data (job or script)
3. Deploy code reading new + old shape
4. Remove old columns in a **later** release

## Rules

- **Never** `prisma migrate reset` in production
- Backup before risky migrations (`docs/security/postgres-backup-restore.md`)
- Prefer additive migrations (see Stage 6.8C `AppReleaseSettings` migration)

## Rollback matrix

| Layer | Rollback |
|-------|----------|
| Admin/Business web | Previous static artifact |
| catalog-api | Previous container if DB compatible |
| Mobile | Cannot recall installed apps — use flags, min version, hotfix store build |
| PostgreSQL | Restore only if necessary; prefer forward migration |

## DB compatibility

If migration is additive-only, previous backend version should usually still run. Document exceptions per release.
