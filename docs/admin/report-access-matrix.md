# Report access matrix (Stage 6.9.2)

Permissions are defined in `packages/shared-types/src/staff-permissions.ts`.

| Role | Overview | Users | Businesses | Cities | Categories | Search | Activity | Reviews | Promotions | Ads | Plans | Moderation | Finance | Staff | Audit | Security | System | Export |
|------|----------|-------|------------|--------|------------|--------|----------|---------|------------|-----|-------|------------|---------|-------|-------|----------|--------|--------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | ✓ |
| CITY_ADMIN | ✓* | ✓* | ✓* | ✓* | ✓* | ✓* | ✓* | ✓* | ✓* | ✓* | ✓* | ✓* | — | — | — | — | — | — |
| MODERATOR | — | — | — | — | — | — | — | — | — | — | — | ✓ | — | — | — | — | — | — |
| SALES_MANAGER | — | — | ✓ | — | — | — | — | — | — | ✓ | ✓ | — | — | — | — | — | — | — |
| CONTENT_MANAGER | — | — | — | — | ✓ | — | — | — | ✓ | — | — | — | — | — | — | — | — | — |
| FINANCE | — | — | — | — | — | — | — | — | — | ✓ | ✓ | — | ✓ | — | — | — | — | ✓ |
| SUPPORT | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | ✓ | — | — | — | — | — | — |
| ANALYST | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | ✓ |
| TECH_ADMIN | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✓ | — |

\* CITY_ADMIN: all granted report permissions are **scoped** to assigned `StaffCityScope` / `managedCityId` in backend queries.

Export: aggregate/non-PII only; CITY_ADMIN cannot export other cities; finance export limited to FINANCE/SUPER_ADMIN.

## Admin Web UI (Stage 6.9.2.1)

Routes under `/reports` mirror permissions above via `canViewReport` / `StaffPermission.REPORT_*` (see `apps/admin-web/lib/report-rbac.ts` and `docs/admin/reporting-ui.md`). Hidden nav is not security: backend returns 403 for unauthorized API calls.

| Route | Nav id |
|-------|--------|
| `/reports` | overview |
| `/reports/users` … `/reports/system` | same slug as API segment |
| `/reports/staff/[userId]` | staff detail (SUPER_ADMIN) |
| `/reports/staff/anomalies` | staff anomalies (SUPER_ADMIN) |