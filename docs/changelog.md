# Changelog — QalaGo

**Каноническая инженерная история проекта** (не заменяется git log).  
Формат: дата → stage → Status / Checkpoint → Summary → Deferred → Next.  
Дисциплина обновления: `AGENTS.md` (Workflow §6, чеклист START/FINISH).

---

## 2026-09-22 — Stage 6.12A.7.7 CLOSED — branch media architecture finalized

- **Status:** **6.12A.7.7 CLOSED** — BRANCH MEDIA ARCHITECTURE FINALIZED.
- **Checkpoint (closure):** `fe03caca4d066f901c6dca9e3c6109243181ff4a` (pre-closure docs); final closure docs commit follows.
- **Summary (track):**
  - **A.7.7.1** — **`BusinessImage.locationId`** nullable; shared vs branch; same-business composite FK integrity.
  - **A.7.7.2** — Owner branch-aware list/attach/delete/cover; **`moderationHidden`** excluded from public reads.
  - **A.7.7.3** — Public **`effectiveMedia`** + **`GET /photos?locationId=`** (branch-first + shared; sibling exclusion).
  - **A.7.7.4** — **Business Web** shared/branch media management UX.
  - **A.7.7.5** — **Flutter** consumer integration; Hotfix 1 full-gallery isolation; **Samsung SM-J610FN physical QA PASS**.
  - **A.7.7.6** — **Admin Web** **`MEDIA`** moderation **`mediaTarget`** + shared/branch labels; moderation semantics unchanged.
  - **Final closure audit:** **PASS** — no architecture blockers for track close.
- **Invariants (retain):** **`Business.id`** = brand identity (reviews/favorites/analytics); **`BusinessLocation.id` / `locationId`** = branch context; shared media **`locationId = null`**; branch media scoped to owning location; public branch view = active branch + shared brand only (no sibling inheritance); **`effectiveMedia`** = branch-aware public source of truth; legacy **`galleryPreview`** compatibility-only (not branch truth); **`Business.coverImageUrl`** brand-level.
- **Deferred (not blockers):** legacy business-wide **`galleryPreview`**; full Admin gallery manager; Admin upload/reorder; owner Flutter branch upload; Consumer Web branch media (**F.4**); image orphan-file GC; media reorder API/UX; explicit branch cover persistence; branch-level moderation status; CDN/object storage migration.
- **Next:** **6.12A.7.8** — catalog / promotions branch scope — **start with read-only architecture audit** (ServiceMenuGroup / ServiceItem / Promotion shared-vs-branch scoping before schema changes). **Do not implement in closure task.**

---

## 2026-09-22 — Stage 6.12A.7.7.6 Admin Web branch media visibility

- **Status:** 6.12A.7.7.6 IMPLEMENTED — closed under **6.12A.7.7** (see closure entry).
- **Checkpoint (implementation):** `3c61e5d`.
- **Summary:**
  - **Audit:** Admin Web had no `BusinessImage` gallery; **`MEDIA`** moderation cases were the only staff surface for reported business photos (backend `MEDIA_HIDE`/`MEDIA_RESTORE` existed; UI was review-only).
  - **API (additive):** `GET /admin/moderation/cases/:id` adds optional **`mediaTarget`** (`locationId`, branch address/city/`isPrimary`, `branchUnavailable`) — no schema/migration changes.
  - **Admin UI:** moderation case detail shows photo preview + **Общие фото** vs **Филиал: {address}** scope before actions; **`MEDIA_HIDE`/`MEDIA_RESTORE`** wired; RU/KK label helpers.
  - **Moderation semantics:** actions still target **`BusinessImage.id`** via case `targetId`; no branch-level moderation status.
- **Deferred:** full Admin gallery manager, upload/reorder (see **6.12A.7.7** closure deferred list).
- **Next:** _(track closed — A.7.8)_.

---

## 2026-09-22 — Stage 6.12A.7.7.5 physical QA closure (Flutter branch media)

- **Status:** **6.12A.7.7.5 PHYSICAL QA PASS** — Flutter consumer branch media closed for this stage.
- **Checkpoint (implementation):** `d30e55d5c2acbabb01aa804a8fff6ac6b5979fb9`.
- **Checkpoint (hotfix 1):** `d5a498ffa2d655c03afcad00edb7a5160b2513a5`.
- **Summary (physical):**
  - **Device:** Samsung **SM-J610FN**, Android 10; fresh Hotfix 1 debug APK (`adb install -r`); catalog API **`http://172.158.10.133:3002/api/v1`**; **`QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`**.
  - **Bar Code 51** (`cmpn1wnq1000iult8yj6a06q7`): **L1** / **L2** branch media isolation verified both directions — branch hero + full gallery show own branch + shared brand only; **QA L1** / **QA L2** excluded on sibling branch.
  - **Shared brand** images visible on both branches; **full gallery branch switching** verified after Hotfix 1.
  - **API alignment:** L2 detail **`effectivePhysical.locationId`** and **`effectiveMedia.activeLocationId`** = L2; L2 **`/photos?locationId=`** excluded sibling branch QA rows (pre-cleanup).
  - **Local QA fixture** removed post-pass (3 `BusinessImage` rows + `uploads/qa-a775/*.png`); legacy brand images, cover, L1/L2 locations unchanged.
- **Deferred:** broader **A.7.7** track items outside this stage (e.g. Admin/Consumer Web media, owner Flutter upload scope); **F.4** URL architecture unchanged.
- **Next:** planned A.7.7+ / admin-media stages per roadmap.

---

## 2026-09-22 — Hotfix 6.12A.7.7.5.1 Flutter full gallery branch isolation

- **Status:** A.7.7.5 HOTFIX 1 IMPLEMENTED — **physical retest PASS** (see physical QA closure entry above).
- **Checkpoint (hotfix):** `d5a498ffa2d655c03afcad00edb7a5160b2513a5`.
- **Summary:**
  - **Root cause:** `BusinessPhotosScreen` kept mutable `_items` across visits to the same route (`/business/:id/photos`); seeding ran only when `_page == 1 && _items.isEmpty`, so opening L2 after L1 left stale L1 rows in the grid while detail/hero used fresh `effectiveMedia`.
  - **Fix:** scope key `businessId|locationId`; router `ValueKey` on gallery screen; page 1 always renders provider rows; pagination accumulation reset on scope change; regression tests L1↔L2.
  - **Backend:** unchanged (L2 `/photos?locationId=` already correct on server).
- **Deferred:** _(none — retest completed in physical QA closure)_.
- **Next:** _(closed with A.7.7.5 physical QA)_.

---

## 2026-09-22 — Stage 6.12A.7.7.5 Flutter branch media integration

- **Status:** 6.12A.7.7.5 IMPLEMENTED — **PHYSICAL QA PASS** (Samsung branch media + Hotfix 1 gallery isolation).
- **Checkpoint (implementation):** `d30e55d5c2acbabb01aa804a8fff6ac6b5979fb9`.
- **Summary:**
  - **Flutter detail:** consumes backend **`effectiveMedia`** for hero + preview strip when present; legacy **`coverImageUrl`/`galleryPreview`** fallback unchanged.
  - **Full gallery:** **`GET /businesses/:id/photos?locationId=`** carries active branch from detail; router preserves query.
  - **Dedupe:** cover URL not duplicated in carousel when already in preview items.
  - **Physical QA:** completed in separate closure entry (Samsung SM-J610FN).
- **Deferred:** Consumer Web F.4; owner Flutter upload scope; Admin/Consumer branch media surfaces (outside A.7.7.5).
- **Next:** roadmap stages after A.7.7.5 closure.

---

## 2026-09-22 — Stage 6.12A.7.7.4 Business Web branch media UX

- **Status:** 6.12A.7.7.4 IMPLEMENTED — READY FOR FLUTTER INTEGRATION (mobile not in this stage).
- **Checkpoint (implementation):** `a88e31e48a9f8e108ac1b8fbf583a92709a9c8fe`.
- **Summary:**
  - **Business Web `/business/[id]/media`:** scope selector — **Общие фото** (brand) vs per-**BusinessLocation**; list uses **`scope=brand`** or **`locationId`** (A.7.7.2 management API).
  - **Upload/attach:** passes **`locationId`** for branch scope; brand cover action only in shared scope; plan quota uses **`usage.photos`** (Business-wide).
  - **RU/KK** strings via **`locale.ts`**; no backend/schema changes.
- **Deferred:** Flutter **`effectiveMedia`** consumption, Admin/Consumer Web, reorder, explicit branch cover UI.
- **Next:** mobile detail/gallery wiring to **`effectiveMedia`**.

---

## 2026-09-22 — Stage 6.12A.7.7.3 effective public media contract

- **Status:** 6.12A.7.7.3 IMPLEMENTED — READY FOR OWNER/UI INTEGRATION (Flutter/Business Web not in this stage).
- **Checkpoint (implementation):** `bd3136d867670d4bbe107c3635f98f7d6a061544`.
- **Summary:**
  - **`effectiveMedia`** on **`GET /businesses/:id?locationId=`** — active branch + shared brand images only; branch-first ordering; read-only branch hero **`coverImageUrl`**; uses same active-location resolver as **`effectivePhysical`**.
  - **`GET /businesses/:id/photos?locationId=`** — same resolver/ordering; legacy **`/photos`** without query stays Business-wide.
  - **Single helper:** `business-effective-media.util.ts` shared by detail + photos; moderation → order → plan cap unchanged Business-wide.
  - **Legacy preserved:** top-level **`coverImageUrl`**, **`galleryPreview`**, **`/photos`** without `locationId`.
- **Deferred:** Flutter/Business Web/Admin/Consumer UI wiring — **A.7.7.4+**; explicit branch cover column — not this stage.
- **Next:** client integration against **`effectiveMedia`**.

---

## 2026-09-22 — Stage 6.12A.7.7.2 branch media management + public moderation

- **Status:** 6.12A.7.7.2 IMPLEMENTED — READY FOR A.7.7.3 (public branch gallery).
- **Checkpoint (implementation):** `917b6e62a4d572013215ed4a0fa10f372c7c608d`.
- **Summary:**
  - **Attach/list:** optional **`locationId`** on `POST /uploads/business/:businessId`; validated same-business; **`asCover`** only for shared (`locationId` null); management list filters `scope=all|brand` or `locationId`.
  - **Brand cover:** delete repoint and set-cover use **shared images only**; branch rows cannot set **`Business.coverImageUrl`**.
  - **Public safety:** **`galleryPreview`** and **`GET /businesses/:id/photos`** exclude **`moderationHidden`** before plan cap (owner management list unchanged).
  - **Plan limits:** remain Business-wide (shared + branches).
- **Deferred:** **`effectiveMedia`**, branch-aware public gallery merge, branch hero — **A.7.7.3**.
- **Next:** A.7.7.3 public branch media resolution.

---

## 2026-09-22 — Stage 6.12A.7.7.1 branch media data foundation

- **Status:** 6.12A.7.7.1 IMPLEMENTED — READY FOR A.7.7.2 (API/read path).
- **Checkpoint (implementation):** `5cda615e9175f4792058c3bf7483d79b8839ba94`.
- **Summary:**
  - **Schema:** nullable **`BusinessImage.locationId`** — `null` = shared/brand image; non-null = scoped to **`BusinessLocation`**.
  - **Integrity:** composite FK **`(businessId, locationId)` → `BusinessLocation(businessId, id)`**; **`@@unique([businessId, id])`** on locations; **`ON DELETE RESTRICT`** on branch (no silent promotion to brand).
  - **Migration:** all existing rows remain **`locationId = NULL`**; counts preserved.
  - **Tests:** runtime integrity spec (shared, same-business branch, cross-business reject, Business cascade, location RESTRICT).
- **Deferred (A.7.7.2):** upload/attach `locationId`, public **`moderationHidden`** filter, **`effectiveMedia`** / scoped gallery — **no public API behavior change in 7.7.1**.
- **Next:** A.7.7.2 scoped management + public read path.

---

## 2026-09-22 — Stage 6.12A.7.6 effective physical contract (Business detail)

- **Status:** 6.12A.7.6 PHYSICAL QA PASS — STAGE CLOSED, READY FOR A.7.7.
- **Checkpoint (implementation):** `63a0c46de62be31ca00530611ba27cd751e067cf`.
- **Summary:**
  - **API:** additive `GET /businesses/:id?locationId=`; response **`activeLocationId`** + **`effectivePhysical`** (server resolver; invalid/foreign `locationId` → primary fallback, no cross-business leak).
  - **Flutter detail:** consumes **`effectivePhysical`** for address/route/mini-map/contacts/hours/open status; **`Business.id`** unchanged for favorites/reviews/brand sections.
  - **Consumer Web:** shared DTO typing extended (additive); F.4 branch SEO pages not started.
  - **Physical QA (Samsung SM-J610FN / Android 10):** map → Bar Code 51 (`cmpn1wnq1000iult8yj6a06q7`) → L2 (`cmubk34fk0001uls458d1nta9`) → full detail PASS — L2 remained active; top address L2/Абая (not primary L1); schedule/status, phone, route, WhatsApp, website, Instagram actions confirmed. Path: **`locationId` → detail API → `effectivePhysical` → Flutter physical context**.
  - **Unchanged (by design):** gallery/catalog/promotions/reviews/favorites remain **Business-grain**; branch media/catalog not location-aware.
  - **QA fixture:** L2 retained for A.7.7+ multi-branch testing (local A.1/A.2 exact-count tests may still fail — not modified).
- **Deferred:** branch-level media/catalog/promotions/reviews/favorites grain (A.7.7+ / F.4).
- **Next:** 6.12A.7.7 (per roadmap).

---

## 2026-09-22 — Stage 6.12A.7.4 FINALIZED (multi-branch map physical QA)

- **Status:** 6.12A.7.4 FINALIZED — READY FOR A.7.6 EFFECTIVE PHYSICAL CONTRACT.
- **Checkpoint (implementation/cleanup):** `eb48d4860e77e109a58286f25574a0894ee73625` (changelog + A.7.4 closure; A74MAP never committed, removed from working tree before finalize).
- **Summary:**
  - **Physical QA (Samsung SM-J610FN):** native MapLibre business layer confirmed; one Business → multiple **BusinessLocation** markers (Bar Code 51 L1+L2); map fetch → parse → state → GeoJSON → source/layers pipeline observed (16 viewport features in instrumented run).
  - **Hotfix 2:** `GET /businesses/:id/locations/public` route shadowing fixed (`cd66f7d8`); unauthenticated public branches list returns L1+L2.
  - **Cleanup:** temporary `[A74MAP]` runtime instrumentation removed from Flutter; local capture `infra/local-backups/samsung-a74map-logcat.txt` retained uncommitted.
  - **QA fixture:** L2 `cmubk34fk0001uls458d1nta9` intentionally retained for A.7.6+ branch QA (may skew local A.1/A.2 exact-count tests — not weakened in this stage).
  - **Deferred:** effective physical contract for detail (hours/socials/media/catalog/promotions branch-aware) → **A.7.6+**; A.7.5 branch content architecture audit PASS (read-only, no commit); F.4 / full branch content not complete.
- **Next:** 6.12A.7.6 effective physical contract (backend DTO + client wiring).

---

## 2026-09-22 — Stage 6.12A.7.4 Hotfix 2 (public locations route shadowing)

- **Status:** 6.12A.7.4 HOTFIX 2 IMPLEMENTED — READY FOR SAMSUNG DETAIL RE-QA (backend restart on LAN API).
- **Checkpoint (implementation):** `cd66f7d8` (see git `cd66f7d…`).
- **Summary:**
  - **Root cause:** `GET /businesses/:id/locations/public` was shadowed by authenticated `GET :businessId/locations/:locationId` (`locationId = "public"`) → mobile `businessPublicBranchesProvider` never received L1+L2 → detail fell back to primary address despite correct `locationId` query.
  - **Fix:** register `@Public() @Get(':id/locations/public')` **before** dynamic location routes in `businesses.controller.ts`; URL unchanged.
  - **Tests:** HTTP/controller regression (`stage-6-12a7-4-public-locations-http.spec.ts`) — unauthenticated 200 + L1/L2 ids; protected single-location 401; optional QA DB fixture assertion.
- **Mobile:** no Flutter changes; installed APK at `1cd345b…` sufficient after backend fix (no rebuild required for this hotfix).
- **Deferred:** Samsung physical detail re-QA; QA L2 cleanup after acceptance; fixture geocode label mismatch.
- **Next:** Samsung map L2 → detail re-QA on `192.168.8.101:3002`.

---

## 2026-09-22 — Stage 6.12A.7.4 Physical QA hotfix (category map + branch detail)

- **Status:** 6.12A.7.4 HOTFIX IMPLEMENTED — READY FOR SAMSUNG PHYSICAL RE-QA.
- **Checkpoint (implementation):** `1cd345b8` (see git `1cd345b…`).
- **Summary:**
  - **Category map:** GeoJSON/native layer uses **`mapLayerItems`** (`lastFetchBounds`) so multi-branch businesses are not hidden by tighter **`visibleBounds`** after category scope entry.
  - **Detail handoff:** optional query **`locationId`** on `/business/:id`; branch address/route/coordinates via public locations + **`resolveActiveBusinessPhysicalContext`**; reviews/favorites stay **Business.id**.
  - **Tests:** catalog-api category map row assertion hardened; Flutter **850** passed; focused map/detail tests added.
- **Deferred:** physical re-QA on Samsung; native layer dart-define build hardening; QA fixture geocode label mismatch.
- **Next:** Samsung physical re-QA; L2 cleanup after acceptance.

---

## 2026-09-21 — Stage 6.12A.7.2 Flutter map BusinessLocation marker identity

