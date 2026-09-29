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

## 14. Team / manager access (BIZ.3)

### 14.1 Roles & statuses (schema)

| `BusinessMembershipRole` | `OWNER` · `MANAGER` |
| `BusinessMembershipStatus` | `INVITED` · `ACTIVE` · `SUSPENDED` · `REVOKED` |
| `BusinessInvitationStatus` | `PENDING` · `ACCEPTED` · `REVOKED` · `EXPIRED` |

Cabinet (`GET /businesses/my`): **ACTIVE** OWNER or MANAGER only. **INVITED / SUSPENDED / REVOKED** excluded.

### 14.2 `BusinessPermission` inventory (enum — do not extend without contract)

`BUSINESS_PROFILE_EDIT` · `BUSINESS_HOURS_EDIT` · `CATALOG_EDIT` · `PHOTOS_EDIT` · `PROMOTIONS_EDIT` · `REVIEWS_REPLY` · `ANALYTICS_VIEW` · `ANALYTICS_EXPORT` · `ADS_MANAGE` · `PAYMENTS_VIEW`

**OWNER:** all permissions via `BusinessAccessService` (`ownerHasAllPermissions()`).

**MANAGER:** only `permissions[]` on **ACTIVE** membership row.

### 14.3 OWNER-only (backend `assertOwner`)

| Action | API / service |
|--------|----------------|
| Invite manager | `POST /businesses/:id/team/invite` |
| Revoke pending invitation | `DELETE …/team/invitations/:invitationId` |
| Change manager status / permissions | `PATCH …/team/:membershipId` |
| List team (Business Web plane) | `GET …/team` — managers denied |
| Plan checkout / owner billing mutations | owner or `PAYMENTS_VIEW` per endpoint (see plans module) |

**OWNER row** cannot be updated or revoked via team PATCH (403). No voluntary ownership transfer in product.

### 14.4 MANAGER capability matrix (backend authority)

| Permission | Backend (representative) | Business Web nav / route |
|------------|--------------------------|---------------------------|
| `BUSINESS_PROFILE_EDIT` | Brand profile PATCH; **BusinessLocation** create/update/delete/set-primary (`BusinessLocationService`) | Profile, locations, settings |
| `BUSINESS_HOURS_EDIT` | Location hours fields (patch deps) | Profile, locations |
| `CATALOG_EDIT` | Menu / service items | `/business/[id]/menu` |
| `PHOTOS_EDIT` | Business media | `/business/[id]/media` |
| `PROMOTIONS_EDIT` | Promotions CRUD | `/business/[id]/promotions` |
| `REVIEWS_REPLY` | Reviews owner plane | `/business/[id]/reviews` |
| `ANALYTICS_VIEW` / `ANALYTICS_EXPORT` | Analytics dashboards (export requires both; normalized on invite) | `/statistics` |
| `ADS_MANAGE` | Monetization / campaigns | `/monetization/*` |
| `PAYMENTS_VIEW` | Plan status / payments read | `/plan` (footer nav) |

Nav: `apps/business-web/lib/business-access.ts` — `ownerOnly: team`; `anyOf` permission gates. **Backend remains authority** on direct URL.

### 14.5 BusinessLocation + managers (decision)

**Intended:** managers with **`BUSINESS_PROFILE_EDIT`** may create, edit, delete, and set-primary **BusinessLocation** (same permission as brand profile). Verified by `stage-6-12a4-business-location-crud.spec.ts` and `BusinessLocationService` guards. **Not** a BIZ.3 policy change.

### 14.6 Invitation flows

| Channel | Create | Accept |
|---------|--------|--------|
| **Phone** (unknown user) | `BusinessInvitation` PENDING, `tokenHash: null`, TTL 7d | **`claimPendingInvitations`** after OTP login — **phone must match** invitation phone |
| **Phone** (existing user) | Immediate **ACTIVE MANAGER** membership | N/A |
| **Email** | `tokenHash` + one-time URL `/invite/:token` | `POST /invitations/accept` — **auth identity email must match** invitation email (BIZ.3) |

Duplicate PENDING invites for same phone/email on a business are **revoked** before re-issue. Plan **`assertCanAddManager`**: counts **ACTIVE managers + non-expired PENDING invitations** (accept may exclude self invitation id).

