# F.6 — Deep Links / App Links / Universal Links / NavigationTarget

**Gate:** F.6 — Deep Links / App Links / Universal Links  
**Status:** **F.6 PHASE 0 — AGREED / CONTRACT LOCKED**; **Phase 1 — IMPLEMENTATION PASS**; **Phase 2 — IMPLEMENTATION PASS** (Flutter receiver + coordinator + navigation)  
**Umbrella:** **IN PROGRESS / NOT CLOSED** (Phases **3–6** not started; **no** verified OS App/Universal Links yet)

**Authority:** This document is the **canonical F.6 contract**. Other architecture docs **reference** this file; they must not duplicate full contract text.

**Depends on:**

- **6.12A PASS** — [business-location.md](./business-location.md)
- **F.4 CLOSED / PASS** — public business URLs + `GET /businesses/by-slug/:businessSlug?citySlug=`
- **F.5 CLOSED / PASS** — locale SEO URLs — [public-consumer-web.md](./public-consumer-web.md) § F.5
- **NavigationTarget concept** — [future-extensibility-contracts.md](./future-extensibility-contracts.md) § Contract 2
- **Notifications E.4/E.5/E.6 CLOSED** — [notifications-final-architecture.md](./notifications-final-architecture.md)

**Explicitly not in scope here (Phase 0):** Any Flutter, Android, iOS, middleware, backend, Prisma, or association-file implementation.

---

## 1. Primary principle

Canonical public deep links are **HTTPS URLs** on:

```text
https://qalago.kz
```

Primary public URLs remain **valid Consumer Web URLs**. F.6 **must not** replace them with custom-scheme-only links as the primary public sharing format.

When the app is installed and OS association succeeds, supported HTTPS URLs may open QalaGo. Otherwise the same URL opens Consumer Web.

**F.4 / F.5 URL architecture remains authoritative.** F.6 resolves existing public URLs; it does not redefine them.

---

## 2. Supported canonical URL families

Locale prefixes (only supported locales):

```text
/ru/
/kk/
```

F.6 parser families are based on **existing F.5 URLs** (do not add new public route families for deep linking only; do not introduce localized slugs):

| Family | Pattern |
|--------|---------|
| City home | `/{locale}/{citySlug}` |
| Categories index | `/{locale}/{citySlug}/categories` |
| Category | `/{locale}/{citySlug}/{categorySlug}` |
| Subcategory | `/{locale}/{citySlug}/{categorySlug}/{subcategorySlug}` |
| Business | `/{locale}/{citySlug}/business/{businessSlug}` |
| Business + branch | `/{locale}/{citySlug}/business/{businessSlug}?locationId={BusinessLocation.id}` |
| Search | `/{locale}/{citySlug}/search?q=…` |

Query keys beyond those already used on Consumer Web (e.g. `locationId`, `q`, and existing search params) must not be interpreted as navigation instructions unless explicitly added to this contract in a future phase.

---

## 3. Primary target priority

**Business deep links** are the **primary** F.6 use case.

Category, subcategory, search, and city/home targets may be supported through the same parser **only where corresponding Flutter surfaces already exist**. Do not invent mobile screens.

Internal mobile routes may continue to use **UUIDs** (e.g. `/business/:id`). Web **slug → mobile UUID** resolution uses the existing public endpoint only:

```text
GET /api/v1/businesses/by-slug/:businessSlug?citySlug={citySlug}
```

Do not create a second business identity system.

---

## 4. NavigationTarget

**NavigationTarget** is a **typed navigation contract**, **not** a Prisma model. **No database table** for NavigationTarget in F.6.

Conceptual fields remain aligned with [future-extensibility-contracts.md](./future-extensibility-contracts.md) § Contract 2:

| Field | Role |
|-------|------|
| `entityType` | Extensible, additive enum |
| `entityId` | Primary entity id (cuid) |
| `businessId` | Optional; required for some child entities |
| `locationId` | Optional branch **context** |
| `citySlug` | Optional routing/discovery context |
| `source` | Optional attribution |

**Documented entity types:** `BUSINESS`, `PROMOTION`, `REVIEW`, `MAP_LOCATION`, `BUSINESS_APPLICATION`, `OWNERSHIP_CLAIM`, `AD_CAMPAIGN`. **`EVENT` — RESERVED / NOT IMPLEMENTED** (not part of F.6).

F.6 **Phase 1+** may introduce a **client-side** typed representation when implementation starts. No shared API DTO is required for Phase 0.

