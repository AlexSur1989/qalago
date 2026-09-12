# SUPER_ADMIN bootstrap

## Principles

- No public registration, no default password, no hardcoded owner email in repo.
- One-shot **CLI** only: `npm run bootstrap:super-admin` in `services/catalog-api`.
- Idempotent when the same phone already has active SUPER_ADMIN.
- Refuses QA seed phones and refuses second SUPER_ADMIN if one already exists.

## Production procedure

1. Deploy API and run `prisma migrate deploy` (includes `20260913030000_stage_6_9_1_staff_rbac`).
2. Set operator phone (Kazakhstan E.164):

   ```powershell
   $env:BOOTSTRAP_SUPER_ADMIN_PHONE="+7701XXXXXXX"
   cd services/catalog-api
   npm run bootstrap:super-admin
   ```

3. Optional: `BOOTSTRAP_SUPER_ADMIN_NAME` for display name on new user.
4. Sign in via existing OTP flow in admin-web (no secrets printed).
5. Create additional staff via `/admin/staff` (SUPER_ADMIN) — not via bootstrap.

## Audit

- Bootstrap writes `STAFF_BOOTSTRAP` audit event (no tokens/passwords).
