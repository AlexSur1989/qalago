# Business Web vs Mobile Owner Cabinet — Parity Audit

**Audit date:** 2026-10-03 (initial read-only audit); **updated 2026-10-03** through **6.14O.CLOSE** (core mobile owner parity closed).  
**Scope:** Comparison of owner/business management in **`apps/business-web`** vs **`apps/mobile`** (Flutter owner plane).  
**Context:** Post–**6.13M** monetization closure; **6.14O.x — Mobile Owner Parity** workstream (does not reopen 6.13M).  
**Authoritative Business Web contract:** [`business-web-ownership.md`](./business-web-ownership.md) (BIZ.x).  
**Does not reopen:** `docs/monetization/6.13M-monetization-refinement.md`.

---

## 1. Executive conclusion

**They are not functionally identical.** Business Web is the **canonical, membership-gated owner backoffice** (BIZ PASS). Flutter provides a **substantial but partial owner companion** embedded in the consumer app (`/owner/*`), with overlapping APIs for core day-to-day tasks but **large gaps** in **multi-branch (`BusinessLocation`) management**, **branch-scoped catalog/promotions**, **production plan billing (6.13M.4)**, and **profile/location model alignment (BIZ.4)**.

**Gap size:** **Medium–large** for multi-location businesses; **smaller** for single-branch MVP operators who only need profile, menu, photos, promotions, reviews, analytics, team, and ad purchase flows.

---

## 2. Product intent (repository evidence)

| Interpretation | Evidence |
|----------------|----------|
| **Business Web = authoritative owner plane** | BIZ.1–BIZ.9 PASS; sidebar route matrix; BL-only physical writes (BIZ.4); branch ALL/SELECTED for menu/promotions (6.12A.7.8); Admin parity docs reference **Business Web** as owner self-service. |
| **Flutter = consumer app + partial owner cabinet** | `app_router.dart`: owner routes under `/owner` with drawer; `OwnerDashboardScreen` + management grid; **no** `/business/[id]/locations` equivalent; `docs/ai-project-context.md` branch media debt explicitly lists **“owner Flutter branch upload”** deferred; onboarding/claim routes exist on mobile. |
| **Not full parity by default** | No doc states “mobile must mirror Business Web 1:1”; BIZ closure scope is **Business Web**-centric. |

**Answer:** **B — primarily a consumer app with partial owner functionality**, with Business Web as the **full** cabinet. Mobile covers many **core** owner journeys but is **not** equivalent to Business Web for **branch-heavy** or **production billing** workflows.

---

## 3. Navigation trees

### 3.1 Business Web (permission-scoped shell)

Source: `apps/business-web/lib/business-access.ts` + `BusinessShell`.

**Main nav (per selected business, gated by `BusinessPermission`):**

| Nav id | Route pattern | Permission gate |
|--------|---------------|-----------------|
| home | `/dashboard` | — |
| profile | `/business/[id]` | `BUSINESS_PROFILE_EDIT` or `BUSINESS_HOURS_EDIT` |
| locations | `/business/[id]/locations` | same as profile |
| media | `/business/[id]/media` | `PHOTOS_EDIT` |
| menu | `/business/[id]/menu` | `CATALOG_EDIT` |
| promotions | `/business/[id]/promotions` | `PROMOTIONS_EDIT` |
| reviews | `/business/[id]/reviews` | `REVIEWS_REPLY` |
| monetization | `/monetization/*` | `ADS_MANAGE` |
| stats | `/statistics` | `ANALYTICS_VIEW` |
| settings | `/settings` | `BUSINESS_PROFILE_EDIT` |
| team | `/business/[id]/team` | **ownerOnly** (+ platform `businessTeamEnabled`) |

**Footer nav:** `/plan` (`PAYMENTS_VIEW`), `/help`.

**Onboarding (outside shell):** `/onboarding/*` (apply, search, claim, applications).

**Global:** `/messages`, `/login`, `/legal/accept`, `/account-deletion`, `/monetization/checkout`, etc.

### 3.2 Flutter owner navigation

Source: `app_router.dart`, `OwnerScaffold` drawer, `OwnerDashboardScreen` grid.

**Drawer (`OwnerScaffold`):** `/owner` (overview), `/owner/analytics/:id`, `/owner/promote` + `/owner/monetization/*`, `/owner/messages`, `/owner/plan`, `/owner/team`, `/owner/settings`, `/owner/help`, back to `/home`.

