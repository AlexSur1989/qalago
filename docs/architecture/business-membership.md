# Business membership (Stage 5M.1)

QalaGo separates **system roles** from **business-scoped roles**.

## Two independent dimensions

| Dimension | Storage | Examples |
|-----------|---------|----------|
| **System role** | `User.role` (`UserRole`) | `USER`, `BUSINESS`, `CITY_ADMIN`, `ADMIN` |
| **Business role** | `BusinessMembership.role` | `OWNER`, `MANAGER` |

A user may be `User.role = USER` while holding `BusinessMembership.role = OWNER` for one or more businesses. Clients may not expose owner UI for that combination until capability routing is updated (Stage 5M.2+).

## BusinessMembership model

- `userId` + `businessId` — unique pair
- `role`: `OWNER` | `MANAGER` (MANAGER exists in schema; permissions deferred to 5M.2)
- `status`: `INVITED` | `ACTIVE` | `SUSPENDED` | `REVOKED` — only `ACTIVE` grants access

## Legacy compatibility

`Business.ownerId` remains the primary compatibility owner field:

- Not removed in 5M.1
- `User.ownedBusinesses` relation unchanged
- On user delete: `ownerId` → `SetNull` (unchanged)
- On business/membership delete: membership rows cascade

**Dual-read invariant (5M.1):** management access is granted when:

1. `business.ownerId === user.id`, **or**
2. an `ACTIVE` membership with `role = OWNER` exists for `(userId, businessId)`

**Dual-write on create:** new businesses set `ownerId` and create `ACTIVE OWNER` membership in one transaction.

## What MANAGER means in 5M.1

`MANAGER` is in the enum for future migrations but **does not grant management access** in 5M.1. No API creates active managers.

## Revocation caveat

Revoking membership alone does **not** remove access if `Business.ownerId` still points to the same user (legacy dual-read). Full ownership revocation requires a future stage that updates both fields.

## Admin identity

`ADMIN` and `CITY_ADMIN` do not use `BusinessMembership` for platform/city duties. City scope remains `managedCityId` via `BusinessAccessService`.

## JWT

Memberships are **not** embedded in JWT. Authorization reads current DB state per request (Stage 5L stale-access protection preserved).

## Multi-owner (future)

Schema allows multiple `OWNER` memberships per business (unique on user+business, not one-owner-per-business). 5M.1 does not expose APIs to add a second owner; `ownerId` remains the compatibility primary owner.
