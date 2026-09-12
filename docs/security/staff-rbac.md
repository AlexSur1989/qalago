# Staff RBAC (Stage 6.9.1)

## Model

- **Staff roles** (10): `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `SALES_MANAGER`, `CONTENT_MANAGER`, `FINANCE`, `SUPPORT`, `CITY_ADMIN`, `ANALYST`, `TECH_ADMIN`.
- **Business roles** remain `OWNER` / `MANAGER` on `BusinessMembership` — not staff.
- **Consumer** identity remains `USER`.
- Canonical chain: **Role → Permissions → Resource scope → Policy** (`StaffPolicyService`, `packages/shared-types/src/staff-permissions.ts`).
- **`StaffAccess`** row is required for active staff; disabled staff cannot use admin APIs even if JWT role is stale (guard checks `StaffAccess.isActive` when present).

## City scope

- `StaffCityScope` supports multiple cities per `CITY_ADMIN`.
- Legacy `User.managedCityId` is kept in sync for the primary city.
- Backend resolves **resource city** from DB (business, case, payment order) — never trusts client-only `cityId`.

## Self-escalation

- No self role change, self city scope, self restore, or self SUPER_ADMIN promotion (API enforced in `StaffAccessService`).
- `ADMIN` cannot create `ADMIN` or `SUPER_ADMIN` in this stage (SUPER_ADMIN-only staff API).

## Separation of duties

- `SALES_MANAGER`: orders/sales prep, **no** `PAYMENT_CONFIRM`.
- `FINANCE`: `PAYMENT_CONFIRM`, no staff role assignment.
- `MODERATOR` / `CONTENT_MANAGER` / `SUPPORT`: no ownership or staff grants.

## MFA / step-up

- Fields: `StaffAccess.mfaEnrolledAt`, `mfaRequired` (reserved).
- `STEP_UP_REQUIRED_PERMISSIONS` listed in shared-types — enforcement is a future stage; no fake MFA UI.

## Known limitations

- Fine-grained permission guard is wired on staff management and payment confirm; many legacy routes still use `@Roles()` hierarchy.
- Impersonation / login-as-user is not implemented.

See also: [super-admin-bootstrap.md](./super-admin-bootstrap.md), [admin-access.md](./admin-access.md).
