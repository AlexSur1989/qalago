# Stage 5L — RBAC & Access Control Audit

> **HISTORICAL / SUPERSEDED** — snapshot at checkpoint `fa2e72e` (pre–5M.0).  
> Current authorization truth: [RBAC](./architecture/rbac.md), [Business membership](./architecture/business-membership.md), [Project status](./PROJECT_STATUS.md).

**Date:** 2026-09-08  
**Checkpoint audited:** `fa2e72e` (Stage 5K.1)  
**Scope:** Read-only audit of current authentication, authorization, ownership, and role architecture.  
**No runtime changes** in Stage 5L.

---

## Executive summary

QalaGo MVP uses **four system roles** stored on `User.role`:

| Role | Purpose (current) |
|------|-------------------|
| `USER` | Resident / consumer |
| `BUSINESS` | Business owner (platform role, not per-business membership) |
| `CITY_ADMIN` | City-scoped moderator (`managedCityId`) |
| `ADMIN` | Platform administrator |

**There is no:** `SUPER_ADMIN`, `MODERATOR`, `OWNER` enum value, `BusinessMembership`, fine-grained permission enum, or `AuditLog`.

**Business ownership** is a single nullable FK: `Business.ownerId → User.id`. One user may own **multiple** businesses; one business has **at most one** owner. There is **no** manager/staff/team model.

**Authorization pattern:** Global `JwtAuthGuard` + `RolesGuard` + per-service ownership helpers. Role on each request is **reloaded from DB** (JWT role claim is not trusted alone). Plan tier (`Business.planTier`) adds **entitlement gating** separate from RBAC.

**Critical gaps for Stage 5M:**

| Gap | Severity |
|-----|----------|
| `CITY_ADMIN` city scope **not enforced** on many business-owner routes (analytics, menu, promotions, uploads, plans) | **P0** |
| `POST /uploads` (raw file upload) has **no ownership check** — any authenticated user | **P0** |
| `ai-orchestrator` endpoints are **unauthenticated** | **P0** (network exposure) |
| `BusinessOwnerGuard` defined but **never wired** | **P1** |
| Duplicate ownership helpers with inconsistent CITY_ADMIN behavior | **P1** |
| Business Web lacks post-login role enforcement | **P1** (client UX; server still protects mutations) |
| No audit trail for admin role changes, payment confirm, moderation | **P1** |
| Role enum duplicated (Flutter vs shared-types; business-web not using shared-types) | **P2** |

---

## 1. Prisma — User model

**File:** `services/catalog-api/prisma/schema.prisma`

### UserRole enum (exact)
```
USER | BUSINESS | CITY_ADMIN | ADMIN
```

### User fields
| Field | Type | Notes |
|-------|------|-------|
| `id` | cuid | Primary key |
| `phone` | String @unique | Login identifier |
| `name` | String? | |
| `role` | UserRole @default(USER) | Single system role |
| `isActive` | Boolean @default(true) | Checked in JwtAuthGuard |
| `preferredCityId` | String? | Consumer city preference |
| `managedCityId` | String? | CITY_ADMIN assigned city |
| `createdAt` / `updatedAt` | DateTime | |

### Relations
- `ownedBusinesses` → `Business[]` via `BusinessOwner`
- `favorites`, `reviews`, `notifications`, `otps`, `orders`

### Status / blocking
- **`isActive` only** — no BLOCKED/SUSPENDED/DELETED enum on User
- No soft-delete (`deletedAt`)

### Payments
- User has `orders[]` (monetization orders), not direct Payment relation

---

## 2. Prisma — Business ownership

### Business fields (auth-relevant)
| Field | Notes |
|-------|-------|
| `ownerId` | String? FK → User, `onDelete: SetNull` |
| `cityId` | FK → City, `onDelete: Restrict` |
| `status` | `PENDING \| ACTIVE \| BLOCKED` |
| `planTier` | `FREE \| BASIC \| PREMIUM \| VIP` |
| `planExpiresAt` | DateTime? |

