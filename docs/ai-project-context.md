# QalaGo — AI / developer current-state context

**Purpose:** concise handoff for ChatGPT/Cursor sessions. **History:** `docs/changelog.md`. **Rules:** `AGENTS.md`.

**Mandatory read before work:** `AGENTS.md` → this file → relevant `docs/architecture/*` → recent `docs/changelog.md` → `git rev-parse HEAD` + `git status`.

## Current stage (handoff snapshot)

| Field | Value |
|-------|--------|
| **Kazakhstan compliance** | **KZ-C.0 PASS — COMPLIANCE CONTRACT LOCKED** — **`docs/architecture/kazakhstan-compliance-contract.md`** (docs only; **not** legal approval / **not** production compliant). Audit baseline **`9b6b55a…`**. |
| **Last completed architecture decision gate** | **FUTURE EXTENSIBILITY ARCHITECTURE GATE — AGREED / DOCUMENTED** — **`docs/architecture/future-extensibility-contracts.md`** |
| **F.4** | **CLOSED / PASS — PUBLIC BUSINESS PAGES FINALIZED** (Phases **0.1** → **2.1** + physical QA — **`docs/changelog.md`**) |
| **F.5** | **CLOSED / PASS — LOCALE SEO URL ARCHITECTURE IMPLEMENTED AND VERIFIED** (Phases **0**, **1** + **1.1–1.4**, **2**, PublicShell hotfix — **`docs/changelog.md`** umbrella entry **2026-09-27**). Non-blocking deferred: legacy **`/businesses/{id}`** / real **`locationId`** manual QA gaps; **`<html lang>`** on soft nav (not verified). |
| **F.6** | **CLOSED / PASS — DEEP LINKS ARCHITECTURE FINALIZED** (Phases **0–6**). Production Verified App Links / Universal Links: **external verification debt** (not claimed). |
| **F.7** | **CLOSED / PASS — LEGAL MIGRATION FINALIZED** (**F.7 PASS — LEGAL MIGRATION FINALIZED**). Contract: **`docs/architecture/public-consumer-web.md`** § **F.7**. Implementation checkpoint **`30ab33f033a6dca52dd57c90e263559081b08a98`**; umbrella closure docs at git log after **`ece46c26…`**. |
| **F.4 implementation SHA** | `52dfe1c4c32a906c964ee3e34470a511864faa84` (Phase 2); hotfix `678cb23a8e9004aa9be3aea170affaad68eb045e` |
| **F.4 Phase 1 backend SHA** | `3bcd5cac785c5fbc9c5b5f623c96359645cf1854` |
| **Last completed architecture contour** | **6.12A PASS — BUSINESSLOCATION ARCHITECTURE FINALIZED** (umbrella — see **`docs/changelog.md`** entry **2026-09-27**) |
| **6.12A.9.4.5E docs closure (canonical checkpoint)** | `657cfc6f1ccad2cf469d0030ade0e0d9aab5146b` |
| **A.9.4.5D3 implementation SHA** | `7a153cdf497c711c3aeda2b60cc72588f50d7859` |
| **A.9.4.5D1 implementation SHA** | `ffeffdc3d844a183e31f46d5f776c4b49e047209` (unchanged) |
| **A.9.4.5D2 docs SHA** | `db82561a1dc101c1420a099a84ddb7547563f40d` |
| **5D pre-migration gate baseline** | `d7b039dd00d062d20622b8d24420194277afc7d8` |
| **A.9.4.5C implementation SHA** | `e661f0bc50bdc363efd50865510c4a90c9d270af` |
| **A.9.4.5B implementation SHA** | `f459acd742f13b7406ef1ddc8be0da0408754a3d` |
| **A.9.4.5 audit baseline** | `d34dc7071d12f0294371a6cde1b2258739d3406a` |
| **A.9.4.5A implementation SHA** | `a47c67268b4faddb1b15179b65c15efe9cfeb514` |
| **A.9.4.3D docs closure** | `75d58f6bb477a0a295029a867fd225989544c172` — physical QA finalized |
| **A.9.4.3C implementation SHA** | `91284804547a78c1b4b6521ffe648e63508c2fe9` |
| **A.9.4.3B implementation SHA** | `cde02e6d0faee3b5b6831ba479d6f4dcdff14b17` |
| **A.9.4.3A implementation SHA** | `51e0b5bb502930ff43adf0e7f875b95137a12ae4` |
| **A.9.4.2B implementation SHA** | `07e0a8cdc41c72f53821e57ed892337f5d886f05` |
| **A.9.4.2A implementation SHA** | `7909260e0b9c1a99fdb2fb0455d1e5a532d5c8bd` |
| **A.9.4.4A implementation SHA** | `cc7c0beead14b980a8e9db11c8346ca5eeea7141` |
| **A.9.4.4B implementation SHA** | `34032806ae08db5868c1a8d8fb78d31d95f8ebac` |
| **A.9.4.4C1 implementation SHA** | `80f678a9584f2614c1aaf029e56183c48315f1bb` |
| **A.9.4.4C2 implementation SHA** | `10c767d272e0033b25fdc93938e62727f9f89beb` |
| **A.9.4.4C3 implementation SHA** | `a78ff95457c10e7e31ccce846906e91a1b99f670` |
| **Last completed substage (cityId track)** | **6.12A.9.4.5 PASS** — **`Business.cityId`** retirement (**5A–5E**); **5E** physical/manual QA closed |
| **Last product implementation (6.12A)** | **6.12A.9.4.5D1** `ffeffdc3…` (column retirement); **5D2** dev DB; **5D3** `7a153cdf…` regression/fixtures; **5E** QA-only (no product diff) |
| **A.9.4.4C4A implementation SHA** | `90cd95b89f0f72751df517c90a9785962a944024` |
| **A.9.4.4C4B docs SHA** | `713a53f8ad9f40f5acb622c76f60017f887b7b27` |
| **Prior** | **6.12A.9.4.2 PASS** (invariants + **2E** physical QA); **6.12A.9.4.1** city context |
| **A.9.4.2C** | **NOT REQUIRED** (2A/2B + physical QA sufficient; no new gap) |
| **Physical QA pending (6.12A)** | **None** — contour closed (**5E** finalized) |
| **Flutter Web disposition** | **PASS — DEV/QA ONLY** (Option **B**); see **`docs/changelog.md`** |
| **Public help** | **CLOSED / PASS — PUBLIC HELP FINALIZED** — Consumer Web guest **`/help`**; hotfix **`08b5340…`**; physical QA **PASS** (**2026-09-28**); Business Web **`/help`** = authenticated owner only |
| **F.8** | **CLOSED / PASS — SOCIAL PREVIEW / OG IMAGE PIPELINE FINALIZED** — **`docs/architecture/public-consumer-web.md`** § **F.8**; implementation checkpoint **`4ab630c…`** (+ docs closure after); local physical QA **PASS** (**2026-09-28**, **localhost:3005**) |
| **F.8 external debt** | **Public HTTPS social crawler previews** (Telegram/WhatsApp/Facebook/X on **`qalago.kz`**) — **NOT VERIFIED**; trusted **`/uploads/…`** Business cover — **NOT OBSERVED** physically (automated PASS) |
| **KZ-C.1B** | **PASS — FLUTTER KK-FIRST IMPLEMENTED** — device locale/persistence/glyphs/catalog LAN **PASS** — **`docs/changelog.md`** |
| **KZ-C.1C** | **PASS — CONSUMER + BUSINESS WEB KK-FIRST IMPLEMENTED** — browser KK-first/switch/persistence **PASS**; **x-default RU** unchanged — **`docs/changelog.md`** |
| **KZ-C.1F** | **PASS — NOTIFICATION / FCM PHYSICAL QA VERIFIED** — **SM-J610FN** Android 10; PushDevice + live FCM foreground/background/recents-swipe; KK/RU push shade; inbox + tap/deep-link; fixture phone lookup **`be5f880`** — **`docs/changelog.md`** KZ-C.1B entry |
| **KZ-C.1E** | **PASS — KAZAKH-FIRST AUTOMATED REGRESSION GATE** |
| **KZ-C.1 (umbrella)** | **CLOSED / PASS — KAZAKH-FIRST + NOTIFICATIONS PHYSICAL QA VERIFIED** |
| **AOP.0** | **PASS — ADMIN CATALOG / OPERATIONS CONTRACT LOCKED** — **`docs/architecture/admin-catalog-operations.md`** |
| **AOP.1** | **PASS — BACKEND ADMIN CATALOG CORE** — `POST/GET/PATCH` **`/api/v1/admin/businesses*`** |
| **AOP.2** | **PASS — ADMIN BUSINESS MANAGEMENT UI** — **`/catalog/businesses`** (list/detail/create/catalog edit) |
| **AOP.3** | **PASS — ADMIN BUSINESSLOCATION MANAGEMENT** — detail **Locations** CRUD + set-primary |
| **AOP.4** | **PASS — ADMIN CATALOG RBAC / CITY SCOPE ENFORCED** |
| **AOP.5** | **PASS — ADMIN CATALOG AUDIT / LIFECYCLE INTEGRATED** — audit matrix **§5.4**; catalog detail taxonomy + lifecycle UX |
| **AOP.6** | **PASS — ADMIN CATALOG FULL AUTOMATED REGRESSION VERIFIED** — AOP.0–5 integrated gate |
| **AOP.7H** | **PASS — ADMIN HIERARCHY / DEV LOGIN HARDENED** — SUPER→ADMIN→CITY_ADMIN; lifecycle **PRIMARY-city**; featured/plan **SUPER+ADMIN**; DEV login UI gated; audit nav **`AUDIT_VIEW`** |
| **AOP.7H.1** | **PASS — CITY_ADMIN LOCATION UI ALIGNED WITH BACKEND RBAC** (superseded for scope resolution by **7H.2**) |
| **AOP.7H.2** | **PASS — ADMIN WEB CAPABILITY MATRIX ALIGNED** — decoupled brand vs location capabilities |
| **AOP.7H.3** | **PASS — ADMIN AUTH REFRESH PRESERVES STAFF SCOPE** — `/users/me` after refresh |
| **AOP.7** | **PASS — ADMIN WEB PHYSICAL QA VERIFIED** — manual QA on **`aop7-test-cafe`**; F5 stable for SUPER/ADMIN/CITY_ADMIN |
| **AOP (umbrella)** | **PASS — ADMIN CATALOG / OPERATIONS PLANE FINALIZED** — **AOP.0–AOP.7** complete |
| **Admin hotfix** | **Business managers UI (OWNER→MANAGER in catalog) TEMPORARILY OFF** — **`NEXT_PUBLIC_QALAGO_ADMIN_BUSINESS_TEAM`** default unset/false (compile-time Admin catalog gate; **orthogonal** to runtime **`businessTeamEnabled`**) |
| **BIZ.9 HOTFIX 5B** | **IMPLEMENTED (automated PASS)** — global runtime **`businessTeamEnabled`** (default OFF, SUPER_ADMIN PATCH, **`GET /platform-features`**); Team UI/API fail-closed when OFF; checkpoint **`53cc9c4`** |
| **BIZ.9 HOTFIX 6** | **IMPLEMENTED** — Admin Web F5 session restore (single-flight refresh bootstrap); checkpoint **`a58d3f0`** |
| **BIZ.9 HOTFIX 7B** | **CLOSED / PASS** — isolated Admin/Business refresh cookies + BFF namespaces; physical multi-app QA verified; checkpoint **`edd39e5`** (+ docs **`283c7e0`**) |
| **BIZ.0** | **PASS — BUSINESS WEB / OWNERSHIP READ-ONLY AUDIT** (transcript; no docs commit) |
| **BIZ.1** | **PASS — OWNERSHIP / CLAIM CONTRACT FINALIZED** — **`docs/architecture/business-web-ownership.md`** + claim hardening |
| **BIZ.2** | **PASS — BUSINESS WEB SESSION / CABINET ACCESS HARDENED** — canonical `/users/me` after refresh; membership-only cabinet gate; business selection hardening |
| **BIZ.3** | **PASS — BUSINESS TEAM / MANAGER ACCESS FINALIZED** — permission matrix documented; email invite identity binding; team tests |
| **BIZ.4** | **PASS — BUSINESS PROFILE / LOCATION MODEL CANONICALIZED** — Business Web BL-only physical writes; primary read from locations |
| **BIZ.5** | **PASS — BUSINESS CONTENT / PLAN LIMITS HARDENED** — menu/media/promotions matrix; service item create plan gate |
| **BIZ.6** | **PASS — OWNER REVIEWS / BUSINESS NOTIFICATIONS HARDENED** — manage review list; inbox navigation; reply/notification tests |
| **BIZ.7** | **PASS — BUSINESS PLANS / ENTITLEMENTS / BILLING CONTRACT HARDENED** — plan matrix §18; plan payments list; billing access tests |
| **BIZ.8** | **PASS — BUSINESS OWNER PLANE SECURITY REGRESSION CLEAN** — IDOR/membership regression suite; no CRITICAL/HIGH findings |
| **BIZ.9** | **CLOSED / PASS — PHYSICAL QA VERIFIED** (**2026-09-30**) — HOTFIX 1–7B; owner/manager matrix; platform Team rollout; multi-app auth |
| **BIZ (track)** | **CLOSED / PASS — BUSINESS OWNER PLANE FINALIZED** — **BIZ.0–BIZ.9** complete |
| **UXA.0** | **PASS — READ-ONLY AUDIT** (Admin + Business Web baseline) |
| **UXA.1** | **PASS — BACKOFFICE DESIGN SYSTEM FOUNDATION** — checkpoint **`78ecea0`**; `packages/brand/qalago-theme.css` + `backoffice-primitives.css` |
| **UXA.2** | **PASS — BACKOFFICE SHELL / NAVIGATION UNIFIED** — checkpoint **`ed1c9ff`**; `backoffice-shell.css`, Admin authenticated areas in `AdminShell`, mobile drawer @960px |
| **UXA.3** | **PASS — QALAGO BACKOFFICE ICON SYSTEM** — checkpoint **`03e6e17`**; `@qalago/brand/icons`; SVG `currentColor` nav/shell; no emoji in authenticated shell/nav |
| **UXA.9** | **PASS — BACKOFFICE SYSTEM STATES STANDARDIZED** — checkpoint **`5774f0f`**; `@qalago/brand/states`; inline alerts; access vs feature unavailable |
| **UXA.7** | **PASS — STATUS / BADGES / CONFIRMATIONS STANDARDIZED** — checkpoint **`49265c4`**; `@qalago/brand/badges`, `status`, `confirm`; audit/staff enum humanization; representative confirm migrations |
| **UXA.4** | **PASS — TABLES / FILTERS / SEARCH STANDARDIZED** — checkpoint **`b608444`**; `@qalago/brand/tables`; representative Admin/Business list migrations |
| **UXA.5** | **PASS — BACKOFFICE FORMS STANDARDIZED** — `@qalago/brand/forms`; field/controls/sections/switch; representative Admin/Business form migrations; dirty guard on settings/profile |
| **UXA.6** | **PASS — BUSINESS LOCATION / GEO UX STANDARDIZED** — `@qalago/brand/locations`; branch cards; Business locations + Admin CatalogLocationsManager; map UX polish |
| **UXA.8** | **PASS — DASHBOARDS / CARDS / STATISTICS STANDARDIZED** — `@qalago/brand/dashboards`; KPI hierarchy; Business `/dashboard` partial failure; representative Admin/Business statistics surfaces |
| **UXA.10** | **PASS — BACKOFFICE RESPONSIVE LAYOUT STANDARDIZED** — `backoffice-responsive.css`; shell ≤960 drawer; KPI/table/form/chart/modal responsive contracts |
| **UXA.11** | **PASS — BACKOFFICE ACCESSIBILITY STANDARDIZED** — checkpoint **`76ee055`**; `backoffice-a11y.css`, `@qalago/brand/accessibility`; skip link; drawer inert/focus; static a11y contracts (**WCAG cert / SR QA deferred UXA.13**) |
| **UXA.12** | **PASS — RU/KK VISUAL LOCALIZATION QA COMPLETED** — checkpoint **`298c327`**; `owner-visual-copy.ts`, `backoffice-i18n.css`; parity/hardcoded guards (**physical visual QA UXA.13**) |
| **UXA.13** | **PASS — BACKOFFICE PHYSICAL BROWSER QA VERIFIED** — SUPER `+77473850274`, CITY_ADMIN Uralsk, OWNER/MANAGER matrix, team flag OFF/ON, RU↔KK F5, representative overflow/keyboard/drawer; **`/messages`** hooks fix |
| **UXA (track)** | **CLOSED — BACKOFFICE UX / UI SYSTEM FINALIZED** (checkpoints: fix + docs commits after **`cd712af`**) |
| **Future-ready platform** | **DOCUMENTED** — **`docs/architecture/future-ready-platform.md`** (planning only; **SCALE not started**) |
| **SCALE (track)** | **PLANNED** — **SCALE.0–SCALE.12 not started**; see future-ready doc §70 |
| **CW.1** | **PASS — CONSUMER WEB PRODUCT SCOPE LOCKED** — **Option B (guest + richer discovery)** — **`docs/architecture/public-consumer-web.md`** § **CW** |
| **CW.2** | **CLOSED — PUBLIC UI FOUNDATION** (incl. **CW.2A** closure verification) |
| **CW.3** | **CLOSED — BACKEND-CONTROLLED HOME SYSTEM** (incl. **CW.3A** DB invariants + closure verification) |
| **CW.4** | **CLOSED — DISCOVERY HOME** (incl. **CW.4A** closure verification) |
| **CW.5** | **CLOSED — BUSINESS DETAIL COMPLETION** (+ **CW.5A** live browser closure verified **2026-10-02**) — **`public-consumer-web.md`** § **CW.5** |
| **CW.6** | **CLOSED — WEB ADS + ANALYTICS** — **`public-consumer-web.md`** § **CW.6** |
| **CW (track)** | **ACTIVE** — **CW.1–CW.6 CLOSED** · **CW.7–CW.8 NOT STARTED** · F.4–F.8 **remain CLOSED** |
| **Roadmap (product UI)** | **AOP = CLOSED** · **BIZ = CLOSED** · **UXA = CLOSED** · **CW ACTIVE** · Mobile UI/UX after CW · production/security/pre-VPS · **SCALE** later |
| **Next** | **CW.7** — Promotions discovery page (**no UXA.14**; **KZ-C.2+** not started) |