- **Status:** 6.12A.7.2 PASS — READY FOR A.7 AUTOMATED REGRESSION / PHYSICAL QA GATE.
- **Checkpoint (implementation):** `ab48d0421939d49a48c3c828672c5af3cfdb8dcf`.
- **Summary:**
  - **Flutter map:** physical marker identity = **`locationId`** (fallback `id` for legacy rows); **`BusinessModel.id`** remains **Business.id** for detail/reviews/favorites/analytics.
  - **State / GeoJSON / selection:** `byLocationId` storage, merge/dedup by physical key; `Feature.id` + `properties.locationId` = physical key; `properties.businessId` = Business.id; preview and directions use selected location row.
  - **Unchanged:** backend A.7.1; MapLibre/style; geocoding; web apps; reviews/favorites scope.
- **Tests:** Flutter **845** passed, **0** failed; `flutter analyze` **184** issues, **0** errors; debug APK build PASS.
- **Deferred:** physical multi-branch map QA on device; optional analytics `locationId`.
- **Next:** A.7 automated regression / physical QA gate.

---

## 2026-09-21 — Stage 6.12A.7.1 BusinessLocation map viewport backend cutover

- **Status:** 6.12A.7.1 PASS — READY FOR A.7.2.
- **Checkpoint (implementation):** `0d8a772ceeb6133a2cbe7ce3f59e9877628c5bf4`.
- **Summary:**
  - **`GET /businesses` + `forMap=true` + bbox:** PostGIS grain switches to **`BusinessLocation.location`** joined to parent **`Business`**; one list row per qualifying branch.
  - **Contract:** **`id`** remains **Business.id**; additive **`locationId`** = **BusinessLocation.id**; branch physical fields (`cityId`, address, coordinates, contacts, `workHours`) from location row; brand/taxonomy/status/plan display from Business.
  - **City filter (map viewport):** **`BusinessLocation.cityId`** (branch city).
  - **Unchanged:** nearest/radius/search/category **Business-grain** discovery; Flutter map marker identity (**A.7.2**); MapLibre/style; geocoding; schema/migrations; ads/plans/reviews/favorites scope.
- **Tests:** catalog-api Jest **1046** / **148** suites (incl. `stage-6-12a7-1-map-location-viewport` **10** cases); prior 6.11C geo suites PASS.
- **Deferred:** A.7.2 Flutter GeoJSON/selection/route cutover; optional discovery location-grain migration (product decision).
- **Next:** 6.12A.7.2 Flutter map marker identity.

---

## 2026-09-21 — Dev CORS: LAN 172.x for physical-device web

- **Status:** local-dev only.
- **Summary:** catalog-api development CORS now allows `http://172.x.x.x` origins (plus existing localhost / 192.168 / 10.x) and explicit `CORS_ORIGINS`, so Flutter web on a LAN IP works from a phone. Production still uses the allow-list only.
- **Files:** `services/catalog-api/src/main.ts`.
- **Deferred:** none.

---

## 2026-09-21 — Stage 6.12A.6 BusinessLocation Flutter & Consumer client integration

- **Status:** 6.12A.6 PASS — READY FOR A.7.
- **Checkpoint:** `fc13f679df138a92e122e1a7ea9ab7fdc78a67b6`.
- **Summary:**
  - **Public read:** `GET /businesses/:id/locations/public` (`@Public`, ACTIVE business only); `PublicBusinessLocationResponseDto` (no timestamps/provenance); management mutations stay authenticated.
  - **Flutter:** `BusinessBranchLocation`, public fetch, consumer detail **Филиалы** when multiple branches; legacy Business top-level fields unchanged; map unchanged.
  - **Consumer Web:** typed client + branch section on temporary `/businesses/[id]`; F.3 noindex preserved; no F.4 SEO URLs.
  - **Docs / AI context:** A.6 strategy; F.3, shared APK/Web data, full advertising future architecture in `docs/ai-project-context.md`.
  - **Unchanged:** discovery/search/category, map/PostGIS, Business Web owner UX, Admin read-only panel, ads implementation.
- **Tests:** catalog-api Jest **1036** / **147** suites (incl. `stage-6-12a6-public-locations`); Flutter `business_branch_location_test`; Consumer Web vitest **58** PASS.
- **Build:** Consumer Web `next build` PASS; Flutter analyze on new widgets PASS.
- **Database:** test fixtures cleaned in specs; production baseline unchanged unless noted in report.
- **Deferred:** A.7 map cutover; F.4 public business pages; location DELETE.
- **Next:** 6.12A.7 map/PostGIS cutover.

---

## 2026-09-21 — Stage 6.12A.5 BusinessLocation owner & admin management UX

- **Status:** 6.12A.5 PASS — READY FOR A.6.
- **Checkpoint:** `d8904a7472d5501e9bb8cf7d272e2aa8f1886b89`.
- **Summary:**
  - **Business Web:** `/business/[id]/locations` (“Филиалы” nav); list/create/edit/set-primary via A.4 endpoints; cross-city city selector from `listCities()`; reuses `BusinessLocationField`; **`isPrimary`** badge; confirm before set-primary; **`refreshBusinesses`** after primary switch / primary edit; **no DELETE**.
  - **Admin Web:** read-only branch list on approved application detail (`BusinessLocationsReadonly`); staff uses same locations list API; **no admin edit UI**.
  - **Docs:** `business-location.md` A.5 section; **`docs/ai-project-context.md`** + AGENTS maintenance note.
  - **Unchanged:** catalog-api backend, consumer-web, map/PostGIS, Flutter, ads, public discovery.
- **Tests:** business-web vitest (incl. `business-locations`, nav localization); admin-web vitest **53** PASS; business-web **build PASS**; admin-web **build PASS**. Pre-existing business-web hardcoded-UI guard failures on `reviews/page.tsx` (not A.5 scope).
- **Database:** persistent branches not created for demo; baseline **31/31/31** unchanged.
- **Deferred:** A.6 Flutter; A.7 map; location DELETE/archive; F.4 public branch URLs.
- **Next:** 6.12A.6 client consumption (Flutter).

---

## 2026-09-21 — Stage 6.12A.4 BusinessLocation management API

- **Status:** 6.12A.4 PASS — READY FOR A.5.
- **Checkpoint:** `d5958ba5e6623c35deabf8f0b28df04ba89400cc`.
- **Summary:**
  - Authenticated management API: list/get/create/patch locations under `/businesses/:businessId/locations`; **`POST …/set-primary`** for explicit primary switch.
  - Cross-city secondaries supported; create leaves legacy `Business` unchanged; primary PATCH / set-primary / legacy Business PATCH keep **bidirectional** physical sync (A.3 services extended).
  - Permissions: existing `BUSINESS_PROFILE_EDIT` / `BUSINESS_HOURS_EDIT`; BusinessMembership remains **Business-scoped** (no branch managers).
  - **DELETE/archive deferred**; public discovery/map unchanged (primary `Business` fields only).
  - **No schema migration**; Prisma validate/generate/migrate up to date (41 migrations).
- **Tests:** catalog-api Jest **1032** / **146** suites (incl. `stage-6-12a4-business-location-crud`); local DB integrity baseline **31/31/31**.
- **Deferred:** A.5 owner/admin location UX; discovery/map cutover; location DELETE/archive.
- **Next:** 6.12A.5 location management UX.

---

## 2026-09-21 — Stage 6.12A.3 primary location compatibility layer

- **Status:** 6.12A.3 PASS — READY FOR A.4.
- **Checkpoint:** `43fe98742a09ce8443f4bee6e5af25f64631d913`.
- **Summary:**
  - **`BusinessPrimaryLocationService`**: resolve primary (`isPrimary` only), `createInitialPrimary`, `syncPrimaryFromBusinessRecord`; synchronized physical fields on legacy writes.
  - **Production creates:** admin import (`BusinessesService.create`) and business-application **approval** atomically create **Business + one primary BusinessLocation** (deterministic id aligned with A.2 backfill).
  - **Owner PATCH `/businesses/:id`:** physical-field patches update Business and primary location in **one transaction**; brand-only patches skip location writes; partial PATCH semantics preserved.
  - **Public API unchanged** — list/detail still read top-level **Business** physical fields; **map** still uses **`Business.location`**; no location CRUD endpoints.
  - **Prisma generate:** PASS after stopping local `catalog-api` dev processes (Windows EPERM on `query_engine-windows.dll.node`); validate + migrate status up to date; **no new migration**.
- **Tests:** catalog-api Jest **1018** / **145** suites (incl. `business-primary-location.service`, `stage-6-12a3-business-location-sync`); local DB integrity **31/31/31**, missing/multi primary **0**.
- **Deferred:** A.4 BusinessLocation CRUD + multi-branch public contracts.
- **Next:** 6.12A.4 location-aware APIs.

---

## 2026-09-21 — Stage 6.12A.2 BusinessLocation 1:1 backfill

- **Status:** 6.12A.2 PASS — READY FOR A.3.
- **Checkpoint:** `1477d77d84e674a946798cc32e327568b1b50dae`.
- **Summary:**
  - Idempotent migration **`20260921190000_stage_6_12a2_business_location_backfill`**: one **primary** `BusinessLocation` per existing `Business` (physical fields copied; geography via location trigger).
  - **No `Business` row updates**; APIs/map still read legacy `Business` physical columns.
  - Local integrity: **31** businesses → **31** locations, **31** primary; field/geo parity **0** mismatches; partial/invalid coords **0**.
  - **Gap until A.3:** new Business creates (application approval, admin import) do not auto-create locations.
- **Tests:** catalog-api Jest **1005** (incl. `stage-6-12a2-business-location-backfill`); migrate status up to date.
- **Deferred:** A.3 compatibility read/write + primary sync on create/update.
- **Next:** 6.12A.3 compatibility layer.

---

## 2026-09-21 — Stage 6.12A.1 BusinessLocation database foundation

- **Status:** 6.12A.1 PASS — READY FOR A.2.
- **Checkpoint:** `e4734968e66056110445f274c71ec0124e22cf65`.
- **Summary:**
  - Additive **`BusinessLocation`** model (1:N under `Business`): city, address, coordinates, `locationSource`, `workHours`, contacts, **`isPrimary`** with partial unique index.
  - PostGIS foundation: geography column, isolated sync trigger, GiST index; **map/catalog still use `Business.location`**.
  - **No backfill** — table empty until A.2; legacy **`Business` physical fields unchanged**; no public API/DTO/client changes.
  - Docs: `docs/architecture/business-location.md`; api-contracts internal note.
  - Local migration history: reconciled orphan E.5 record + applied `20260921160000_stage_6_11e5_push_device` before A.1 migrate.
- **Tests:** catalog-api Jest **999** (incl. `stage-6-12a1-business-location-foundation`); `prisma validate` OK; migrate status up to date.
- **Deferred:** A.2 1:1 backfill + primary rows; location APIs; map cutover; F.4 URLs.
- **Next:** 6.12A.2 backfill + primary location invariants.

---

## 2026-09-21 — Stage 6.12A.0 BusinessLocation architecture audit

- **Status:** 6.12A.0 AUDIT PASS — READY TO DESIGN A.1.
- **Checkpoint:** none (read-only audit; recorded at A.1 closure).
- **Summary:** Repository audit — Business = brand + embedded place; 1→N `BusinessLocation` target; reviews/favorites/membership/plans stay on Business for MVP; map cutover isolated; primary-location compat strategy. Full findings in session A.0 report.
- **Next:** 6.12A.1 additive schema.

---

## 2026-09-21 — Stage 6.11F.3 SEO infrastructure

- **Status:** 6.11F.3 PASS — READY FOR 6.12A.
- **Checkpoint:** `ed67a6f07a955f7bf51d00f64d3699340171f2ae`.
- **Summary:**
  - Canonical origin via `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL` / `getConsumerWebOrigin()`; `buildCanonicalUrl()` for city/category/subcategory paths and pagination (`?page=N` when N > 1).
  - Root + discovery **metadata** (RU/KK from cookie), Open Graph / Twitter basics; **search** and temporary **`/businesses/{id}`** → `noindex, follow` (no fake business canonical).
  - **`app/robots.ts`**: allow public discovery, disallow `/businesses/`, sitemap URL; **`app/sitemap.ts`** from `GET /cities`, `GET /categories?citySlug=`, subcategories (no search/legacy/business ID routes).
  - JSON-LD: **WebSite** (root), **BreadcrumbList** on categories/category/subcategory; visible breadcrumbs; React `cache()` dedupe for catalog fetches.
  - Docs: `docs/architecture/public-consumer-web.md` (F.3 section); locale-neutral canonicals — **hreflang deferred to F.5**.
- **Tests/build:** consumer-web vitest **56**; `check:ui-strings` OK; `next build` OK (`/robots.txt`, `/sitemap.xml` routes present).
- **Deferred:** final business/branch canonical URLs (**6.12A** + **F.4**); hreflang/locale URLs (**F.5**); LocalBusiness / SearchAction schema; OG image assets (**F.7/F.8**).
- **Next:** **6.12A BusinessLocation** (not F.4 yet).

---

## 2026-09-21 — Stage 6.11F.2 City & category discovery

- **Status:** 6.11F.2 PASS — READY FOR F.3.
- **Checkpoint:** `7f84e30baae743605f6c82d249bec6b789042c86`.
- **Summary:**
  - City-aware routes: `/{citySlug}`, `/{citySlug}/categories`, `/{citySlug}/{categorySlug}`, `/{citySlug}/{categorySlug}/{subcategorySlug}`, `/{citySlug}/search?q=`.
  - Root `/` permanent redirect → `/uralsk`; legacy `/categories` + `/categories/[id]` → default city slug routes.
  - Reserved segments (`categories`, `search`, …); category resolution server-side from public city category list; invalid city/category/subcategory → 404.
  - City switcher from `GET /cities`; search GET form; pagination `?page=`; public business cards → temporary `/businesses/{id}` links.
  - Search route `force-dynamic`; catalog routes keep F.1 ISR policy.
- **Tests/build:** consumer-web vitest **40**; `check:ui-strings` OK; `next build` OK.
- **Deferred:** SEO metadata/robots/canonical (F.3); business slug URLs (6.12A + F.4); locale URL prefixes (F.5).
- **Next:** 6.11F.3 SEO infrastructure.

---

## 2026-09-21 — Stage 6.11F.1 Public Web foundation

- **Status:** 6.11F.1 PASS — READY FOR F.2.
- **Checkpoint:** `18ff50ce92faf2b44a5f9768d668b513869ba658`.
- **Summary:**
  - Public **PublicShell** (nav, footer legal links via `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL`), Montserrat + design tokens (`--blue`, `--accent`).
  - Central **public-config**, **cache-policy** (ISR-friendly fetches; layout `revalidate = 60`; removed page `force-dynamic`).
  - Root **`npm run dev:consumer`**; `start-all.ps1` + CORS/env examples for port 3005.
  - Docs: `docs/architecture/public-consumer-web.md`; consumer-web README; `.gitignore` for `.next`.
  - Tests: consumer-web **30** vitest; `check:ui-strings` OK; **next build** OK.
- **Deferred:** city/category slug routes (F.2), SEO metadata/sitemap (F.3), rich business pages until after **6.12A**, legal pages on public host (F.7).
- **Next:** 6.11F.2 City/category discovery.

---

## 2026-09-21 — Stage 6.11F.0 Public Web / SEO / Deep Links architecture audit

- **Status:** 6.11F.0 AUDIT PASS — ROADMAP REORDER REQUIRED (read-only; **no commit**).
- **Checkpoint:** `ec633c4dd1acf773b3d8ebd0b0152b1f6630ec8f` (unchanged; audit at accepted 6.11E HEAD).
- **Summary:**
  - Preserve and extend `apps/consumer-web` (Next.js 15 App Router); do not spawn a second public site.
  - Consumer web = partial discovery MVP (categories + minimal business); public catalog API sufficient for SSR without JWT.
  - Slugs exist in DB (City/Category/Business); web routes still use internal IDs; no RU/KK SEO URL architecture; no Universal/App Links.
  - Final public business/branch URL architecture **deferred until Stage 6.12A BusinessLocation**.
- **Roadmap (approved order):** F.1 → F.2 → F.3 → **6.12A** → F.4 → F.5 → F.6 → F.7 → F.8.
- **Next:** 6.11F.1 Public Web foundation.

---

## 2026-09-21 — Stage 6.11E.6 notifications final QA & release gate

- **Status:** 6.11E.6 AUTOMATED PASS — **IN-APP NOTIFICATIONS FINALIZED**; live FCM/APNs **not** physically verified.
- **Checkpoint:** `ec633c4dd1acf773b3d8ebd0b0152b1f6630ec8f`.
- **Verified (automated):** Single architecture (`NotificationsService` + post-commit push); backend/Flutter notification test suites; Firebase-less debug APK build.
- **Documented:** `docs/architecture/notifications-final-architecture.md` (canonical in-app notification, external Firebase gate).
- **Physical QA closure (Samsung, in-app — post-commit, no separate product commit):** inbox RU/KK; read/unread; badge; structured `NEW_REVIEW` navigation (dev fixture); Back navigation; legacy NULL-target rows remain mark-read only; Mark All Read; refresh/pagination; map regression smoke. **Live production push delivery not tested.**
- **Deferred / debt:** push via best-effort post-commit `setImmediate` (no durable outbox); no push preferences; server-side background push locale TBD; local Prisma migration-history drift around obsolete E.5A migration name — reconcile before `migrate deploy`; Firebase/APNs provider config + live delivery QA = external production gate.
- **Next:** 6.11F.0 (completed) → 6.11F.1.

## 2026-09-21 — Stage 6.11E.5 push readiness & device registration

- **Checkpoint:** `c7d2ee37e88a0758e5994961eb0f263424d9eb14`.
- **Added:** `PushDevice` model; `POST/DELETE /notifications/devices`; FCM delivery abstraction (`PUSH_ENABLED`, Noop vs Firebase Admin); post-commit push dispatch (never inside Prisma transactions).
- **Added:** Flutter `firebase_core` / `firebase_messaging` foundation, token register/revoke on auth lifecycle, push tap → E.4 navigation whitelist.
- **Requires external config:** Firebase project (`google-services.json`, `GoogleService-Info.plist`, service account); Apple Push capability / APNs key for iOS live delivery.
- **Deferred:** preference center, marketing/guest push, delivery outbox analytics (E.6+).