**Dashboard management grid (not in drawer):** `/owner/edit/:id`, `/owner/menu/:id`, `/owner/gallery/:id`, `/owner/promotions/:id`, `/owner/reviews/:id`, `/owner/analytics/:id`, `/owner/team` (owner only).

**Onboarding:** `/business/apply`, `/business/search`, `/business/start`, `/business/applications`, `/business/claims`, `/business/:id/claim`.

**Missing vs Web nav labels:** dedicated **locations/branches**, **media** (gallery instead), **statistics** naming (analytics), **monetization** hub page (promote entry), **settings** vs Web account+business settings split.

---

## 4. Feature parity matrix

Statuses: **YES** | **PARTIAL** | **NO** | **NOT FOUND** | **CONSUMER ONLY** | **EXPECTED DIFFERENCE**

| Capability | Business Web | Mobile owner | Same behavior? | Same permissions? | Notes |
|------------|--------------|--------------|----------------|-------------------|-------|
| **A. Business profile** | `/business/[id]` brand + taxonomy; BL read for primary | `/owner/edit/:id` | PARTIAL | PARTIAL | **6.14O.1:** Mobile profile PATCH is identity-only (`title`, `shortDesc`, `description`); branch fields moved to `/owner/locations/*` |
| Logo / cover | Profile + media | Edit + gallery | PARTIAL | YES | Cover via gallery; Web `/media` |
| Category / subcategory | Web profile | Mobile edit + subcategory helpers | YES | YES | Both PATCH taxonomy |
| Status / visibility | Web profile / admin | Dashboard status label; limited owner status API | PARTIAL | — | Mobile `updateBusinessStatus` targets **admin** path in repository (owner use unclear) |
| **B. Contacts** | Profile + per-branch on locations | Per-branch on location form | PARTIAL | YES | **6.14O.1:** phone/WhatsApp/Instagram/website on BusinessLocation CRUD; not on business profile PATCH |
| **C. Business locations / branches** | `/business/[id]/locations` CRUD, primary, hours | `/owner/locations/:id` (+ create/edit) | PARTIAL | PARTIAL | **6.14O.1:** list/create/edit/delete/set-primary via owner BL API; city names enriched from `/cities`; no Web map UX parity |
| **D. Working hours** | Business-level on profile + **per-location** on locations | Per-location on branch form | PARTIAL | PARTIAL | **6.14O.1:** `workHours` on BL PATCH; profile edit no longer sends hours; MANAGER hours-only via `BUSINESS_HOURS_EDIT` on update |
| **E. Services / products (menu)** | `/business/[id]/menu` + branch availability | `/owner/menu/:id` + ALL/SELECTED (**6.14O.3**) | PARTIAL | PARTIAL | Core branch scope parity; Web inline page vs mobile dialog UX |
| **F. Promotions** | `/business/[id]/promotions` + branch scope | `/owner/promotions/:id` + ALL/SELECTED (**6.14O.3**) | PARTIAL | PARTIAL | Organic promotion scope only; not ad campaign targeting |
| Paid ad promotion product | `/monetization` | `/owner/promote` | YES | YES | Same monetization API family in `catalog_repository.dart` |
| **G. Reviews** | List, reply, **report** | List, reply, **report** (**6.14O.4**) | PARTIAL | YES | Manage list via `GET /reviews/manage/:id`; report via `POST /reports` |
| **G2. Permission-aware dashboard** | Sidebar + route gates | Dashboard grid + drawer (**6.14O.4**) | YES | YES | Central `owner_dashboard_actions.dart` + `canAccessOwnerNavItem` |
| **H. Notifications** | `/messages` + unread poll | `/owner/messages` | YES | YES | Typed presentation + deep links (BIZ.6) |
| **I. Plan / subscription** | `/plan` catalog, **PENDING purchase**, history, renew UX (6.13M.5) | `/owner/plan` production **`plan/purchases`** + **`plan/payments`** (6.14O.2) | PARTIAL | PARTIAL | Core billing parity YES; mock checkout dev-only; no external payment gateway UI on either client |
| **J. Advertising / monetization** | Full `/monetization/*` hub (**6.13M.5** plan + ads sections) | `/owner/promote` hub (**6.14O.5**) + orders + campaigns | YES (core UX) | YES | Same monetization API; mobile landing mirrors Web separation (not pixel parity) |
| **K. Managers / team** | `/business/[id]/team` | `/owner/team` | YES | PARTIAL | Both owner-gated; platform `businessTeamEnabled` on Web |
| **L. Ownership / applications** | `/onboarding/*` | `/business/*` onboarding routes | YES | YES | Parity on apply/claim/applications |
| **M. Account settings** | `/settings` (name, logout) | `/owner/settings` | YES | YES | Phone read-only both; locale on mobile app-level |