### Ownership answers (repository truth)

| Question | Answer |
|----------|--------|
| One User → multiple businesses? | **Yes** — `findMy()` uses `where: { ownerId: user.id }` |
| One Business → multiple owners? | **No** — single `ownerId` only |
| User manage business without owning? | **No formal model** — only ADMIN/CITY_ADMIN override |
| USER owner of A + manager of B? | **No manager role** — only owner or admin |
| Ownership transfer? | **No dedicated endpoint** — would require admin DB or `ownerId` update (not exposed in owner API) |
| User deleted? | `ownerId` **SetNull** on businesses — businesses become ownerless |
| Business deleted? | Cascades: favorites, reviews, analytics, images, menu, promotions, plan payments; **Restrict** on orders/campaigns |

There is **no** `BusinessUser`, `BusinessMembership`, `creatorId`, or `managedBy` table.

---

## 3. Role definitions — canonical sources

| Source | Values | Notes |
|--------|--------|-------|
| **Prisma** `UserRole` | USER, BUSINESS, CITY_ADMIN, ADMIN | DB source of truth |
| **packages/shared-types** | Same enum + `ROLE_DEFINITIONS` + helpers | Used by admin-web |
| **Flutter** `role_permissions.dart` | Same strings, duplicated definitions | Not importing shared-types |
| **business-web** | Inline string checks in login | No shared-types dependency |
| **JWT payload** | `sub`, `phone`, `role` | Role refreshed from DB on each request |

**Not found anywhere:** `SUPER_ADMIN`, `MODERATOR`, `OWNER` (as enum), `GUEST` (not stored — unauthenticated).

---

## 4. Authentication

### Flows

| Flow | Endpoint | Role assignment |
|------|----------|-----------------|
| OTP signup/login | `POST /auth/verify-code` | `resolveAccountRole()` — USER or BUSINESS from `accountType`; preserves ADMIN/CITY_ADMIN/BUSINESS |
| DEV login | `POST /auth/dev-login` | Gated by `DEV_LOGIN_ENABLED`; new users → USER; preserves ADMIN |
| Business create | `POST /businesses` | Sets `ownerId`; promotes USER → BUSINESS in transaction |
| Admin role change | `PATCH /admin/users/:id/role` | **ADMIN only**; sets `managedCityId` when role=CITY_ADMIN |
| Profile update | `PATCH /users/me` | name, preferredCityId only — **no role** |

### JWT behavior
- Signed: `{ sub, phone, role }`
- **JwtAuthGuard** loads user from DB and uses **DB role** + `isActive`
- Role change takes effect on **next request** (no stale JWT privilege bypass)

### DEV login exposure
- Server: `DEV_LOGIN_ENABLED=true` in local `.env`
- Clients: `NEXT_PUBLIC_QALAGO_DEV_LOGIN`, Flutter `--dart-define=QALAGO_DEV_LOGIN`
- Seed phones: +77000000001 ADMIN, +77000000002 BUSINESS, +77000000003 USER, +77000000004 CITY_ADMIN (Aktobe)

---

## 5. Global guards

**Registration:** `app.module.ts` — `JwtAuthGuard` then `RolesGuard` (global).

### JwtAuthGuard
- `@Public()` → optional auth
- Non-public → Bearer required, DB user, `isActive`

### RolesGuard
- No `@Roles()` → **any authenticated role** allowed
- Missing user → 403
- Role not in list → 403 `Insufficient role`

### Unused guard
- `BusinessOwnerGuard` — checks ownerId param; **never applied to any route**

---

## 6. Authorization helpers inventory