## 2026-09-21 — Stage 6.11E.4 notification routing & deep links

- **Checkpoint:** `d337b8f8a20742d8d655f420ec12d02823897af4`.
- **Added:** Central `resolveNotificationDestination` + `navigateNotificationDestination` for typed in-app routes from `type`/`targetType`/`targetId`.
- **Changed:** Inbox tap marks read (optimistic) then pushes canonical consumer/owner screens; double-tap guard; entity-unavailable snackbar.
- **Deferred:** push/FCM (E.5); Web deep links.

## 2026-09-21 — Stage 6.11E.3 notification inbox UX & localization

- **Checkpoint:** `47a3b42b492f91338013223ebd0fc7c7cb81f427`.
- **Added:** Flutter `NotificationPresentation` layer (type + payload → RU/KK templates); shared paginated inbox (`NotificationsInboxBody`) for consumer and owner.
- **Changed:** Inbox pagination (20/page, load-more, refresh, empty/error/retry states); unread styling; mark read / mark all with optimistic rollback; badge refresh via `unreadNotificationsProvider`.
- **Deferred:** notification tap navigation (E.4); push (E.5); Business Web full localized rendering.

## 2026-09-21 — Stage 6.11E.2 notification domain producers

- **Checkpoint:** `3c5b545866c55961f8eb95061826dfcf0b0210a7`.
- **Added:** Review alerts to membership-aware recipients; moderation `REVIEW_HIDDEN` / `REVIEW_RESTORED`; explicit application/claim/invitation/ad types.
- **Changed:** Plan expiry notification guarded by conditional tier transition (`updateMany` count).
- **Docs:** `docs/architecture/notification-producers.md` producer matrix.

## 2026-09-21 — Stage 6.11E.1 notifications data & API integrity

- **Checkpoint:** `3e80b0e56ec8cf42b1e36486ea44d4d17cc6a720`.
- **Note:** No separate **6.11E.0** substage commit or doc in repository; notification series begins at E.1.
- **Added:** `NotificationTargetType`, optional `targetType` / `targetId` / `payload` on `Notification`; index `(userId, createdAt DESC)`.
- **Changed:** `GET /notifications` returns paginated `{ items, pagination }` (default limit 20, max 50); stable mark-read DTOs.
- **Fixed:** Notification creation participates in Prisma transactions for business applications and ownership claims.
- **Changed:** Existing producers attach structured targets for new rows; Flutter/Business Web consume paginated API and canonical `NEW_REVIEW` type labels.

## 2026-09-21 — Stage 6.11D.5 physical QA hotfix 1 (duplicate report UX)

- **Checkpoint:** `c6eda65aae55efbf38263f9897feb28b1ba83cf9`.
- **Fixed:** `ProductionExceptionFilter` now preserves `code` on HTTP exception responses so mobile receives `REPORT_ALREADY_SUBMITTED` on 409.
- **Fixed:** Shared `extractApiErrorCode` for Dio error parsing in review report flow.

## 2026-09-21 — Stage 6.11D.5 reviews & trust release gate

- **Status:** 6.11D.5 CODE PASS — Reviews & Trust series accepted for 6.11E (automated release gate).
- **Checkpoint:** `508f294be6f4367c3b795c96c7b5c974efc0ec89` (release blocker fix); hotfix `c6eda65…` (duplicate report UX).
- **Fixed:** `PATCH /reviews/:id/reply` no longer requires global `BUSINESS` role; USER managers with `REVIEWS_REPLY` reach service membership checks (D.5 release blocker).
- **Verified:** DB invariants, automated test suites, map non-regression for D.1–D.4 scope.
- **Physical QA:** Dedicated Samsung closure entry for reviews **not recorded** in repo docs; treat device QA as part of release gate unless a future stage adds explicit sign-off.

## 2026-09-21 — Stage 6.11D.4 consumer reviews UX & trust polish

- **Checkpoint:** `afb4592b8bd6da9ce4c9ebbbfe3ccef871dc1373`.
- **Added:** Flutter `/business/:id/reviews` paginated screen; Business Detail “all reviews” entry; shared consumer review card with company reply label.
- **Added:** Mobile create/edit/delete/report flows wired to D.1–D.3 APIs with RU/KK l10n and error-code mapping.
- **Changed:** Admin moderation case detail — removed dead manual status PATCH UI; status follows moderation actions.
- **Deferred:** immutable report snapshot; historical manager self-reviews cleanup.

## 2026-09-21 — Stage 6.11D.3 review moderation & reports workflow

- **Checkpoint:** `b30c9dcb63bd82ab9084c6d710d70270f782236d`.
- **Added:** Enriched `GET /admin/moderation/cases/:id` with linked reports, action history, and live `reviewTarget` state (business, reviewer, lifecycle, public visibility).
- **Added:** Required moderator `internalNote` for `REVIEW_HIDE` / `REVIEW_RESTORE`; admin case UI wired to record actions with confirmation and loading states.
- **Changed:** `POST /reports` for `REVIEW` rejects soft-deleted targets; moderation-hidden reviews remain reportable.
- **Changed:** Admin hard delete review writes `REVIEW_DELETE` audit before removal.
- **Added:** Business Web “report review” via generic `POST /reports`; Flutter `ContentReportRepository` foundation.
- **Deferred:** Immutable report-time review text snapshot; full consumer report UX (D.4).

## 2026-09-20 — Stage 6.11D.2 review lifecycle & abuse protection

- **Checkpoint:** `af052207443453d1428d05100860b9614a405d5b`.
- **Added:** `Review.deletedAt` soft delete; public predicate includes `deletedAt = null`.
- **Added:** `PATCH /reviews/:id`, `DELETE /reviews/:id`; POST restores soft-deleted row (same id; preserves `moderationHidden`).
- **Added:** Self-review block (`REVIEW_SELF_REVIEW_FORBIDDEN`); review mutation rate limits; audit `REVIEW_CREATE/UPDATE/DELETE/RESTORE`.
- **Changed:** Plain-text normalization (trim, NFC, max 2000); mobile profile edit/delete; rating-only reviews allowed on mobile.
- **Deferred:** admin moderation UI, consumer report UX, full reviews list screen (D.3/D.4).

## 2026-09-20 — Stage 6.11D.1 review data & rating integrity

- **Checkpoint:** `9d09c1fc8336e2319a6a7e32f378d21d322e34c1`.
- **Note:** No separate **6.11D.0** substage in repository.
- **Added:** `@@unique([userId, businessId])` and PostgreSQL CHECK `rating` 1..5 on `Review`.
- **Added:** Central public review filter (`moderationHidden = false`) for list, preview, counts, and aggregates.
- **Added:** `ReviewAggregationService`; business detail exposes authoritative `averageRating` / `reviewCount`.
- **Changed:** `GET /reviews` paginated envelope (`items`, `pagination`); duplicate create → 409 `REVIEW_ALREADY_EXISTS`.
- **Changed:** Flutter business detail header uses API rating/count (not preview average).
- **Deferred:** self-review block, soft delete, edit/delete, rate limits (Stage 6.11D.2+).

## 2026-09-20 — Stage 6.11C.6H PRE-CLOSURE FIX 1 map empty semantics + road widths

- Mobile: `EmptyCityView` on map uses `cityCatalogTotalProvider` (city-wide); viewport PostGIS total renamed to `viewportTotal` so empty viewport ≠ empty city.
- Mobile: QalaGo Light `line-width` scaling multiplies interpolate/step **stop outputs** only (MapLibre-valid; no `['*', zoom-expr, scale]`).
- Future: C.6H remains blocked until full closure checklist; no new backend city count API (reused lightweight catalog total).

## 2026-09-20 — Stage 6.11C.6F.2 FIX 3 public MapLibre style mutation

- Mobile: QalaGo Light merges live layer snapshots then uses public `MapLibreMapController.setLayerProperties` (no private `_maplibrePlatform` dynamic access; fixes Samsung NoSuchMethodError).
- Future: none; closes physical style-load failure from C.6G.

## 2026-09-19 — Stage 6.11C.6F.2 FIX 2 QalaGo Light legibility tuning

- Mobile: paint-only style updates (`skipNulls`) preserve Liberty line-width/text-field; stronger buildings; scaled road widths; safer street-label colors.
- Future: Samsung re-QA z14–18+ hierarchy.

## 2026-09-19 — Stage 6.11C.6F.2 FIX 1 street labels + housenumber stack

- Mobile: stop symbol-layer QalaGo Light paint (restores Liberty `text-field`); insert `qalago-housenumber` below `highway-name-*` anchor.
- Future: Samsung re-QA z14–18+ street vs housenumber hierarchy.

## 2026-09-19 — Stage 6.11C.6F.2 QalaGo Light style + house numbers

- Mobile: `QalaGoMapLightStyle` runtime paint on verified Liberty layers; `QalaGoMapHouseNumbers` symbol layer from OpenMapTiles `housenumber` (z16+, city-agnostic).
- Docs: `docs/mobile/qalago-map-light-style.md`.
- Future: physical Samsung visual QA; pinned production style after ops review.

## 2026-09-19 — Stage 6.11C.6F.1 commercial basemap POI suppression

- Mobile: `QalaGoMapBasemapHardening` runs once per MapLibre style load before native business layers; merges OpenFreeMap Liberty `poi_r1` / `poi_r7` / `poi_r20` filters with city-agnostic OpenMapTiles class/subclass commercial deny policy (transit/airport/housenumber untouched).
- Future: C.6F.2 QalaGo Light + house-number labels; C.6F full visual redesign.

## 2026-09-19 — Stage 6.11C.6E map selection and interaction parity

- Mobile: single `_selectedBusinessId` path for native tap, list, preview close; cluster tap clears stale preview; viewport/catalog selection reconciliation; Flutter semantics on preview/list/search.
- Limitation: native MapLibre circle markers are not individual Flutter semantics nodes (documented).
- Future: C.6F basemap/POI visual work.

## 2026-09-19 — Stage 6.11C.6D FIX 1 native cluster pipeline reliability

- Mobile: defer clustered GeoJSON source until features exist; per-layer install with retry; FIX1 constant cluster radius + Noto count labels; omit `clusterMinPoints` on wire (native default 2).
- Future: restore step radius tuning after physical PASS; C.6E/C.6F unchanged.

## 2026-09-19 — Stage 6.11C.6D native map business clustering

- Mobile: clustered GeoJSON source, cluster circle/count layers, cluster tap → `getClusterExpansionZoom` with fallback; C.6C individual/selected layers preserved.
- Future: basemap POI (C.6F), native a11y (C.6E).

## 2026-09-19 — Stage 6.11C.6C native unclustered map businesses

- Mobile: MapLibre CircleLayer business points, selection highlight layer, feature tap → MapScreen selection; overlay business pins hidden when `QALAGO_NATIVE_MAP_BUSINESS_LAYER=true`. Source `cluster: false` until C.6D.
- Future: cluster layers/UX (C.6D), TalkBack on native points (C.6E), basemap POI suppression (C.6F).

## 2026-09-19 — Stage 6.11C.6B native map business layer foundation

- Mobile: `BusinessMapGeoJsonBuilder`, MapLibre `QalaGoMapBusinessLayerController`, clustered source config, `QALAGO_NATIVE_MAP_BUSINESS_LAYER` flag (default off). Overlay markers unchanged by default.
- Future: C.6C unclustered native rendering + taps; C.6D cluster UI; selection styling via GeoJSON `selected` property (not feature-state).

---

---

---

---

---

## 2026-09-19 — Stage 6.11C.5G.1: Explicit Search location UX

- Search radius (3/5/10/15 km) and nearest sort request user GPS via explicit permission flow; no city-center substitute for selected distance.
- Localized feedback for denied, deniedForever (open settings), and disabled location services.

## 2026-09-19 — Stage 6.11C.5F.1: PostGIS integration test isolation

- C.5C/C.5D runtime DB fixtures use Prisma interactive transaction client (`tx`) so rollback aborts writes; per-test slug-scoped `finally` cleanup as safety net.
- Future: optional dedicated integration DB if parallel Jest workers ever share mutable geo fixtures.

## 2026-09-19 — Stage 6.11C.5E: PostGIS map viewport bbox

- `forMap` + bbox: `ST_Intersects` on `Business.location` with SQL pagination; lat/lng API unchanged. No new index.

## 2026-09-19 — Stage 6.11C.5D closure: radiusKm filter independent of sort

- Explicit `radiusKm` + user geo applies PostGIS `ST_DWithin` for recommended/rating/popular/search, not only `sort=nearest`.

## 2026-09-19 — Stage 6.11C.5D: PostGIS nearest / radius catalog queries

- `GET /businesses` nearest path: SQL `ST_DWithin` + `ST_DDistance`, paginated in DB; lat/lng API unchanged. Map bbox still lat/lng (C.5E).

## 2026-09-19 — Stage 6.11C.5C: Business spatial location + trigger + GiST

- Migration: nullable `Business.location` geography(Point,4326), trigger `business_derive_location_from_coordinates`, backfill, partial GiST `Business_location_gist_idx`. Lat/lng remain authoritative; API unchanged. Docs: `docs/architecture/business-spatial-location.md`. C.5D/E query migration deferred.

## 2026-09-18 — Stage 6.11C.5B: PostGIS infrastructure (extension only)

- Docker dev/staging/prod compose: `postgis/postgis:16-3.4-alpine` (PG16); migration `CREATE EXTENSION IF NOT EXISTS postgis`; docs `docs/infra/postgis-local.md`. No `Business.location` yet (C.5C).

## 2026-09-18 — Stage 6.11C.5A: catalog geo query validation & baseline

- `GET /businesses`: hardened user geo pair + `radiusKm` rules, map bbox max viewport spans, server-side invalid stored coordinate filter for map/bbox; performance baseline documented for in-memory nearest (PostGIS deferred C.5B–D).
- Docs: `docs/architecture/catalog-geo-query.md`, `api-contracts.md`.

## 2026-09-18 — Stage 6.11C.4: MapLibre overlay marker camera sync (bridge)

- Mobile MapLibre: reproject Flutter overlay business pins during camera pan/zoom (`trackCameraPosition`, throttled `toScreenLocationBatch`, stale-result guard); catalog viewport fetch remains on camera idle only.
- Future: native GeoJSON/SymbolLayer + clustering (6.11C.6), not overlay polling at scale.

## 2026-09-18 — Stage 6.11C.4: DEV/QA MapLibre basemap (OpenFreeMap Liberty)

- Mobile: default MapLibre style URL changed from MapLibre `demotiles` demo to **OpenFreeMap Liberty** (`https://tiles.openfreemap.org/styles/liberty`) after physical QA on Samsung SM-J610FN (Android 10): demotiles showed blank geographic vectors; Liberty renders roads/buildings/labels on Map tab and business location picker.
- `QALAGO_MAP_STYLE_URL` dart-define override unchanged. MapLibre remains the default runtime renderer on device; `flutter_map` fallback unchanged.
- Attribution bar updated for OpenFreeMap / OpenMapTiles / OpenStreetMap (DEV style compliance).
- **Not** production basemap approval: public OpenFreeMap has no SLA; production provider decision remains deferred (6.11C+).

## 2026-09-18 — Stage 6.11C.4 hotfix: Geocoding city-boundary safety

- City model: `geocodingMin/MaxLat/Lng` for provider-neutral search bounds (uralsk, aktobe, shymkent seeded).
- Geocoding: MapTiler `bbox`, post-provider autocomplete filter, reverse + persistence validation against selected city.
- Mobile/Business Web: reverse geocoding passes `citySlug`; localized out-of-bounds picker error (RU/KK).
- Future: tune bounds per city from operator QA; PostGIS search remains C.5.

## 2026-09-18 — Stage 6.11C.4: Address geocoding and business location picker

- Backend: provider-neutral geocoding API (MapTiler or mock), application/business coordinate persistence, approval pipeline, validation — see `docs/architecture/geocoding.md`.
- Mobile: debounced address autocomplete, MapLibre center-pin location picker, BusinessApply + OwnerEdit integration (RU/KK l10n).
- Business Web: Leaflet location picker component, onboarding apply + business profile; Admin: application coordinate preview.
- Future: PostGIS search (6.11C.5); production MapTiler key and live KZ quality verification by operator.

## 2026-09-17 — Stage 6.11C.3: MapLibre business discovery hardening

- Mobile: viewport-aware map business loading (`MapBusinessesNotifier`) with camera-idle bounds, padded bbox fetch, multi-page dedupe (removes silent 100-business cap), stale-request protection, city/category scope invalidation, invalid-coordinate filtering.
- Map abstraction: `QalaGoMapBounds`, `readVisibleBounds()`, `onCameraIdle` on both MapLibre and flutter_map adapters; MapLibre disables rotate/tilt for overlay marker accuracy.
- Catalog API: optional `forMap` + bbox query params (`minLat`/`maxLat`/`minLng`/`maxLng`) — map-only non-null coordinate filter; search/list semantics unchanged when omitted.
- Future: native MapLibre symbol layers + clustering (6.11C.6), PostGIS bbox (6.11C.5), geocoding/location picker (6.11C.4).

## 2026-09-17 — Stage 6.11C.2: MapLibre renderer integration (Flutter)

- Added `maplibre_gl` ^0.27.1 behind existing QalaGo map abstraction; flutter_map OSM fallback retained.
- Renderer selection via `QALAGO_MAP_RENDERER` / `QALAGO_MAP_STYLE_URL` dart-defines; default MapLibre at runtime, flutter_map in widget tests.
- MapLibre markers use Flutter widget overlay projected with `toScreenLocationBatch` (same QalaGoMapMarker children as fallback).
- Default style: MapLibre demo tiles — development/QA only until production tile provider (6.11C+).