---

## 5. Backend / API parity

| Capability | Backend (representative) | Web uses | Mobile uses |
|------------|-------------------------|----------|-------------|
| My businesses + access | `GET /businesses/my` | Yes | Yes |
| Profile PATCH (brand) | `PATCH /businesses/:id` (brand fields) | Yes (BIZ.4) | Yes (+ legacy geo fields) |
| BusinessLocation CRUD | `GET/POST/PATCH …/locations`, set-primary | Yes | **No** (public GET only) |
| Catalog / menu | `…/catalog`, manage service items | Yes | Yes |
| Branch availability on items/promos | DTO `branchAvailability` | Yes | **Not in owner UI** |
| Photos | `…/photos` | Yes (`/media`) | Yes (`/owner/gallery`) |
| Promotions CRUD | `…/promotions` | Yes | Yes |
| Reviews + reply | reviews API + reply | Yes | Yes |
| Review report | `POST /reports` (REVIEW target) | Yes | Yes (**6.14O.4**) |
| Review manage list | `GET /reviews/manage/:businessId` | Yes | Yes (**6.14O.4**) |
| Notifications | inbox + unread count | Yes | Yes |
| Plan context | `GET …/plan` | Yes | Yes |
| Plan mock checkout | `POST …/plan/mock-checkout` | Yes (dev) | Yes (flag) |
| Plan production purchase | `POST …/plan/purchases` | Yes (6.13M.4) | Yes (**6.14O.2**) |
| Plan payment history | `GET …/plan/payments` | Yes | Yes (**6.14O.2**) |
| Monetization quote/order/campaigns | `/monetization/*` | Yes | Yes |
| Team invite/manage | `…/team` | Yes | Yes |
| Analytics / export | owner analytics + CSV export | Yes (`/statistics`) | Yes (`owner_analytics_screen` + export utils) |
| Legal acceptance gate | legal manifest accept | Web login → `/legal/accept` | Mobile auth flow (separate) |

**Patterns:**

- **BACKEND EXISTS, MOBILE UI MISSING:** none material post–6.14O.4 for audited owner scope.
- **BACKEND EXISTS, WEB UI MISSING:** None material for audited scope.
- **DIFFERENT client model (reduced 6.14O.1):** Profile/geo — both clients now write physical truth via BusinessLocation; legacy Business address fields remain on backend but Mobile owner no longer PATCHes them from profile edit.
- **SAME API:** Menu, gallery, promotions (business-wide API), reviews reply, monetization purchase path, team, notifications, plan **read** context.

---

## 6. Permission parity

Both clients mirror **`BusinessPermission`** enum (Web TS / Mobile Dart).

| Area | Web | Mobile |
|------|-----|--------|
| Shell / drawer filtering | `buildPermissionScopedShellNav` hides nav items | `filterOwnerNavByPermission` on drawer |
| Dashboard grid | Route gates on pages (`useBusinessRouteGate`) | **`owner_dashboard_actions.dart`** filters tiles + summary cards (**6.14O.4**) |
| Team | `ownerOnly` + feature flag | `OwnerNavItem.team` owner-only |
| Plan checkout | Owner-only on backend; Web UX | Mobile mock checkout when flag |

**Residual:** Deep-linked routes still rely on screen-level checks + backend; grid/drawer now aligned with Web nav gates (**6.14O.4**).

---

## 7. Plan-tier limit parity

Both surfaces consume backend **plan context** (limits, usage, entitlements) on owner dashboard / plan pages.

| Limit signal | Web | Mobile |
|--------------|-----|--------|
| Usage counters (photos, items, promotions) | Dashboard / section UX | Owner dashboard card |
| Enforce on create | Server gates + Web UI | Server gates; mobile screens link to `/owner/plan` on limit errors (gallery, promotions, team) |
| Over-limit published slice | Web copy from entitlements | Mobile shows `overLimitNotice` on dashboard |

**Risk:** Frontend-only differences possible on edge screens; **backend `PlanLimits` is authoritative** on both. No evidence mobile bypasses limits.

