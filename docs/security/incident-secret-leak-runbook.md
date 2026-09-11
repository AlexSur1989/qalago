# Developer security runbook (minimal)

## JWT secret leaked

1. Generate new strong secret (≥32 chars, high entropy).
2. Update env / secret store; redeploy catalog-api.
3. `POST /auth/logout-all` for affected admins if account compromise suspected.
4. All refresh sessions invalidated on next deploy if you rotate and clear `AuthSession` (optional emergency SQL: `UPDATE "AuthSession" SET "revokedAt" = NOW()`).

## Admin account compromised

1. Set user `isActive=false` in DB or admin tool.
2. Revoke sessions (`logout-all` or revoke all rows for `userId`).
3. Review `AuditLog` for actor id.

## Database credentials leaked

1. Rotate Postgres password; update `DATABASE_URL`.
2. Rotate JWT and `QALAGO_INTERNAL_SERVICE_TOKEN`.
3. Redeploy all services using the DB.

## AI internal token leaked

1. Rotate `QALAGO_INTERNAL_SERVICE_TOKEN` on catalog-api and ai-orchestrator.
2. Redeploy both services.