## 2026-09-17 — Stage 6.11C.1: Map provider abstraction (Flutter)

- Mobile: `core/map` SDK-neutral coordinate, camera, marker, controller, and `QalaGoMapView` with flutter_map OSM adapter.
- MapScreen and business detail mini-map refactored to abstraction; behavior unchanged.
- Future: MapLibre renderer behind same contract (6.11C.2); geocoding/location picker unchanged.

## 2026-09-17 — Stage 6.11B.6: Recent searches & catalog suggestions

- **Added:** Local recent search history (SharedPreferences, max 10, deduped, clear action) on empty Search; RU/KK strings.
- **Added:** In-client taxonomy suggestions (categories + one-time subcategory prefetch per city) with exact/prefix/contains ordering; tap commits canonical `GET /businesses?search=`.
- **Preserved:** 320ms debounce, pagination/generation guards, SEARCH analytics on committed searches only; no backend/API changes.
- **Deferred:** Service-item and business-title suggestions (no lightweight client vocabulary without new endpoint).

## 2026-09-17 — Stage 6.11B.5: Search relevance & DB pagination

- **Added:** Organic discovery (`sort=recommended`, no text query) uses PostgreSQL `ORDER BY title, id` with `skip`/`take` and separate `count` for `meta.total` (no full-city load for page 1).
- **Added:** Text search + recommended uses deterministic relevance tiers (exact/prefix/contains title → taxonomy → visible service title → description fields) before pagination; plan-neutral tie-break `title` + `id`.
- **Preserved:** Service-item eligibility via bounded visibility resolver + `OR id IN (...)` before pagination (6.11B.2); rating/popular/nearest remain in-memory with existing semantics.
- **Future:** DB-level relevance pagination for text search (raw SQL / indexed fields); PostGIS or aggregate columns for nearest/rating/popular at scale.

## 2026-09-17 — Stage 6.11B.4: Search filters, sorting & pagination

- **Added:** Consumer sort menu (recommended / nearby / rating / popular) mapped to `BusinessCatalogSort` API values; compact filters bar + bottom sheet (category, subcategory, radius).
- **Added:** Search pagination page size 20, load-more (scroll threshold + button), deduped append, next-page error/retry, `_loadMoreGeneration` stale-page guard.
- **Preserved:** 6.11B.3 generation/cancel semantics; SEARCH analytics on debounced query only (not per page).
- **Future:** DB relevance/pagination (6.11B.5); search history/suggestions (6.11B.6).

## 2026-09-17 — Stage 6.11B.3: Consumer mobile search UX & state

- **Added:** SearchScreen initial / continue-typing / active pane modes; min free-text length 2; localized empty hints and load-error copy (RU/KK).
- **Added:** Stale-result guard via fetch generation + verified results; Dio `CancelToken` on `businessesProvider` dispose; `suppressNetwork` idle queries.
- **Tests:** `search_screen_state_test.dart` (stale response, clear/filter in-flight, retry, keyboard submit, 320dp KK 2.0).
- **Future:** Sort UI + load-more (6.11B.4); search history/suggestions (6.11B.6); maps/geo UX (6.11C).

## 2026-09-17 — Stage 6.11B.2: Multilingual search integrity

- **Fixed:** Global `GET /businesses?search=` service-item matching now uses the same plan-cap + catalog sort as consumer catalog (two-query bounded resolver; no N+1).
- **Added:** Shared `public-catalog-service-items.util`; integration tests in `stage-6-11b2-search-integrity.spec.ts`.
- **Future:** DB-level list pagination/relevance (6.11B.5); SearchScreen UX (6.11B.3+).

## 2026-09-17 — Stage 6.11B.1: Search backend foundation

- **Added:** `GET /businesses?search=` multilingual catalog discovery (business fields, category/subcategory RU+KK, public service items RU+KK); query normalization util; max search length 100; per-business catalog search includes `titleKk` / `descriptionKk`.
- **Docs:** `api-contracts.md` search semantics.
- **Future:** DB-level pagination/relevance (6.11B.5); plan-tier catalog slot limits in global service-item match; SearchScreen UX (6.11B.3+).

## 2026-09-17 — Stage 6.11A.UI.10B.3: Android startup closure

- Pre-12 native splash: solid `#F7FAFC` only (no bitmap); removed unused splash wordmark PNG.
- City catalog: API failure falls back to existing offline taxonomy (onboarding no longer blocked).

---

## 2026-09-17 — Stage 6.11A.UI.10B.2: Android native splash scaling fix

- Trim opaque black canvas from native splash wordmark; inset-based ~30% width layout.
- Night-mode launch theme aligned to light `#F7FAFC` splash (no dark flash).

---

## 2026-09-17 — Stage 6.11A.UI.10B.1: Physical Android splash branding fix

- Remove default Flutter `ic_launcher` from native splash; pre-12 QalaGo wordmark on `#F7FAFC`.
- Android 12+ minimal primary-brand splash icon (compact symbol still deferred).
- Larger wordmark on Flutter startup surface and Welcome (~30–35% width).

---

## 2026-09-17 — Stage 6.11A.UI.10B: Launch experience & first-run (mobile)

- First-run Welcome (RU/KK) + city confirmation; onboarding version 1 in SharedPreferences.
- Branded startup surface (ReleaseShell + router `/startup`); approved wordmark in consumer headers.
- Passive location on Home (no automatic permission prompt); Android/iOS launch background alignment.
- Future: compact Android 12 splash symbol, store/adaptive icons.

---

## 2026-09-16 — Stage 6.11A.UI.6B: Favorites, Profile, Auth UI (mobile)

- **Changed**: Favorites/Profile/Login aligned to QalaGo design system; guest favorites/profile flows; empty favorites CTA to Categories; favorite remove analytics + error feedback; profile avatar on main card; logout confirmation; guest language + business entries; iOS Apple-before-Google provider order; neutral Google button (no unofficial logo art).
- **Changed**: `/profile/language` public for guest language selection (routing only).
- **Future**: UI.7+ polish; 6.11E notifications settings; provider activation external.

## 2026-09-16 — Stage 6.11A.UI.6B.1: Favorites / Profile / Auth QA closure (mobile)

- **Added**: Consumer tests for favorite remove success/failure analytics, OWNER/MANAGER/multi-business profile, auth flag matrix, redirect regression, logout confirm, and 320×KK×2.0 spot checks.
- **Fixed**: Profile/legal responsive overflow on narrow widths and large text (header, user card, menu/business rows, logout/delete actions).

## 2026-09-16 — Stage 6.11A.UI.5B.1: Business Detail visual closure (mobile)

- **Changed**: Hero, identity, and contacts blocks on Business Detail aligned to QalaGo tokens (overlay, 48dp hero controls, typography/spacing, informational contact rows).
- **Added**: Widget tests for primary intent layout (320 KK textScale 2.0 + additional widths) and minimal-detail regression.

## 2026-09-16 — Stage 6.11A.UI.5B: Business cards & detail intents (mobile)

- **Changed**: Shared `BusinessCard` with `standard`, `compactHorizontal`, and `compactVertical` layouts (QalaGo tokens, image placeholder, semantics); Home Nearby/Popular use compact variants; Popular decorative favorite removed.
- **Changed**: Business Detail primary intent row uses `Wrap` (no `FittedBox` on labels), 48dp targets, QalaGo styling.
- **Future**: UI.6 Favorites redesign; verified/public-data/report-error product+backend; category title locale on list payloads.

## 2026-09-16 — Stage 6.11A.UI.4F: Global Search UI/UX (mobile)

- **Changed**: Consumer `/search` layout aligned with Home/Categories (SafeArea, 20px rhythm, back + `QalagoSearchField`); category scope chip; honest result count when total &gt; loaded page; retain prior results while refetching; stale `SEARCH_PERFORMED` guard.
- **Future**: 6.11B search quality (relevance, KK/service indexing, pagination); optional recent searches product decision.

## 2026-09-16 — Stage 6.10D.2: Business Web UX / localization / discoverability

- **Changed**: User-visible «Сообщения» → «Уведомления» / «Хабарландырулар» (`/messages` route kept); notification dates use RU/KK locale formatting.
- **Fixed**: Organic promotion status tags, reviews count copy, onboarding city/rejection labels, plan Analytics 360 label, checkout RU-only fragments.
- **Added**: Permission-filtered sidebar entries for Media (`PHOTOS_EDIT`) and Reviews (`REVIEWS_REPLY`).
- **Future**: 6.10D.QA closure QA; remaining P2/P3 cabinet polish.

## 2026-09-16 — Stage 6.10D.1: Business Web mobile nav & error hygiene

- **Added**: Mobile drawer for existing `BusinessShell` sidebar below 900px (menu control, backdrop, Escape, route-close); RU/KK `shellOpenNavigation` / `shellCloseNavigation`.
- **Fixed**: P1 owner routes use centralized `parseApiError` / `mapLoginRouteError` with technical error sanitization in `parseApiErrorMessage`.
- **Future**: 6.10D.2 UX/localization/discoverability (messages rename, sidebar links, hardcoded RU cleanup).

## 2026-09-16 — Stage 6.10C.QA: Business cabinet closure QA

- **Business Web**: profile subcategory chips use `subcategoryDisplayName` (KK with RU fallback); regression tests.
- **6.10C**: cabinet completion block closed after 6.10C.1–6.10C.2 + targeted QA.

## 2026-09-16 — Stage 6.10C.2: Flutter owner subcategory profile parity

- **Flutter Owner**: subcategory multi-select on business profile edit via existing `GET /categories/:id/subcategories` and `PATCH subcategoryIds`; `BUSINESS_PROFILE_EDIT` gating; zero-subcategory empty state; profile PATCH omits `subcategoryIds` (separate save, Business Web parity).
- **Future**: 6.10C closure QA; maps/geolocation audit (6.11C.0).

## 2026-09-16 — Stage 6.10C.1: Business Web catalog & promotion edit parity

- **Business Web**: edit overlays for organic `ServiceItem` and `Promotion` via existing PATCH APIs; `CATALOG_EDIT` / `PROMOTIONS_EDIT` UX gating; semantic RU/KK keys; safe `parseApiError` on promotions mutations.
- **API**: manage menu item list includes `titleKk` / `descriptionKk` for owner prefill (additive response fields).
- **Future**: Flutter owner profile taxonomy parity (6.10C.2); remaining Business Cabinet P1 gaps from audit.

## 2026-09-15 — Stage 6.10B.QA: Cross-platform RU/KZ localization QA

- **Cities**: migration + seed backfill `shymkent.nameKk = Шымкент`; Flutter offline city taxonomy documents API-aligned fallbacks.
- **Defect fixes**: Flutter owner promotion limit snackbar → l10n; Business Web plan quota lines → semantic `locale.ts` keys (menu/promotions/media).
- **Docs**: glossary city rule; multilingual-content QA closure notes.
- **Future**: hash-like Business Web keys (bulk rename deferred); physical-device QA before release.

## 2026-09-15 — Stage 6.10B.6: Multilingual content model (RU/KZ data)

- **Schema**: optional `ServiceItem.titleKk/descriptionKk`, `Promotion.titleKk/descriptionKk`; City `nameKk` backfill migration for seeded cities; Business brand `title` unchanged.
- **API**: localized-content resolver; PATCH-isolated optional KK fields; city `nameKk` on business payloads.
- **Clients**: Flutter `localized_content.dart` + city display from API; Consumer Web home tagline from `/cities/:slug`; Business Web city chip.
- **Docs**: `docs/localization/multilingual-content-model.md`.
- **Future**: approved KK legal texts; search on KK business fields.
- **Closure (6.10B.6)**: owner KK fields (Flutter + Business Web create forms), consumer display resolver wired on Flutter; PATCH isolation tests; full backend regression.

## 2026-09-15 — Stage 6.10B.5: Business Web RU-KK localization

- **Business Web**: full owner-facing UI RU/KK via `apps/business-web/lib/locale.ts` (~500+ keys), `lib/presentation.ts` mappers, SSR `LocaleProvider` + `qalago_locale` cookie, language switcher in shell topbar and legal chrome.
- **Guard**: `lib/hardcoded-ui-guard.ts`, `npm run check:ui-strings`, `lib/i18n.test.ts`; legal page bodies (`terms`, `privacy`, `account-deletion`) allowlisted — RU legal text unchanged.
- **Future**: locale-prefixed URLs + hreflang (Stage 6.11F); KK legal copy; improve KK coverage for generated hash keys; ESLint CLI migration for `npm run lint`.

## 2026-09-15 — Stage 6.10B.4: Consumer Web RU-KK localization

- **Consumer Web**: centralized `UI_LABELS` in `apps/consumer-web/lib/locale.ts`; SSR `html lang`, localized metadata via `generateMetadata`, `qalago_locale` cookie unchanged.
- **Routes**: Home, categories, category/subcategory businesses, business detail, `not-found`, `error` chrome localized; category/subcategory `nameRu`/`nameKk` unchanged.
- **Guard**: `lib/hardcoded-ui-guard.ts`, `npm run check:ui-strings`, vitest coverage in `lib/i18n.test.ts`.
- **Future**: locale-prefixed URLs + hreflang (Stage 6.11F); Business Web (6.10B.5); `City.nameKk` content model.

## 2026-09-15 — Stage 6.10B.3: Owner / business cabinet RU-KK localization

- **Migrated**: `lib/features/owner` (dashboard, edit, gallery, menu, promotions, reviews, analytics, plan, settings, team, messages, help), monetization purchase UI, centralized `owner_l10n.dart` for plan tiers, statuses, permissions, ads products.
- **Guard**: `stage610b3ScanRoots` includes consumer + owner; removed broad `/owner/` and `monetization` exclusions.
- **Tests**: `test/owner/localization_stage_6_10b3_test.dart`; updated owner unit tests for `AppLocalizations` parameters.
- **Future**: multilingual business-authored content (City.nameKk, promotion/service copy); Business/Admin Web.

## 2026-09-15 — Stage 6.10B.2: Consumer UI l10n migration (map, business, profile, onboarding)

- **Migrated**: map, promotions, notifications, business catalog/photos/details, profile sub-screens, business onboarding flow, shared widgets (city picker, empty city, legal links, search field, business card), consumer ad widgets; `onboarding_errors` / `onboarding_labels` delegate to `onboarding_l10n`.
- **Guard**: `stage610b2ScanRoots` covers consumer `lib/features` (excl. owner/admin/monetization), `lib/core/auth`, `lib/core/release`, `lib/shared/widgets`, `lib/features/ads/widgets`; allowlist `dev_quick_login_panel`, `category_discovery_strings` only.
- **Tests**: `test/consumer/localization_stage_6_10b2_test.dart` (RU/KK keys, scanner, release/auth prompt samples).
- **Future**: owner/monetization cabinets; RBAC permission copy in `role_permissions`; city `nameKk` in pickers when API ready.

## 2026-09-14 — Stage 6.10B.1: Consumer mobile RU/KK localization foundation

- **Added**: Flutter `gen_l10n` (`app_ru.arb`, `app_kk.arb`), `context.l10n`, persisted locale (`qalago_ui_locale`), profile language screen, API/load error mapping, glossary, scoped hardcoded-string guard.
- **Localized (consumer)**: shell nav, home, categories discovery, profile/settings entry, login OTP/social shell, favorites shell, business detail primary actions (partial sections remain).
- **Future**: complete search/map/business-detail/reviews/promotions/onboarding strings; owner/monetization cabinet; city `nameKk` when API provides it; expand scanner roots.

## 2026-09-14 — Stage 6.10B: Category RU/KZ localization and consumer web parity

- Prisma `Category.nameRu` / `Category.nameKk` with migration backfill; `title` kept as legacy alias of `nameRu`.
- Public category API exposes `nameRu`, `nameKk`, `title`, `icon`, `iconUrl`.
- Flutter category labels use `displayName` + `appLocaleCodeProvider` (not hardcoded RU on category screens).
- Consumer Web: RU/KZ cookie locale, localized category/subcategory labels, category → subcategory → business list + minimal business detail route.
- Admin dashboard: edit category RU/KZ names; icon upload unchanged.

## 2026-09-14 — Admin Web: canonical TOTP MFA enrollment on `/mfa/setup`

- `/mfa/setup` and `/settings/security` use shared `StaffMfaEnrollment` (QR via `qrcode.react`, Authenticator TOTP, recovery codes once).
- Session restore via `POST /api/auth/refresh` when access token is memory-only; login honors `?next=/mfa/setup`.
- LOCAL mode: voluntary enrollment stays TOTP (not SMS); no redirect away from `/mfa/setup` when MFA is optional.
- Future: optional BFF proxy for enroll routes if CORS/cookie policy changes.

## 2026-09-13 — Stage 6.10A: Category icon system & home category UI

- Consumer API: `iconUrl` on categories/subcategories (alias of `icon`); ordering unchanged (`sortOrder`, city order).
- Mobile: home icon grid + «Ещё», all-categories and subcategory icon grids, safe fallbacks.
- Admin: category/subcategory icon upload & remove via hardened uploads pipeline.
- New `apps/consumer-web` for public category browsing (icon grid parity with mobile).
- Docs: `docs/catalog/stage-6-10a-category-icons.md`.

## 2026-09-13 — Stage 6.9.1.2: Staff MFA & SUPER_ADMIN recovery hardening

- TOTP MFA, encrypted secrets, recovery codes, login challenge, MFA step-up, admin reset, emergency CLI.
- Admin-web `/mfa/setup`, login MFA screen, `/settings/security`.
- Docs: `docs/security/staff-mfa.md`, `staff-mfa-recovery.md`.

## 2026-09-13 — Stage 6.9.2.1: Admin Reports UI & executive dashboard

- Admin-web `/reports/*` — KPI cards, filters (URL query), recharts, role-aware nav, export UX, no raw JSON for operators.
- Docs: `docs/admin/reporting-ui.md`.