Audit: `TEAM_INVITE`, `TEAM_INVITATION_ACCEPT`, `TEAM_PERMISSION_UPDATE`, `TEAM_SUSPEND`, `TEAM_RESTORE`, `TEAM_REVOKE`. Notifications: `BUSINESS_INVITATION_RECEIVED`, `BUSINESS_INVITATION_ACCEPTED` (existing producers).

### 14.7 Session after membership change

Revoked/suspended manager: next **`GET /businesses/my`** omits business; BIZ.2 selection fallback; API mutations **403** via `BusinessAccessService`. Permissions are **per business** in `/my` access payload — not cached globally on user.

---

## 15. Business Web profile vs location (BIZ.4)

- **Business Web profile PATCH** sends **brand fields only** (`title`, descriptions, brand contacts, taxonomy). **No** `address` / `latitude` / `longitude` / `locationSource` on business PATCH from UI.
- **Primary physical edits** use **BusinessLocation** API; see **`docs/architecture/business-location.md`** § BIZ.4.
- **BIZ.3** manager/team contract **unchanged**.

## 16. Operational content & plan limits (BIZ.5)

| Area | Permission | API (owner plane) | Plan limit (catalog enum) |
|------|------------|-------------------|---------------------------|
| **Service items / menu** | `CATALOG_EDIT` | `ServiceItemsService` + menu groups | `maxServiceItems`: FREE **10**, BASIC **50**, PREMIUM **150**, VIP **300** |
| **Media / photos** | `PHOTOS_EDIT` | `UploadsService` attach/list/delete/cover | `maxPhotos`: FREE **5**, BASIC **20**, PREMIUM **50**, VIP **100** |
| **Promotions** | `PROMOTIONS_EDIT` | `PromotionsService` | `maxActivePromotions` + daily create cap; FREE **1**, BASIC **3**, PREMIUM **10**, VIP **25** |

**Branch assignment (6.12A.7.8):** zero assignment rows ⇒ **ALL** locations; explicit rows ⇒ **SELECTED** only. Foreign `locationId` rejected. Location delete blocked when assignments exist.

**Downgrade:** content **preserved** in DB; public surfaces slice to plan limits; **new create** blocked at/above limit (`assertCanAdd*`); **update/delete** of existing rows allowed (BIZ.5: service item **create** now calls `assertCanAddServiceItem`).

**Business Web routes:** `/business/[id]/menu`, `/media`, `/promotions` — nav gated by permissions per selected business (`business-access.ts`).

---

## 17. Reviews & Business Web notifications (BIZ.6)

| Area | Permission | API | Plan |
|------|------------|-----|------|
| **Reviews list (owner plane)** | `REVIEWS_REPLY` | `GET /reviews/manage/:businessId` — all non-deleted reviews incl. **moderationHidden** | — |
| **Review reply** | `REVIEWS_REPLY` | `PATCH /reviews/:id/reply` — single `ownerReply` field (create/update overwrite) | `canReplyToReviews` (**FREE false**, **BASIC+ true**) |
| **Public reviews** | — | `GET /reviews?businessId=` — `publicReviewWhere()` (visible only) | — |

**Reply guards:** access resolved on **`review.businessId`** (cross-business IDOR denied). Soft-deleted review → **404**. Hidden reviews: owner may list + reply; public list excludes them.

**Notifications (owner inbox):** `NEW_REVIEW` → owners/managers with `REVIEWS_REPLY` (`notification-recipients.util`). Payload: `businessId`, `reviewId`, `rating`, `businessName`. Business Web **`/messages`**: typed presentation via `@qalago/notification-presentation`; navigation **`resolveBusinessNotificationHref`** (payload `businessId`, not shell selection). Legacy rows without payload: mark-read only, no crash.

**Audit:** `REVIEW_REPLY_CREATE` on owner reply. Moderation remains staff plane.

**Out of scope (unchanged):** KZ-C.1 FCM/inbox physical QA; push delivery verification.

---

## 18. Plans, entitlements & billing (BIZ.7)

