# AOP — Admin Catalog / Operations Management Plane

**Gate:** **AOP.0 PASS — ADMIN CATALOG / OPERATIONS CONTRACT LOCKED** · **AOP.1 PASS — BACKEND ADMIN CATALOG CORE IMPLEMENTED** (Catalog API)  
**Status:** Architecture contract (AOP.0) + **AOP.1 backend** staff catalog primitives (see §2.2 implementation note).  
**Depends on:** **6.12A PASS** — [business-location.md](./business-location.md) (authoritative; **must not** redesign); [kazakhstan-compliance-contract.md](./kazakhstan-compliance-contract.md) §31; Stage **6.9.1** staff RBAC (`StaffPermission`, `@RequireStaffPermission`); existing Admin Web surfaces (moderation, applications, claims, monetization, reports, taxonomy, read-only branch content).

**History:** `docs/changelog.md`. **AOP Phase 0 read-only audit:** PASS (accepted before this lock).

---

## 1. Admin catalog responsibility

**Admin Web** (`apps/admin-web`) is the **internal staff operations plane** for QalaGo **catalog data** and related privileged operations.

It **must eventually** support authorized staff workflows for:

| Area | Scope |
|------|--------|
| **Business** | Brand shell, taxonomy, lifecycle, descriptive/content fields staff may edit |
| **BusinessLocation** | Full branch CRUD aligned with domain invariants |
| **Taxonomy** | Category/subcategory assignment via shared backend taxonomy |
| **Publication** | Status / visibility / moderation-aligned lifecycle |
| **Media & catalog content** | Where staff already has `CONTENT_EDIT` / owner-parity read paths |
| **Operations** | Search, filter, list, inspect catalog entities |
| **Audit** | Append-only record of privileged mutations (see §8) |

**Admin Web is not:**

| Surface | Role |
|---------|------|
| **Business Web** | Owner/manager **self-service** (membership-scoped) |
| **Consumer Web / Flutter** | **Public** discovery and consumer UX |
| **Legal CMS** | Full legal document lifecycle (F.7 / safety queues remain separate) |

No duplicate Admin catalog database. **PostgreSQL + Catalog API** remain the single source of truth (§10).

---

## 2. Staff Business creation contract

### 2.1 Problem (accepted Phase 0 finding)

Today **`POST /api/v1/businesses`** (privileged global admin only) **must not** be reused as the Admin catalog creation workflow because it:

- sets **`ownerId`** to the **acting staff user**;
- creates **active OWNER `BusinessMembership`** for that staff user;
- contradicts **ownerless staff-created catalog** allowed by architecture and KZ-C.0.

**Admin Web** currently has **no** end-to-end UI to create **Business + initial primary BusinessLocation**.

### 2.2 Target API

```http
POST /api/v1/admin/businesses
```

Staff-only (`@AdminStaffRoute` + **`StaffPermission.BUSINESS_CREATE`** — see §5). **Implemented in AOP.1** (`AdminService.createStaffBusiness` → `createBusinessWithInitialPrimaryInTx`, `ownerId: null`, default **`PENDING`**).

**AOP.1 Admin read/update (backend):**

| Method | Route | Permission |
|--------|-------|------------|
| GET | `/api/v1/admin/businesses` | `BUSINESS_VIEW` (existing) |
| GET | `/api/v1/admin/businesses/:id` | `BUSINESS_VIEW` |
| GET | `/api/v1/admin/businesses/:id/locations` | `BUSINESS_VIEW` |
| POST | `/api/v1/admin/businesses/:id/locations` | `BUSINESS_EDIT` |
| PATCH | `/api/v1/admin/businesses/:id/locations/:locationId` | `BUSINESS_EDIT` |
| POST | `/api/v1/admin/businesses/:id/locations/:locationId/set-primary` | `BUSINESS_EDIT` |
| DELETE | `/api/v1/admin/businesses/:id/locations/:locationId` | `BUSINESS_EDIT` |
| PATCH | `/api/v1/admin/businesses/:id/catalog` | `BUSINESS_EDIT` (allowlisted core fields; no slug/owner/status) |
| GET | `/api/v1/admin/businesses/:businessId/content` | `BUSINESS_VIEW` (existing) |

**AOP.3 (implemented):** Admin BusinessLocation mutations delegate to **`BusinessLocationService.*ForAdmin`** via **`AdminBusinessLocationService`** (staff city scope + audit metadata `admin_location_*`). Owner plane **`/businesses/:id/locations`** unchanged.

### 2.3 Staff-created Business rules (locked)