**F.4 (closed):** Canonical **`/{citySlug}/business/{businessSlug}`** (+ optional **`?locationId=`**); slug API **`GET /businesses/by-slug/:businessSlug?citySlug=`**; legacy **`/businesses/{id}`** → permanent redirect; SEO canonical/sitemap exclude query; multi-city one URL per city membership — contracts in **`future-extensibility-contracts.md`** § Contract 1 + **`public-consumer-web.md`**.

**Future extensibility gate:** **AGREED / DOCUMENTED** — public URL + **NavigationTarget**, F.4 typed showcase, Event/Promotion + editorial boundaries, config split, lifecycle/media/favorites/notification/analytics/API rules — details in **`docs/architecture/future-extensibility-contracts.md`**. **No product implementation** in this gate.

**6.12A state:** **CLOSED** — BusinessLocation architecture finalized (**A.1–A.9.4.5E**). **Business** = brand; **BusinessLocation** = sole physical/city authority; retired **Business** physical columns including **`cityId`**; contact defaults on **Business** per policy. Grains and RBAC per **`docs/changelog.md`** umbrella entry **2026-09-27**. Dev **`qalago_dev`** baseline: **109 Business / 110 BL / 109 primary**; integrity PASS; migrations **47/47**. Pre-5D2 backup preserved: `infra/local-backups/qalago_dev_native_pg18_pre_5d2_business_cityid_retirement_20260926T131630Z.dump` (596125 bytes; uncommitted). **`a945e-*`** helpers remain local/untracked.