---

## 8. RU/KK terminology (owner-facing)

Shared keys largely aligned via `owner-visual-copy` (Web) and `app_ru.arb` / `app_kk.arb` (Mobile):

| Concept | Web (RU) | Mobile (RU) | Match? |
|---------|----------|-------------|--------|
| Plan | Тариф | Тариф (`ownerNavPlan`) | YES |
| Team | Команда | Команда | YES |
| Promote / ads nav | Реклама и продвижение | `ownerMonetizationTitle` + hub sections (**6.14O.5**) | YES (core) |
| Branches | **Филиалы** (nav) | **Филиалы** / **Филиалдар** (`ownerLocationsTitle`) — owner grid + `/owner/locations` | YES (6.14O.1) |
| Messages | Уведомления | Сообщения / notifications copy | PARTIAL |
| Analytics | Статистика (nav) | Статистика | YES |
| Settings | Настройки | Настройки | YES |

KK: Web `Филиалдар` vs Mobile `Жарнама` etc. follow same pattern as RU for nav keys where present.

---

## 9. Classified gaps

### P0 — Critical parity gap (if mobile parity expected for multi-branch / billing)

1. ~~**Production plan billing (6.13M.4)**~~ — **closed in 6.14O.2** (production purchase + pending + history; owner-only purchase; mock dev-only).
2. ~~**No owner BusinessLocation / branch management**~~ — **closed in 6.14O.1** (core CRUD; PARTIAL vs Web UX).
3. ~~**Profile vs location model (BIZ.4)**~~ — **closed in 6.14O.1** (identity-only business PATCH).

**P0 (initial audit):** none remaining for core owner billing + branches.

### P1 — Important

1. ~~**Branch-scoped menu/promotions** (ALL/SELECTED)~~ — **closed in 6.14O.3** (mobile `BranchAvailabilitySelector`; edit preserves scope).
2. ~~**Review report**~~ — **closed in 6.14O.4**.
3. ~~**Mobile dashboard grid permission UX**~~ — **closed in 6.14O.4**.
4. ~~**Monetization hub UX**~~ — **closed in 6.14O.5** (My Plan + Advertising landing on `/owner/promote`).

**P1 (core scope):** none remaining after **6.14O.CLOSE**.

### P1 — Non-blocking naming / route overlap (downgraded to P2 at closure)

1. **Dedicated media route** vs gallery naming (functional overlap) — see §22 P2 backlog.

### P2 — Convenience

1. Navigation structure (drawer vs sidebar; grid shortcuts).
2. `/statistics` vs `/owner/analytics/:id` naming.
3. Web `/help` vs Mobile `/owner/help`.
4. Business Web **legal accept** gate on login; Mobile uses app legal flow.

### EXPECTED DIFFERENCE

1. Business Web as **desktop-first backoffice** with full branch + billing maturity.
2. Flutter **consumer shell** + owner drawer (not a standalone business-only app).
3. **Admin** catalog operations — neither mobile owner nor required on mobile.

---

## 10. Missing on Business Web

Nothing major in audited scope that Mobile has **exclusively** for owners except:

- **In-app return to consumer home** (`/home`) from owner drawer — by design.
- **Mock plan checkout** exposed on Mobile when dev flag enabled (Web also has mock path).

---

## 11. Recommended target model

**Business Web authoritative + Mobile companion (core parity only)**

- **Authoritative:** branches, branch-scoped catalog/promotions, production plan billing, full monetization/plan UX, BIZ.4 location writes.
- **Companion (mobile):** dashboard KPIs, quick edit profile (aligned to BL over time), menu/gallery/promotions/reviews, notifications, team, ad purchase, analytics export — **when** backend already supports.

Do **not** target pixel-perfect nav parity or full Business Web surface on phone without product sign-off.

---

## 12. Suggested implementation order

1. ~~**Align owner profile PATCH with BIZ.4**~~ — **6.14O.1 Implemented**.
2. ~~**Mobile BusinessLocation management**~~ — **6.14O.1 Implemented** (see §15).
3. ~~**Production PlanPayment** on Mobile~~ — **6.14O.2 Implemented**.
4. ~~**Branch availability** on Mobile menu/promotions forms~~ — **6.14O.3 Implemented**.
5. **Review report** on Mobile.
6. **Permission-filtered management grid** on Mobile.
7. **Terminology / monetization hub** polish (optional P2).