## 2026-09-13 — Stage 6.9.2: Admin reporting & staff oversight foundation

- `REPORT_*` permissions in `@qalago/shared-types`; module `services/catalog-api/src/modules/admin-reporting/` (scope, query, read-only endpoints, CSV export).
- Admin-web `/reports` with role-filtered nav; docs `docs/admin/reporting.md`, `report-access-matrix.md`, `docs/security/staff-oversight.md`.
- **STAFF MFA still PENDING** — no MFA compliance metrics in staff reports.

## 2026-09-13 — Stage 6.9.1.1: Staff permission guard & step-up hardening

- `@RequireStaffPermission` / `@AdminStaffRoute` / `@RequireStaffStepUp` on staff admin controllers; legacy `updateUserRole` limited to USER/BUSINESS.
- JWT staff session binding (`sid`); disabled staff and revoked sessions fail access + refresh immediately.
- OTP step-up: `POST /auth/staff/step-up`, TTL **600s**; audit `STAFF_STEP_UP_VERIFIED`. **STAFF MFA PENDING.**
- Docs: `staff-step-up.md`, `staff-roles-inventory.md`, api-contracts staff section.

## 2026-09-13 — Stage 6.9.1: Staff RBAC & SUPER_ADMIN access foundation

- Added `StaffAccess`, `StaffCityScope`, extended `UserRole` staff roles, staff audit actions, migration `20260913030000_stage_6_9_1_staff_rbac`.
- Central permission registry in `@qalago/shared-types` (`staff-permissions.ts`); staff admin API `/admin/staff/*` (SUPER_ADMIN); admin-web `/staff`.
- Hardened bootstrap CLI + `StaffAccess` sync; payment confirm requires `PAYMENT_CONFIRM`; moderation business restore preserves pre-hide status.
- Docs: `docs/security/staff-rbac.md`, `super-admin-bootstrap.md`, `admin-access.md`.
- Future: MFA/step-up enforcement, broader `@RequireStaffPermission` on all admin routes.

## 2026-09-12 — Stage 6.9: Legal, safety & moderation foundation

- Backend: legal documents/acceptance, data-rights requests, content reports, moderation cases/actions/appeals, government requests & security incidents (SUPER_ADMIN), account deletion hardening (sessions, avatar, ownership code).
- Admin Web: moderation + legal admin sections; feature flags `legalCenterEnabled`, `reportingEnabled`, `dataRightsEnabled` (default OFF).
- Docs: `docs/legal/*`, `docs/safety/moderation-system.md`; **LEGAL_REVIEW_REQUIRED** for published policy text and retention law.

## 2026-09-12 — Stage 6.8D.1: Flutter regression suite closure

- Fixed stale `widget_test.dart` smoke: stub release gate + home providers so canonical Home search hint is reachable without live app-config network.
- Full Flutter suite green (331 tests).

## 2026-09-12 — Stage 6.8D: Google & Apple auth integration foundation

- Production architecture: server-side Google ID token and Apple identity token verification, `AuthIdentity` mapping, `issueQalaGoSession`, no email auto-linking, tombstone/inactive gates, rate limits, fail-closed prod config.
- Flutter: Google/Apple adapters, login UX gated by app-config + env + platform; Apple optional first-login display name; secure storage session unchanged.
- Docs: `docs/auth/stage-6-8d-google-apple-auth.md`, `provider-setup-checklist.md`, `provider-auth-threat-model.md`.
- **Integration foundation complete** — real Google/Apple login with production credentials and physical devices not verified in this stage.

## 2026-09-12 — Stage 6.8C.1.2: Category map scope fix

- Category → Map with «Все» now scopes by `categoryId` only; global bottom-nav Map stays city-wide.
- Feature flag OFF still applies category map scope; subcategory filter only when flag ON.

## 2026-09-12 — Stage 6.8C.1.1: Subcategory map integration closure

- Flutter Map reuses catalog `subcategoryId` when opened from category with a subcategory chip selected (flag ON); bottom nav clears ephemeral scope.
- Closure QA: avatar URL blocked on PATCH; regression specs; map unit tests.

## 2026-09-12 — Stage 6.8C.1: Subcategories & user profile photo

- Prisma: `Subcategory`, `BusinessSubcategory`, `User.avatarUrl`; idempotent seed taxonomy (RU/KK).
- Feature flag `subcategoriesEnabled` (global OFF); public/admin subcategory APIs; business filter `subcategoryId`.
- User avatar POST/DELETE `/users/me/avatar` with sharp WebP normalize and upload hardening.
- Mobile category chips + profile avatar; Admin/Business web taxonomy editors.
- Docs: `docs/catalog/stage-6-8c-1-subcategories-and-user-avatar.md`.
- Future: subcategory ad targeting, 6.8D OAuth avatars, enable flag per city rollout.

## 2026-09-12 — Stage 6.8C: Release architecture foundation

- Shared release types; semver/update-mode utilities; `GET /app-config` and `/version`.
- Prisma runtime config: release settings, feature flags, city overrides; maintenance guard.
- SUPER_ADMIN release APIs + audit; `QALAGO_ENV` with production fail-closed.
- Flutter: config cache, maintenance/required/optional screens, client version headers.
- Docs under `docs/release/*`.
- Future: admin UI for release settings, VPS/store rollout (7.x), OAuth flags (6.8D).

## 2026-09-11 — Stage 6.8B: Local security hardening

- Production fail-closed: weak secrets, DEV login, mock checkout, AI internal token, CORS wildcard.
- Auth: `AuthSession` refresh rotation (hashed tokens), short access JWT, logout/revocation APIs.
- Admin/Business Web: HttpOnly refresh cookie via Next BFF; access token memory-only.
- Mobile: secure storage for refresh; Dio refresh-on-401.
- AI orchestrator: token required (explicit dev open flag); tightened CORS; constant-time compare.
- Uploads: magic-byte validation, business-scoped uploads, rate limits.
- Redis-ready rate limit store; Helmet + production error filter; log redaction util.
- Docs: `docs/security/stage-6-8b-local-security-hardening.md`, backup/incident runbooks.
- Future: 6.8C infra/CSP, 6.8D OAuth hardening, 7.x mandatory Redis/backups.

## 2026-09-11 — Stage 6.8A: Local security readiness audit

- Read-only security audit across monorepo (auth, RBAC, IDOR patterns, uploads, CORS, deps, Docker, AI orchestrator, mobile/web token storage).
- Risk register and release blockers in `docs/security/stage-6-8a-local-security-audit.md`.
- npm audit: 19 findings (1 critical in Next.js chain); no code hardening in this stage.
- Future: Stage 6.8B ordered hardening (secrets, deps, tokens, rate limits, uploads, headers).

## 2026-09-11 — Stage 6.7QA: Monetization + category adversarial QA

- Added regression suites: `stage-6-7qa-purchase-adversarial`, `stage-6-7qa-category-discovery`, `stage-6-7qa-package-inventory`; Flutter `category_discovery_qa_test.dart`.
- catalog-api **681** tests passing; no integrity defects found in 6.7B/C/D scope.
- Docs: `docs/monetization/stage-6-7qa-final-qa.md` (concurrency limits, limit=100 note, idempotency semantics).
- Future: PostgreSQL parallel tests for last-slot race; DB pagination for large catalogs.

## 2026-09-11 — Stage 6.7D: Advertising and category discovery UX

- Consumer category screen: «Рекомендуем» (organic), «Продвигаемые места» (paid), «Все места» with session sort chips (`recommended` / `nearest` / `rating` / `popular`).
- `GET /businesses?sort=` organic comparators; default geo → nearest, else title recommended.
- Owner UX: `GET /monetization/purchase-states`, quote/package schedule preview; Flutter + Business Web product cards.
- Docs: `docs/monetization/stage-6-7d-advertising-category-ux.md`; API contracts updated.
- Future: 6.7QA adversarial monetization/category tests on device.

## 2026-09-11 — Stage 6.7C: Package and city inventory integrity

- Immutable `packageSnapshot` / `lineSnapshot` on `OrderItem`; provisioning uses snapshots only.
- `AdPlacementCityConfig` for per-city capacity; `AdInventoryReservation` (HELD/CONVERTED/EXPIRED/CANCELLED) with configurable TTL.
- Schedule-after renewal for business-scope placements; capacity counts campaigns + active holds.
- `AdCampaign.promotionId` FK; payment confirm revalidates schedules after expired holds.
- Docs: `docs/monetization/stage-6-7c-package-inventory.md`.
- Future: monetization UX (6.7D), adversarial QA (6.7QA), ad bonus spend.

## 2026-09-11 — Stage 6.7B: Monetization purchase integrity core

- Central purchase scopes + same-business overlap checks (409 `PURCHASE_CONFLICT` with `reasonCode`).
- Pending-order dedupe and optional checkout `idempotencyKey` on `Payment`.
- Transaction-safe placement availability counts; VIP capacity isolated per `cityId`.
- Category/promotion validation on direct `createOrder`; package lines validated inside checkout transaction.
- Docs: `docs/monetization/stage-6-7b-purchase-integrity-core.md` (+ 6.7A audit retained).
- Future: package snapshots, promotion on campaign, inventory reservation, renewal UX (6.7C–6.7D).

## 2026-09-10 — Stage 6.6QA: Analytics 360 final QA

- Adversarial regression suite `analytics-stage-6-6qa-final.spec.ts` (entitlements, downgrade leakage, privacy thresholds, export auth, rollup-first 365).
- Fixes: CSV export requires `ANALYTICS_VIEW` + `ANALYTICS_EXPORT`; conversion `rate` null when views=0 (no fake 0%).
- Docs: `docs/analytics/stage-6-6qa-final-qa.md`.

## 2026-09-10 — Stage 6.6F: Analytics reporting & export foundation

- Canonical `buildBusinessAnalyticsReport` (CUSTOM/WEEKLY/MONTHLY completed local periods) reuses dashboard rollup semantics; CSV serializes report payload.
- Export: PRO/VIP + `ANALYTICS_EXPORT`, UTF-8 BOM, semicolon delimiter, formula-injection safe cells, period range in filename, `Cache-Control: private, no-store`.
- Docs: `docs/analytics/stage-6-6f-reporting-export.md`.
- Будущее: email/PDF/scheduler delivery (6.6QA+), public GET `/report` if needed.

## 2026-09-10 — Stage 6.6E: VIP benchmark & recommendations

- Rollup-backed category benchmark (`AnalyticsDailyMetric.groupBy`): same city + primary category, ACTIVE peers, subject excluded, same local period; min 5 peers; per-metric min 5 for CTR/conversion averages.
- Deterministic VIP recommendations (max 5): visibility, CTR, intent conversion, search, promotions visibility, returning views, popular hours; centralized thresholds in `analytics-insights.constants.ts`; no LLM, no named competitors.
- Shared types: additive optional fields on `AnalyticsBenchmarkDto` / `AnalyticsRecommendationDto`.
- Docs: `docs/analytics/stage-6-6e-benchmark-recommendations.md`.
- Будущее: cohort median; lost-demand analytics (explicitly deferred); promotion/catalog action instrumentation.

## 2026-09-10 — Stage 6.6D: Business Web Analytics 360

- Rebuilt `/statistics` with Analytics 360 sections, backend-driven capabilities/lockedSections, PRO+ export, manager `ANALYTICS_EXPORT`, intent actions, funnel, VIP audience/content.
- Added `analytics-360-dashboard` component, extended `AnalyticsDashboard` types and `analytics-utils` tests.
- Docs: `docs/analytics/stage-6-6d-business-web-analytics.md`.

## 2026-09-10 — Final mobile UI screen-by-screen cleanup

- Migrated consumer/owner/profile/auth/onboarding screens from ad-hoc greys and hex literals to `AppTheme` + `ColorScheme` tokens; added surface/status/search tokens and `QalagoSearchField`.
- Unified search UI on home, categories, search, promotions; extended `app_theme_test` (scaffold, search field, card @320).
- Docs: `docs/mobile/ui-design-system-consistency.md` § Final screen-by-screen cleanup.

## 2026-09-10 — Mobile navigation & back behavior

- Shared `navigation_utils` (pop vs source-aware fallback); consistent `BackButton` on search, category, business subpages, owner screens; business detail deep-link fallback by traffic source.
- Docs: `docs/mobile/navigation-consistency.md`; tests `test/navigation/navigation_utils_test.dart`.

## 2026-09-10 — Mobile UI design system consistency

- Expanded `AppTheme.light` (buttons, inputs, chips, dialogs, sheets, snackbars); `QalagoTheme` extensions; consumer shell nav + shared widgets aligned to `ColorScheme`.
- Docs: `docs/mobile/ui-design-system-consistency.md`; widget tests `test/core/app_theme_test.dart`.
- Будущее: migrate remaining screen-level `AppTheme.kzBlue` tints to `primarySurfaceTint` opportunistically.

## 2026-09-10 — Stage 6.6C: Flutter Owner Analytics 360 UI

- Owner statistics screen restructured (Обзор / Привлечение / Аудитория / Контент / рекомендации); capabilities-driven period selector, PRO+ CSV export with RBAC, compact upgrade UX, hour-only popular times, promotion/catalog actions-unavailable copy.
- Docs: `docs/analytics/stage-6-6c-flutter-analytics-ui.md`; Flutter tests in `owner_analytics_test.dart`.
- Будущее: 6.6D (Business Web analytics); weekday heatmap when rollup ready; review analytics if added to API.

## 2026-09-10 — Stage 6.6B: Analytics entitlements & backend security

- Canonical plan capabilities (`impressions`, `ctr`, `audience`, `catalogAnalytics`, `visitorMetrics`, `promotionBreakdown`); overview/section server-side gating; BASIC period comparison; PRO export + `reportExport` on PREMIUM/VIP.
- Docs: `docs/analytics/stage-6-6b-entitlements.md`.
- Будущее: 6.6C UI for PRO export and upgrade UX.

## 2026-09-10 — Stage 6.6A.1: Analytics action semantics fix

- Canonical **business intent actions** exclude `PROMOTION_VIEW`, `FAVORITE_REMOVE`, and content events; shared util + dashboard/summary/trends alignment.
- Docs: canonical definition in `docs/analytics/stage-6-6a-dashboard-data-layer.md`.

## 2026-09-10 — Stage 6.6A: Analytics 360 dashboard data layer

- `GET /analytics/business/:id/dashboard` reads historical metrics from `AnalyticsDailyMetric` / `AnalyticsDailyDimensionMetric` (365d without raw scan); ≤90d raw fallback when rollups empty.
- Extended overview (impressions, CTR, conversion, UV/session approx + period distinct ≤90d), audience NEW/RETURNING view counts, promotion/catalog breakdowns with honest action unavailability.
- Local timezone trends aligned with rollup `metricDate`; docs: `docs/analytics/stage-6-6a-dashboard-data-layer.md`.
- Будущее: session funnel, lost demand, weekday popular times rollup, benchmark on rollups (6.6E).

## 2026-09-10 — Stage 6.5.2: Mobile owner team management

- Flutter: экран «Команда» для OWNER (`/owner/team`), invite/edit/suspend/revoke, лимиты из plan API, presets прав, mobile `/invite/:token` accept flow.
- Docs: `docs/mobile/stage-6-5-2-owner-team-management.md`.
- Будущее: App Links для invite, audit history в mobile, transactional email.

## 2026-09-10 — Stage 6.5.1: Analytics instrumentation completion

- Flutter: map impressions (`MapBusinessPreviewImpression`, list viewability), catalog (`TrackedCatalogItemCard`), reviews (`ReviewsViewTracker`, `REVIEW_CREATED` after API success).
- Search funnel: `discoverySurface=SEARCH_RESULTS` on open, `SEARCH_PERFORMED` from search UI, visitor/session on views.
- Backend: `AnalyticsBusinessVisitor` + `visitorType` on `VIEW_BUSINESS`; `VISITOR_TYPE` rollup dimension.
- Tests: full Flutter suite + search funnel / visitor-type backend specs.
- **Future:** Analytics 360 UI (6.6), `CATALOG_ITEM_ACTION` when UI adds meaningful actions.

## 2026-09-10 — Stage 6.5: Analytics data foundation

- Extended `AnalyticsEvent` (promotionId, catalogItemId, clientEventId, visitorHash, discoverySurface, platform, isInternal).
- Added `AnalyticsDailyMetric` + `AnalyticsDailyDimensionMetric` with timezone-aware rollup job.
- Organic ingest: whitelist, idempotency, internal-traffic exclusion, promotion/catalog validation.
- Fixed `popularTimes` to use `City.timezone` (not UTC).
- Flutter: visitor/session providers, impression tracking, promotionId on promotion views.
- Docs: `docs/analytics/stage-6-5-analytics-data-foundation.md`.
- **Future:** Analytics 360 UI (6.6), scheduled raw-event retention job, new/returning visitor dimension.

## 2026-09-10 — Stage 6.4: Subscription plan redesign

- **Сделано:** Canonical `PLAN_CATALOG` (FREE/BASIC/PREMIUM/VIP → Бесплатный/Бизнес/PRO/VIP); manager limits; review-reply entitlement; monthly ad bonus in catalog (display only); ad discount derived from catalog; consumer plan badge removed; Business/Admin/Flutter plan UX; docs + monthly ad bonus design note.
- **Политика:** subscription ≠ organic ranking; downgrade preserves content; no ad wallet ledger in 6.4.
- **На будущее:** Analytics 360 (6.5/6.6), monthly ad bonus accounting, extended styling UI.

## 2026-09-10 — Stage 6.3: Privacy, terms, account deletion & store compliance foundation

- **Сделано:** Public `/privacy`, `/terms`, `/account-deletion` (Business Web); Flutter/Business Web legal links and login consent; privacy data inventory; Google Play / Apple privacy drafts; store checklists; legal-review-required registry.
- **Политика:** тексты отражают фактическое поведение репозитория; placeholders для оператора/контактов; без вымышленных legal claims.
- **На будущее:** юридическая экспертиза, deploy qalago.kz, Apple revocation, in-app report review, kk translation.