**F.5:** **CLOSED / PASS** — locale SEO URL architecture implemented and verified (routing, SEO, PublicShell URL-locale UI). Milestone: **F.5 PASS — LOCALE SEO URL ARCHITECTURE IMPLEMENTED AND VERIFIED**. Non-blocking: **`<html lang>`** vs URL on soft nav (not verified); Phase **1** manual QA gaps (legacy redirect, **`locationId`** UI). No backend change.

**Consumer Web F-series (canonical order):** F.5 **CLOSED** → **F.6 CLOSED / PASS** → **F.7 CLOSED / PASS** → **F.8 CLOSED / PASS** — **`docs/architecture/public-consumer-web.md`** § **F.8**.

**F.6 (closed):** Canonical HTTPS → parser → coordinator → session city / locale → go_router; Web `/.well-known`; Android/iOS configured. **Production** association verification deferred (Play SHA / Apple Team ID / device QA). Android release debug signing remains general release debt.

**F.7 (closed):** **Canonical public legal host:** Consumer Web / **`qalago.kz`**. **Paths:** locale-neutral **`/privacy`**, **`/terms`**, **`/account-deletion`**. **Business Web:** legacy legal routes redirect to Consumer Web. **Localization:** RU/KK QalaGo chrome; **Russian** source-language legal body until approved translation (no machine translation). **SEO:** self-canonical legal pages; index/follow; no legal RU/KK hreflang; one sitemap entry per legal page. **Physical QA:** PASS (**2026-09-28**). **External legal/content debt:** **`docs/legal-review-required.md`** — does **not** reopen technical F.7.

**F.8 (closed):** Static fallback **`/og/qalago-default.png`**; trusted Business **`coverImageUrl`** (`/uploads/…` only); **F.8.0–F.8.4** automated gates; **F.8.5** local physical browser QA **PASS**. **External:** public HTTPS crawler previews **NOT VERIFIED**; physical trusted **`/uploads/`** Business cover **NOT OBSERVED** (dataset gap).

## Kazakhstan compliance (KZ-C)

**Contract:** **`docs/architecture/kazakhstan-compliance-contract.md`**. **KZ-COMPLIANCE.0** read-only audit PASS; **KZ-C.0** locks target architecture (**no implementation** in KZ-C.0).

