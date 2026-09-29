# Business Web — ownership & claim contract (BIZ)

**Gate:** **BIZ.0 PASS** — read-only audit (2026-09-29).  
**Status:** **BIZ.1** locks canonical ownership semantics for owner onboarding.  
**Depends on:** [business-location.md](./business-location.md) (6.12A brand/branch invariants), [admin-catalog-operations.md](./admin-catalog-operations.md) (staff catalog plane, AOP staff create).

**Related API:** Catalog API `/api/v1` — `ownership-claims`, `business-applications`, `businesses/my`, `BusinessAccessService`.

---

## 1. Canonical authorization

| Concept | Rule |
|---------|------|
| **BusinessMembership** | **Canonical** Business Web authorization when a row exists for `(userId, businessId)`. |
| **Business.ownerId** | **Compatibility pointer** to a `User`; **not** the primary auth source when membership exists. |
| **UserRole** (global) | Staff plane (`ADMIN`, `CITY_ADMIN`, …) is **separate** from business-scoped OWNER/MANAGER. **`UserRole.BUSINESS`** is legacy global role — **must not** be treated as ownership (see §10). |

### 1.1 Membership roles

| Role | Meaning |
|------|---------|
| **OWNER** | Full business-scoped permissions (`BusinessPermission` bundle). |
| **MANAGER** | Subset from explicit `permissions[]` only. |

### 1.2 Membership status (schema)

`INVITED` · `ACTIVE` · `SUSPENDED` · `REVOKED`

Only **ACTIVE** memberships grant cabinet access. **INVITED** must accept invitation first.

### 1.3 Legacy `ownerId` fallback

When **no** `BusinessMembership` row exists for `(user, business)`:

- **ACTIVE owner access** is granted iff `Business.ownerId === user.id` (`BusinessMembershipService.hasActiveOwnerAccess`).
- When a membership row **exists**, only **ACTIVE OWNER** role counts; matching `ownerId` alone does **not** grant access if membership is REVOKED/SUSPENDED.

**BIZ.1 does not remove `ownerId`.** New ownership grants still set `ownerId` when null on claim approval; application approval sets it at create time.

---

## 2. Single canonical OWNER (product lock)

| Layer | Semantics |
|-------|-----------|
| **`Business.ownerId`** | At most **one** user id per business (nullable). |
| **`BusinessMembership`** | At most **one** row per `(userId, businessId)`; product expects **at most one ACTIVE OWNER** per business. |
| **Multiple OWNER rows** | **Not supported** as a product feature. Approval paths reject a second ACTIVE OWNER (BIZ.1). |
| **Manager → OWNER promotion** | Explicit path: pending ownership claim by **ACTIVE MANAGER**, staff approval promotes role (may leave legacy `ownerId` unchanged if it pointed at a prior holder — reconcile in future BIZ debt). |

No ownership **transfer** workflow in BIZ.1 (no voluntary handoff UI/API).

---

## 3. Staff-created business (AOP)

```
SUPER_ADMIN / ADMIN → POST /admin/businesses (AOP)
  → Business.ownerId = null
  → no BusinessMembership
  → status = PENDING (default)
  → primary BusinessLocation created (6.12A)
  → staff actor NEVER becomes OWNER
```

| Step | Claimable? | Owner cabinet? |
|------|------------|----------------|
| **PENDING**, ownerless | **No** | **No** (not in `/businesses/my`) |
| Staff sets **ACTIVE**, still ownerless | **Yes** (see §4) | **No** until claim approved |
| After claim **APPROVED** | N/A | **Yes** (OWNER membership + `ownerId` if was null) |

**Do not** auto-activate on staff create.

---

## 4. Claimability matrix

| Ownership | Business.status | Submit claim (`POST …/ownership-claims`) |
|-----------|-----------------|------------------------------------------|
| **Ownerless** | **PENDING** | **DENY** |
| **Ownerless** | **ACTIVE** | **ALLOW** (subject to rate limits & duplicates) |
| **Ownerless** | **BLOCKED** | **DENY** |
| **Owned** (`ownerId` set and/or ACTIVE OWNER membership) | any | **DENY** for unrelated users |
| **ACTIVE MANAGER** on owned business | **ACTIVE** | **ALLOW** (promotion claim — staff approval required) |