## 2026-09-10 — Stage 6.2B7: Auth migration finalization

- **Сделано:** Social-first auth policy documented; OTP independently disableable (backend + Business Web client flag); production validation requires ≥1 auth method; admin `authMethods` visibility; JWT guard tests; auth collision/tombstone tests; all-auth-off UX; invitation rate-limit IP fix.
- **Политика:** Google/Apple primary; OTP transitional; no auto-linking; tombstones enforced; legacy phone invites require OTP path.
- **На будущее:** real provider E2E, Apple revocation, admin social login, distributed rate limits, provider linking UX.

## 2026-09-10 — Stage 6.2B6: Team invitations (email + secure token)

- **Сделано:** Email-based manager invitations with cryptographically secure one-time tokens; `tokenHash` only in DB; `POST /invitations/resolve` and `/invitations/accept`; Business Web team page (copy link) and `/invite/[token]` acceptance flow; legacy phone invitations preserved via `claimPendingInvitations`; 7-day TTL; login redirect preservation.
- **Политика:** token possession + authenticated user + explicit accept; invitation email — контекст доставки, не auth identity; без email auto-link.
- **На будущее:** transactional email provider, Flutter deep links, stricter optional email-match signal (non-blocking).

## 2026-09-10 — Stage 6.2B5: Business Web social authentication

- **Сделано:** Google/Apple login на Business Web; GIS + Apple JS; state/nonce; existing JWT session; OTP fallback.
- **На будущее:** real OAuth credentials, Apple revocation, httpOnly cookie hardening, B6 team invites.

## 2026-09-10 — Stage 6.2B4: Flutter social authentication

- **Сделано:** Google/Apple login на Flutter; provider gateways; `AuthRepository.signInWithGoogle/Apple`; credential-gated dart-define flags; OTP fallback; guest-first UX preserved.
- **На будущее:** real OAuth credentials, B5 Business Web, Apple revocation.

## 2026-09-10 — Stage 6.2B3: Apple backend authentication

- **Сделано:** `POST /auth/apple`; Apple JWKS verification via `jose`; `AppleIdentityTokenVerifierService`; shared `SocialAuthLoginService`; relay email support; partial AuthIdentity metadata updates; Apple production config validation; Google DI runtime fix.
- **На будущее:** B4 Flutter social UI, B5 Business Web, Apple token revocation (App Store compliance).

## 2026-09-09 — Stage 6.2B2: Google backend authentication

- **Сделано:** `POST /auth/google`; `google-auth-library` ID token verification; `GoogleAuthLoginService`; IP rate limiting; production Google client ID validation; tombstone/inactive-user enforcement; no email auto-link.
- **На будущее:** B3 Apple backend, B4 Flutter Google UI, B5 Business Web Google UI.

## 2026-09-09 — Stage 6.2B1: Social auth identity foundation

- **Сделано:** `AuthProvider` enum; `AuthIdentity` + `AuthIdentityTombstone` models; `User.phone` nullable; optional `User.email`; `AuthIdentityService`; account deletion tombstones external identities; JWT/AuthUser optional phone; feature flags `OTP_AUTH_ENABLED`, `GOOGLE_AUTH_ENABLED`, `APPLE_AUTH_ENABLED`; OTP routes gated when disabled; client null-safe phone display.
- **На будущее:** B2 Google verification, B3 Apple verification, B4–B5 client social login, B6 phone-based invitation redesign.

## 2026-09-09 — Stage 6.0.1: Production safety prerequisites

- **Сделано:** fail-closed CORS в production; OTP send/verify rate limiting (in-process, Redis-ready abstraction); mock plan checkout заблокирован в production (backend + Flutter + Business Web); production env validation (`JWT_SECRET`, `CORS_ORIGINS`, `OTP_DEBUG`, `DEV_LOGIN_ENABLED`); `DELETE /users/me` self-service account deletion (hybrid anonymize/deactivate); safe SUPER_ADMIN bootstrap script (`bootstrap:super-admin`); analytics ingest IP rate limit; permission error sanitization (`REVIEWS_REPLY`); deploy docs — **never seed production**.
- **На будущее (Stage 6.1+):** Redis-backed rate limits; real SMS; Android/iOS signing; S3 uploads; Nginx/TLS; store billing; privacy/terms legal text.

## 2026-09-09 — Hotfix: VIP creative moderation lifecycle sync

- **Сделано:** `POST /monetization/creatives/:id/submit` (`DRAFT`/`REJECTED` → `PENDING`, ADS_MANAGE); VIP campaign при оплате с `DRAFT` креативом → `SCHEDULED` (не `PENDING_MODERATION`); submit синхронизирует кампанию в `PENDING_MODERATION`; admin approve/reject только для `PENDING`; Business Web — «Отправить на модерацию», корректный «Фактический период»; Admin Web — подсказка для `DRAFT`; +11 backend tests (405 total).
- **На будущее:** submit из Flutter owner UI; data repair script для legacy `PENDING_MODERATION`+`DRAFT` пар.

## 2026-09-09 — Stage 5N.QA: Manual E2E verification (runtime)

- **Сделано:** runtime QA script `services/catalog-api/scripts/stage-5n-qa-runtime.mjs` + fixture audit `stage-5n-qa-fixtures.mjs`; DEV stack verified (API :3002, Admin :3001, Business :3003, Flutter :8080); HTTP smoke on all web apps; API paths for application/claim lifecycle, POST `/businesses` matrix, PAYMENTS_VIEW RBAC, CITY_ADMIN scope, stale moderation, rate limit 429, accountType attack; **P1 fix:** `BusinessAccessService.assertBusinessPermission` возвращает generic `Insufficient permissions` вместо `Missing permission: PAYMENTS_VIEW` (+1 regression test, backend 394/394).
- **Manual UI:** PARTIAL — browser automation недоступна в Cursor; Flutter/Admin/Business Web flows покрыты automated unit tests + API runtime; responsive/guest redirect/nav smoke не выполнялись в реальном браузере.
- **На будущее:** Playwright smoke для onboarding/plan RBAC; перезапуск API или отдельные QA phones между прогонами runtime script (in-memory rate limit).

## 2026-09-09 — Stage 5N.5: Business onboarding security hardening

- **Сделано:** `POST /businesses` закрыт для обычных пользователей (только ADMIN/SUPER_ADMIN import); `accountType=business` больше не повышает роль; удалены мёртвые client `createBusiness`; rate limits на create/submit applications и ownership claims (429, env-config); Flutter session cleanup через `userScopedCacheCleanupProvider` + auth-gated onboarding providers; PAYMENTS_VIEW RBAC на Business Web сохранён и расширен тестами; backend +7 тестов (393 total).
- **На будущее:** read-only plan limits endpoint для менеджеров каталога без PAYMENTS_VIEW; постепенный отказ от `@Roles(BUSINESS)` на контроллерах.

## 2026-09-09 — Business Web: plan page access (PAYMENTS_VIEW)

- **Сделано:** страница «Тариф» и связанные экраны проверяют `PAYMENTS_VIEW` перед запросом `/businesses/:id/plan`; пункт меню «Тариф» скрывается для менеджеров без права; вместо JSON-403 показывается понятное сообщение на русском; checkout тарифа доступен только владельцу.
- **На будущее:** отдельный read-only эндпоинт лимитов тарифа для менеджеров каталога/акций без доступа к платежам.

## 2026-09-09 — Stage 5N.4: Client business onboarding

**Added**
- Flutter: «Для бизнеса» profile section, `/business/start|search|apply|applications|claims`, claim CTA on business detail
- Business Web: `/onboarding/*` (search, apply, claims, applications), zero-business empty states
- Auth UX: removed account-type selector; login always as User (`accountType=user` internally)
- Onboarding uses `BusinessApplication` + `OwnershipClaim` APIs (no direct `POST /businesses` in new flows)

**Legacy preserved**
- `UserRole.BUSINESS`, `Business.ownerId`, backend `POST /businesses` unchanged
- Legacy BUSINESS users and repository helpers remain for compatibility

**Deferred**
- Stage 5N.5 verification/rate limits/cleanup; phone OTP auto-approval; document KYC

---

## 2026-09-09 — Stage 5N.3: Admin business request moderation UI

**Added**
- Admin Web «Заявки бизнеса»: `/business-requests/applications`, `/business-requests/claims` (+ detail routes)
- Paginated queues with status filters (default `PENDING`), city scope via shell picker (ADMIN/SUPER_ADMIN) or locked city (CITY_ADMIN)
- Approve/reject dialogs with Russian copy, rejection reason validation (3–500), 409 stale-state handling
- Pending count badges on nav + sub-tabs; vitest coverage for utils/API query mapping

**Not implemented**
- Consumer/business onboarding (5N.4), verification/rate limits (5N.5), dedicated admin business detail deep link

---

## 2026-09-09 — Stage 5N.2: Business ownership claim backend foundation

**Added**
- `BusinessOwnershipClaim` model + migrations (`PENDING/APPROVED/REJECTED/CANCELLED`)
- User API: `POST /businesses/:id/ownership-claims`, `GET /ownership-claims/my`, read, cancel
- Admin API: `/admin/ownership-claims/*` (list, approve, reject)
- Partial unique index: one PENDING claim per `(businessId, claimantUserId)`
- Approval transaction: ACTIVE OWNER membership; `ownerId` set only if null; plan/content preserved
- Audit actions: `BUSINESS_OWNERSHIP_CLAIM_SUBMIT/APPROVE/REJECT/CANCEL`
- MVP verification: `MANUAL` only (no phone auto-approval, no documents)

**Deferred**
- Admin Web UI (5N.3), client onboarding (5N.4), rate limiting (5N.5)

---

## 2026-09-09 — Stage 5N.1: Business application backend foundation

**Added**
- `BusinessApplication` model + migrations (`BusinessApplicationStatus`: DRAFT/PENDING/APPROVED/REJECTED/CANCELLED)
- User API: `/business-applications/*` (create, edit, submit, cancel)
- Admin API: `/admin/business-applications/*` (list, approve, reject)
- Dedupe fingerprint (`dedupeKey`) + partial unique index for active DRAFT/PENDING per applicant
- Approval transaction: Business + ACTIVE OWNER membership + `ownerId` + AuditLog; applicant stays `USER`
- Audit actions: `BUSINESS_APPLICATION_SUBMIT/APPROVE/REJECT/CANCEL`
- P0 fix: membership-authoritative owner access (revoked `ownerId` bypass closed)

**Legacy**
- `POST /businesses` marked deprecated; kept for Flutter/Business Web until Stage 5N.4

**Deferred**
- Ownership claims (5N.2), Admin moderation UI (5N.3), client onboarding (5N.4), rate limiting (5N.5)

---

## 2026-09-08 — Stage 5M.4.1: SUPER_ADMIN verification checkpoint

**Verified**
- Backend 346/346; 11 migrations; catalog-api restarted after schema change
- Manual API QA: SUPER_ADMIN role assignment, audit log, ADMIN denial, CITY_ADMIN scope, self-demotion block
- Git tag `stage-5m4-checkpoint` on `1f726b5` (+ docs commit if any)

**Known unrelated:** Flutter `auth_session_test.dart` (3 failures)

---

## 2026-09-08 — Stage 5M.4: SUPER_ADMIN system role governance

**Added**
- `UserRole.SUPER_ADMIN`; migrations `20260908190000_stage_5m4_super_admin` + `20260908190001_stage_5m4_super_admin_migrate`
- Existing `ADMIN` users migrated → `SUPER_ADMIN` (privilege preserved)
- `SystemAccessService` + `RolesGuard` hierarchy (SUPER_ADMIN inherits ADMIN ops, not vice versa)
- Role change: **SUPER_ADMIN only**; self-change denied; last-SUPER_ADMIN demotion blocked
- Governance: city create/update, global category create/delete → SUPER_ADMIN
- Operational ADMIN: moderation, payments, audit read, category update
- Dev seed: `+77000000001` SUPER_ADMIN, `+77000000005` ADMIN

**Deferred**
- MODERATOR role
- USER_STATUS_CHANGE endpoint

---

## 2026-09-08 — Documentation sync through Stage 5M.3

**Updated**
- `README.md`, `docs/PROJECT_STATUS.md`, `docs/README.md` — checkpoint `2bacbb3`, 9 migrations, 5M.3 complete
- `scripts/dev/SETUP.md`, `docs/deploy.md` — `migrate deploy` workflow, DATABASE_URL Windows pitfall, production safety
- `docs/stage-5l-rbac-audit.md` — marked HISTORICAL/SUPERSEDED
- `docs/architecture/business-membership.md` — AuditLog implemented; deferred items clarified

**Policy**
- Stage 6 not started; SUPER_ADMIN / MODERATOR not implemented
- No historic AuditLog backfill

---

## 2026-09-08 — Stage 5M.3: Audit log foundation

**Added**
- Prisma `AuditLog` model + migration `20260908180000_stage_5m3_audit_log` (9 migrations total)
- Central `AuditLogService` — server-side actor, role snapshot, safe metadata, transaction support
- Wired mutations: team, business profile/hours, catalog, photos, promotions, review replies, plans, ad orders/payments/creatives/campaigns, user role, cities, categories
- `GET /admin/audit-logs` (ADMIN global, CITY_ADMIN city-scoped)
- `GET /businesses/:id/team/audit` (OWNER only)
- Admin Web `/audit-logs`; Business Web team history block

**Policy**
- Append-only; no backfill of historic actions; retention TBD
- Not mixed with `AnalyticsEvent`; secrets/PII excluded from metadata
- Critical mutations (team invite existing user, role change, payment confirm, invitation accept) logged in same DB transaction where practical

**Deferred**
- `USER_STATUS_CHANGE` / `PAYMENT_REJECT` — no admin endpoints yet
- SUPER_ADMIN / MODERATOR roles

---

## 2026-09-08 — Stage 5M.2.1: Prisma & runtime verification

**Verified**
- Migration `20260908160000_stage_5m2_business_permissions` applied (8/8 migrations, DB up to date)
- Owner invariant: 17 businesses with ownerId → 17 ACTIVE OWNER memberships (0 missing)
- 44-scenario API runtime QA (owner/manager/invitations/cross-business/cross-city)
- Expired invitation not claimed; live permission grant/revoke without relogin

**Fix**
- `RolesGuard`: USER may reach `@Roles(BUSINESS…)` routes; `BusinessAccessService` enforces permissions
- `scripts/dev/SETUP.md`: document PowerShell `DATABASE_URL` shell override pitfall

**Root cause (Stage 5M.2 Prisma CLI failure)**
- `.env` was valid; stale `$env:DATABASE_URL` in PowerShell had leading `"` and overrode `.env`
- PostgreSQL: native local instance on `localhost:5432` (Docker not installed on dev machine)

**Manual UI QA:** Flutter/Business Web browser walkthrough not run; client unit tests + API QA executed.

---

## 2026-09-08 — Stage 5M.2: Business team & manager permissions

**Сделано**
- Prisma: `BusinessPermission` enum, `BusinessMembership.permissions[]`, `BusinessInvitation`
- Migration `20260908160000_stage_5m2_business_permissions`
- `BusinessAccessService`: `resolveAccess`, `assertOwner`, `assertBusinessPermission`; MANAGER granular access
- Field-level PATCH business authorization (profile vs hours)
- Team API: list / invite / update / revoke invitation
- Phone invitations: existing user → ACTIVE MANAGER; unknown → PENDING invite, claim on OTP login
- `GET /businesses/my`: `{ items: [{ business, access }] }` — OWNER + ACTIVE MANAGER
- Services wired: catalog, photos, promotions, reviews, analytics, export, ads, payments
- Shared types: `BusinessPermission` + RU labels
- Flutter: membership-based cabinet gate, permission-aware owner nav, tests
- Business Web: accessible-business gate, team UI «Сотрудники», permission nav, tests

**Инварианты**
- OWNER implicit all permissions; not stored
- Team management owner-only
- JWT без permissions
- Plan limits still server-side

**На будущее**
- Flutter owner team UI (optional P2)
- ~~Full AuditLog for team ops~~ → implemented in Stage 5M.3

---

## 2026-09-08 — Stage 5M.1: Business membership foundation

**Сделано**
- Prisma: `BusinessMembership` + enums `BusinessMembershipRole` / `BusinessMembershipStatus`
- Backfill: каждый `Business.ownerId != null` → ACTIVE OWNER membership
- `BusinessMembershipService` + dual-read в `BusinessAccessService`
- Создание бизнеса: транзакция ownerId + membership
- `GET /businesses/my`: legacy ownerId OR ACTIVE OWNER membership (dedupe)
- Seed: upsert membership для seeded owners
- Документация: `docs/architecture/business-membership.md`

**Инварианты**
- `UserRole` ≠ `BusinessMembershipRole`
- MANAGER в enum, но без прав в 5M.1
- JWT без membership claims

**На будущее (Stage 5M.2)**
- MANAGER permissions, invitations, team UI

---

## 2026-09-08 — Stage 5M.0: Authorization P0 hardening

**Сделано**
- `BusinessAccessService` — единая проверка ADMIN / CITY_ADMIN (managedCityId) / BUSINESS owner
- CITY_ADMIN scope на PATCH business, analytics/export, catalog, promotions, reviews reply, plans, uploads, monetization
- `POST /uploads` ограничен ролями BUSINESS / CITY_ADMIN / ADMIN
- AI: service token (`X-QalaGo-Service-Token`), proxy через catalog-api (`/ai/*`, `/admin/ai/*`)

**Инварианты**
- CITY_ADMIN не выходит за managedCityId
- Секрет сервиса не попадает в browser/mobile bundle

---

## 2026-09-08 — Stage 5L: RBAC & access control audit