| Helper | File | ADMIN | CITY_ADMIN | BUSINESS owner | City scope |
|--------|------|-------|------------|----------------|------------|
| `CityScopeService.resolveAdminCityId` | city-scope.service.ts | optional filter | **forced managedCityId** | n/a | Yes |
| `CityScopeService.assertBusinessInAdminScope` | city-scope.service.ts | no-op | **cityId match** | n/a | Yes |
| `BusinessesService.assertCanManage` | businesses.service.ts | pass | pass **no city** | ownerId match | **No** |
| `MenuAccessService.assertCanManage` | menu-access.service.ts | pass | pass **no city** | ownerId match | **No** |
| `UploadsService.assertCanManage` | uploads.service.ts | pass | pass **no city** | ownerId match | **No** |
| `AnalyticsService.assertCanViewBusinessAnalytics` | analytics.service.ts | pass | pass **no city** | ownerId match | **No** |
| `PlansService.assertCanView/Manage` | plans.service.ts | pass | pass **no city** | ownerId match | **No** |
| `PromotionsService.assertCanManage` | promotions.service.ts | pass | pass **no city** | ownerId match | **No** |
| `MonetizationAccessService.assertCanManageBusiness` | monetization-access.service.ts | pass | pass **no city** | ownerId match | **No** |
| `MonetizationAccessService.assertOrderAccess` | monetization-access.service.ts | pass | **city scoped** | owner | Yes |
| `MonetizationAccessService.assertCampaignAccess` | monetization-access.service.ts | pass | **city scoped** | owner | Yes |
| `MonetizationAccessService.assertAdminPaymentAccess` | monetization-access.service.ts | pass | **city scoped** | deny | Yes |
| `MonetizationAccessService.assertBusinessOwner` | monetization-access.service.ts | pass | pass **no city** | owner | **No** — **unused** |

---

## 7. Endpoint security map (concise)

### @Public (no auth)
- Auth: send-code, verify-code, dev-login
- Health, cities, categories list
- Businesses: list, detail, catalog, photos (public pagination)
- Promotions list, reviews list by business
- Service menu public reads
- Analytics event tracking (`POST /analytics/events`)
- Monetization: ad serve/events, product catalog