| Topic | Contract (summary) |
|-------|-------------------|
| **KK-first** | **QALAGO PRODUCT POLICY (P0 before public launch):** no saved language → **kk**; explicit user choice **wins forever**; Russian fully supported. **Flutter IMPLEMENTED (KZ-C.1B)**; **Consumer + Business Web IMPLEMENTED (KZ-C.1C)**; **Notifications typed push + Business Web inbox IMPLEMENTED (KZ-C.1D.2)** + **FCM physical QA VERIFIED (KZ-C.1F / KZ-C.1B closure)** on **SM-J610FN**; Flutter in-app ARB unchanged (E.3). Physical APK dev host: **`QALAGO_DEV_HOST=192.168.8.101`**. **iOS push physical QA deferred** (mobile-release). |
| **Operator** | **`OPERATOR_IDENTITY = PENDING BUSINESS DECISION`** — P0 **production** blocker for legal publication; **not** internal dev blocker. |
| **Legal KK/RU** | Target: **approved** KK + RU where applicable; no uncontrolled MT as final legal text. **Current:** RU draft bodies on Consumer Web (F.7). |
| **Legal source of truth** | **Backend `LegalDocument`** = version authority for tracked docs; **Consumer Web** = public presentation (F.7 neutral URLs); **`LegalAcceptance`** = proof — **clients not wired yet** (KZ-C.2). |
| **Providers / location** | Production **register** required; UNKNOWN dev OK; UNKNOWN prod PD systems **not** OK — **KZ-C.7** gate. |
| **Public DTO privacy** | **`Business.ownerId`** must be removed/minimized pre-production (**P0**, KZ-C.3); review **`user.id`** in public previews lower priority unless escalated. |
| **Ads** | Shared Ad Engine; locale-aware labels + transparency + separate retention class — **KZ-C.4**; fixed API **`Реклама`** is not final. |
| **AI** | Consumer AI **not launched**; external LLM / content-origin schema — **KZ-C.6** gate before launch. |
| **Production gate** | Do **not** claim LEGAL READY / COMPLIANCE COMPLETE until §30 checklist in contract (+ **KZ-C.9**). |
| **AOP** | **CLOSED / PASS** — **AOP.0–AOP.7** + **7H/7H.1/7H.2/7H.3** — [admin-catalog-operations.md](./architecture/admin-catalog-operations.md) §5.2–5.3, §11; physical QA **2026-09-29** on **`aop7-test-cafe`**; **controlled catalog population may begin** (not production launch). |

**Phases:** KZ-C.1 … KZ-C.9 per contract; **AOP.0** may proceed in parallel where compatible; **public production** gated by P0 compliance work.

**Post-6.12A candidates (documented — not auto-started):** **6.12B** / Catalog Import; remaining contours — **`docs/changelog.md`** / architecture docs.

**Distinction:** **Implemented** = merged code/docs checkpoint. **Verified audit** = read-only evidence only until implementation commit.

**Protected local dirt (do not stage/restore/clean):** mobile branding/login/logo, generated Flutter registrants, `services/catalog-api/src/main.ts`, notification seed script, untracked `infra/local-backups/`, local dev audit scripts — use `git status` as authority.

## Product

QalaGo — городской маркетплейс/гид (MVP city: Uralsk; multi-city via `cityId`/`citySlug`, not hardcoded city names in domain logic).

## Stack

- **Backend:** NestJS `services/catalog-api`, Prisma + PostgreSQL/PostGIS, REST **`/api/v1`**, local dev default **http://127.0.0.1:3002/api/v1**
- **Mobile:** Flutter `apps/mobile`
- **Web:** Next.js — `apps/business-web`, `apps/admin-web`, `apps/consumer-web`
- **Monorepo:** npm workspaces

## Client surfaces (architecture — durable)

**Flutter Mobile**

- **Android** and **iOS** — production native application (`apps/mobile`).
- Store builds, MapLibre mobile map, push, F.6 App Links / Universal Links to **`https://qalago.kz`** (Consumer Web origin for HTTPS links).

**Consumer Web**

