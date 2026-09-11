# PostgreSQL backup & restore (local / prep for 7.4)

## Backup

```bash
pg_dump -Fc -h localhost -U qalago -d qalago_dev -f qalago_backup_$(date +%Y%m%d).dump
```

Run before applying migrations in staging/production.

## Restore (verify on a scratch DB)

```bash
createdb -h localhost -U qalago qalago_restore_test
pg_restore -h localhost -U qalago -d qalago_restore_test --clean --if-exists qalago_backup_YYYYMMDD.dump
```

Confirm row counts and run smoke tests against restore DB before trusting backup.
