# Stage 5.0 — Consumer Product Audit (Flutter)

Date: 2026-09-06  
Scope: `apps/mobile` consumer flows only (owner/admin referenced where mixed).  
Status: **AUDIT ONLY** — no product code changes in this stage.

---

## Executive summary

QalaGo consumer app has a **functional discovery stack** (home, categories, map, search, business detail, promotions, ads) wired to catalog-api. Critical gap vs MVP intent: **not guest-first** — global router requires login for all routes except `/login`. “Continue as guest” is dev auto-login only.

Organic ranking correctly ignores subscription tier (Stage 4C). Paid visibility is via monetization ad placements (Stage 3B). UI copy still promises TOP/VIP organic priority in several places — **misleading**.

---

## A. Consumer route map

| Route | Screen | Guest? | Auth? | City scoped? | Notes |
|-------|--------|--------|-------|--------------|-------|
| `/login` | login_screen.dart | Yes | No | No | Outside shell |
| `/home` | home_screen.dart | **No** | Yes | Yes | Tab 0 |
| `/categories` | categories_screen.dart | No | Yes | Yes | Tab 1 |
| `/categories/:id` | category_businesses_screen.dart | No | Yes | Yes | Paid ads + organic |
| `/map` | map_screen.dart | No | Yes | Yes | Tab 2, 15km radius |
| `/favorites` | favorites_screen.dart | No | Yes | Partial | Server list not city-filtered |
| `/profile` | profile_screen.dart | No | Yes | Display | Tab 4 |
| `/profile/*` | edit/city/reviews/help/about/permissions | No | Yes | city screen only | |
| `/promotions` | promotions_screen.dart | No | Yes | Yes | Not a tab |
| `/notifications` | notifications_screen.dart | No | Yes | No | |
| `/search` | search_screen.dart | No | Yes | Yes | Not a tab |
| `/business/:id` | business_details_screen.dart | No | Yes | By ID | Shared with owner preview |

**Dead routes:** none found.  
**Duplicate routes:** none.  
**Owner mixed in:** `/business/:id`, profile → `/owner/*` (22 owner routes, unguarded by role at router).  
**Login gate:** global redirect — unauthenticated → `/login`.  
**No splash screen** — `main.dart` → `QalaGoApp` → router `initialLocation: /home` → redirect to login.

---

## B. Bottom navigation

Target V1: Главная | Категории | Карта | Избранное | Профиль

**Current:** matches labels and routes exactly.

**Issues:**
- `/search`, `/promotions`, `/notifications`, `/business/:id` keep bottom nav but highlight **Главная** (index 0) — tab selection bug.
- Profile sub-routes correctly highlight tab 4.

---

## C. Home — current section order

1. Header (logo, city pill, notifications)
2. Search box → `/search` (read-only entry)
3. Empty city gate OR content
4. Categories photo strip (organic)
5. **HOME_VIP_BANNER** (paid, first item only)
6. “Акции и предложения” header → `/promotions`
7. Organic promotions strip (max 6)
8. **HOME_PROMOTIONS** (“Продвигается”, paid)
9. “Рекомендуем” — AI recommendations carousel (organic)
10. **HOME_FEATURED** (“Рекомендуем”, paid — duplicate title)
11. “Рядом с вами” (3 km, organic; subtitle claims TOP/VIP priority — **false**)

---

## D. Home data/API map

| Block | Provider | Endpoint |
|-------|----------|------------|
| Categories | categoriesProvider | GET /categories?citySlug |
| Empty city | cityCatalogTotalProvider | GET /businesses?limit=1 → meta.total |
| Nearby | businessesProvider | GET /businesses + geo 3km |
| Recommended | recommendedBusinessesProvider | POST /recommendations → GET /businesses/:id |
| Promotions | promotionsProvider | GET /promotions?activeNow |
| VIP ad | homeVipBannerAdsProvider | GET /monetization/ads/serve |
| Promotions ad | homePromotionsAdsProvider | same |
| Featured ad | homeFeaturedAdsProvider | same |

---

## E. Ad placement map

