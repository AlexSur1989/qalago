# Intentional `@Roles()` inventory (Stage 6.9.1.1)

Staff admin routes under `/admin/*` (and staff category mutations) use **`@AdminStaffRoute()` + `@RequireStaffPermission()`** instead of broad `@Roles(ADMIN)`.

## Remaining `@Roles()` (by design)

| Area | Pattern | Reason |
|------|---------|--------|
| Business cabinet | `BUSINESS`, `ADMIN`, `CITY_ADMIN` | Mixed consumer/business + legacy staff helpers on same controllers (`promotions`, `reviews`, `service-items`, `uploads`, `monetization` business routes, `analytics` business dashboard) |
| Plans checkout | `BUSINESS`, `ADMIN`, `CITY_ADMIN` | Owner checkout, not staff portal |
| `satisfiesRequiredRoles` | SUPER_ADMIN inherits ADMIN/CITY_ADMIN on `@Roles` routes | Legacy hierarchy for mixed routes only |

## Staff portal (permission-guarded)

- `AdminController` (`/admin/...` operational)
- `StaffAdminController`
- `MonetizationAdminController`
- `SafetyAdminController` (moderation/legal/gov/security admin)
- `BusinessApplicationsAdminController`
- `OwnershipClaimsAdminController`
- `AuditLogController`
- `ReleaseAdminController`
- `AdminAiController`
- Global category mutations on `CategoriesController` (POST/PATCH/DELETE)

Do not add new staff capabilities via `@Roles(ADMIN)` alone.