| Rule | Requirement |
|------|-------------|
| **Owner** | **`ownerId` MAY be `null`** |
| **Acting staff** | **MUST NOT** become OWNER; **MUST NOT** receive `BusinessMembership` as owner/manager side-effect |
| **Later ownership** | Via existing **claim / application / ownership** flows only |
| **Atomic create** | **Business brand shell + exactly one PRIMARY `BusinessLocation`** in **one transaction** |
| **Aggregate** | Reuse **`createBusinessWithInitialPrimaryInTx`** (or current equivalent in `business-primary-location-aggregate.util` / `BusinessPrimaryLocationService`) — **no duplicated** primary/one-BL invariant logic |
| **Partial failure** | **No** committed Business without valid initial primary BL |

### 2.4 Minimum creation inputs (current schema — no new DB fields in AOP.0)

**Business (brand):** `title`, `slug` (see §2.5), `categoryId`, optional `shortDesc`, brand-level contact defaults where applicable (`phone`, etc. per DTO evolution in AOP.1).

**Initial primary BusinessLocation:** `cityId` (required), `address` (required per domain), optional `latitude`/`longitude`/`locationSource` (pair rules unchanged), optional branch contacts / `workHours` per [business-location.md](./business-location.md).

**Taxonomy:** valid **Category** id; subcategories follow existing assignment rules (AOP.1+).

**Initial status:** default **`PENDING`** unless AOP.5 explicitly defines staff “create as ACTIVE” policy (§6).

### 2.5 Slug

- **Global uniqueness** on `Business.slug` (current schema).
- **Immutable after creation** for AOP unless a **future dedicated** slug-migration / redirect architecture is explicitly designed (F.4 / extensibility).
- Admin **must not** casually rename slug in routine edit UI/API.

### 2.6 Validation & errors (locked behavior)

| Condition | Outcome |
|-----------|---------|
| Duplicate slug | **409** / reject; no partial row |
| Invalid / inactive city | **404** / **400**; transaction rolled back |
| Invalid category / subcategory combo | Reject; no partial Business |
| Invalid coordinates (half-pair, out of bounds) | Reject per existing BL validation |
| Invalid primary location payload | Reject entire create |
| Transaction failure | **Full rollback** — no orphan Business |

---

## 3. Business catalog editing contract

Admin edits use the **current** `Business` + related models. Group fields:

| Group | Examples | Who (typical) |
|-------|----------|----------------|
| **A — Identity / core** | `title`, internal ids | `BUSINESS_EDIT`; slug **not** casual edit |
| **B — Public descriptive** | `shortDesc`, cover, gallery (via uploads/content) | `BUSINESS_EDIT`, `CONTENT_EDIT` |
| **C — Taxonomy** | `categoryId`, subcategories | `CATEGORY_EDIT` / `BUSINESS_EDIT` + `PATCH admin/businesses/:id/taxonomy` pattern |
| **D — Lifecycle / publication** | `status`, featured, plan hooks | `BUSINESS_EDIT`; transitions §6 |
| **E — Sensitive** | `ownerId`, memberships, auth identities, billing/payment, security | **Dedicated permissions** only (`BUSINESS_OWNERSHIP_CHANGE`, staff MFA, finance) — **no** casual catalog editor access |

**Existing Admin API (today):** list businesses, read branch content snapshot, patch **status**, **featured**, **plan**, **taxonomy** — not full profile/BL CRUD.

**Ordinary catalog editors MUST NOT** casually mutate group **E**. No auth redesign in AOP.

---

## 4. BusinessLocation Admin management

Admin **must** gain parity with owner BL operations (via **Admin API**, not Business Web), using **`BusinessLocation`** as **sole** physical/city authority:

| Operation | Contract |
|-----------|----------|
| List | All BL for a Business (primary first) |
| Create | Secondary BL; or initial primary only via §2 create |
| Update | Address, city, coordinates, `locationSource`, contacts, hours |
| Set primary | **`POST …/set-primary`** semantics; cross-city allowed with confirm UX |
| Deactivate/delete | Per existing domain rules — **no** retired Business geo fallback |

**Preserve (frozen 6.12A):**

- Exactly **one** primary BL invariant  
- **No** Business-level address/lat/lng/cityId as authority  
- Branch-effective catalog/promotions/media (6.12A.7.8)  
- **No** second branch model  

**Primary replacement:** promoting a secondary BL updates owner-equivalent **CITY_ADMIN** scope to **new primary city** ([business-location.md](./business-location.md) § A.9.4.5A) — Admin mutations that imply owner-equivalent access must use **primary BL city**, not “any BL in city” alone.

