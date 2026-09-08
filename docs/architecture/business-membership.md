# Business membership & permissions (Stage 5M.1–5M.2)

QalaGo separates **system roles** from **business-scoped roles**.

## Two independent dimensions

| Dimension | Storage | Examples |
|-----------|---------|----------|
| **System role** | `User.role` (`UserRole`) | `USER`, `BUSINESS`, `CITY_ADMIN`, `ADMIN` |
| **Business role** | `BusinessMembership.role` | `OWNER`, `MANAGER` |
| **Business capability** | `BusinessMembership.permissions[]` | `CATALOG_EDIT`, `ANALYTICS_VIEW`, … |

A user may be `User.role = USER` while holding `BusinessMembership.role = OWNER` or `MANAGER` for one or more businesses. Clients gate the business cabinet from `GET /businesses/my` (membership), not only `UserRole.BUSINESS`.

## BusinessPermission enum

| Permission | Meaning |
|------------|---------|
| `BUSINESS_PROFILE_EDIT` | title, description, address, contacts, social |
| `BUSINESS_HOURS_EDIT` | workHours |
| `CATALOG_EDIT` | service items / menu groups |
| `PHOTOS_EDIT` | gallery upload, attach, delete, cover |
| `PROMOTIONS_EDIT` | business promotions CRUD |
| `REVIEWS_REPLY` | owner/manager replies only |
| `ANALYTICS_VIEW` | analytics dashboard (plan-gated) |
| `ANALYTICS_EXPORT` | CSV export (requires `ANALYTICS_VIEW` + VIP plan) |
| `ADS_MANAGE` | business-side ad orders/campaigns |
| `PAYMENTS_VIEW` | business billing/order history read |

**Not grantable to MANAGER (owner-only):** team invite, permission changes, suspend/revoke, owner transfer, business delete.

## OWNER semantics

- Implicit **all** `BusinessPermission` values (not stored in DB).
- Dual-read with legacy `Business.ownerId` remains authoritative for owner access.

## MANAGER semantics

- Requires `BusinessMembership.status = ACTIVE` **and** explicit permission.
- `INVITED` / `SUSPENDED` / `REVOKED` → deny regardless of permissions array.
- `REVOKED` cannot be restored to `ACTIVE`; owner must re-invite.

## Effective access formula

```
SYSTEM AUTH ∩ MEMBERSHIP STATUS (ACTIVE) ∩ BUSINESS PERMISSION ∩ PLAN ENTITLEMENT
```

Example: MANAGER with `ANALYTICS_EXPORT` on PREMIUM business → export denied (VIP required).

## Legacy compatibility

- `Business.ownerId` not removed.
- Dual-read: `ownerId === user.id` OR ACTIVE OWNER membership.
- Dual-write on create: `ownerId` + ACTIVE OWNER membership in one transaction.
- Revoking membership alone does **not** remove access if legacy `ownerId` still matches (5M.1 caveat).

## Invitations (5M.2)

- Phone-based (`+7XXXXXXXXXX`, normalized).
- Existing user → immediate ACTIVE MANAGER membership.
- Unknown phone → `BusinessInvitation` (PENDING, 7-day expiry).
- Claim only after verified OTP/dev-login on matching phone (`AuthService.completeLogin` → `claimPendingInvitations`).
- Never trust client-supplied phone without authentication.

## Team API (owner-only unless noted)

| Method | Path | Access |
|--------|------|--------|
| GET | `/businesses/:id/team` | OWNER; ADMIN; CITY_ADMIN read (scoped city, masked phone) |
| POST | `/businesses/:id/team/invite` | OWNER |
| PATCH | `/businesses/:id/team/:membershipId` | OWNER |
| DELETE | `/businesses/:id/team/invitations/:invitationId` | OWNER |

## GET /businesses/my contract

```json
{
  "items": [
    {
      "business": { "...": "..." },
      "access": {
        "role": "OWNER" | "MANAGER",
        "permissions": ["CATALOG_EDIT", "..."]
      }
    }
  ]
}
```

Includes ACTIVE OWNER and ACTIVE MANAGER memberships + legacy `ownerId`. Deduped.

## System roles vs business permissions

| Actor | Business management |
|-------|---------------------|
| GUEST | Public read only |
| USER | No business APIs without membership |
| OWNER membership | All permissions (implicit) |
| MANAGER membership | Explicit permissions only |
| CITY_ADMIN | Managed city; all permissions for scoped businesses |
| ADMIN | Global; all permissions |

## JWT

Memberships and permissions are **not** in JWT. Authorization reads live DB state per request.

## Multi-business managers

Each `(userId, businessId)` membership has independent `permissions[]`. Switching business must refresh client capability state.

## Future

- MODERATOR, SUPER_ADMIN — **not implemented**
- Audit retention/archival policy — TBD
- Second owner API — schema allows; not exposed in 5M.2
- Flutter owner team UI — deferred (P2)

## AuditLog (Stage 5M.3 — implemented)

Central `AuditLogService` records security/operational mutations. See [RBAC](./rbac.md) and [API contracts](./api-contracts.md).

**Wired:** team invite/accept/permission/suspend/restore/revoke; business profile/hours; catalog; photos; promotions; review reply create; plan checkout/override; payment confirm; ad orders/creatives/campaign pause/activate; user role change; city/category admin actions.

**Read:** `GET /admin/audit-logs` (ADMIN/CITY_ADMIN); `GET /businesses/:id/team/audit` (OWNER).

**Not wired (no endpoint):** `USER_STATUS_CHANGE`, `PAYMENT_REJECT`, review reply update/delete.

**Policy:** append-only; no historic backfill; metadata sanitized; not mixed with analytics.