---

## 5. Single trust boundary

Required architecture:

```text
PUBLIC HTTPS URL
        ↓
allowlisted host + path/query parser
        ↓
typed internal NavigationTarget / deep-link target
        ↓
entity resolution if necessary (e.g. by-slug for BUSINESS)
        ↓
existing QalaGo navigation / go_router
```

**Never:**

```text
PUBLIC URL → arbitrary router.push(rawUrl)
```

**Never trust arbitrary** `route`, `url`, `deeplink`, or `link` fields from notifications or push payloads.

---

## 6. Notifications E contour

Notifications **E.4 / E.5 / E.6 remain CLOSED**.

F.6 **must not** create a second competing notification navigation architecture.

Reuse existing principles:

- Typed destination
- Allowlisted fields
- Safe entity validation
- Existing navigator where target semantics overlap (`resolveNotificationDestination` / `navigateNotificationDestination`)

**Do not** add arbitrary URLs to FCM payloads. **Do not** weaken `push_message_mapper` whitelist.

Deep links enter through **HTTPS App Links / Universal Links**, not through a new raw URL notification payload.

---

## 7. Locale policy (LOCKED)

For **canonical F.6 links:**

- `/kk/…` → app opens the target in **KK**
- `/ru/…` → app opens the target in **RU**

**URL locale is authoritative** for a successful canonical deep-link open.

When a supported canonical deep link is accepted:

1. Apply its locale to QalaGo UI.
2. Update/persist app locale preference using the existing mechanism (`app_locale_notifier` / `kUiLocalePrefsKey`).

Examples:

- Saved **RU** + `/kk/…` link → app switches to **KK**
- Saved **KK** + `/ru/…` link → app switches to **RU**

**Do not** create a per-screen temporary localization system.

Supported locales: **`ru`**, **`kk`** only.

Unsupported locale (e.g. `/en/…`) is **not** a valid F.6 target. Safe fallback: reject/no-op in app or leave Web behavior per platform entry point (Web may `notFound` per F.5 middleware rules).

---

## 8. City policy (LOCKED)

Deep-link **city context must not silently overwrite** the user's **persisted selected city** merely because an external link was opened.

**Example:**

- Persisted app city: **Uralsk**
- External link: `/kk/aktobe/business/aktobe-coffee-lab`

**Expected:**

- Resolve business using **`citySlug=aktobe`**
- Open the Aktobe business in correct context
- Preserve valid **`locationId`**
- Display target correctly
- **Persisted selected city remains Uralsk**

The external target city is **navigation context**, not automatically a new permanent city preference.

For a direct city/home link (`/kk/aktobe`): open QalaGo Home in **Aktobe link/session context**. **Do not** automatically persist Aktobe as selected city solely because the link was opened.

A **permanent** city preference change requires an **explicit** user city-selection action (existing city picker / onboarding city step).

**Implementation note:** City-sensitive screens reached through a deep link must not accidentally use persisted city before target handling completes (session/link `citySlug` must drive resolution and target-scoped UI where required).

---

## 9. BusinessLocation

Preserve branch context:

```text
?locationId={BusinessLocation.id}
```

**Pipeline:**

```text
canonical business URL
→ parse locale, citySlug, businessSlug, locationId
→ resolve Business by slug + city (by-slug API)
→ navigate to internal /business/:id
→ preserve valid locationId query on internal routes
```

**Identifier contract:** public `locationId` query values are **`BusinessLocation.id`** — Prisma `String @id @default(cuid())` (PostgreSQL `TEXT`), **not** an RFC UUID. Phase 1 mobile parser applies **syntactic** validation only (bounded alphanumeric/`_`/`-` shape compatible with catalog cuids); **do not** require RFC UUID or add `@IsUUID()` for this contract.

**6.12A** remains authoritative. **Do not** duplicate branch ownership validation in the URL parser; backend and business-detail contracts handle foreign/invalid `locationId`. Malformed `locationId` must fail safely. **Do not reopen** BusinessLocation architecture.

---

## 10. Legacy URL policy

Canonical App Links / Universal Links association should prioritize:

```text
/ru/*
/kk/*
```

Locale-neutral legacy URLs are **compatibility Web routes**. **Do not** make neutral legacy URLs primary mobile deep-link targets. Allow Consumer Web middleware to canonicalize them first where applicable.

Legacy **`/businesses/{id}`** remains Web compatibility behavior (F.4/F.5); **not** a primary F.6 mobile contract.