**Implementation note:** Owner BL CRUD exists on **`/businesses/:id/locations`** (membership). AOP adds **staff-scoped** Admin routes/wrappers with `assertBusinessInAdminScope` / primary-city rules as applicable.

---

## 5. RBAC / staff roles

Canonical permissions: `packages/shared-types/src/staff-permissions.ts`. Enforcement: `@RequireStaffPermission`, `@AdminStaffRoute`, `CityScopeService`.

### 5.1 AOP catalog permission matrix (target)

| Operation | Permission (existing or AOP.1 debt) |
|-----------|-----------------------------------|
| View catalog / businesses / BL read | `BUSINESS_VIEW` |
| Create Business (staff) | **`BUSINESS_CREATE`** (AOP.1 — also granted to **ADMIN**, **CITY_ADMIN**, **CONTENT_MANAGER**) |
| Edit Business core/content | `BUSINESS_EDIT`, `CONTENT_EDIT` |
| Taxonomy assign | `CATEGORY_EDIT` + business taxonomy patch |
| Manage BusinessLocations (staff) | `BUSINESS_EDIT` (+ city scope) |
| Lifecycle / status / featured | `BUSINESS_EDIT` |
| Ownership / membership changes | `BUSINESS_OWNERSHIP_CHANGE` only |
| Application / claim review | Existing review permissions |
| Monetization / finance | `ORDER_*`, `PAYMENT_*`, `FINANCE` role sets |

**Roles without catalog edit:** `ANALYST` (reports), `TECH_ADMIN` (flags), `SUPPORT` (mostly view) — **no** implied create Business.

### 5.2 Staff hierarchy (AOP.7H — locked)

| Level | Role | Scope |
|-------|------|--------|
| 1 | **SUPER_ADMIN** | Global governance; all `StaffPermission`; staff plane; cities; security-critical controls |
| 2 | **ADMIN** | Global **operational** administration (catalog, BL, lifecycle, featured, plan override, taxonomy, moderation, applications) — **no** `STAFF_*` plane |
| 3 | **CITY_ADMIN** | City-scoped operations; **Uralsk** and **Aktobe** CITY_ADMIN share identical permission bundles — difference is **`StaffCityScope` only** |

**CITY_ADMIN summary (AOP.7H):** ANY-BL **read** (list/detail/BL list); **PRIMARY-city** brand core + **lifecycle**; own-city **BL** CRUD/set-primary anti-escalation; **no** taxonomy mutation (`CATEGORY_EDIT` denied); **no** global **featured** mutation; **no** **plan override**; **no** `AUDIT_VIEW`; **no** staff plane.

### 5.2.1 CITY_ADMIN scope modes (locked)

| Mode | Rule |
|------|------|
| **Visibility** (lists, moderation filters, reports) | Business visible iff **ANY** `BusinessLocation.cityId` ∈ managed cities (`buildAdminBusinessScopeWhere`) |
| **Owner-equivalent mutation** (Business Web parity) | **Primary** BL `cityId` ∈ managed cities (`assertBusinessPrimaryLocationCityInAdminScope`) |
| **Anti-escalation** | Secondary BL in city B **does not** grant whole-business owner access while primary remains in city A |

If an AOP operation cannot be expressed with current permissions: record **AOP.1 implementation debt** — **no** hidden bypass.

### 5.3 AOP.4 + AOP.7H — enforced city-scope matrix (implemented)

| Operation | Staff permission | CITY_ADMIN scope |
|-----------|------------------|------------------|
| List / detail / BL list | `BUSINESS_VIEW` | **ANY-BL** visibility |
| Staff create Business | `BUSINESS_CREATE` | Initial primary `cityId` ∈ managed cities |
| Catalog core patch (`PATCH …/catalog`) | `BUSINESS_EDIT` | **Primary-city** authority |
| BL create | `BUSINESS_EDIT` | ANY-BL visibility + target `cityId` ∈ managed cities |
| BL update | `BUSINESS_EDIT` | Existing + target `cityId` ∈ managed cities; **primary BL** edit also requires **primary-city** authority |
| BL set-primary | `BUSINESS_EDIT` | **Primary-city** authority **and** target branch `cityId` ∈ managed cities (blocks cross-city promotion by scoped city admins; blocks B-admin escalation while primary stays in A) |
| BL delete | `BUSINESS_EDIT` | Target branch `cityId` ∈ managed cities (+ domain last/primary rules) |
| Status / lifecycle | `BUSINESS_EDIT` | **Primary-city** authority (**AOP.7H** — not ANY-BL) |
| Featured / plan tier | `BUSINESS_EDIT` at route layer | **DENY** for CITY_ADMIN — **SUPER_ADMIN** + **ADMIN** only (`canStaffMutateBusinessFeatured` / `canStaffOverrideBusinessPlan`) |
| Taxonomy patch | `CATEGORY_EDIT` | **DENY** (role lacks permission); global admins use primary-city helper where applicable |