---

## 13. Files reviewed (representative)

| Area | Paths |
|------|--------|
| Business Web nav / RBAC | `apps/business-web/lib/business-access.ts`, `components/business-shell.tsx` |
| Business Web routes | `apps/business-web/app/business/[id]/**`, `app/plan/page.tsx`, `app/monetization/**`, `app/onboarding/**`, `app/settings/page.tsx`, `app/messages/page.tsx`, `app/statistics/page.tsx` |
| Business Web API | `apps/business-web/lib/api.ts` (ownerApi) |
| Flutter router | `apps/mobile/lib/core/router/app_router.dart` |
| Flutter owner UI | `apps/mobile/lib/features/owner/presentation/**`, `features/owner/monetization/**` |
| Flutter RBAC | `apps/mobile/lib/core/rbac/business_access.dart` |
| Flutter API | `apps/mobile/lib/features/catalog/data/catalog_repository.dart` |
| Architecture | `docs/architecture/business-web-ownership.md`, `docs/ai-project-context.md` (branch/deferred notes) |

---

## 15. 6.14O.1 — Mobile BusinessLocation & Owner Profile Alignment

**Status:** Implemented (Flutter owner plane; no backend/schema changes).

### Previous mobile behavior

- `/owner/edit/:id` PATCHed `address`, geo (`BusinessLocationValue.toPayload()`), contacts, and `workHours` on **`PATCH /businesses/:id`**.
- No owner route for branch CRUD; only **`GET …/locations/public`** for consumers.

### New mobile behavior

- **`/owner/locations/:businessId`:** list branches (city via `/cities` enrichment, address, primary badge, phone, hours summary); create via FAB; edit/set-primary/delete when `BUSINESS_PROFILE_EDIT` (hours edits also respect `BUSINESS_HOURS_EDIT` on PATCH).
- **`/owner/edit/:id`:** business identity + taxonomy only; card links to **Филиалы / Филиалдар**.
- **Repository:** owner BusinessLocation CRUD mirrors Business Web `ownerApi` routes.

### Business-owned fields (mobile PATCH)

`title`, `shortDesc`, `description`, `subcategoryIds` (taxonomy section only).

### BusinessLocation-owned fields

`cityId`, `address`, `latitude`, `longitude`, `locationSource`, `workHours`, `phone`, `whatsapp`, `instagram`, `website`, primary via **`POST …/set-primary`**.

### Navigation

Owner dashboard grid tile **Филиалы** (permission-gated); `OwnerNavItem.locations` registered for RBAC filtering.

### CRUD / permissions

- Create/delete/set-primary: **`BUSINESS_PROFILE_EDIT`** (backend).
- Update: profile vs hours split mirrored in mobile form (same as Web locations page).
- Delete errors: `BUSINESS_LOCATION_LAST_DELETE_BLOCKED`, `BUSINESS_LOCATION_PRIMARY_DELETE_BLOCKED` → localized snackbars.

### Zero / single / multi-location

- **Zero:** empty state + add branch CTA; legacy business `address` read-only hint if present (no auto-backfill).
- **Single / multi:** same BL model; first create becomes primary (backend).

### Legacy fallback

Legacy Business address/geo **not** written from profile edit; hint only when no BL rows.

### Tests

`owner_profile_patch_test.dart`, `owner_business_location_test.dart`, `owner_location_permissions_test.dart`.

### Deferred (6.14O.1)

- Drawer entry for locations (grid only in this stage).
- Full permission-filtered dashboard grid (locations tile only gated).
- Branch-scoped menu/promotions, PlanPayment mobile, review report.

---

## 15A. 6.14O.1A — Owner Profile Null-Safety Hotfix

**Status:** Implemented (Flutter parsing/rendering only; no backend/schema changes).

### Root cause

- **`BusinessModel.fromJson`** cast `json['address'] as String` while owner/public payloads after **BIZ.4 / BL geo retirement** often **omit** `address` or send **`null`** (e.g. nested `business` on owner **`GET /promotions?businessId=`** selects only `id`, `title`, `slug`, `coverImageUrl`).
- Crash surfaced on owner cabinet paths tied to consumer **Profile → My businesses → Owner** (`/owner` dashboard loads promotions) and any screen calling **`BusinessModel.fromJson`** on those rows (`TypeError: null is not a subtype of type 'String'`).

### Backend contract