**Сделано**
- Полный аудит текущих ролей, ownership, guards и client/server authorization
- Access matrix, gap matrix, migration strategy → `docs/stage-5l-rbac-audit.md`

**На будущее (Stage 5M)**
- BusinessMembership, fine-grained permissions, CITY_ADMIN scope fixes

---

## 2026-09-08 — Stage 5K.1: Flutter native analytics CSV share

**Сделано**
- Native Android/iOS: backend CSV → app temp file → system share sheet (`share_plus` + `path_provider`)
- Filename sanitization, temp cleanup, dismiss ≠ error UX
- Flutter Web regression preserved (browser download)

**На будущее**
- Optional native “save to Downloads” without share sheet (P2)

---

## 2026-09-08 — Stage 5K: VIP business analytics CSV export

**Сделано**
- `GET /analytics/business/:businessId/export` — VIP-only CSV from canonical dashboard builder
- Semicolon delimiter, UTF-8 BOM, formula-injection safe escaping
- Business Web + Flutter Owner: «Скачать CSV» with period selector

**На будущее**
- PDF export deferred; campaign analytics export deferred (P2)

---

## 2026-09-07 — Stage 5J: privacy-safe audience geography analytics

**Сделано**
- `AnalyticsEvent.audienceDistanceBucket` — coarse enum only (no raw GPS on server)
- Flutter computes bucket locally from actual user position + business coords; passive read (no new permission prompt)
- VIP dashboard: «Аудитория по расстоянию» with `MIN_AUDIENCE_GEOGRAPHY_SAMPLE = 10`
- Business Web + Flutter Owner parity; privacy explanation copy

**На будущее**
- Stage 6 remains deferred

---

## 2026-09-07 — DEV quick-login shortcuts for seed users

**Сделано**
- Flutter: панель «DEV: быстрый вход без SMS» на главной и экране входа (chips: Test User, Business Owner, Admin, City Admin)
- Admin Web + Business Web: кнопки быстрого dev-login на `/login`
- `start-all.ps1`: `DEV_LOGIN_ENABLED=true` для API, `NEXT_PUBLIC_QALAGO_DEV_LOGIN=true` для Admin/Business/Mobile

**На будущее**
- Убрать перед production; не включать флаги на staging/prod

---

## 2026-09-07 — Stage 5I: business search query analytics

**Сделано**
- `AnalyticsEvent.searchQuery` (nullable) on `VIEW_BUSINESS` when `trafficSource=SEARCH`
- Query normalization (trim, collapse spaces, lowercase, min 2 / max 100 chars)
- PREMIUM/VIP dashboard: top 10 queries, threshold count ≥ 3, `otherCount` bucket
- Flutter Search passes effective result-set query via `openBusiness(..., searchQuery:)`
- Business Web + Flutter owner: «По каким запросам вас находят»

**Privacy**
- Aggregate only; no user identity in owner API
- Low-frequency queries hidden below threshold (not exposed individually)

**DEFERRED**
- Audience geography analytics
- Query clustering / typo normalization

---

## 2026-09-07 — Stage 5H: real business traffic source attribution

**Сделано**
- `BusinessTrafficSource` enum on `AnalyticsEvent.trafficSource` (nullable, additive migration)
- `POST /analytics/events` accepts optional `trafficSource` on `VIEW_BUSINESS`
- PREMIUM/VIP dashboard aggregates organic `VIEW_BUSINESS` by source; legacy null → UNKNOWN
- Flutter consumer passes explicit source on every business-detail navigation
- Business Web + Flutter owner show «Источники просмотров» breakdown

**Semantics**
- One business open → one `VIEW_BUSINESS` with source metadata
- Paid ad tap: `AD_CARD_OPEN` (campaign) + `VIEW_BUSINESS source=AD` (business analytics) — not duplicate views
- `AD` in source breakdown = business opens from paid placements; campaign metrics remain separate

**DEFERRED**
- Search-query analytics (which search term)
- Consumer web attribution (enum ready for future web client)

---

## 2026-09-06 — Stage 5G.1: Flutter owner catalog pagination

**Сделано**
- Flutter Owner menu uses paginated `GET /service-menu/manage/:businessId/items`
- Server-side search, section filter, load-more (20/page), business switch reset
- Plan usage display from existing `businessPlanProvider`

**DEFERRED**
- Flutter owner full section CRUD (Business Web)

---

## 2026-09-06 — DEV login without SMS (development only)

**Сделано**
- `POST /auth/dev-login` — passwordless phone login when `DEV_LOGIN_ENABLED=true`; returns 404 when disabled
- Shared `completeLogin()` for OTP verify and DEV login (same JWT/session)
- Flutter: `QALAGO_DEV_LOGIN` dart-define + «Войти без SMS» button
- Business Web: `NEXT_PUBLIC_QALAGO_DEV_LOGIN` + equivalent button

**WARNING:** NEVER set `DEV_LOGIN_ENABLED=true` in production.

---

## 2026-09-06 — Stage 5G: scalable business catalog & gallery

**Сделано**
- Public `GET /businesses/:id` returns bounded previews (`galleryPreview`, `catalogPreview`, `promotionsPreview`, `reviewsPreview`) — fixed limits independent of plan
- New public endpoints: `GET /businesses/:id/catalog` (pagination, section filter, search), `GET /businesses/:id/photos` (pagination)
- Owner paginated management: `GET /service-menu/manage/:businessId/items`
- Catalog sections reuse `ServiceMenuGroup` + `ServiceItem.groupId` (nullable; delete group → SET NULL)
- Flutter consumer: detail previews, `/business/:id/catalog`, `/business/:id/photos`
- Business Web owner menu: pagination, search, section filter, group CRUD
- Flutter owner: section assignment on items (existing group dropdown)
- Backend regression tests for VIP-scale content vs bounded previews

**DEFERRED**
- Public consumer web (no app in repo) — backend contract ready
- Flutter owner full section CRUD (primary in Business Web)
- Thumbnail/CDN pipeline (document as P2 if absent)

**На будущее**
- Public web consumer catalog/gallery screens when consumer web app exists
- Optional catalog item detail / item-open analytics event

---

## 2026-09-06 — Stage 5F: business analytics parity (Web + Mobile Owner)

**Сделано**
- Backend: unified `GET /analytics/business/:id/dashboard` contract; plan entitlements as source of truth
- Tier windows: FREE/BASIC 30d, PREMIUM 90d, VIP 365d; locked metrics not returned in API
- FREE: views + daily view trend; BASIC+: customer actions; PREMIUM+: sources/conversion/comparison; VIP: popular times/benchmark/recommendations
- Business Web `/statistics`: tiered KPIs, locked sections, upgrade CTA → `/plan`, organic vs ad split
- Flutter Owner `/owner/analytics/:businessId`: same contract, drawer entry, business switch invalidation
- Tests: backend capabilities, web analytics-utils, Flutter owner analytics entitlement matrix

**Feature matrix (Stage 5F)**

| Feature | Backend | Web | Mobile |
|---------|---------|-----|--------|
| Views | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Actions | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| View/action trends | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Traffic sources | PARTIAL (deferred UI; no fake attribution) | IMPLEMENTED | IMPLEMENTED |
| Conversion | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Period comparison | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Popular times | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Category benchmark | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Recommendations | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| Search queries | DEFERRED | DEFERRED | DEFERRED |
| Audience geography | DEFERRED | DEFERRED | DEFERRED |
| Ad campaign analytics | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |

**Заложить на будущее**
- Referrer/source tracking on organic events for multi-source breakdown
- Search-query and service-level analytics when event schema supports them
- Report export (VIP, platform-appropriate)

---

## 2026-09-06 — Stage 5E: guest, auth & profile polish

**Сделано**
- Login: KZ phone normalization, production copy, resend cooldown, guest CTA, no demo OTP UI
- Safe login redirect validation (`sanitizeLoginRedirect`) — blocks open redirects
- Session: logout → `/home`, user-scoped provider invalidation, 401 → guest mode
- City across login: preserve session city, sync to profile on login
- Profile guest: city picker, help/about; profile/city works for guest + auth
- Help: removed dev/placeholder contacts; permissions test accounts debug-only

**Заложить на будущее (Stage 6)**
- Real production SMS provider integration
- OTP rate limiting on backend
- Legal/privacy documents in About

---

## 2026-09-06 — Stage 5D: promotions, favorites & map

**Сделано**
- `/promotions`: city-scoped active feed, real expiry labels, differentiated empty/error states, client-side active guard
- Favorites: filter by selected city (client-side on complete user list), real «Недавние»/«По названию» sort, three empty states, BusinessCard + remove sync
- Map: city-wide businesses (`mapBusinessesProvider`, limit 100), marker preview sheet with «Подробнее», GPS/city camera fallback, OSM attribution, error banner without hiding map
- Backend: favorites response includes `business.city` for city filtering
- Tests: consumer_discovery_utils + promotions/favorites/map widget tests

**Заложить на будущее**
- Server-side favorites `citySlug` filter if user lists grow large
- Map pagination beyond 100 markers per city
- Map clustering if marker density becomes unusable

---

## 2026-09-06 — Stage 5C: consumer business detail

**Сделано**
- Business Detail: IA reorder (identity → actions → description → promotions → menu → hours → contacts → mini-map → gallery → reviews)
- Safe URL helpers: phone, WhatsApp (KZ 8→7), website, Instagram, route (coords or address)
- WEBSITE_CLICK / INSTAGRAM_CLICK organic analytics (Prisma enum + Flutter tracking)
- VIEW_BUSINESS once-per-open via initState guard
- Open/closed badge from workHours + city timezone (Asia/Oral UTC+5); hours hidden when absent
- Promotions: active filter, expiry label, PROMOTION_VIEW on tap
- Gallery fullscreen viewer; mini-map (flutter_map, OSM)
- No plan tier badges; «Нет отзывов» instead of fake rating; owner edit only for own business
- Public detail enforces plan limits via existing backend findOne (photos/promotions/menu)

**Заложить на будуще**
- Full IANA timezone library for multi-city expansion beyond KZ UTC+5
- Favorites city filter (Stage 5A P1)
- Similar businesses / booking (Stage 5D+)

---

## 2026-09-06 — Stage 5B: consumer categories, search & filters

**Сделано**
- Categories screen: title, city context, local category-name filter, explicit «Поиск заведений» CTA
- Category businesses: city-wide organic list (removed hidden 3 km default); city in app bar and section subtitle
- Search: radius filter (3/5/10/15 km + «Весь город»), category chips with clear, active filter summary + reset
- Deep links: `/search?q=&categoryId=&radiusKm=`; whole city omits geo params
- Search uses `BusinessCard`; result count from API meta; differentiated empty/error states
- Paid CATEGORY_TOP / CATEGORY_BOOST dedupe preserved; organic sort unchanged (no plan tier)
- Deferred: open-now, rating, promotion filters (no reliable backend support)
- Consumer tests expanded (search filters, category dedupe, guest search widgets)

**Заложить на будущее**
- Backend openNow / minRating / hasPromotion filters
- Category business counts without N+1
- Search debounce cancellation on dispose edge cases

---

## 2026-09-06 — Stage 5A: guest-first consumer Home & discovery

**Сделано**
- Guest-first routing: browse Home, categories, map, search, business, promotions без JWT
- «Продолжить как гость» → `/home` без demo auto-login
- Auth gates: favorites, review submit, profile edit, notifications, owner/admin routes
- Guest profile и favorites с CTA «Войти»
- API config через `--dart-define` (`QALAGO_API_BASE_URL`, `QALAGO_AI_BASE_URL`, `QALAGO_DEV_HOST`)
- Home: organic «Рекомендуем» + paid «Продвигаемые места»; dedupe HOME_FEATURED из organic
- Удалены consumer TOP/VIP organic copy и plan badges на organic cards
- Search geo parity: `nearbySearchPositionProvider`
- Bottom nav: no false tab highlight on search/business/promotions
- COMING_SOON badge «Скоро» в city picker
- Consumer tests (45 total)

**Заложить на будущее**
- Anonymous organic analytics (backend auth policy)
- Home dedupe across VIP/promotions paid slots
- Favorites city filter for authed users

---

## 2026-09-06 — Stage 4E: business owner experience unification

**Сделано**
- Единая IA кабинета: Обзор, Мой бизнес, Товары и услуги, Акции, Реклама и продвижение, Статистика, Тариф, Настройки
- business-web: обновлён dashboard (лимиты тарифа, кампании, быстрые действия), `/statistics`, hub «Мой бизнес», метки фото over-limit, лимиты меню, FAQ без legacy Pro/TOP
- Flutter owner: drawer «Обзор» + «Реклама и продвижение», plan usage на dashboard, VIP disclaimer, единые RU labels кампаний
- `lib/owner-utils.ts` + тесты: plan usage, VIP/moderation copy, photo publish state

**Заложить на будущее**
- Отдельная глобальная аналитика бизнеса beyond `/analytics/business/:id/summary`
- Business switcher в Flutter sub-screens (URL-bound routes)

---

## 2026-09-06 — Stage 4B.2: VIP inventory reservation + order validation

**Сделано**
- `HOME_VIP_BANNER`: capacity учитывает `ACTIVE`, `SCHEDULED`, `PENDING_MODERATION` (paid VIP на модерации резервирует слот)
- Остальные placements: capacity без изменений (`ACTIVE`, `SCHEDULED`)
- Order creation: `creativeId` обязателен для direct `VIP_BANNER` и пакетов с VIP (`MAX`, `NEW_PLACE`); `START` / `BUSINESS` без creative
- Provisioning VIP: всегда проверка availability + owned creative; `CREATIVE_REQUIRED` / `CREATIVE_NOT_OWNED`
- REJECTED creative → campaign `REJECTED` → слот освобождается (без refund-логики)
- Serve без изменений: только `ACTIVE` + approved creative
- Тесты `stage-4b2-vip-inventory.spec.ts`; DEV E2E `scripts/stage-4b2-e2e.ts`

**Заложить на будущее**
- Явная политика resubmit после REJECTED (edit creative → повторная модерация vs новый заказ)

---

## 2026-09-06 — Stage 4D: business-web monetization UI

**Сделано**
- `apps/business-web`: полный owner-flow монетизации — обзор, каталог продуктов/пакетов, VIP-креатив, checkout (manual payment), заказы и кампании с analytics
- Расширен `ownerApi`: product/campaign/creative endpoints, типы `MonetizationOrder.campaigns`, campaign analytics
- `lib/monetization-utils.ts` + vitest: owner-facing RU labels, formatters, `packageHasVip`
- Навигация: footer «Реклама и продвижение» → `/monetization`; plan label → «Тариф»; CTA «Продвинуть акцию» на promotions
- Цены только через `POST /monetization/quote`; без fake payment success

**Заложить на будущее**
- Online payment provider (Kaspi/Stripe) в checkout
- Owner pause/resume campaigns (сейчас только admin)

---

## 2026-09-06 — Stage 4B.1: package VIP creative activation

**Сделано**
- Package orders принимают `creativeId` / `promotionId` / `desiredStartAt` в metadata
- VIP_BANNER в MAX/NEW_PLACE: `PENDING_MODERATION` до одобрения linked creative; остальные items активируются сразу
- Duration на approval из `PromotionPackageItem` (NEW_PLACE VIP 7d vs order 14d)
- Idempotency: повторный provision/payment confirm не дублирует кампании; повторный approve не сдвигает даты
- Flutter: package → VIP creative → confirm; notice + CTA для пакетов с VIP
- Admin: VIP campaign/order — creative, moderation, requested vs actual start

**Заложить на будущее**
- Post-payment creative link API (если pay-first без creativeId)
- VIP inventory reservation во время moderation (сейчас PENDING_MODERATION не резервирует слот)

---

## 2026-09-06 — Stage 4C.1: subscription / organic visibility cleanup

**Сделано**
- `recommended()` cold start: organic title order, no `isFeatured` filter
- Public `GET /businesses?featured=true` ignored (legacy param deprecated)
- AI orchestrator + ai-core: neutral recommendation reasons, organic fallback
- Flutter fallback: no `featured: true`, no isFeatured-based reason
- Plan activation regression tests (no isFeatured/featuredSlot/AdCampaign)
- Deprecated `isFeatured` / `featuredSlot` documented in schema + api-contracts
- PostgreSQL backup procedure: `docs/infra/postgresql-backup.md`

**Заложить на будущее**
- Stage 4B.1 unchanged

---

## 2026-09-06 — Stage 4C.1: preserve content on downgrade / expiry

**Сделано**
- Удалён `archiveExcessPromotions` — downgrade/expiry больше не меняет status акций
- Entitlement layer: public API ограничивает photos, service menu, promotions по текущему тарифу; DB records сохраняются
- `GET /businesses/:id`, public menu, promotion feed/list — server-side caps
- Optional JWT на `@Public` routes для owner bypass в promotion list
- Owner plan API/UI: `entitlements` (total / published / overLimitNotice) — Flutter + business-web
- Tests: `plan-downgrade-entitlements.spec.ts`, расширен `plan-entitlements.util.spec.ts`

**Заложить на будущее**
- Stage 4B.1 без изменений

---

## 2026-09-06 — Этап 4C: FREE / BASIC / PREMIUM / VIP subscriptions

**Сделано**
- Prisma migration `20260906000000_business_plan_tier_stage_4c`: safe enum swap BASIC→FREE, PRO→PREMIUM, TOP_CITY→VIP; default `FREE`
- `PlanLimitsService` / `PLAN_CATALOG` — единый backend source of truth (цены, лимиты, ad discounts 0/5/10/15%)
- Backend enforcement: photos, service items, active promotions; expiry paid → FREE
- Organic ranking plan-neutral (`compareBusinessCatalogRank` = title; geo = distance + title)
- Subscription activation no longer sets `isFeatured` / `featuredSlot`; city promotion feed decoupled from plan tier
- Analytics tiers: BASIC (7d summary), EXTENDED (30d + trends), FULL (365d + trends)
- Flutter owner plan UI (4 tiers), badges, VIP disclaimer; `business_rank.dart` plan-neutral
- Admin + business-web plan selectors updated; `packages/shared-types` plan DTOs
- DEV seed: `qa-plan-free/basic/premium/vip` businesses
- Tests: backend 122, Flutter 36, admin vitest 10