---

## 11. Startup / cold-start (LOCKED)

A valid deep link **must not** be silently lost because Flutter navigation context is not ready.

F.6 implementation **must** provide a **pending/deferred deep-link** mechanism:

```text
OS opens app
→ URL received
→ validate/parse
→ retain typed pending target
→ startup / onboarding / bootstrap completes
→ execute target once navigation is ready
→ clear consumed pending target
```

**Do not** depend on immediate `BuildContext` availability (audit: push cold start can no-op today if context is null).

Phase 0 **does not** modify the closed push system. Later implementation may reuse a generalized deferred-navigation primitive if separately audited.

---

## 12. Auth (LOCKED)

Public F.6 targets remain **guest-first**:

| Target | Guest |
|--------|-------|
| Business | Yes |
| City / home | Yes |
| Categories / category / subcategory | Yes |
| Search | Yes |

These links **must not** force login.

If a future **auth-only** NavigationTarget is exposed externally:

- Preserve a **validated typed** pending target
- Authenticate
- Resume **only** that validated internal target

**Never** store an arbitrary external redirect URL for post-login execution.

Owner/admin routes are **not** part of the public F.6 URL contract.

---

## 13. Security contract

Only approved **HTTPS** host(s) may enter the parser.

**Production host:** `qalago.kz` (staging hosts may be documented in implementation phases; must not weaken production rules).

Parser must validate: scheme, host, locale, path family, segment count, percent decoding, slug syntax/limits, **`locationId` syntactic shape** (when present — see §9; **not** RFC UUID), supported query keys, query length/limits.

**Reject:** `javascript:`, `data:`, `file:`, arbitrary custom schemes, unknown hosts, unsupported locale, unsupported route families, malformed encoding.

Unknown query parameters **must not** become internal navigation instructions. **No open redirects.** **No raw external URL** passed into `go_router`.

---

## 14. Web fallback

Every canonical F.6 public URL remains a valid Consumer Web URL.

| Scenario | Behavior |
|----------|----------|
| App not installed | Web |
| OS association failure | Web / normal HTTPS |
| Unsupported app route | Safe no-crash; Web remains canonical |
| Invalid target | Safe failure; no crash |
| Old app version | HTTPS URL still usable as Web |

---

## 15. Well-known (LOCKED — implementation deferred)

Production verification requires **root-domain** endpoints (not locale-prefixed):

```text
https://qalago.kz/.well-known/assetlinks.json
https://qalago.kz/.well-known/apple-app-site-association
```

They **must not** be locale-redirected. Current Consumer Web middleware would redirect `/.well-known/*` to `/ru/.well-known/…` or `/kk/.well-known/…`; a **later F.6 phase** must **exempt** `/.well-known/*` from locale middleware. **Not implemented in Phase 0.**

Association files must contain **real** platform identifiers and signing data only. **Do not fabricate** certificate fingerprints or Apple Team ID in the repository.

---

## 16. Android contract (implementation deferred)

**Current applicationId:** `kz.qalago.qalago_mobile`

**Primary mechanism:** Android App Links over HTTPS.

Future manifest: `android:autoVerify="true"` for canonical `qalago.kz` HTTPS paths. Exact intent-filter path policy finalized in **F.6 Phase 4**.

**assetlinks.json** requires actual Android signing **SHA-256** fingerprint(s). **Do not assume** upload-key fingerprint equals **Play App Signing** fingerprint. Treat debug and production verification separately.

---

## 17. iOS contract (implementation deferred)

**Current bundle ID:** `kz.qalago.qalagoMobile`

**Primary mechanism:** Universal Links over HTTPS.

Future entitlement: `applinks:qalago.kz`

**AASA** requires actual **Apple Team ID** + bundle identifier. **Do not fabricate** Team ID. Production verification requires macOS/Xcode/signing/device or appropriate Apple test environment (**F.6 Phase 5**).

---

## 18. Analytics

F.6 must **not** become a full attribution platform.

Minimum: reuse existing analytics (`VIEW_BUSINESS`, `BusinessTrafficSource`, `AnalyticsPlatform` **ANDROID** / **IOS** / **WEB**). If deep-link source distinction is required, use an **additive source dimension** or narrowly scoped extension only.

**Out of scope for F.6:** campaign/install attribution, UTM platform, deferred-install attribution (unless separately staged).

---

## 19. Implementation phases (LOCKED)