| Placement | Where | Session | Impression | Click | Viewability | Empty |
|-----------|-------|---------|------------|-------|-------------|-------|
| HOME_VIP_BANNER | Home after categories | adSessionIdProvider (32 hex, keepAlive) | AD_IMPRESSION | AD_CLICK | ≥50% / 1s | shrink |
| HOME_PROMOTIONS | Home after organic promos | same | AD_IMPRESSION | AD_PROMOTION_OPEN | same | shrink |
| HOME_FEATURED | Home after recommendations | same | AD_IMPRESSION | AD_CARD_OPEN | same | shrink |
| CATEGORY_TOP | Category businesses | same + categoryId | same | AD_CARD_OPEN | same | shrink |
| CATEGORY_BOOST | Category businesses | same + categoryId | same | AD_CARD_OPEN | same | shrink |

**Dedupe:** category screen yes; home **no**.  
**Fail-safe:** serve errors → `[]`; slots hidden.  
**AdImpressionController.reset()** never called — no re-impression after refresh in same session.

---

## F. Categories / subcategories

- **Flat model** — no `Category.parentId` in schema or Flutter.
- City-specific ordering via `CategoryCityOrder`.
- Flow: Home category tap → `/categories/:id` → business list + ads.
- Categories tab: local text filter + submit to search.
- **No subcategory navigation.**

---

## G. Business list

**Cards vary by context:** `_NearbyBusinessTile` (home), `BusinessCard` (category/sponsored), `_SearchResultTile` (search).

**Shown:** photo, name, category, distance, address, plan badge (if API sends planTier), sponsored label.

**Organic ordering:** distance → title (`business_rank.dart`). Tier rank disabled (Stage 4C).

**Legacy leakage:** `isFeatured`/`featuredSlot` parsed in models, **not shown**. Plan badges still render. UI copy references TOP/VIP/Pro organic priority — **incorrect**.

---

## H. Search

- Route: `/search?q=&categoryId=`
- **Server-side:** GET /businesses with `search`, `categoryId`, optional lat/lng
- Debounce: 320ms
- Filters: category chips only
- **No radius** in search (unlike home 3km)
- Geo: `userLocationProvider` only — **no city-center fallback**
- No ads in search
- No search history

---

## I. Filters

| Filter | UI | Backend | Works? |
|--------|-----|---------|--------|
| Category | Search chips, promotions filter | categoryId param | Yes |
| Text search | Search, categories submit | search param | Yes |
| Distance/radius | Home/map/category implicit | lat/lng/radiusKm | Partial (search missing) |
| Open now | — | — | **No** |
| Rating | — | — | **No** |
| Promotion filter | Promotions screen local | activeNow on API | Yes |
| Price | — | — | **No** |

---

## J. Business detail

| Component | Status |
|-----------|--------|
| Cover, gallery, name, category, rating | Implemented |
| Call, WhatsApp, route | Implemented + analytics |
| Website, Instagram | Implemented, **no analytics** |
| Description, work hours | Implemented |
| Menu/services | Implemented (embedded + service-menu API) |
| Promotions list | Embedded only |
| Map preview | **Missing** (route action only) |
| Similar businesses | **Missing** |
| Reviews + submit | Implemented (AI moderation) |
| Favorites | Implemented + analytics |

**Analytics sent:** VIEW_BUSINESS, CALL_CLICK, WHATSAPP_CLICK, ROUTE_CLICK, FAVORITE_ADD/REMOVE.  
**Not sent:** WEBSITE_CLICK, INSTAGRAM_CLICK, PROMOTION_VIEW on detail promotions.

---

## K. Promotions

- Organic feed: GET /promotions?citySlug&activeNow — home strip + `/promotions`
- Tap → `/business/:id` + PROMOTION_VIEW analytics
- **HOME_PROMOTIONS** paid slot separate pipeline (AD_* events)
- Ordering: API/createdAt (no paid reorder of organic feed)

---

## L. Map / location

- flutter_map + OSM tiles, userAgent set
- Markers from businessesProvider (15km)
- Permission: Geolocator; denied → city center fallback on map sheet
- **Radius inconsistency:** map 15km vs home/category 3km
- No marker clustering

---

## M. Favorites

- **Server-only** (GET/POST/DELETE /favorites)
- Requires auth (global gate)
- List **not filtered** by selected city in UI
- Sort dropdown cosmetic (“Недавние” does not re-sort)