**Checkpoint**
- Tag: `checkpoint-stage-4c-pre-migration`
- Pre-migration counts: `services/catalog-api/scripts/stage-4c-pre-migration-counts.json`

**Заложить на будущее**
- Stage 4B.1: package VIP creative linking; real payments; price editor

---

**Сделано**
- `apps/admin-web` — раздел «Монетизация»: обзор, заказы, оплаты, кампании, креативы, placements
- Manual payment confirm с idempotency (`alreadyPaid`), VIP preview, campaign pause/resume/cancel
- Read-only каталог цен и пакетов на странице placements
- Backend (без schema): `GET /admin/monetization/creatives`, `GET /admin/monetization/placements`, enriched admin order/payment responses
- Vitest: `monetization-utils.test.ts` (labels, formatters, action matrix)

**Сохранено без изменений**
- Prisma schema, payment gateway, consumer Flutter, owner monetization flow

**Заложить на будущее**
- Stage 4C: price editor; backend filters for campaign status; audit trail; campaign analytics charts

---

## 2026-09-05 — Этап 4A: Business monetization UI (owner)

**Сделано**
- Owner flow: «Продвинуть бизнес» → products/packages → quote → order → campaigns → analytics
- `features/owner/monetization/` — models, labels, formatters, providers, 8 screens
- `CatalogRepository` — monetization API methods (products, quote, orders, campaigns, creatives)
- Dashboard CTA + «Мои продвижения»; plan screen link to monetization
- VIP creative editor + preview (`VipBannerAd.previewMode`)
- Business switcher invalidates monetization providers
- 12 monetization unit tests (29 total Flutter tests)

**Сохранено без изменений**
- Backend schema, Stage 3B consumer ads, organic API, legacy plan mock-checkout

**Заложить на будущее**
- Stage 4B admin payment confirm UI; widget tests for promote flow screens

---

## 2026-09-05 — Этап 3C: Flutter cross-platform build & QA prep

**Сделано**
- Environment audit: Flutter 3.41.7, Dart 3.11.5; Android SDK/JDK absent on audit machine
- `docs/mobile/ANDROID_BUILD.md` — SDK setup, API matrix, build commands, DEV localhost notes
- `docs/mobile/IOS_BUILD_CHECKLIST.md` — Mac/Xcode checklist (static audit only)
- Real HTTP smoke: all 5 ad placements + event POST against DEV backend
- `flutter clean` → analyze (0 errors) → test (17/17) → `flutter build web` OK
- Backend regression: 109 tests + monorepo build OK
- Minor fix: unused import in `test/ads/ad_models_test.dart`

**Заложить на будущее**
- Install Android Studio + SDK; run `flutter build apk --debug` on device/emulator
- Mac/Xcode iOS build verification; add `INTERNET` to main AndroidManifest before release
- DEV cleartext ATS/network config for Android/iOS physical devices
- `--dart-define` API URL for emulator (`10.0.2.2`) without code edits

---

## 2026-09-05 — Этап 3B: Flutter ad integration

**Сделано**
- Mobile: `features/ads/` — sessionId, serve providers, viewability tracker, VIP banner, sponsored business/promotion blocks
- Home: HOME_VIP_BANNER, HOME_PROMOTIONS, HOME_FEATURED (отдельно от organic)
- Category: CATEGORY_TOP, CATEGORY_BOOST + dedup organic list
- `CatalogRepository.serveAds` / `sendAdEvent` (best-effort, failure isolation)
- `BusinessCard.sponsored` optional label; `visibility_detector` for >=50%/1s impressions
- 16 Flutter tests (ads/)

**Сохранено без изменений**
- Organic `GET /businesses`, backend schema/API, admin/business web, go_router structure

**Заложить на будущее**
- Owner campaign analytics screen; widget tests for VIP/sponsored UI with demo seed

---

## 2026-09-05 — Этап 3A: ad serving, fair rotation, analytics

**Сделано**
- `AdRotationService` — fairSort по `qualifiedImpressions/weight`, tie-break hash(sessionId+campaignId+scope), CATEGORY_TOP position 1 через `lastTopPositionAt`
- `AdServingService` — `GET /monetization/ads/serve` (public), фильтры кампаний, AD_SERVED + servedCount
- `AdEventsService` — `POST /monetization/ads/events`, dedupe AD_IMPRESSION 30 мин, click/action counters
- `AdAnalyticsService` — CTR, action groupBy; owner + admin analytics endpoints
- `CampaignExpirationScheduler` — cron */5 min → COMPLETED
- In-memory rate limit guard (120 req/min/IP) для ad events
- `scripts/seed-monetization-demo.ts`, npm script `seed:monetization-demo`
- 34+ unit tests (rotation, serving, events, analytics, expiration)
- Docs: `MONETIZATION.md`, `api-contracts.md`

**Сохранено без изменений**
- `schema.prisma` (no migration), `GET /businesses`, `business-rank.util.ts`, Flutter/admin/business web

**Заложить на будущее**
- Flutter widgets, period-scoped aggregates from events, Redis optional upgrade

---

## 2026-09-05 — Этап 2: backend monetization core

**Сделано**
- NestJS module `src/modules/monetization/` — catalog, pricing, availability, orders, manual payments, campaign provisioning, creatives
- Public API: products, packages; owner API: quote, orders, campaigns, creatives
- Admin API: orders, payments (manual confirm), campaigns (pause/resume/cancel), creative moderation
- Pricing precedence (city/category/placement/global), legacy plan discounts (BASIC 0%, PRO 10%, TOP_CITY 15%)
- Package pricing without plan discount; idempotent manual payment confirm
- PostgreSQL advisory lock for placement race protection
- Seed: `PromotionPackageItem` for START/BUSINESS/MAX/NEW_PLACE, `PACKAGE` product
- 42 unit tests (pricing, orders, payments, campaigns, availability, RBAC)
- Docs: `docs/MONETIZATION.md`, `api-contracts.md`

**Сохранено без изменений**
- `PlanPayment`, mock checkout, `/plans`, `business-rank.util.ts`, schema (no new migration)

**Заложить на будущее**
- Этап 3: ad serving, fair rotation, impression/click analytics

---

## 2026-09-05 — Этап 1: campaign-based monetization schema (additive)

**Сделано**
- Новые модели: `AdPlacement`, `MonetizationProduct`, `ProductPrice`, `Order`, `OrderItem`, `Payment`, `AdCreative`, `AdCampaign`, `AdCampaignPlacement`, `PromotionPackage`, `PromotionPackageItem`
- `AnalyticsEvent`: nullable `campaignId`, `placementId`, `sessionId`; enum AD_* values
- Migration `20260905120000_monetization_campaign_architecture` (create-only, не применена автоматически)
- Seed catalog: placements, products, Uralsk prices, packages (`seed-monetization.ts`)

**Сохранено без изменений**
- `Business.planTier`, `planExpiresAt`, `isFeatured`, `featuredSlot`, `PlanPayment`, `PlanLimitsService`

**Заложить на будущее**
- Этап 2: backend services/API для orders/campaigns

---

**Причина**
- Дашборд owner фильтровал акции как `Map`, API возвращает `PromotionModel` → всегда «Нет активных акций»
- FitLife (Базовый тариф): акция на **карточке заведения**, но **не в ленте города** — это по тарифу

**Сделано**
- Исправлен `ownerDashboardProvider`, единые хелперы статуса/дат акций
- Подсказка: «Видна на карточке · не в ленте города (Базовый тариф)»

---

**Причина расхождения**
- Админка показывает **все статусы** (PENDING, ACTIVE, BLOCKED); публичный API — только **ACTIVE**
- Новые заведения от владельцев создаются как **PENDING** до кнопки «Одобрить»
- «Рядом с вами» и категории фильтруют **радиус 3 км** от GPS; если браузер дал координаты **далеко от выбранного города** — список пустой, хотя в админке заведения есть

**Сделано**
- Mobile: если GPS дальше 25 км от центра выбранного города — поиск от **центра города**
- Скрипт `npm run dev:api:sync` — активирует PENDING и проставляет координаты из центра города
- Admin: колонка **«Приложение»** — «В приложении» / «Не в приложении»
- Dev: `npm run dev:restart`, `scripts/dev/restart-all.ps1`, таблица портов в SETUP.md

---

**Сделано**
- Экран категории и блок **«Рядом с вами»** на главной: радиус **3 км** от точки пользователя (GPS или центр города)
- Три блока: **Топ города** → **VIP · Pro** → **Все остальные** (по расстоянию)
- На карточках показывается расстояние, если API вернул `distanceMeters`

**Заложить на будущее**
- Единый вид списка «рядом» на home / search / category

---

## 2026-09-04 — Сортировка каталога по тарифам

**Сделано**
- `GET /businesses`: порядок TOP → PRO → BASIC (с учётом `planExpiresAt`, `featuredSlot`)
- Geo-поиск: сначала тариф, затем расстояние внутри одного tier
- `GET /businesses/recommended/me` — та же сортировка
- Mobile: бейджи **Топ** (TOP_CITY) и **VIP** (PRO)

**Заложить на будущее**
- Денormalized `catalogRank` в БД для больших городов

---

## 2026-09-04 — Mobile owner cabinet parity with business-web

**Сделано**
- Дашборд владельца: KPI за 7 дней, график просмотров, % профиля, тариф, активные акции
- Экраны: `/owner/plan`, `/owner/messages`, `/owner/settings`, `/owner/help`
- Боковое меню кабинета (как навигация business-web)
- Лимиты тарифа в галерее и акциях (как на web)
- API в mobile: `fetchPlans`, `fetchBusinessPlan`, `mockPlanCheckout`

**Заложить на будущее**
- Push-дублирование in-app сообщений
- Видео в галерее

---

## 2026-09-04 — Выбор типа аккаунта при регистрации

**Сделано**
- `POST /auth/verify-code`: опциональный `accountType` (`user` | `business`)
- Новый пользователь получает роль `USER` или `BUSINESS`; существующий `USER` может апгрейдиться до `BUSINESS`
- Mobile: выбор «Пользователь / Бизнес» на экране входа; после входа бизнес → `/owner`
- Business-web: выбор типа на странице логина (по умолчанию «Бизнес»)

**Заложить на будущее**
- Отдельный onboarding для бизнеса без заведения (сразу на форму регистрации)

---

## 2026-09-04 — Phase 2: launchStatus городов + уведомления тарифов

**Сделано**
- `City.launchStatus`: `COMING_SOON` | `LIVE` — admin UI, API cities
- Mobile: другой текст заглушки для городов «скоро откроется»
- In-app уведомления: `PLAN_ACTIVATED`, `PLAN_EXPIRED` при подключении и истечении тарифа
- FAQ по тарифам в business-web «Помощь»

**Заложить на будущее**
- Push (FCM) дублирует in-app уведомления
- Авто-перевод города в LIVE при N заведениях

---

## 2026-09-04 — Тарифы для бизнеса (Basic / Pro / Топ города)

**Сделано**
- Тарифы в БД: `Business.planTier`, `planExpiresAt`, история `PlanPayment` (mock)
- Каталог тарифов и лимиты в `PlanLimitsService`
- API: `GET /plans`, `GET /businesses/:id/plan`, `POST /businesses/:id/plan/mock-checkout`
- Ограничения: фото, активные акции, глубина аналитики, акции в городской ленте
- После mock-оплаты: VIP (`isFeatured`), слот топа для «Топ города»
- Business-web: страница тарифов с кнопкой «Подключить (тест)», дашборд показывает текущий план
- Admin-web: колонка «Тариф», назначение через `PATCH /admin/businesses/:id/plan`
- Автодаунгрейд истёкшего тарифа; лимит фото на странице «Фото» в кабинете
- Инструкция по тарифам: `docs/product/business-tariffs.md`
- Уточнённые лимиты акций: срок, лента, антиспам; даунгрейд лишних акций в DRAFT

**Лимиты**

| | Базовый | Pro | Топ города |
|---|---------|-----|------------|
| Цена | 0 | 9 900 ₸/30 дн. | 19 900 ₸/30 дн. |
| Фото | 5 | ∞ | ∞ |
| Активные акции | 1 | 5 | 10 |
| В ленте города одновременно | 0 | 2 | 5 |
| Срок одной акции | 14 дн. | 90 дн. | 90 дн. |
| Новых акций в день | 1 | 3 | 5 |
| Аналитика | 7 дней | 90 дней | 90 дней |
| VIP в выдаче | нет | да | да |
| Слот «топ города» | нет | нет | да |

**Заложить на будущее**
- Реальная оплата (Kaspi / карта) и webhooks
- Cron даунгрейда при истечении + push-уведомление владельцу
- Лимиты меню/услуг, AI-описания для Top

---

## 2026-09-04 — Mobile: синхронизация города на карте

**Сделано**
- Шапка карты (CityPill) всегда видна и обновляется при смене города
- Карта перелетает к координатам выбранного города (`centerLat/centerLng` из API)
- `CityState` хранит координаты центра; picker передаёт их при выборе
- Единый `invalidateCityScopedProviders` при смене города

---

## 2026-09-04 — Mobile: экран «пустой город»

**Сделано**
- Виджет `EmptyCityView` — «{город} скоро в QalaGo»
- Кнопки: **Выбрать другой город** и **Добавить заведение**
- Показывается на **Главной**, **Категории** и **Карте**, если в городе 0 активных заведений
- Провайдер `cityCatalogTotalProvider` — лёгкая проверка через `meta.total`

**Заложить на будущее**
- Порог «мало контента» (например < 5 заведений) — мягкая подсказка вместо полной заглушки
- Push/email «город запущен» пользователям, выбравшим город заранее
- Admin-флаг `launchStatus: coming_soon | live` вместо только подсчёта бизнесов

---

## 2026-09-04 — Bootstrap категорий + скрытие per-city

**Сделано**
- При `POST /admin/cities` — автокопирование порядка категорий из Уральска
- `CategoryCityOrder.isHidden` — скрыть категорию только в одном городе
- API: `PATCH /admin/categories/:id/city-visibility`
- Admin-web: кнопка «Скрыть/Показать» в категориях; проверка дубликата slug при создании города
- Mobile получает уже отфильтрованный список через `GET /categories?citySlug=`

**Заложить на будущее**
- Копировать порядок из выбранного города (не только uralsk)
- Drag-and-drop сортировка категорий
- Экран «скоро откроем» для пустого города без заведений

---

## 2026-09-04 — Admin: автоподсказки города + координаты

**Сделано**
- API: `GET /admin/geo/search?q=` — geocoding через OpenStreetMap (Nominatim), только ADMIN
- Admin-web: при вводе названия города — выпадающий список подсказок
- При выборе автозаполняются: название, slug, широта, долгота, timezone

**Заложить на будущее**
- Кэш geocoding-ответов на backend (rate limit Nominatim: 1 req/s)
- Платный fallback: Google Places / 2GIS для точности по KZ
- Карта-превью выбранной точки перед сохранением
- Валидация: город уже существует в БД → предупреждение до POST

---

## 2026-09-04 — Admin: управление городами

**Сделано**
- API: `GET/POST /admin/cities`, `PATCH /admin/cities/:id` (только роль **ADMIN**)
- Admin-web: вкладка **«Города»** — форма создания, список, активация/скрытие
- Поля города: `slug`, `nameRu`, `nameKk`, координаты центра, `timezone`, `isActive`
- Автоподсказка slug из названия (транслит)
- Контракт: `docs/architecture/api-contracts.md`, RBAC обновлён

**Заложить на будущее (города)**
| Тема | Зачем |
|------|--------|
| **Bootstrap контента** | При создании города — seed категорий-порядка, demo-бизнесы, VIP-слоты |
| **CITY_ADMIN при запуске** | Wizard: создать город → назначить модератора → checklist перед `isActive` |
| **Границы города** | GeoJSON полигон / `radiusKm` для карты и фильтра «рядом» |
| **Feature flags per city** | Бронирование, доставка, акции — включать по городам |
| **Локализация** | Обязательный `nameKk`, контент на kk для App Store / законодательства |
| **Аналитика** | Дашборд KPI отдельно по городу, воронка запуска |
| **Юридическое** | Оферта, реквизиты, support-контакты per city |
| **Кэш/CDN** | Инвалидация списка городов в mobile/web после POST/PATCH |
| **Миграция slug** | Запретить смену slug после запуска или soft-redirect старых ссылок |
| **Очередь модерации** | Пустой город: UX «скоро откроем» vs полный каталог |

---

## 2026-09-04 — Порядок категорий per-city

**Сделано**
- Таблица `CategoryCityOrder`, API `GET /categories?citySlug=`, admin city-order
- Admin-web: порядок категорий для выбранного города
- Mobile: категории запрашиваются с `citySlug` текущего города

**Заложить на будущее**
- Скрытие категории в конкретном городе (`isVisible` в `CategoryCityOrder`)
- Drag-and-drop сортировка в admin-web
- Копирование порядка из другого города

---

## 2026-09-03 — Admin-web polish + mobile UX

**Сделано**
- Admin shell, KPI, pagination, VIP slots, category inline edit, CITY_ADMIN scope
- Mobile: city picker, owner reviews, search, promotions filters
- Business-web: settings, register, brand theme

**Заложить на будущее**
- Admin-web: split на отдельные routes вместо одной dashboard-страницы
- Geocoding при создании бизнеса (lat/lng из адреса)

---

## Как добавлять записи

```markdown
## YYYY-MM-DD — Краткий заголовок

**Сделано**
- ...

**Заложить на будущее**
- ...
```

Обязательно при каждой заметной фиче (см. `AGENTS.md`).