**Legacy bypass audit:** `POST /api/v1/businesses` (owner plane) remains **global ADMIN/SUPER_ADMIN only** — not staff `BUSINESS_CREATE`. Admin catalog mutations use `@AdminStaffRoute` + `StaffPermission` + `CityScopeService`.

### 5.4 AOP.5 — audit action matrix (implemented)

| Mutation | AuditAction | Notes |
|----------|-------------|--------|
| Staff create Business | `BUSINESS_CREATE` | AOP.1 |
| Catalog core patch | `BUSINESS_PROFILE_UPDATE` | metadata `source: admin_catalog_patch` |
| Taxonomy patch | `BUSINESS_TAXONOMY_UPDATE` | from/to category + subcategory ids |
| Status patch | `BUSINESS_STATUS_UPDATE` | fromStatus → toStatus; tx with mutation |
| Featured patch | `BUSINESS_FEATURED_UPDATE` | featured + slot before/after |
| Plan tier (admin) | `PLAN_OVERRIDE` | existing `PlansService.adminSetTier` |
| BL create/update/set-primary/delete | `BUSINESS_LOCATION_*` | dedicated enum values; set-primary records old/new primary ids |

**Lifecycle:** staff create defaults **`PENDING`**; public discovery queries require **`ACTIVE`**; **`BLOCKED`** excluded. Status changes via **`PATCH …/status`** only (not catalog PATCH). **Moderation:** `BLOCKED` is **Business lifecycle state**; staff may reactivate via status endpoint (audited) — no second moderation gate added in AOP.5.

**Admin Web:** catalog detail — independent UI capabilities (**AOP.7H.2**): **core** / **lifecycle** (PRIMARY-city); **taxonomy** (`CATEGORY_EDIT`); **locations** per-branch city scope (own-city secondary edit **decoupled** from brand read-only); set-primary anti-escalation; staff scope from canonical **`GET /users/me`** profile (**AOP.7H.3** — refresh/login must not use slim auth payload alone). Featured/plan on **dashboard** only (SUPER+ADMIN).

---

## 6. Lifecycle / publication

**Schema (`BusinessStatus`):** `PENDING`, `ACTIVE`, `BLOCKED` (current enum).

| Transition | Who | Notes |
|------------|-----|-------|
| Create | Staff with create permission | Prefer **`PENDING`** default — **do not** accidentally expose incomplete catalog publicly |
| → **ACTIVE** | Staff `BUSINESS_EDIT` | Public discovery uses **ACTIVE**; notify owner **if** `ownerId` set (existing behavior) |
| → **BLOCKED** | Staff `BUSINESS_EDIT` / moderation alignment | Hidden from public catalog |
| Staff-created **ownerless** | No owner notification until ownership attached |

**No new state machine** unless schema audit proves gap. Staff create **should not** default to **ACTIVE** without explicit product decision in AOP.5.

---

## 7. Taxonomy

- Admin assigns **shared backend** categories/subcategories only — **no** Admin-only taxonomy tree.
- Consumer Web, Flutter, Business Web continue same **`Category` / `Subcategory`** models.
- Validate inactive category, invalid subcategory for category, city visibility rules (city-scoped category order/visibility admin endpoints exist).
- **Do not** redesign taxonomy in AOP.

---

## 8. Auditability

AOP is a **privileged** plane. Mutations **should** emit **`AuditLog`** rows where infrastructure exists (`AuditAction.*`, actor, resource, business/city metadata).

| Event | Audit expectation | Current gap (AOP.5) |
|-------|-------------------|---------------------|
| Staff Business create | **`AuditAction.BUSINESS_CREATE`** | **Implemented AOP.1** |
| Business core edit | `BUSINESS_PROFILE_UPDATE` pattern | Partial via owner paths; Admin patch audit **incomplete** |
| Status / featured / plan | Distinct actions | **e.g.** `updateBusinessStatus` **no audit today** — fix in AOP.5 |
| Taxonomy change | Category/business taxonomy audit | Extend as needed |
| BL create/update/set-primary | Location audit actions | Align with owner BL writers |
| Ownership change | Existing claim/ownership audit | Use dedicated flows |