**Storage enum (Prisma):** `FREE` | `BASIC` | `PREMIUM` | `VIP`. **Product display:** FREE / BUSINESS / PRO / VIP via `plan-display.util` (`BASIC→BUSINESS`, `PREMIUM→PRO`). Legacy `TOP_CITY` migrated to `VIP` (migration 4C); no separate TOP_CITY tier in runtime.

**Source of truth:** `PLAN_CATALOG` + `PlanLimitsService` (`services/catalog-api/src/common/services/plan-limits.service.ts`). Public catalog: `GET /plans`. Per-business context: `GET /businesses/:id/plan` → `getBusinessPlanContext` (effective tier, usage, entitlements, team slots).

**Prices (KZT / 30-day paid period):** FREE **0**, BASIC **4900**, PREMIUM **9900**, VIP **19900**.

| Tier (enum) | Display | Photos | Items | Active promos | Managers | Review replies | Analytics days | Ad discount | Ad bonus/mo |
|-------------|---------|--------|-------|---------------|----------|----------------|----------------|-------------|-------------|
| FREE | Бесплатный | 5 | 10 | 1 | 0 | no | 30 BASIC | 0% | 0 |
| BASIC | Бизнес | 20 | 50 | 3 | 1 | yes | 30 EXTENDED | 5% | 500 |
| PREMIUM | PRO | 50 | 150 | 10 | 3 | yes | 90 FULL | 10% | 1500 |
| VIP | VIP | 100 | 300 | 25 | 10 | yes | 365 ANALYTICS_360 | 15% | 3500 |

Also: `maxPromotionsCreatedPerDay`, `maxPromotionDurationDays`, support/moderation priority — see `PlanLimits` interface.

**Access:** View plan + payment history → **`PAYMENTS_VIEW`**. Checkout / tier change → **OWNER only** (`assertOwner`). Mock checkout: `POST …/plan/mock-checkout` when `mockPlanCheckoutEnabled` and non-production.

**Payment maturity:** **Class C** — internal `PlanPayment` rows (`COMPLETED` | `FAILED`, `isMock` default true); **no production PSP** on subscription path. Campaign ads use separate monetization orders (admin manual flow).

**PlanPayment:** created on paid tier activation (not on admin `skipPayment` override). No `PENDING` approval state in schema.

**Downgrade / expiry:** `planExpiresAt` past → effective **FREE** (`syncExpiredPlan`); **content preserved**; public sliced; new creates blocked at limit; **existing managers kept** with `team.overLimit` + `assertCanAddManager` blocks new invites only.

**Business Web:** `/plan` — catalog from API; status from plan context; history via **`GET …/plan/payments`**. No receipts/invoices.

**Out of scope:** PSP integration, ads redesign, UXA.

---

## 19. Owner-plane security regression (BIZ.8)

**Authority model:** `BusinessMembership` + **ACTIVE** status + `BusinessPermission` via **`BusinessAccessService`**. Global `UserRole` alone does **not** grant owner-plane access (legacy `UserRole.BUSINESS` requires owner membership or legacy `ownerId` fallback).

**Automated regression:** `owner-plane-security-regression.spec.ts` (umbrella) + domain `*-content-access.spec.ts`, `business-access.service.spec.ts`, `businesses-membership.spec.ts`, team/invite/claim specs, monetization adversarial specs, Business Web `owner-plane-security.test.ts`, BIZ.2 session tests.

**BIZ.8 findings (no CRITICAL/HIGH code defects fixed — tests/docs):**

| Severity | Finding | Status |
|----------|---------|--------|
| INFO | Public business DTOs may still expose `ownerId` (KZ-C.3 debt) | Documented |
| INFO | Business Web direct URL to non-`/my` business: UI lacks membership; **API denies** | By design |
| INFO | Notification deep links route by payload `businessId`; access still enforced on API | By design |
| LOW | No owner-plane payment `PENDING` dedup (BIZ.7) | Deferred |
| INFO | Rate limits: review mutation, auth OTP — partial; no platform-wide limiter | Debt |

**Physical browser QA:** not part of BIZ.8 (follows automated gate).

---

## 20. Deferred (BIZ.9+)
- `ownerId` ↔ ACTIVE OWNER reconciliation after manager promotion.
- Ownership transfer / recovery beyond claim + manager promotion.
- Public `ownerId` removal (KZ-C).