- **Next.js** — **`apps/consumer-web`**
- **Canonical public browser experience** — desktop and mobile browsers.
- Production public host: **`https://qalago.kz`** when configured (local dev default **http://localhost:3005**, `npm run dev:consumer`).
- Owns public discovery, SEO, and F.7 legal pages on the public origin — see **`docs/architecture/public-consumer-web.md`**.

**Flutter Web**

- **DEV / QA / local demo / compile-regression only** — optional Flutter **`web`** target in the same `apps/mobile` codebase.
- May remain available locally (e.g. **`http://127.0.0.1:8080`** when using `npm run dev:all` / `scripts/dev/start-all.ps1`).
- **Not** production/public, **not** canonical, **no** SEO ownership — **not** a competing public frontend for `qalago.kz`.

**Safety rule (shared Dart):** Do **not** remove or alter Flutter **`lib/`** shared code merely because the public browser product is Consumer Web. Any future **full Flutter Web retirement** requires a **separate audit** — shared Dart is also used by Android/iOS.

**Disposition checkpoint:** **Option B approved** — Flutter Web retained for local DEV/QA; **FLUTTER WEB DISPOSITION PASS — DEV/QA ONLY** — **`docs/changelog.md`**.

## Shared catalog / data principle

**PostgreSQL + Catalog API** are the canonical source for catalog, business, category, and location data. **Flutter (Android/iOS) and Consumer Web consume the same backend** — do not maintain separate hardcoded production catalogs per channel. Taxonomy and business/location changes propagate via API consumption.

## Public business visibility (MAP-SEC.C1)

- **Public catalog/discovery/map** (`GET /businesses`, `@Public`) exposes **ACTIVE** businesses only.
- Clients **cannot** widen visibility with **`?status=PENDING`** or **`?status=BLOCKED`** (→ **400**). Omit **`status`** or use **`status=ACTIVE`**.
- **Administrative** status filtering remains on protected **`GET /admin/businesses`** (staff auth).

## Map user location (MAP-LOCATION.2 CLOSED / PHYSICAL PASS)

- **Pipeline:** Geolocator → passive **last-known / bounded current bootstrap** → continuous stream → **`userLocationProvider`** → **MapScreen** → **`QalaGoMapView.userLocation`** → native MapLibre GeoJSON **`qalago-user-location`** + **CircleLayer** (not **`myLocationEnabled`**).
- **Physical Samsung SM-J610FN (Android 10):** automatic initial dot; pan/zoom/fast-pan geographic attachment; map tab re-entry replay — **PASS** (debug APK **`QALAGO_DEV_HOST=172.158.10.133`**, native business layer on). Details: `docs/changelog.md` MAP-LOCATION.2 physical QA entry.
- **flutter_map fallback:** user location remains Flutter overlay markers.
- **Still open (not MAP-LOCATION):** duplicate native **`qalago-business-*`** layer add errors (**C3** track).

## Map viewport fetch hysteresis (MAP-PERF.C2 CLOSED / PHYSICAL PASS)

- **Invariant:** visible viewport **⊆** fetched padded coverage (**`lastFetchBounds`**, **12%** pad) → **suppress** fetch; viewport **exits** coverage → **fetch** new padded coverage. Error / cancel / stale / incomplete wave (**30-page** cap without API total exhausted) → **must not** establish valid coverage.
- **Physical Samsung SM-J610FN:** small pan inside coverage → **`fetchNeeded=false`** / **`fetchSkipped`**; larger pan outside → **`fetchNeeded=true`** / successful refetch — **PASS**. Details: `docs/changelog.md` MAP-PERF.C2 physical QA entry. Implementation: **`3c86164ffcd9eafdf42536642de08635c30490ed`**.
- **MAP-PERF.C3 CLOSED** — native MapLibre business layer + **Android release path finalized**. **C3.1–C3.5R** PASS (Samsung release-mode smoke **C3.5R**; **C3.4** debug; **C3.3** synthetic **100–3000** only — not physical 3000 on device). **Code default:** `QALAGO_NATIVE_MAP_BUSINESS_LAYER=false`. **Android store/release:** pass `QALAGO_NATIVE_MAP_BUSINESS_LAYER=true` + production API URL in docs (`https://api.qalago.kz/api/v1`). **iOS:** native business **not** enabled until dedicated physical QA. **No** native→overlay runtime fallback (debt). **Separate infra:** `api.qalago.kz` DNS/API not deployed/resolvable at C3.5R observation — not a C3 defect. Details: `docs/changelog.md` MAP-PERF.C3 CLOSED entry.

## Consumer Web stage

**Architecture (CLOSED — preserve):** **F.4–F.8** — routing, locale SEO, legal migration, OG, deep-link well-known files. **Do not rebuild.**

**Product track (ACTIVE):** **CW.1–CW.6 CLOSED** (through unified web ads + analytics). Contract: **`docs/architecture/public-consumer-web.md`** § **CW**. **CW.7 next** — city promotions discovery page.

- **6.11F.3 PASS** — public SEO infrastructure (sitemap, robots, temporary business detail **noindex**, etc.).
- **6.12A.9.3.4 PASS (physical QA finalized)** — Consumer Web discovery/detail physical context; **QA-001 CLOSED**.
- **6.12A.9.3.5 PASS (physical QA finalized)** — Business Web permission-safe profile PATCH; primary-branch UX; hours-only MANAGER scope verified; closes **`A.9.3.4+`** owner slice; central audit **P1 CLOSED**.
- **6.12A.9.4.0 PASS (policy gate)** — legacy physical retirement policies & invariants frozen; **`docs/architecture/business-location.md`** § **9.4.0**; **F.4** not blocked on column drop.
- **F.4** — **CLOSED / PASS** — canonical public Business pages implemented + physically verified; **LocalBusiness** / **AggregateRating** JSON-LD still deferred (CW: enhancement unless promoted).
- **F.5** — **CLOSED / PASS** — **F.5 PASS — LOCALE SEO URL ARCHITECTURE IMPLEMENTED AND VERIFIED** (Phase **0** contract; Phase **1** + **1.1–1.4** routing; Phase **2** SEO; PublicShell hotfix — **`docs/changelog.md`**).

## BusinessLocation track

| Stage | Status | Notes |
|-------|--------|--------|
| 6.12A.5 | PASS | Owner Business Web + Admin read-only branches |
| 6.12A.6 | PASS | checkpoint `fc13f679…` — public read + Flutter/Consumer client awareness |
| 6.12A.7.1 | PASS | checkpoint `0d8a772…` — backend `forMap` viewport → **BusinessLocation** grain + `locationId` |
| 6.12A.7.2 | PASS | Flutter map **physical key** = `locationId`; detail/reviews/favorites stay **Business.id** |
| 6.12A.7.4 | FINALIZED | multi-branch map physical QA; public locations Hotfix 2 |
| 6.12A.7.6 | CLOSED (physical QA PASS) | **`GET /businesses/:id?locationId=`** + **`effectivePhysical`** backend source of truth for detail physical UI |
| **6.12A.7.7** | **CLOSED** | **Branch media architecture finalized** — A.7.7.1–7.7.6 complete; closure audit PASS |
| 6.12A.7.7.1 | CLOSED | **`BusinessImage.locationId`** nullable; same-business DB integrity |
| 6.12A.7.7.2 | CLOSED | Owner management + public **`moderationHidden`** filter |
| 6.12A.7.7.3 | CLOSED | **`effectiveMedia`** + scoped **`/photos?locationId=`** |
| 6.12A.7.7.4 | CLOSED | **Business Web** shared/branch media UX |
| 6.12A.7.7.5 | CLOSED (physical QA PASS) | **Flutter** + Hotfix 1; Samsung SM-J610FN L1/L2 verified |
| 6.12A.7.7.6 | CLOSED | **Admin** **`MEDIA`** **`mediaTarget`** scope visibility |
| 6.12A.7.8.0 | PASS | Read-only audit — M2M branch availability for ServiceItem/Promotion; ServiceMenuGroup business-wide |
| 6.12A.7.8.1 | PASS (data foundation) | **`ServiceItemBranchAvailability`** + **`PromotionBranchAvailability`**; composite same-business FKs |
| 6.12A.7.8.2 | **PASS (management API)** | Owner **`branchAvailability`** on ServiceItem/Promotion CRUD; location **DELETE** conflict mapping; **no public filtering** |
| 6.12A.7.8.3 | **PASS (public contract)** | Detail **`effectiveCatalog`** / **`effectivePromotions`**; **`/catalog?locationId=`**; legacy previews unchanged |
| 6.12A.7.8.4 | **PASS (Business Web UX)** | Owner menu + promotions **ALL/SELECTED** branch controls; **`listManageServiceItems`** for edit assignments |
| 6.12A.7.8.5 | **CLOSED (physical QA PASS)** | Flutter branch-effective catalog/promotions; Samsung SM-J610FN L1/L2 verified; QA785 fixture cleaned (dev) |
| 6.12A.7.8.6 | **PASS (Admin read-only)** | **`GET /admin/businesses/:businessId/content`** — **`BUSINESS_VIEW`**, ALL/SELECTED branch scope labels; no branch editing |
| **6.12A.7.8** | **CLOSED** | Branch catalog/promotions architecture finalized (A.7.8.0–A.7.8.6); discovery/global promotions branch grain → **A.7.9** |
| 6.12A.7.9.1 | **PASS (contract foundation)** | Discovery **`contextLocationId`** additive; **map keeps `locationId`**; detail **`activeLocationId`** |
| 6.12A.7.9.2 | **PASS (nearby)** | Nearest/radius on **`BusinessLocation.location`**; one card per Business; geo **`contextLocationId`** + **`distanceMeters`** |
| 6.12A.7.9.3A | **PASS (city membership)** | Discovery city = branch **`cityId`** presence; non-geo **`contextLocationId`**; **`Business.cityId`** not physical presence |
| 6.12A.7.9.3B | **PASS (branch-aware search)** | Search stays **Business-grain**; branch **address** + **SIBA** honesty; search **`contextLocationId`** precedence (geo **>** SELECTED item **>** address **>** city) |
| 6.12A.7.9.4 | **PASS (promotion city feed)** | **`GET /promotions`** **ALL/SELECTED PBA** + city **`contextLocationId`**; Promotion-grain |
| 6.12A.7.9.5 | **PASS (Flutter automated)** | Discovery cards → detail **`locationId`** from backend **`contextLocationId`**; map keeps marker **`locationId`**; favorites/reviews **Business.id** |
| **6.12A.7.9.6** | **CLOSED (physical QA PASS)** | Samsung SM-J610FN: discovery **Business-grain** + map **BusinessLocation-grain**; detail branch switch; branch-aware **catalog/promotions** full lists; fixture cleaned (dev); impl checkpoints `4a24b43` / `d7b25ea` |
| **6.12A.7.QA** | **CLOSED (audit PASS)** | Final read-only BusinessLocation E2E architecture audit — **READY FOR A.8**; no P0/P1; findings **QA-001..QA-008** backlog only |
| **6.12A.8.0** | **CLOSED (audit PASS)** | Read-only ads/analytics location hooks audit — implementation plan ready |
| **6.12A.8.1** | **PASS (foundation)** | Nullable schema + API contract hooks: campaign **target** / **destination** branch FKs; `AnalyticsEvent.businessLocationId`; serve DTO fields present but **null** until A.8.3; no serving/nav/client analytics yet |
| **6.12A.8.2** | **PASS (validation)** | Server validates campaign branch target/destination (ownership, city, PBA, target≠destination); order/provision metadata path; branch delete clears safe campaign refs or conflicts |
| **6.12A.8.3** | **PASS (serving)** | Ad serve engine resolves branch destination + branch-effective business card; target filters eligibility; promotion **PBA** enforced at serve; rotation pre-filters invalid campaigns |
| **6.12A.8.4** | **CLOSED (physical QA PASS)** | Branch-aware ad taps on Samsung SM-J610FN; HOME_FEATURED / CATEGORY_TOP / HOME_PROMOTIONS / VIP BUSINESS / VIP PROMOTION + L2→L1 back stack; impl `a7806bb` + hotfix `f1d03c8` |
| **6.12A.8.4.PHYSICAL** | **CLOSED** | Fixture cleanup + dev baseline restored; changelog closure docs-only after QA |
| **6.12A.8.5** | **PASS (attribution)** | `AnalyticsEvent.businessLocationId` = interaction branch; organic server-validated; ad server-derived; historical null preserved |
| **6.12A.8.6** | **PASS (platform)** | Ad + serve record optional `AnalyticsEvent.platform` when client sends enum; organic/ads share Flutter helper; historical ad platform stays null |
| **6.12A.8** | **CLOSED / FINALIZED** | **6.12A.8.FINAL** audit PASS; branch-aware campaign/serve/nav/analytics + ad platform hooks complete; **A.8.7 not required**; impl checkpoint **A.8.6** `ae20e92…` |

**6.12A.9.3.1 PASS** — public API **read normalization**: top-level Business physical fields on list/detail/favorites are **compatibility projections** from effective **BusinessLocation** (primary or `contextLocationId`); legacy columns remain; **`forMap=true`** still branch-grain; favorites stay **Business-grain** (primary physical only).

**6.12A.9.3.2 PASS** — discovery SQL: **BL-authoritative** address search + bbox; legacy bbox without **`forMap`** = **Business-grain** + in-bbox **`contextLocationId`**; promotions nested business physical aligned to branch context.

**6.12A.9.3.2b PASS (implementation)** — no active **`GET /businesses`** physical geo on **`Business.latitude/longitude`**; bbox → BL PostGIS; **`forMap` without bbox** → BL map-ready guard in city; nearest/radius unchanged (BL PostGIS). Checkpoints: **A.9.3.1** `f4154d9a…`, **A.9.3.2** `f2bbc9c8…`, **A.9.3.2b** `c53af3c2…`.

**6.12A.9.3.3 PASS (Flutter closure)** — **`openBusinessFromFavorite`**; **QA-002 CLOSED / OBSOLETE**.

**6.12A.9.3.4 PASS (Consumer Web closure)** — **`contextLocationId` → detail `?locationId=`**; physical browser QA PASS; **QA-001 CLOSED**.

**6.12A.9.3.5 PASS (Business Web owner closure)** — permission-split profile/hours PATCH; primary-branch labeling + locations link; physical browser QA PASS; fixture **`QA A935 OWNER PHYSICAL`** cleaned (dev); impl **`9e00ef25…`**; backend sync unchanged (**A.3/A.4/A.5**).

### Flutter detail navigation (canonical)

- **File:** `apps/mobile/lib/shared/navigation/open_business.dart`
- Discovery: **`contextLocationId` → `locationId` query**
- Map: row **`locationId` → `locationId` query**
- Promotions: **`promotion.contextLocationId`** (ALL / null → primary)
- Favorites: **`openBusinessFromFavorite`** — omit `locationId` (not branch bookmarks)
- Notifications / profile review links: business-level route → primary (**by design**)

## Ads / Analytics location (A.8) — CLOSED

**Stage 6.12A.8 is finalized.** Location and platform hooks for ads/analytics are in production architecture; no further A.8 substage unless a new product stage explicitly scopes follow-on work.

- **Ownership:** **AdCampaign** remains **Business-grain** (`businessId` required).
- **Targeting (optional):** `targetBusinessLocationId` — serve eligibility narrowing (`null` = legacy city/category behavior).
- **Destination (optional):** `destinationBusinessLocationId` — configured tap branch; **serve** returns resolved `destinationLocationId` / `contextLocationId` (A.8.3).
- **Attribution (A.8.5):** `AnalyticsEvent.businessLocationId` — **branch interaction context**, not user GPS; organic DTO validated same-business; **`AD_SERVED`** = serve-time resolved destination; client **`AD_*`** = explicit campaign destination only when set.
- **Platform (A.8.6):** `AnalyticsEvent.platform` — optional client runtime (`IOS`/`ANDROID`/`WEB`/`UNKNOWN`); Flutter canonical helper; serve query + ad event body; omitted legacy → **null**; independent of branch attribution.
- **A.8.2 rules:** branch ids validated on order + provision; **BusinessLocation.cityId** must match **campaign.cityId** when branch set; **target** and **destination** independent but cannot differ when both set; promotion **PBA** enforced on destination; single selected branch in city may auto-fill destination at provision; branch delete clears nullable campaign refs when safe else **409** `BUSINESS_LOCATION_DELETE_BLOCKED`.
- **A.8.3 serving:** single engine for all placements; city authority = **BusinessLocation.cityId**; brand null/null → A.7.9.3A city-context branch when present; fail-closed stale campaigns.
- **A.8.4 Flutter:** `resolvedDestinationLocationId` → business detail `locationId`; promotion-rich ads use `promotion.contextLocationId`; **VIP PROMOTION** may be creative-target-only (no `promotion` payload) — client opens **Business** detail with backend-resolved destination/context branch; VIP external URL unchanged.
- **Deferred (post–A.8):** Consumer Web ads/analytics producers; campaign channel **ALL | APP | WEB**; **WEB_MOBILE/WEB_DESKTOP**; branch/platform analytics dashboards; creative-level analytics; serve-session bridge for runtime-only client **AD_*** branch; **A85-004** VIEW_BUSINESS branch-switch dedupe semantics.
- **Test debt:** **A8F-001** — A.8.1 runtime spec expects zero historical `businessLocationId`; stale after A.8.5 (FINAL audit focused regression **73/74**; not a product blocker). Last full Flutter **955/955** at A.8.6 closure.

## Business vs BusinessLocation

- **Business:** brand identity — membership, reviews, favorites, plans, ads, analytics; **ServiceItem** / **Promotion** are business entities with optional per-branch availability (reviews/favorites/analytics remain **Business.id**-scoped).
- **BusinessLocation:** physical branch identity — city, address, coords, hours, contacts; **Business 1:N BusinessLocation**.
- **Business detail (A.7.6–A.7.9.6 CLOSED):** optional **`locationId`** selects active branch; **`effectivePhysical`** / **`effectiveMedia`** / **`effectiveCatalog`** / **`effectivePromotions`**; consumer **`/business/:id/catalog|promotions?locationId=`**; in-detail **«Филиалы»** switch via **`context.replace`**. Reviews/favorites/analytics stay **`Business.id`**. Branch-specific media physical QA = **A.7.7**, not re-tested in **A.7.9.6**.
- **Discovery grain (A.7.9 CLOSED via A.7.9.6):** list/search/category/nearby/promotions feed = **Business-grain** card + backend **`contextLocationId`**; **map** = **BusinessLocation-grain** (**`locationId`** per marker).
- **Primary:** default active context when `locationId` omitted; **`isPrimary` badge ≠ forced active** when user/map selects another branch.
- **Primary sync:** legacy **Business** geo **columns** retired (**A.9.4.4C4**); **`Business.cityId`** retired (**A.9.4.5D/E**). **A.9.4.4C1–C3 / 4B CLOSED:** **BL-authoritative** writes/reads; public **`cityId`** = effective **BusinessLocation** projection. Branch assignments **A.7.8.2**; branch-effective catalog/promotions **A.7.8.3**; branch reviews deferred.
- **Branch catalog/promotion invariants (A.7.8 CLOSED):** **ServiceMenuGroup** = business-wide. **ServiceItem** / **Promotion:** **0** assignment rows = all branches; **≥1** = only assigned **`BusinessLocation`** ids. Owner edits via **Business Web** (**ALL/SELECTED**); **Admin** read-only content inspection (no branch editing). Public/Flutter use **`effectiveCatalog`** / **`effectivePromotions`**; legacy **`catalogPreview`** / **`promotionsPreview`** + city **`GET /promotions`** remain business-grain until **A.7.9**. Assignments = availability only. **BusinessLocation** delete **RESTRICT** while assignments exist.
- **Branch media invariants (A.7.7 CLOSED):** shared = **`BusinessImage.locationId` null**; branch = **`locationId` = `BusinessLocation.id`** (same business); public branch view = **active branch media + shared brand** (never sibling branches); **`effectiveMedia`** is branch-aware public truth; legacy **`galleryPreview`** on detail is **compatibility-only** (not branch truth); **`Business.coverImageUrl`** remains **brand-level**; owner **Business Web** + consumer **Flutter** + **Admin MEDIA** moderation aligned; plan quota Business-wide; **`moderationHidden`** never on public surfaces.
- **Branch media deferred / debt:** legacy business-wide **`galleryPreview`**; full Admin gallery manager; Admin upload/reorder; owner Flutter branch upload; orphan file GC; reorder API/UX; explicit branch cover column; branch-level moderation status; CDN migration.
- **Cross-city:** secondary branches may live in other cities; **A.7.9.3A** discovery uses **branch city presence** + **`contextLocationId`** for the branch in the requested city (not parent **`Business.cityId`** alone).
- **Public read (A.6):** `GET /businesses/:id/locations/public` (ACTIVE only, guest-safe).
- **Management (A.4):** authenticated CRUD + `set-primary`; **DELETE** non-primary branch (409 when FK references remain, e.g. catalog/promotion assignments).

## Frozen / deferred

- **Map (A.7.1–A.7.4):** backend **BusinessLocation** grain + **`locationId`**; Flutter map layer uses **physical key**; category map renders **`mapLayerItems`** (fetch bounds); detail accepts optional **`locationId`** for branch address/route; reviews/favorites/analytics remain **Business.id**.
- **Nearest/radius/list discovery:** **Business-grain** card; branch context via **`contextLocationId`** (A.7.9.2+).
- **Public discovery:** Backend **A.7.9.3A–3B/4** + Flutter **A.7.9.5** passes **`contextLocationId`** into detail **`locationId`**. Map unchanged (**marker `locationId`**). **A.7.9.6 CLOSED** (physical QA PASS). **A.7 BusinessLocation architecture complete** (A.7.QA audit PASS).
- **Post-F.5 Consumer Web (not started):** **F.6** deep links; branch **LocalBusiness** / **AggregateRating** JSON-LD richness — beyond closed **F.4** / **F.5** — not A.6.
- **Branch-level membership, location favorites, branch reviews:** deferred.

## A.7.QA outstanding debt (not implemented)

| ID | Severity | Summary | Target |
|----|----------|---------|--------|
| QA-001 | **CLOSED (A.9.3.4 + F.4 PASS)** | Discovery → canonical **`/{citySlug}/business/{businessSlug}`**; branch context preserved | — |
| QA-002 | **CLOSED / OBSOLETE** (A.9.3.3) | Favorites are **Business-grain**; **`openBusinessFromFavorite`** omits route **`locationId`**; **A.9.3.1** primary projection + detail **`primary_default`** | — |
| QA-003 | P3 | BL rows with lat/lng but null geography (dev snapshot: 27) | A.9 / ops backfill |
| QA-004 | P3 | Single-primary enforced in app, not DB | A.9 |
| QA-005 | P2 | Promotions invalid-`locationId` doc vs primary-fallback | api-contracts |
| QA-006 | CLOSED (A.8) | Branch dimension in ads/analytics — **6.12A.8 CLOSED** | — |
| QA-007 | DEFERRED | Admin no full branch CRUD | Admin backlog |
| QA-008 | **CLOSED (A.9.4.4B)** | Runtime no longer uses legacy **Business** geo as physical fallback | **4.4C** column drop |

## Advertising (unified backend — CW.6 for web UI)

**One shared advertising backend** across **Android, iOS, and Consumer Web** — **CW.1 locked:** web ads **in v1** via **`GET /monetization/ads/serve`** + **`platform=WEB`** (implementation **CW.6**). Placements: **HOME_VIP_BANNER**, **CATEGORY_TOP**, **CATEGORY_BOOST**, **HOME_FEATURED**, **HOME_PROMOTIONS**. Campaign **APP vs WEB channel filter** — future; client platform distinguishes web today. **BusinessLocation** branch target/destination — **6.12A.8 CLOSED** on mobile; web rendering **CW.6**.

## Home composition (CW.3 — hard requirement)

**CW.1 locked:** backend/admin-controlled home **section order** and **enabled** state — **not** permanently hardcoded in Consumer Web or Flutter. Shared logical config; **`platform`** = applicability on **one row per scope + sectionType** (not dual APP/WEB order rows). **CW.3A:** PostgreSQL partial uniques enforce global + city row cardinality. Implementation **CW.3** (API/admin) + **CW.4** (home UI). Simple model — not over-complex CMS.

## Workflow discipline

1. **Task → implementation → final report → audit → next stage** (do not skip audit gate).
2. Plan → contract (if API changes) → code → tests → docs → **changelog in same commit as code** when possible.
3. **Git safety:** no `reset --hard`, `clean`, `stash`, mass restore; do not stage protected local dirt (mobile generated registrants, local DB dumps, `.next` caches).
4. **Prisma on Windows:** stop `catalog-api` dev processes before `prisma generate` if EPERM on `query_engine-windows.dll.node`.

## A.9 deferred (naming from changelog/roadmap)

- **P2:** `mergeSearchResultPages` dedupes by **`Business.id`** only (valid while discovery is Business-grain).
- **A.9.3.4+ owner slice** — **closed in A.9.3.5** (Business Web); Consumer Web closed in **A.9.3.4**.
- **A.9.4.0** — retirement **policy gate finalized** (docs).
- **A.9.4.1A** — Admin **ANY-BL** visibility **IMPLEMENTED** (catalog-api).
- **A.9.4.5A** — Owner-equivalent **CITY_ADMIN** uses **`assertBusinessPrimaryLocationCityInAdminScope`** (primary BL city); secondary branch anti-escalation **IMPLEMENTED**.
- **A.9.4.1B** — campaign city, analytics attribution, BL dedupe, public **`cityId`** projection **IMPLEMENTED** (catalog-api).
- **A.9.4.2A** — integrity auditor + repair CLI **IMPLEMENTED** (catalog-api).
- **A.9.4.2B** — runtime location invariant enforcement **IMPLEMENTED** (catalog-api).
- **A.9.4.2E** — owner branch physical QA **VERIFIED** (Business Web + API; fixture cleanup restored baseline).
- **A.9.4.2 overall** — **PASS** (invariants finalized); **2C** DB trigger **NOT REQUIRED**.
- **A.9.4.3** — **CLOSED** (**3A** owner inversion, **3B** onboarding/create, **3C** seed/dev, **3D** physical QA); legacy **Business** physical columns **`Business.cityId`** **not** retired.
- **A.9.4.4A** — **PASS** — rogue **`sync-businesses-visibility.ts`** geo writer retired (visibility-only).
- **A.9.4.4B** — **PASS** — runtime physical reads cut over to **BusinessLocation**.
- **A.9.4.4C1** — **PASS** — normal **Business** geo mirror writes retired (**BL** write authority).
- **A.9.4.4C3** — **PASS** — business creation cut over to **BusinessLocation** authority.
- **A.9.4.4** — **PASS** — legacy **Business** physical geo storage retired (**C4**); **`Business.cityId`** remains **A.9.4.5** track.
- **A.9.4.5B** — **PASS** — campaign/analytics/order paths use BL/explicit/primary only; **`metadata.campaignCityId`** stable on orders.
- **A.9.4.5C** — **PASS** — benchmark/reporting/moderation/audit city attribution uses BL/explicit context.
- **A.9.4.5** — **`Business.cityId`** retirement — **CLOSED** (**5A–5E**); physical/manual QA **PASS** (**5E**).
- **6.12A (umbrella)** — **CLOSED** — BusinessLocation architecture finalized (changelog **2026-09-27**).
- **A.8.1 test debt** — **CLOSED in 5B** (branch **`businessLocationId`** contract spec).
- **F.4** — **CLOSED / PASS** (see changelog **2026-09-27** finalized entry). Rich snippets (**LocalBusiness**) remain future work.
- Post **6.12A:** User contour audit, Business Web owner contour, Admin Web contour, Admin Catalog/CMS, centralized Home config, Catalog Import, QalaGo AI, remaining Consumer Web, production monetization, analytics UX, role-based E2E, security/legal/release — **not** current track unless explicitly staged.

## Product roadmap order (canonical)

```
AOP — CLOSED
  ↓
BIZ — functional Business Web / ownership / claim (ACTIVE)
  ↓
BIZ CLOSED
  ↓
UXA.0 → UXA.13 — QalaGo Backoffice UI/UX finalization (Admin Web + Business Web) — REQUIRED, not optional polish
  ↓
CW.1 → CW.8 — Consumer Web product (Option B) — ACTIVE after CW.1 lock
  ↓
Mobile UI/UX pass
  ↓
Production / security / pre-VPS readiness gates
  ↓
SCALE.0 → SCALE.12 — scale foundation (see docs/architecture/future-ready-platform.md; not started)
  ↓
VPS / production deployment
```

**VPS / production** is **not** implied ready when AOP, BIZ, or UXA docs exist alone — all gates above apply.

| Track | Status |
|-------|--------|
| **AOP** | **CLOSED** |
| **BIZ** | **CLOSED** |
| **UXA** | **CLOSED** — **UXA.1–UXA.13 PASS**; backoffice physical browser QA verified **2026-10-01** |
| **CW (Consumer Web product)** | **ACTIVE** — **CW.1–CW.6 PASS** · **CW.7–CW.8 not started** |
| **Mobile UI/UX** | **PLANNED** |
| **VPS / production** | **BLOCKED** until readiness gates |
| **SCALE** | **PLANNED** — architecture roadmap documented; **implementation not started** |
| **Future-ready platform doc** | **DOCUMENTED** — `docs/architecture/future-ready-platform.md` |

## Future-ready platform (summary)

Canonical planning doc: **`docs/architecture/future-ready-platform.md`**. **Modular monolith first**; stateless API; PostgreSQL/PostGIS source of truth; Redis for cache/coordination only; workers/object storage/CDN/outbox/idempotency as **PLANNED** maturity steps. **Explicit non-goals now:** Kubernetes, microservices, sharding, read replicas, multi-region, partner API. **SCALE.0–SCALE.12** listed — **none started**. **Does not** change AOP/BIZ/API/RBAC/DB or active **UXA** work.

## UXA — QalaGo Backoffice UI/UX finalization (mandatory pre-production)

**Scope:** **`apps/admin-web`** + **`apps/business-web`**. Shared **QalaGo Backoffice** design system; **different** information density (Admin = dense/operational; Business = owner-friendly/guided). **RBAC clarity must not be sacrificed** for simplification.

**Brand (UXA.1 tokens):** Primary **`#00A8D6`**, accent **`#F3A100`** (`--color-brand-*`); Montserrat; legacy **`--qz-gold` (#fec50c)** deprecated alias retained.

**Do not start UXA** before **BIZ CLOSED** unless Chief Orchestrator / explicit approval.

| Stage | Scope |
|-------|--------|
| **UXA.0** | Full read-only UI/UX audit — routes, screenshots inventory, patterns, obsolete UI, desktop/tablet, a11y baseline, RU/KK parity, icon inventory |
| **UXA.1** | Backoffice design system — typography, spacing, radius, borders, surfaces, shadows, colors, semantic colors, focus/hover/disabled, component sizing |
| **UXA.2** | App shell / navigation — sidebar, header, titles, breadcrumbs, account menu, city/business context, active nav, collapse if needed |
| **UXA.3** | **PASS** — QalaGo Backoffice icon system — `@qalago/brand/icons`, 16/20/24px, stroke `currentColor`, no emoji in authenticated shell/nav |
| **UXA.4** | **PASS** — Tables / filters / search — `@qalago/brand/tables`; toolbar, search, pagination, filtered empty; dashboard deferred |
| **UXA.5** | **PASS** — Forms — `@qalago/brand/forms`; labels/errors/success; switch; sections/actions; dirty guard (settings/profile); catalog create/detail; business locations/promotions/menu create |
| **UXA.6** | **PASS** — Location / geo UX — branch cards, sectioned forms, map pin/coords, Admin manager alignment (**domain rules unchanged**) |
| **UXA.7** | **PASS** — Status badges + confirmations — `@qalago/brand/badges|status|confirm`; audit/staff labels; `backofficeConfirm`; dashboard `confirmAction` deferred |
| **UXA.8** | **PASS** — Dashboards / KPI / chart shells — `@qalago/brand/dashboards`; Business partial-failure loading; Admin dashboard KPI row + monetization/reports alignment |
| **UXA.9** | **PASS** — System states foundation (`@qalago/brand/states`); representative screen migration; no global toast |
| **UXA.10** | **PASS** — Responsive layout — `backoffice-responsive.css`; shell drawer ≤960; table inner scroll; KPI breakpoints; static contract tests (**physical QA UXA.13**) |
| **UXA.11** | **PASS** — Accessibility — skip link, landmarks/nav semantics, drawer inert/focus, forms/tables/dialogs/switch/progress contracts, static tests (**SR/contrast physical QA UXA.13**) |
| **UXA.12** | **PASS** — RU/KK visual localization — dictionaries + `owner-visual-copy`, long-copy CSS, parity/hardcoded guards (**physical visual QA UXA.13**) |
| **UXA.13** | **PASS** — Physical browser QA verified (SUPER `+77473850274`, CITY_ADMIN, OWNER, MANAGER, team flag, RU/KK F5) → **UXA CLOSED** |

### UXA — known UI/UX debt (carry-in from AOP / BIZ audits)

Not functional AOP defects (**AOP remains CLOSED**):

- Weak or absent **save-success** feedback (catalog/core and elsewhere)
- Audit **action** primary labels humanized (UXA.7); filter/table polish deferred (**UXA.4**)
- **Featured/plan** controls remain on legacy dashboard surface vs catalog detail
- Inconsistent **empty / loading / error** states may exist across backoffice
- Screen-level **loading/empty/error** consistency still open (**UXA.9**)
- **Admin Web** / **Business Web** final UI/UX pass **not performed**
- Responsive + **a11y** physical QA still required

### UXA.3 icon semantics (implemented)

Shell/nav icons live in **`@qalago/brand/icons`**; Admin route map **`admin-shell-icons.ts`**; Business **`BUSINESS_NAV_ICONS`**. Charts and page content emoji unchanged; extend icon set when new nav items ship.

## Context maintenance

- **`docs/changelog.md`** = historical timeline (**Implemented** / **Verified** checkpoints).
- **`docs/ai-project-context.md`** = **current-state** snapshot only (**Agreed** next, audited-vs-implemented).
- **`AGENTS.md`** = mandatory START/FINISH protocol; **no** parallel memory files.
- Update after **major stage**, **audit gate**, or **material architecture decision**; trivial edits skip noisy updates.
- **Do not create duplicate** AI/project-context documents.

## Files to attach in a new ChatGPT/Cursor chat

1. `AGENTS.md`
2. `docs/ai-project-context.md`
3. `docs/changelog.md` (top ~60 lines minimum)
4. As needed: `docs/architecture/business-location.md`, `docs/architecture/catalog-geo-query.md`, `docs/architecture/api-contracts.md`
