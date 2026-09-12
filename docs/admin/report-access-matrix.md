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