**AOP.0:** **no** new audit tables. **AOP.5** implements missing audit calls.

---

## 9. Kazakhstan compliance interaction

Per [kazakhstan-compliance-contract.md](./kazakhstan-compliance-contract.md):

- **Ownerless staff-created Business** — **allowed**  
- **No** public exposure of `Business.ownerId` / staff PD on consumer surfaces (AOP admin paths still internal)  
- **No** moderation/reporting bypass shortcuts  
- **KZ-C.1 NOT CLOSED** (notification physical QA deferred) — **do not** implement KZ-C.2+ in AOP  
- **BusinessLocation** rules unchanged  

---

## 10. Shared data / clients

All Admin catalog mutations go through **Catalog API** → **PostgreSQL**. Flutter, Consumer Web, Business Web, maps consume the same data via existing APIs/cache invalidation patterns.

**No** hardcoded catalog copies in Admin. **No** APK release required for ordinary catalog content edits once APIs exist.

---

## 11. Mass catalog population gate

**REAL / MASS catalog population remains BLOCKED** until:

| Gate | Verification |
|------|----------------|
| Staff **Business + primary BL** create | AOP.1 + AOP.7 |
| Business core edit | AOP.2 |
| BusinessLocation Admin management | AOP.3 + AOP.7 |
| Taxonomy assignment | AOP.2/4 |
| Safe lifecycle / publication | AOP.5 |
| RBAC + **CITY_ADMIN** | AOP.4 |
| Audit on privileged mutations | AOP.5 |
| Automated regression | AOP.6 |
| Physical Admin browser QA | AOP.7 |

**AOP.0 does not** import or seed production catalog.

---

## 12. Implementation roadmap (AOP.1–AOP.7)

| Stage | Scope | Depends on | Verification | Out of scope |
|-------|--------|------------|--------------|--------------|
| **AOP.0** | **This contract** | Phase 0 audit | Docs PASS | Code/DB |
| **AOP.1** | Backend: `POST /admin/businesses`, staff create aggregate (ownerless), Admin BL staff routes, DTOs, tests | 6.12A aggregate | API/integration tests | Admin UI |
| **AOP.2** | Admin Web: **`/catalog/businesses`** list/detail/create/catalog edit; locations **read-only** (superseded on detail by AOP.3 manager) | AOP.1 | vitest + build **PASS** | — |
| **AOP.3** | Admin Web + API: BusinessLocation CRUD + set-primary (delegates **`BusinessLocationService.*ForAdmin`**) | AOP.1 | vitest + build + **`admin-aop3-business-location.spec.ts`** | Mass import |
| **AOP.4** | RBAC + CITY_ADMIN enforcement matrix (**§5.3**) | AOP.1–3 | **`admin-aop4-catalog-rbac.spec.ts`** + 6.12A.9.4.5A | New roles |
| **AOP.5** | Audit + lifecycle + catalog detail taxonomy/lifecycle UX (**§5.4**) | AOP.1–4 | **`admin-aop5-catalog-audit-lifecycle.spec.ts`** | Legal CMS |
| **AOP.6** | Full automated regression (admin + catalog-api) | AOP.1–5 | CI green | Mobile/consumer |
| **AOP.7** | Physical Admin browser QA + **AOP CLOSURE** | AOP.6 | Manual checklist | Population |

**Do not** start AOP.1 without explicit agreement after AOP.0 commit.

---

## 13. Explicitly out of scope (AOP umbrella)

- Mass catalog import / real business population  
- Consumer / Flutter / Business Web redesign  
- Map layer redesign  
- Home CMS  
- Advertising engine redesign  
- KZ-C.2+ legal implementation  
- KZ-C.1F notification fixture / FCM diagnosis (separate track)  
- Events / editorial / QalaGo AI  
- Production deployment  
- Prisma schema changes **unless** a later AOP stage proves required (prefer none for AOP.1)

---

## 14. Phase 0 audit recap (inputs to this lock)

Admin Web **already useful** for: moderation, applications, claims, monetization, reports, taxonomy city order/visibility, **read-only** business branch content (`GET /admin/businesses/:id/content`).

**Critical gaps** driving AOP: no staff **ownerless** create UI/API; **`POST /businesses`** wrong semantics; incomplete Admin business/BL edit plane; audit gaps on some Admin patches; mass population blocked until AOP.1–7 PASS.

**BusinessLocation architecture — CLOSED/PASS — not reopened.**