Public/consumer surfaces must **not** expose `ownerId`, owner phone, or membership ids. Onboarding search uses **public catalog** list; claim eligibility is enforced **server-side** on submit.

---

## 5. Claim lifecycle

```
User (authenticated) → POST /businesses/:businessId/ownership-claims
  → PENDING claim, audit BUSINESS_OWNERSHIP_CLAIM_SUBMIT
  → no membership / ownerId change

Staff → GET /admin/ownership-claims (scoped)
  → POST …/approve (BUSINESS_OWNERSHIP_CHANGE + step-up)
      → ACTIVE OWNER membership (create or MANAGER→OWNER)
      → Business.ownerId := claimant if null
      → audit BUSINESS_OWNERSHIP_CLAIM_APPROVE + notification
  → POST …/reject (BUSINESS_CLAIM_REVIEW)
```

**Concurrency (BIZ.1):**

- One **PENDING** claim per `(businessId, claimantUserId)`.
- Approve uses transaction + `updateMany` pending guard.
- Second approve on same claim: **idempotent** (already APPROVED).
- Cannot approve if another **ACTIVE OWNER** exists for a different user.
- Cannot approve unrelated claimant when `ownerId` names another user (except **ACTIVE MANAGER** promotion path).

**Cancel:** claimant may cancel **PENDING** → `CANCELLED` + audit.

---

## 6. New business application (parallel onboarding)

Distinct from **claim existing**:

```
User → BusinessApplication (DRAFT → PENDING)
Staff → POST /admin/business-applications/:id/approve
  → Business + initial PRIMARY BusinessLocation (6.12A)
  → ACTIVE OWNER membership for applicant
  → Business.ownerId = applicantUserId
  → status ACTIVE if city LIVE else PENDING
  → audit + notification
```

Staff permission: **`BUSINESS_APPLICATION_REVIEW`**. CITY_ADMIN scoped by application `cityId`.

---

## 7. Admin claim review scope

| Role | List/filter | Approve ownership | Reject |
|------|-------------|-------------------|--------|
| **SUPER_ADMIN** | Global | Yes (`BUSINESS_OWNERSHIP_CHANGE` + step-up) | Yes |
| **ADMIN** | Global | Yes | Yes |
| **CITY_ADMIN** | Businesses with **ANY** BL in managed city | Yes, only if business in scope | Yes, in scope |

Approve **must not** bypass staff step-up or permission decorators (see `ownership-claims-admin.controller.ts`).

---

## 8. BusinessAccessService (owner plane)

| Actor | Access |
|-------|--------|
| **ACTIVE OWNER** membership | `accessRole=OWNER`, all `BusinessPermission`s |
| **ACTIVE MANAGER** | `accessRole=MANAGER`, explicit permissions only |
| **Legacy** `ownerId` only (no row) | Treated as OWNER (compat) |
| **No membership + no legacy** | **403** on owner-plane mutations |
| **SUPER_ADMIN / ADMIN** (global) | Full owner permissions on any business (operational) |
| **CITY_ADMIN** | Primary-city scoped owner-equivalent (6.12A.9.4.5A) — **not** OWNER identity |

**Do not** conflate `UserRole.ADMIN` with business OWNER for `/businesses/my`.

---

## 9. Audit & notifications

| Event | AuditAction (minimum) |
|-------|------------------------|
| Claim submit | `BUSINESS_OWNERSHIP_CLAIM_SUBMIT` |
| Claim approve | `BUSINESS_OWNERSHIP_CLAIM_APPROVE` |
| Claim reject | `BUSINESS_OWNERSHIP_CLAIM_REJECT` |
| Claim cancel | `BUSINESS_OWNERSHIP_CLAIM_CANCEL` |
| Application approve | `BUSINESS_APPLICATION_APPROVE` |