- Public DTO allows **`address?: string | null`** (`toPublicBusinessSummaryDto`); physical address authority is **BusinessLocation**, not legacy Business columns.

### Corrected Mobile behavior

- **`BusinessModel.fromJson`:** `(json['address'] as String?)?.trim() ?? ''` for display-safe empty string when missing/null (does not rewrite backend semantics on write).
- **`ownerProfileCompletion`:** safe `coverImageUrl` type check (no cast on null).
- **`SubcategoryModel.fromJson`:** nullable `nameKk` fallback (owner profile taxonomy chips on `/owner/edit/:id`).

### Regression tests

- `apps/mobile/test/features/owner/owner_profile_null_safety_test.dart`

---

## 16. Current Mobile Owner Architecture (post–6.14O.5)

| Concern | Source of truth on Mobile |
|---------|---------------------------|
| Brand / taxonomy | `PATCH /businesses/:id` |
| Physical / contacts / hours | BusinessLocation owner API |
| Plan billing | `POST …/plan/purchases`, `GET …/plan/payments`, `GET …/plan` (PENDING → admin confirm) |
| Plan mock activation | `POST …/plan/mock-checkout` only when `QALAGO_MOCK_PLAN_CHECKOUT` + release gate |
| Menu / promotion branch scope | `branchAvailability: { mode: ALL \| SELECTED, locationIds[] }` on create/update |
| Review report | `POST /reports` (REVIEW); manage list `GET /reviews/manage/:businessId` |
| Dashboard / drawer gates | `owner_dashboard_actions.dart` + `canAccessOwnerNavItem` |
| Monetization hub UX | `/owner/promote` — **My Plan** (`PAYMENTS_VIEW`) + **Advertising** (`ADS_MANAGE`); `owner_monetization_hub.dart` |
| Consumer branch display | Unchanged public locations + effective read paths |

---

## 18. 6.14O.2 — Mobile Production Plan Billing Parity

**Status:** Implemented (Flutter `/owner/plan`; no backend/schema changes).

### Previous Mobile plan behavior

- Production builds showed disabled purchase (“недоступно”); only **`mock-checkout`** when `QALAGO_MOCK_PLAN_CHECKOUT`.
- No **`plan/payments`** history or pending PlanPayment UI.

### New production flow

- **`createPlanPurchase`** with optional stable **idempotencyKey** per purchase attempt (retry-safe).
- **Pending** banner when any `PlanPayment.status == PENDING`; CTAs blocked via `canOfferPlanPurchase`.
- **Pull-to-refresh** reloads plan + payments + dashboard plan slice.
- **Renew / upgrade / downgrade** rules mirror Business Web `plan-owner-ui.ts` (owner role required to purchase; `PAYMENTS_VIEW` for plan read via existing `GET …/plan`).

### Mock checkout

- Unchanged dev flag path; production never uses mock for normal CTAs.

### RU/KK

- Pending title, history statuses, renew hint, action labels, downgrade error — ARB + `owner_l10n.dart`.

### Tests

- `owner_plan_ui_test.dart`, `owner_plan_l10n_test.dart`, `owner_plan_business_switch_test.dart`.

### Deferred (6.14O.2)

- External payment gateway / bank instructions (not in API).
- Full monetization hub UX parity (6.13M.5 layout on mobile).

---

## 19. 6.14O.3 — Mobile Branch-Scoped Menu & Promotions

**Status:** Implemented (Flutter owner; no backend/schema changes).

### Backend semantics (unchanged)

- DTO: `{ mode: 'ALL' | 'SELECTED', locationIds: string[] }` — ALL requires empty `locationIds`; SELECTED requires ≥1 valid business location id.
- Join tables `ServiceItemBranchAvailability` / `PromotionBranchAvailability`; location delete blocked when referenced (`BUSINESS_LOCATION_DELETE_BLOCKED`).

### Previous Mobile behavior

- Create/edit menu items and promotions **omitted** `branchAvailability` → backend treated as ALL for new items; Web-created SELECTED records were invisible and at risk on unrelated PATCH.

### New Mobile behavior

- Reusable **`BranchAvailabilitySelector`** (loads `ownerBusinessLocationsProvider` from 6.14O.1).
- Menu item + promotion dialogs: ALL / SELECTED multi-select; validation mirrors Web.
- **Edit preservation:** `branchAvailability` sent only when changed; price/title-only edits do not reset scope.
- **Permissions:** selector read-only without `CATALOG_EDIT` / `PROMOTIONS_EDIT`; purchase actions unchanged.
- **Zero locations:** SELECTED disabled; localized “add branch first”.
- **Stale selected ids:** warning copy; validation blocks save until resolved.