---

## N. Auth / guest-first

**Can anonymous user browse? NO.**

| Action | Without login |
|--------|---------------|
| Select Uralsk | No (blocked at router) |
| Open Home | No |
| Browse categories | No |
| Search | No |
| Open business | No |
| Open promotion | No |
| Use map | No |

“Продолжить как гость” = auto-login demo user +77000000003 (dev OTP only).

---

## O. Profile

Guest state: **none** (always logged in).  
Features: name edit, city, favorites shortcut, notifications, owner/admin links, help, about, RBAC permissions explainer, logout.

---

## P. Cities

**Seeded:** Uralsk (LIVE), Aktobe (LIVE). No Shymkent in seed.  
**Model:** `launchStatus`: LIVE | COMING_SOON (not ACTIVE).  
**Default:** uralsk.  
**Persistence:** SharedPreferences + PATCH /users/me preferredCityId when authed.  
**COMING_SOON:** EmptyCityView copy; picker does not badge coming-soon cities.

---

## Q. API matrix (consumer)

| Feature | Repository | Endpoint | Auth | City |
|---------|------------|----------|------|------|
| Cities | catalog | GET /cities | No* | — |
| Categories | catalog | GET /categories | No* | slug |
| Businesses list | catalog | GET /businesses | No* | slug |
| Business detail | catalog | GET /businesses/:id | No* | — |
| Promotions | catalog | GET /promotions | No* | slug |
| Reviews | catalog | GET/POST /reviews | Yes | — |
| Favorites | catalog | /favorites/* | Yes | — |
| Analytics | catalog | POST /analytics/events | Yes | — |
| Ads serve | catalog | GET /monetization/ads/serve | No* | slug |
| Ad events | catalog | POST /monetization/ads/events | No* | — |
| AI recommendations | ai | POST /recommendations | No* | slug |
| Notifications | catalog | GET /notifications | Yes | — |
| Auth | auth | /auth/*, /users/me | — | — |

*Endpoints are public at API level but Flutter router blocks unauthenticated access.

**Base URL:** hardcoded `localhost:3002` / `127.0.0.1:3002` — production risk for mobile builds.

---

## R. Model/DTO gaps

- `isFeatured`, `featuredSlot`: parsed, unused in consumer UI
- `planTier`: badges only; ranking ignores (correct)
- `BusinessModel.isTopCity`: hardcoded false
- `featuredBusinessesProvider`: declared, never used in consumer
- City `ACTIVE` vs `LIVE` naming mismatch (backend LIVE, some docs say ACTIVE)
- No subcategory model in Flutter

---

## S. Loading / error states

Generally present on major screens (LoadingView, ErrorView, empty copy).  
Ads: silent hide on failure (good for UX).  
Search without GPS: works without geo (city-only).  
Raw exceptions: mostly caught; API errors show user-facing Russian messages on main flows.

---

## T. Performance findings

1. AI recommendations: N+1 GET /businesses/:id after POST /recommendations
2. Home loads many providers in parallel on each visit (acceptable for MVP)
3. Map loads up to 15km businesses — no pagination on map markers
4. Ad session + impression dedupe permanent per app session
5. Recommended carousel auto-rotates every 3s

---

## U. Legacy consumer leakage

| Item | Location | Impact |
|------|----------|--------|
| “сначала TOP и VIP” | home nearby subtitle | Misleading |
| Tier subheaders “Топ города”, “VIP·Pro” | home_screen.dart | Never shown (dead UI paths) |
| Map “Приоритетные” | map_screen.dart | Never populated |
| Duplicate “Рекомендуем” | organic + HOME_FEATURED | Confusing |
| `featured` query param | backend DTO | Ignored (OK) |
| Plan badges on tiles | BusinessCard, map | Cosmetic; not organic rank |

---

## V. Test coverage

| File | Area |
|------|------|
| test/ads/* (4 files) | Ads models, serve, viewability, URL |
| test/plan_tier_stage_4c_test.dart | Ranking invariant |
| test/owner/monetization_models_test.dart | Owner monetization labels |
| test/widget_test.dart | App smoke |

**Missing high-value consumer tests:** routing/guest, home sections, search, favorites, business detail analytics, categories, map, promotions feed integration.

**36 tests pass.** flutter analyze: 57 info/warnings (no errors).

---

## W. Build status

| Target | Result |
|--------|--------|
| flutter test | 36 passed |
| flutter analyze | 57 issues (info/warn) |
| flutter build web | OK (prior session) |
| catalog-api test | 170 passed |
| catalog-api build | OK |

---

## Priority classification

### P0 — blocks public MVP

1. **Global login gate** — anonymous browsing impossible; contradicts guest-first MVP
2. **Hardcoded localhost API** — mobile release builds cannot reach production API without code change
3. **Misleading TOP/VIP organic copy** — user trust / product integrity (quick fix but user-visible)

### P1 — should fix before launch

1. Bottom nav wrong tab highlight on search/promotions/business detail
2. Home paid/organic dedupe (duplicate businesses across sections)
3. Duplicate section title “Рекомендуем” (organic vs paid)
4. Favorites not filtered by selected city
5. Search geo inconsistency (no city-center fallback, no radius)
6. Map vs home radius mismatch (15km vs 3km)
7. Website/Instagram clicks not tracked
8. COMING_SOON cities not labeled in picker
9. “Guest” button fails outside dev OTP

### P2 — polish / later

1. Dedicated statistics route in Flutter drawer
2. Subcategories (requires product + schema decision)
3. Similar businesses on detail
4. Map clustering
5. Search history, open-now/rating filters
6. Ad impression reset on refresh
7. Splash / onboarding city selection for first launch
8. Consumer integration tests

---

## Proposed Stage 5A — Consumer Home & Discovery

Based on audit findings only:

**Scope:**
1. **Guest-first routing** — allow shell routes without auth; gate only favorites, reviews submit, profile server sync
2. **Remove/fix misleading tier copy** on home and map
3. **Home paid/organic dedupe** — reuse `collectPaidBusinessIds` pattern from category screen
4. **Rename paid HOME_FEATURED section** to distinct owner-friendly label (e.g. “Рекламные места”)
5. **Bottom nav highlight fix** for nested routes
6. **Search geo parity** — use `nearbySearchPositionProvider` fallback
7. **Environment config** for API base URL (no hardcoded localhost in release)

**Out of scope for 5A:** subcategories, new backend filters, map provider change, full profile redesign, payment, owner changes.

**No backend changes required** unless guest-first needs public catalog endpoints verification (likely already public — gate is Flutter-only).

---

## Addendum — Home «Рекомендуем» duplication (Stage 5.0)

### Verdict: **B — organic recommendations + HOME_FEATURED paid advertising**

Two adjacent blocks share the **same visible title** («Рекомендуем») but use **different providers, endpoints, and purpose**. This is **not** duplicate rendering of one provider (F), **not** two organic sections (A), **not** nearby (D).

### Block 1 — Organic «Рекомендуем»

| Field | Value |
|-------|-------|
| Visible title | «Рекомендуем» (+ «1 / N» pager when >1 item) |
| Widget | `_SectionHeader` → `_PopularPlacesCarousel` → `_PopularPlaceCard` |
| File | `apps/mobile/lib/features/home/presentation/home_screen.dart` |
| Provider | `recommendedBusinessesProvider` (`auth_provider.dart`) |
| Primary API | `POST /recommendations` via `AiRepository` → ai-orchestrator :3004 |
| Fallback API | `GET /businesses?citySlug&limit=10` (catalog-api) |
| Personal path | If auth token present: ai-orchestrator → `GET /businesses/recommended/me` (favorite-category filter) |
| Detail fetch | N+1 × `GET /businesses/:id` per recommended ID |
| City | `cityProvider.slug` |
| Category filter | None |
| Count | Up to 10 |
| Organic vs paid | **Organic** (rule-based MVP; `source: rule-based`) |
| Ranking | Backend `compareBusinessCatalogRank` — **title only**; no planTier / isFeatured / featuredSlot |
| Reason text | ai-core: `Популярное: {title}` (widget empty state says «Нет популярных заведений» — naming mismatch) |
| Loading | `LoadingView` height 194 |
| Error | `ErrorView` + retry; catch → catalog fallback |
| Empty | «Нет популярных заведений» |

**Legacy note:** State vars `_featuredTimer` / `_featuredIndex` / `featuredAsync` name this block «featured» in code but it is **not** HOME_FEATURED ads.

### Block 2 — Paid HOME_FEATURED

| Field | Value |
|-------|-------|
| Visible title | «Рекомендуем» (hardcoded in `HomeFeaturedAdSlot`) |
| Widget | `HomeFeaturedAdSlot` → `SponsoredBusinessSection` → `BusinessCard(sponsored: true)` |
| File | `apps/mobile/lib/features/ads/widgets/home_ad_slots.dart` |
| Provider | `homeFeaturedAdsProvider` → `serveAdsProvider(HOME_FEATURED)` |
| API | `GET /monetization/ads/serve?placementCode=HOME_FEATURED&sessionId&citySlug` |
| City | `cityProvider.slug` |
| Count | All active campaigns for placement (dev: 4 items) |
| Organic vs paid | **Paid** (`productType: FEATURED_BUSINESS`, `sponsored: true`) |
| Ad label | `SponsoredLabel` — default «Реклама» (`displayLabel` from API) on section header **and** each card |
| Loading / error / empty | `SizedBox.shrink()` (silent hide) |

**UX issue:** Paid block uses the same section title as organic («Рекомендуем») despite having «Реклама» badge — reads like one algorithmic feed split in two.

### Data overlap (dev Uralsk, 2026-09-06)

| Source | Endpoint | Business IDs (sample) |
|--------|----------|------------------------|
| Organic | `POST /recommendations` | Same 10 as `GET /businesses?limit=10` (title sort): AutoDrive, Bar Code 51, Beauty Studio Elite, **Coffee House Uralsk**, Family Market, **FitLife Gym**, … |
| HOME_FEATURED | `GET …/ads/serve` | **Coffee House Uralsk** (×3 campaigns), **FitLife Gym** |

**2 of 10** organic recommendations also appear in paid HOME_FEATURED on current seed. Home has **no dedupe** (category screen dedupes via `collectPaidBusinessIds`).

Same business can appear **twice on one scroll** under identical section titles — once organic carousel, once sponsored list.

### Legacy checks

| Artifact | Used on Home? |
|----------|---------------|
| `featuredBusinessesProvider` | **No** (admin/owner invalidation only) |
| `isFeatured` / `featuredSlot` in models | Parsed, **not** used for home ranking or display |
| `featured=true` query param | Sent by provider definition; **backend ignores** (Stage 4C.1) |
| `compareBusinessTierRank` | Returns 0 everywhere (Stage 4C) |

No legacy isFeatured recommendation block remains alongside the AI block — the confusion is **title collision with paid HOME_FEATURED**, not dual legacy organic paths.

### «Популярные» vs «Рекомендуем»

No separate user-facing «Популярные места» section exists. Internal widgets use `_PopularPlacesCarousel`; ai-core reasons prefix «Популярное:». Only one organic discovery block — redundant **naming** (Popular vs Recommended), not redundant **sections**.

### Stage 5A recommendation

**RENAME** (primary) + **dedupe** paid IDs from organic list (secondary):

1. Rename paid HOME_FEATURED section title to something distinct (e.g. «Рекламные места», «Продвигается на главной») — keep «Реклама» label.
2. Optionally rename organic to «Популярное в городе» to match ai-core reason text, or keep «Рекомендуем» for organic only.
3. Apply home dedupe pattern from `category_businesses_screen.dart` so paid businesses don’t repeat in organic carousel.

Do **not** REMOVE ONE — both placements are intentional (organic discovery + paid inventory). Do **not** MERGE — different pipelines and compliance (ad labeling).

---

## Stash cleanup (Step 0)

Stash `WIP business-web monetization (pre Stage 4C.1 cleanup)` **dropped** — contents confirmed superseded by Stage 4D+4E:
- `/promote` navigation → `/monetization`
- promotions CTA → `/monetization/products/PROMOTED_PROMOTION`
- `.radio-row` CSS → present in 4D
- tariff/ad split → `/plan` + `/monetization`