| Phase | Scope | Status |
|-------|--------|--------|
| **0** | Contract lock — **docs only** | **PASS — CONTRACT LOCKED** |
| **1** | Public URL parser + typed target + automated tests | **PASS** — `apps/mobile/lib/core/deep_links/` + `test/core/deep_links/public_deep_link_parser_test.dart` |
| **2** | Flutter: HTTPS receiver, pending target, slug resolution, go_router, locale/city/locationId policies | Not started |
| **3** | Consumer Web: association endpoints + `/.well-known` middleware exemption | Not started |
| **4** | Android App Links + QA | Not started |
| **5** | iOS Universal Links + QA | Not started |
| **6** | Cross-platform closure QA + E-contour regression | Not started |

**Do not** start Phase 1 without explicit approval.

---

## 20. External prerequisites

**Not required for Phase 0 lock:**

- Android signing SHA-256
- Play App Signing SHA-256
- Apple Team ID

**Required before production verification:**

| Platform | Prerequisites |
|----------|----------------|
| Android | Correct release / Play App Signing SHA-256 in assetlinks |
| iOS | Apple Team ID; production signing/capability; macOS/Xcode physical verification path |
| Web | `qalago.kz` HTTPS deployment serving Consumer Web `/.well-known` at domain root |

---

## 21. Out of scope

Web auth implementation; favorites synchronization; interactive Consumer Web map; **F.7** legal migration; **F.8** OG image pipeline; Events implementation; City Discovery; Home CMS; generalized bookmarks; **6.12B** import; Admin redesign; Business Web redesign; notification preferences; full marketing/install attribution; arbitrary FCM URL navigation; reopening **6.12A**; changing **F.5** canonical URL shapes.

---

## 22. URL → mobile mapping (reference)

Implementation must follow this matrix; details in Phase 1 tests.

| URL family | Intercept (when implemented) | Flutter surface | Resolution |
|------------|------------------------------|-----------------|------------|
| `…/business/{businessSlug}` | Primary | `/business/:id?locationId=` | by-slug API |
| `…/business/…?locationId=` | Primary | same | API validates branch |
| `…/categories` | Optional | `/categories` | city session context |
| `…/{categorySlug}` | Optional | `/categories/:categoryId` or search | categories list slug match |
| `…/{categorySlug}/{subcategorySlug}` | Optional | `/search?subcategoryId=` | slug match |
| `…/search?q=` | Optional | `/search?q=` | query passthrough |
| `…/{citySlug}` (home) | Optional | `/home` | city session context |
| Legacy neutral / `/businesses/{id}` | Not primary | N/A or id route | Web canonicalizes first |

---

## Gate completion

| Item | Status |
|------|--------|
| F.6 Phase 0 read-only audit | PASS |
| F.6 Phase 0 contract (this document) | **AGREED / CONTRACT LOCKED** |
| F.6 Phase 1 mobile URL parser | **IMPLEMENTED / TESTED** |
| F.6 Phase 1.1 `locationId` terminology | **PASS** — `BusinessLocation.id` (CUID), not RFC UUID |
| F.6 Phase 2 Flutter navigation integration | **IMPLEMENTED / TESTED** — `app_links` receiver, coordinator, executor, session city; **no** Android/iOS verified association |
| F.6 Phases 3–6 | **NOT STARTED** |

**Phase 1 query policy (implemented):** Only **`locationId`** on business URLs and **`q`** on search URLs; any other query key → **invalid**. Forbidden navigation keys (`route`, `url`, `deeplink`, `link`, `redirect`, `next`, `callback`) → **invalid** on all URLs.

**Phase 2 runtime pipeline (implemented):**

1. **`app_links`** — initial + stream URIs (no production host association / autoVerify / Associated Domains).
2. **`PublicDeepLinkCoordinator`** — single entry: parse → pending or execute; onboarding gate; 2s fingerprint dedupe.
3. **`PublicDeepLinkExecutor`** — locale via **`appLocaleProvider`**; **`deepLinkSessionCitySlugProvider`** for link city (not persisted **`cityProvider`**); go_router routes; business via **`GET /businesses/by-slug/:businessSlug?citySlug=`**; category/subcategory slug resolution via existing catalog APIs.
4. Discovery surfaces (home, categories, search, catalog providers) read **`discoveryCitySlugProvider`** / **`discoveryCityProvider`**.

**Next:** **F.6 Phase 3** — explicit approval required — Consumer Web / middleware / well-known coordination (not started).