### Tests

`owner_branch_availability_test.dart`, `owner_branch_availability_l10n_test.dart`.

---

## 20. 6.14O.4 — Mobile Review Report & Permission-Aware Dashboard

**Status:** Implemented (Flutter owner; no backend/schema changes).

### Review report

- **Backend:** `POST /api/v1/reports` with `{ targetType: 'REVIEW', targetId, reason, details? }`; duplicate open report → `REPORT_ALREADY_SUBMITTED` (409).
- **Eligibility:** Same as Business Web reviews route — business member with **`REVIEWS_REPLY`** (manage plane access); report uses authenticated user, no separate permission.
- **Mobile:** Owner reviews screen overflow / button → reason + optional details → `ContentReportRepository.submitReviewReport`; localized success / duplicate via `mapReviewReportError`.
- **List:** Owner reviews provider switched to **`GET /reviews/manage/:businessId`** (moderation-hidden rows included).

### Permission-aware dashboard

- **`owner_dashboard_actions.dart`:** single map for grid tiles (profile, locations, menu, gallery, promotions, reviews, analytics, team) aligned with Business Web `BUSINESS_ROUTE_ACCESS` semantics.
- **Dashboard sections gated:** analytics KPI/chart (`ANALYTICS_VIEW`), plan usage card (`PAYMENTS_VIEW`), profile completion card (`BUSINESS_PROFILE_EDIT`), promotions summary (`PROMOTIONS_EDIT`), monetization card (`ADS_MANAGE`).
- **Drawer:** `canAccessOwnerNavItem` — locations visible for **`BUSINESS_PROFILE_EDIT` OR `BUSINESS_HOURS_EDIT`**; settings requires profile edit.

### Tests

`owner_dashboard_permissions_test.dart`, `owner_review_report_l10n_test.dart`, updated `owner_location_permissions_test.dart`.

---

## 21. 6.14O.5 — Mobile Owner Monetization Hub UX Parity

**Status:** Implemented (Flutter presentation/navigation only; no backend/schema/API changes).

### Previous mobile monetization UX

- `/owner/promote` was a **flat product catalog** + packages + links to campaigns/orders.
- No **My Plan** summary on the monetization landing; plan lived only on `/owner/plan`.
- No **Business vs Promotion** subject step; raw placement aliases (`HOME_*`, `CATEGORY_*`) could surface as primary labels if API returned them.
- PlanPayment pending vs ad order pending were not visually separated on one screen.

### New structure (`PromoteBusinessScreen`)

1. **Intro** — plan capabilities vs paid ads (matches Business Web `monetizationLandingIntro` semantics).
2. **My Plan** (when `PAYMENTS_VIEW`) — tier, expiry, advertising discount %, **PlanPayment PENDING** only here, link to `/owner/plan`. Reuses **6.14O.2** providers; no duplicate PlanPayment logic.
3. **Advertising** (when `ADS_MANAGE`) — campaign KPI chips (ACTIVE / SCHEDULED / PENDING_MODERATION), **ad orders** `AWAITING_PAYMENT` banner (advertising section only), subject chooser (Business / Promotion), filtered products, packages with “not subscription plans” subtitle, links to campaigns/orders.

### Products & packages

- Human labels via `monetizationProductTitle` + alias normalization in **`owner_monetization_hub.dart`** / **`owner_l10n.dart`**.
- VIP **plan tier** is never conflated with VIP **banner** product (`planTierImpliesHomeVipBanner` guard in tests).
- Package codes (START / BUSINESS / MAX / NEW_PLACE) remain advertising bundles, not plan tiers.

### Campaigns

- Existing **`monetization_campaigns_screen.dart`** grouping unchanged (ACTIVE, SCHEDULED, PENDING_MODERATION, COMPLETED, other).
- Hub shows aggregate counts only; no new statuses.

### Pricing / discount

- Quote/checkout unchanged; cards still show backend `basePrice` / `discountPercent` / `finalPrice` from product durations.
- Plan **advertising discount** shown as plan benefit text only (not credit/balance). **`monthlyAdBonusKzt`** not surfaced on mobile owner (no ledger).

### Permissions