Notifications: `OWNERSHIP_CLAIM_APPROVED` / `REJECTED`, `BUSINESS_APPLICATION_APPROVED` / `REJECTED` (existing producers — KZ-C.1 FCM physical QA remains open).

---

## 10. Legacy `UserRole.BUSINESS`

| Usage class | Examples |
|-------------|----------|
| **Compatibility** | Route `@Roles(BUSINESS, ADMIN, …)` on owner APIs; JWT role in tests |
| **Unsafe if alone** | Treating global `BUSINESS` role as proof of ownership without membership/`/my` |
| **Migration candidate** | Retire global role when all clients use membership; **not in BIZ.1** |

**BIZ.2:** Business Web cabinet access is **membership-driven only** (`GET /businesses/my` items). Global `UserRole` (including legacy `BUSINESS` and staff roles) **does not** grant owner cabinet without owner-plane membership rows.

---

## 11. Operator playbook (staff-created → real owner)

1. Admin creates business in Admin Web (AOP) — **PENDING**, ownerless, primary BL.
2. Admin verifies catalog, locations, taxonomy.
3. Admin sets lifecycle **ACTIVE** (not claimable while PENDING).
4. Real owner signs into **Business Web** (OTP/social).
5. Owner: onboarding → search city → **«Это мой бизнес»** on correct listing.
6. Owner submits claim (optional message).
7. Authorized staff reviews claim (city scope for CITY_ADMIN).
8. Staff **approve** (step-up) → OWNER membership + `ownerId` if null.
9. Owner refreshes `/businesses/my` → opens dashboard.

**PENDING is not claimable.** Staff must not skip ACTIVE unless product policy changes.

---

## 12. BIZ.1 implementation notes

- Hardened `OwnershipClaimsService.assertCanClaim` / approve grant path against third-party claims on owned businesses and double-OWNER races.
- **`findActiveOwnerMembershipForBusiness`** helper on `BusinessMembershipService`.
- No Prisma schema change in BIZ.1.
- Out of scope: Business Web UI, auth refresh, profile geo cleanup, payments, Consumer/Flutter.

---

## 13. Business Web session & cabinet (BIZ.2)

| Concern | Rule |
|---------|------|
| **Bootstrap** | After access token (memory or `POST /api/auth/refresh`), always **`GET /users/me`** → normalize **`AuthUser`** → then **`GET /businesses/my`**. Never mark session **ready** from slim `refresh.user` alone. |
| **`/users/me` failure** | Clear tokens/session; redirect login — no partial user state. |
| **Cabinet access** | `hasBusinessCabinetAccess` ⇔ **≥1** item in `/businesses/my` (backend already returns ACTIVE OWNER/MANAGER + documented `ownerId` legacy). |
| **No businesses** | Authenticated users (any role) → **onboarding** (`/onboarding`), not empty dashboard; staff may log in but have no owner plane. |
| **Post-login** | `resolvePostLoginDestination`: safe redirect param → else dashboard if cabinet access → else onboarding. |
| **Business switcher** | `SELECTED_BUSINESS_KEY` in `localStorage` must match an id in current `/my`; stale/revoked ids fall back to first accessible; selection never authorizes API calls by itself. |
| **Membership status** | **ACTIVE** only in `/my`; INVITED/SUSPENDED/REVOKED excluded server-side (no client inventing states). |

Implementation: `apps/business-web/lib/business-auth-session.ts`, `business-cabinet-access.ts`, `business-selection.ts`, `use-auth.ts`, `login-session.ts`, `use-business-access.ts`.

Pattern aligned with Admin Web **AOP.7H.3** (canonical profile after refresh); ownership/claim semantics unchanged from **BIZ.1**.

---

## 14. Deferred (BIZ.3+)

- Brand-level geo fields in owner profile PATCH (6.12A violation risk).
- `ownerId` ↔ ACTIVE OWNER reconciliation after manager promotion.
- Ownership transfer / recovery beyond claim + manager promotion.
- Public `ownerId` removal (KZ-C).