### Authenticated, no @Roles (any role including USER)
- Favorites CRUD (self-scoped)
- Reviews create, reviews/me
- Notifications, users/me
- Businesses: create, my, recommended, PATCH (service checks owner)
- Uploads: **POST /** raw file upload (**no ownership**)

### @Roles(BUSINESS, ADMIN, CITY_ADMIN)
- Analytics read/export
- Plans checkout for business
- Promotions mutate
- Reviews reply
- Service menu/items/groups mutate
- Monetization owner routes (orders, campaigns, creatives)
- Uploads business image attach/list/delete/cover

### @Roles(ADMIN, CITY_ADMIN) — admin controller
- Business moderation, reviews admin, category city order/visibility
- Monetization admin lists/actions (with city filter)

### @Roles(ADMIN) only
- List users, change user role
- Cities CRUD, geo search
- Global category CRUD (`POST/PATCH/DELETE /categories`)

---

## 8. Resource access detail

### Business profile (title, address, phone, hours, coords, etc.)
| Action | Who |
|--------|-----|
| Public read | ACTIVE business via public endpoints |
| Edit | Owner (`BUSINESS` + ownerId) OR ADMIN OR CITY_ADMIN (**no city check**) |
| Server check | `BusinessesService.assertCanManage` on PATCH |

### Catalog (ServiceMenuGroup, ServiceItem)
| Action | Who |
|--------|-----|
| Public read | @Public menu endpoints |
| CRUD | Owner OR ADMIN OR CITY_ADMIN via `MenuAccessService` (**no city check**) |
| Plan limits | `PlanLimitsService` on create (not auth) |

### Photos / gallery (BusinessImage)
| Action | Who |
|--------|-----|
| Public read | Paginated via businesses public content |
| Upload file | **Any authenticated user** (`POST /uploads`) — **gap** |
| Attach/list/delete/cover | Owner OR ADMIN OR CITY_ADMIN via `UploadsService.assertCanManage` |
| Plan limits | `assertCanAddPhoto` on attach |

### Promotions
| Action | Who |
|--------|-----|
| Public list | @Public with city/active filters |
| CRUD | `@Roles(BUSINESS,ADMIN,CITY_ADMIN)` + `assertCanManage` (**no city check**) |
| Activation | Plan limits (`assertCanActivatePromotion`) |

### Reviews
| Action | Who |
|--------|-----|
| Read by business | @Public (includes user name, not phone) |
| Create | Any authenticated user (no block on reviewing own business) |
| Reply | Owner OR ADMIN OR CITY_ADMIN (**reply: no CITY_ADMIN city check**) |
| Admin delete | `/admin/reviews/:id` — **city scoped** |

### Favorites
| Action | Who |
|--------|-----|
| All ops | Self-scoped to `user.id` |
| Owner sees favoriters? | **No endpoint** — only aggregate `FAVORITE_ADD` in analytics |
| Privacy | **Preserved** — no user identity exposed to business owner |

### Analytics (Stage 5F–5K.1)
| Action | Who |
|--------|-----|
| Track events | @Public |
| Dashboard/export | `@Roles(BUSINESS,CITY_ADMIN,ADMIN)` + owner check (**no city check**) |
| Plan gating | Capabilities by `planTier` (export VIP-only, etc.) |
| Cross-owner | **Blocked** in service + tests |

### Advertising / monetization
| Action | Who |
|--------|-----|
| Ad serve/track | @Public |
| Owner orders/campaigns | BUSINESS owner + admin overrides |
| Admin payment confirm | ADMIN/CITY_ADMIN — **city scoped** |
| Campaign analytics | Owner via `assertCampaignAccess`; admin city-scoped |

### Plans / payments
| Action | Who |
|--------|-----|
| Plan catalog | @Public |
| Mock checkout | Owner + `@Roles` |
| Admin set tier | Admin service — ADMIN/CITY_ADMIN with city scope on business |
| Payment confirm | Admin monetization — city scoped |

---

## 9. CITY_ADMIN scope matrix

**Storage:** `User.managedCityId` → `City.id` (required for scoped admin actions; throws if null).

| Resource | Scoped to managed city? | Mechanism |
|----------|-------------------------|-----------|
| Admin list businesses | **Yes** | `resolveAdminCityId` |
| Admin update business status/plan/featured | **Yes** | `assertBusinessInAdminScope` |
| Admin list/delete reviews | **Yes** | city filter / assert |
| Admin monetization lists | **Yes** | `resolveAdminCityFilter` |
| Admin order/campaign/payment single access | **Yes** | monetization access service |
| Category city order/visibility | **Yes** | manual managedCityId check |
| **Analytics dashboard/export** | **No** | assertCanView — global for CITY_ADMIN |
| **Menu/catalog CRUD** | **No** | MenuAccessService |
| **Promotions CRUD** | **No** | promotions assertCanManage |
| **Business PATCH** | **No** | businesses assertCanManage |
| **Uploads attach** | **No** | uploads assertCanManage |
| **Plans checkout** | **No** | plans assertCanManage |
| **Global category CRUD** | **No** | `@Roles(ADMIN,CITY_ADMIN)` on `/categories` mutate |

**Risk:** CITY_ADMIN can access **any city's business data** on business-owner API routes if they know `businessId`.

---

## 10. ADMIN capabilities

Current `ADMIN` effectively acts as **platform super-user** for MVP:

- All cities moderation
- User list + **role assignment** (including CITY_ADMIN + managedCityId)
- City CRUD, geo search
- Global category CRUD
- Business plan tier override
- Payment confirmation (all cities)
- Can use business-owner routes for any business
- Can log into Business Web (client allows)

**No separate SUPER_ADMIN** — ADMIN holds highest privilege.

---

## 11. MODERATOR / SUPER_ADMIN

| Concept | Exists? |
|---------|---------|
| `SUPER_ADMIN` role | **No** — not in schema, code, or clients |
| `MODERATOR` role | **No** — CITY_ADMIN labeled "Модератор города" in UI only |
| Fine-grained Permission enum | **No** |
| CASL / policy engine | **No** |

---

## 12. Client authorization

### Flutter mobile
- **Router:** go_router — client-only guards
- `canManageBusinessCabinet`: BUSINESS, ADMIN, CITY_ADMIN → `/owner/*`
- `canModerate`: ADMIN, CITY_ADMIN → `/admin`
- `/owner/create-business`: **any authenticated user** (matches server USER→BUSINESS promotion)
- CITY_ADMIN: locked to `managedCitySlug` in admin moderation UI
- **Server is authoritative** for mutations

### Business Web
- Token in localStorage; `useAuth()` checks token only
- Login gate: USER, BUSINESS, ADMIN, CITY_ADMIN accepted
- **No post-login role re-check** — `canAccessBusinessWeb` from shared-types **unused**
- Business selection: client localStorage; server scopes via `/businesses/my` + ownership asserts
- **No Next.js middleware**

### Admin Web
- Login + `useAuth`: ADMIN and CITY_ADMIN only
- Nav hides Users/Cities for CITY_ADMIN
- City selector locked for CITY_ADMIN (client + server)

### AI orchestrator
- **No authentication** on any endpoint
- Optional Bearer forwarded to catalog for recommendations
- Admin-web calls AI from browser without auth headers
- CORS default `*`

---

## 13. Multi-business / multi-owner / manager

| Capability | Current state |
|------------|---------------|
| Multi-business per user | **Supported** — multiple rows with same ownerId |
| Multi-owner per business | **Not supported** — single ownerId |
| Business manager/staff | **Does not exist** — no employee/team tables or routes |
| Permission array | **Does not exist** |

---

## 14. Audit logging

**No AuditLog model or admin action history.**

Implicit trails only:
- `createdAt`/`updatedAt` on entities
- `AnalyticsEvent` (aggregate metrics, not admin actions)
- `Notification` (user-facing, not audit)

**Not auditable today:** role changes, payment confirm, review delete, business status change, plan override.

---

## 15. User lifecycle / deletion

| Action | Behavior |
|--------|----------|
| Block user | `isActive=false` — rejected at JWT validation |
| Delete user | **No API** found — would be manual/seed |
| Delete business | **No owner API** — admin moderation only |
| Owner deleted | Businesses: `ownerId` → null (SetNull) |

---

## 16. Security attack review (static)

| Attack | Current mitigation | Gap |
|--------|-------------------|-----|
| **A. IDOR** (change businessId) | Ownership asserts on mutating services | CITY_ADMIN bypasses city on many routes |
| **B. Horizontal escalation** (A→B) | ownerId checks + tests on analytics/export | Same CITY_ADMIN gap |
| **C. Vertical escalation** (USER→ADMIN) | Role only via admin endpoint; signup cannot set role | — |
| **D. CITY_ADMIN scope escape** | Strong on `/admin/*`, weak on business routes | **P0** |
| **E. Stale JWT role** | DB role reload each request | Mitigated |
| **F. Mass assignment role** | verify-code uses resolveAccountRole; updateMe excludes role | — |
| **G. Client-only auth** | Server RBAC on API | Business-web/Flutter UI bypassable |
| **H. Analytics/export bypass** | assertCanView + tests | — |
| **I. Ads/payments bypass** | MonetizationAccessService + city scope on admin | — |
| **J. DEV login in prod** | Env gate 404 when disabled | Misconfiguration risk |

---

## 17. Current access matrix

Legend: **ALLOW** | **DENY** | **SCOPED** (city or self) | **PLAN-GATED** | **UNKNOWN**

| Resource / action | GUEST | USER | BUSINESS | CITY_ADMIN | ADMIN |
|-------------------|-------|------|----------|------------|-------|
| Browse businesses/search/map | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW |
| Favorites | DENY | ALLOW (self) | ALLOW (self) | ALLOW (self) | ALLOW (self) |
| Create review | DENY | ALLOW | ALLOW | ALLOW | ALLOW |
| Profile edit | DENY | ALLOW (self) | ALLOW (self) | ALLOW (self) | ALLOW (self) |
| Create business | DENY | ALLOW → promotes to BUSINESS | ALLOW | ALLOW | ALLOW |
| Business profile edit | DENY | DENY | ALLOW (owned) | ALLOW (**any city**) | ALLOW (any) |
| Catalog manage | DENY | DENY | ALLOW (owned) | ALLOW (**any city**) | ALLOW (any) |
| Photos manage | DENY | DENY | ALLOW (owned) | ALLOW (**any city**) | ALLOW (any) |
| Raw file upload `/uploads` | DENY | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| Promotions manage | DENY | DENY | ALLOW (owned) | ALLOW (**any city**) | ALLOW (any) |
| Analytics view | DENY | DENY | ALLOW (owned) + PLAN-GATED | ALLOW (**any city**) + PLAN-GATED | ALLOW (any) |
| Analytics CSV export | DENY | DENY | ALLOW (owned VIP) | ALLOW (**any city**, VIP) | ALLOW (any, VIP) |
| Ads orders/campaigns | DENY | DENY | ALLOW (owned) | SCOPED (admin lists) / ALLOW (owner routes) | ALLOW |
| Ad analytics | DENY | DENY | ALLOW (owned campaigns) | SCOPED | ALLOW |
| Plan purchase (mock) | DENY | DENY | ALLOW (owned) | ALLOW (**any city**) | ALLOW |
| Review reply | DENY | DENY | ALLOW (owned business) | ALLOW (**any city**) | ALLOW |
| Moderate businesses | DENY | DENY | DENY | SCOPED (managed city) | ALLOW (all) |
| Moderate reviews | DENY | DENY | DENY | SCOPED | ALLOW |
| Approve ad creative | DENY | DENY | DENY | SCOPED | ALLOW |
| Manage users/roles | DENY | DENY | DENY | DENY | ALLOW |
| Manage cities | DENY | DENY | DENY | DENY | ALLOW |
| Global categories CRUD | DENY | DENY | DENY | ALLOW (**no city limit**) | ALLOW |
| Confirm payments | DENY | DENY | DENY | SCOPED | ALLOW |

---

## 18. Future gap matrix (target Stage 5M+)

| Target concept | Current state | Gap class |
|----------------|---------------|-----------|
| `BusinessMembership` OWNER/MANAGER | Single `ownerId` only | **P1** architecture |
| Fine-grained manager permissions | Role-only + ownership | **P1** |
| `MODERATOR` system role | CITY_ADMIN covers partial | **P2** |
| `SUPER_ADMIN` vs `ADMIN` split | ADMIN is all-powerful | **P1** |
| Separate business role from `User.role=BUSINESS` | BUSINESS is both identity and capability | **P1** |
| CITY_ADMIN scope on all business routes | Inconsistent | **P0** security |
| AuditLog | Missing | **P1** |
| ai-orchestrator auth | Open | **P0** |
| Upload ownership on raw POST | Missing | **P0** |
| Team management / ownership transfer | Missing | **P2** |

---

## 19. Recommended migration strategy (Stage 5M+)

**Phase A — Security fixes (no schema)**
- Add city scope to all `assertCanManage*` helpers for CITY_ADMIN
- Restrict `POST /uploads` or require business context
- Add auth to ai-orchestrator (API key or JWT passthrough)

**Phase B — Introduce BusinessMembership (schema)**
- Table: `businessId`, `userId`, `role` (OWNER|MANAGER), `status`, `permissions[]`
- Keep `ownerId` during transition

**Phase C — Backfill**
- For each business with ownerId: create OWNER membership

**Phase D — Central authorization service**
- Single `AuthorizationService.can(user, action, resource)`
- Replace duplicated asserts

**Phase E — MANAGER + permission enum**
- Grant subset per membership; OWNER gets all business permissions

**Phase F — System role cleanup**
- Rename/clarify: `BUSINESS` platform role → optional deprecation
- Introduce MODERATOR, SUPER_ADMIN as needed

**Phase G — Remove legacy paths**
- Drop direct ownerId checks when membership is canonical

---

## 20. Recommended future BusinessMembership permissions

### SAFE OPERATIONAL (MANAGER candidate)
- BUSINESS_PROFILE_VIEW / EDIT
- BUSINESS_HOURS_VIEW / EDIT
- CATALOG_VIEW / EDIT
- PHOTOS_VIEW / EDIT
- PROMOTIONS_VIEW / EDIT
- REVIEWS_VIEW / REPLY

### SENSITIVE (OWNER default, optional MANAGER grant)
- ANALYTICS_VIEW / ANALYTICS_EXPORT
- ADS_VIEW / ADS_MANAGE
- PAYMENTS_VIEW

### OWNER-ONLY
- TEAM_VIEW / TEAM_MANAGE
- Ownership transfer
- Business deletion
- Billing/plan changes (policy decision)

---

## 21. Recommended admin role split

| Capability | MODERATOR (future) | CITY_ADMIN | ADMIN | SUPER_ADMIN (future) |
|------------|-------------------|------------|-------|----------------------|
| Content moderation | Yes | City-scoped | All cities | All |
| Review delete | Yes | City | All | All |
| Ad creative approve | Yes | City | All | All |
| Payment confirm | No | City | All | All |
| Plan/pricing change | No | No | Yes | Yes |
| User role assignment | No | No | Limited? | Yes |
| City launch/CRUD | No | No | Yes | Yes |
| Admin user creation | No | No | No | Yes |

*Adapt in 5M based on product decisions.*

---

## 22. Test coverage audit

### Existing authorization tests
| Area | File | Coverage |
|------|------|----------|
| OTP/DEV login roles | auth.service.spec.ts, auth-role.util.spec.ts | Good |
| CITY_ADMIN city scope | city-scope.service.spec.ts | resolveAdminCityId |
| Monetization cross-city | monetization-access.service.spec.ts | Orders, payment confirm |
| Analytics cross-owner | analytics.service.spec.ts, analytics-export.spec.ts | Good |
| Plan downgrade | plan-downgrade-entitlements.spec.ts | Entitlements not RBAC |

### Missing tests (priority)
| Gap | Priority |
|-----|----------|
| CITY_ADMIN blocked on other city's analytics/menu/promotions | **P0** |
| USER cannot PATCH other's business | P1 |
| uploads POST unauthorized abuse | P0 |
| Reviews: owner reviewing own business | P2 |
| Review reply CITY_ADMIN city scope | P1 |
| businesses.service assertCanManage | P1 |
| menu-access.service | P1 |
| uploads.service | P1 |
| plans.service assertCanManage | P1 |
| promotions assertCanManage cross-owner | P1 |
| Role change endpoint authorization | P1 |
| BusinessOwnerGuard (if wired) | P2 |

---

## 23. Files referenced

| Area | Primary paths |
|------|---------------|
| Schema | `services/catalog-api/prisma/schema.prisma` |
| Auth | `services/catalog-api/src/modules/auth/` |
| Guards | `services/catalog-api/src/common/guards/` |
| City scope | `services/catalog-api/src/common/services/city-scope.service.ts` |
| Shared RBAC docs | `packages/shared-types/src/rbac.ts` |
| Flutter RBAC | `apps/mobile/lib/core/rbac/role_permissions.dart` |
| Flutter router | `apps/mobile/lib/core/router/app_router.dart` |
| Business Web auth | `apps/business-web/lib/use-auth.ts`, `app/login/page.tsx` |
| Admin Web auth | `apps/admin-web/lib/use-auth.ts` |
| AI orchestrator | `services/ai-orchestrator/src/` |

---

*End of Stage 5L audit. Implementation deferred to Stage 5M.*