- Plan block: `canViewOwnerPlanOnMonetizationHub` → `PAYMENTS_VIEW` (owner bypass).
- Advertising block: `canManageOwnerAdvertising` → `ADS_MANAGE`.
- Dashboard monetization card still routes to `/owner/promote` (**6.14O.4**).

### RU/KK

- New ARB: hub intro, section titles, promote subject labels, ad packages disclaimer, ad orders pending count.

### Tests

- `owner_monetization_hub_test.dart` — sections, labels, subject filter, pending separation, campaign counts, RBAC gates, package disclaimer l10n.

---

## 17. Deferred Work (6.14O.x)

| Item | Target stage |
|------|----------------|
| ~~Review report~~ | **Closed 6.14O.4** |
| ~~Permission-aware management grid~~ | **Closed 6.14O.4** |
| ~~Monetization hub UX~~ | **Closed 6.14O.5** |
| Owner drawer link for locations | Optional polish (P2) |
| Monetization deep polish (recent orders list on hub, pixel parity) | P2 — optional |

---

## 22. 6.14O Series Closure

**Status:** **6.14O CORE PARITY CLOSED** (2026-10-03). Presentation and client wiring only; **no** Prisma/schema/migration or monetization-engine changes in this stream.

### Completed stages

| Stage | Summary |
|-------|---------|
| **6.14O.1** | BusinessLocation owner CRUD + set-primary; profile PATCH identity-only; per-branch contacts/hours |
| **6.14O.1A** | Nullable `Business.address` parse; profile completion + subcategory null-safety |
| **6.14O.2** | Production `POST …/plan/purchases`, `GET …/plan/payments`, pending PlanPayment UX; mock checkout dev-only |
| **6.14O.3** | Menu/promotion `branchAvailability` ALL/SELECTED; edit preserves scope |
| **6.14O.4** | Review report via `POST /reports`; manage reviews list; permission-aware dashboard + drawer |
| **6.14O.5** | Monetization hub: My Plan vs Advertising on `/owner/promote` |

### Final architecture (companion parity)

- **Business Web** remains the authoritative **full desktop backoffice** (map UX, deep monetization sub-routes, media route naming, etc.).
- **Mobile Owner** has **core operational / companion parity**: branches, plan billing, branch-scoped catalog/promos, reviews report, RBAC-aware dashboard, monetization hub separation.
- Matrix rows may still show **PARTIAL** where UX/layout differs without blocking owner operations (e.g. menu dialog vs Web page, map-less locations).

### Closed P0 / P1 (agreed core scope)

- **P0:** none (billing, branches, profile/location model).
- **P1 (core):** production plan purchase, BusinessLocation management, branch-scoped menu/promotions, review report, permission-aware dashboard, monetization hub UX — **all closed** in 6.14O.1–6.14O.5.

### Remaining P2 (backlog — not closure blockers)

- Owner **drawer** direct link to **Locations** (grid/route exists; nav polish).
- **Media vs Gallery** naming (`/media` Web vs `/owner/gallery` Mobile).
- **Statistics vs Analytics** route naming.
- **Help** path consistency.
- Monetization hub: **recent ad orders** list on landing (Web has snippet; Mobile links to orders).
- Minor copy/navigation polish.

### Test evidence (closure regression)

Targeted Flutter owner suite (**65 tests**, 2026-10-03): location + l10n + permissions; profile null-safety + profile patch; plan UI/l10n/switch; branch availability + l10n; dashboard permissions; review report l10n; monetization hub. **`flutter gen-l10n`** run. Not a full-app regression.

### Explicitly deferred / out of scope

- **6.14O.6** — not started.
- **6.13M** monetization backend — not reopened.
- Pixel-perfect Web layout parity on mobile.

### Safe Git checkpoint

Checkpoint **recommended** after staging **6.14O manifest only** (see closure report): exclude unrelated consumer-web, backend, home-section, ads/card churn, and **hunk-stage** `catalog_repository.dart` if home-section hunks remain mixed.

---

## 14. Maintenance

Re-run this audit when:

- Business Web adds new owner nav sections or billing flows.
- BIZ or 6.12A branch contracts change.
- A new mobile owner parity stage (post–6.14O) is agreed.

**Initial audit:** read-only. **6.14O.1–6.14O.5 + 6.14O.CLOSE:** mobile owner core companion parity implemented (uncommitted checkpoint at series start SHA `9574b9aba4468cfbf19395397b0747ea69b6e1a9`).
