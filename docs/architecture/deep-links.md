# F.6 — Deep Links / App Links / Universal Links / NavigationTarget

**Gate:** F.6 — Deep Links / App Links / Universal Links  
**Status:** **F.6 PASS — DEEP LINKS ARCHITECTURE FINALIZED** (Phases **0–6** complete)  
**Umbrella:** **CLOSED / PASS** — production Verified App Links / Universal Links remain **external verification debt** (not claimed)

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

They **must not** be locale-redirected. **Phase 3 (implemented):** Consumer Web exempts `/.well-known/*` from F.5 locale middleware; route handlers serve association JSON at domain root. **Prepared/configurable ≠ OS verified** until real SHA-256 / Team ID and Phases **4–5**.

Association files must contain **real** platform identifiers and signing data only. **Do not fabricate** certificate fingerprints or Apple Team ID in the repository.

---

## 16. Android contract (implementation deferred)

**Current applicationId:** `kz.qalago.qalago_mobile`

**Primary mechanism:** Android App Links over HTTPS.

**Phase 4 (implemented):** `AndroidManifest.xml` — single `VIEW` intent-filter with `android:autoVerify="true"`, `https` + `qalago.kz`, `pathPrefix` `/ru` and `/kk`; `flutter_deeplinking_enabled=false` so **app_links** is the sole Flutter HTTPS receiver. Production OS verification still requires matching **`assetlinks.json`** on `qalago.kz` with the **installed app signing certificate** (Play App Signing SHA-256 for store builds).

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
| **2** | Flutter: HTTPS receiver, pending target, slug resolution, go_router, locale/city/locationId policies | **PASS** |
| **3** | Consumer Web: association endpoints + `/.well-known` middleware exemption | **PASS** |
| **4** | Android App Links + QA | **PASS (configured)** — manifest + `autoVerify`; **not** production domain verified |
| **5** | iOS Universal Links + QA | **PASS (configured)** — Associated Domains + app_links; **not** production verified |
| **6** | Cross-platform closure QA + E-contour regression | **PASS** — automated matrix + session-city lifecycle tests; Notifications E regression; **no** production OS association verification in scope |

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
| F.6 Phase 2 Flutter navigation integration | **IMPLEMENTED / TESTED** |
| F.6 Phase 3 Web association endpoints | **IMPLEMENTED / TESTED** |
| F.6 Phase 4 Android App Links manifest | **CONFIGURED / TESTED** |
| F.6 Phase 5 iOS Universal Links | **CONFIGURED / TESTED** (entitlements + static QA); **production verification pending** |
| F.6 Phase 6 | **PASS** — closure QA + Notifications E regression |
| F.6 umbrella | **CLOSED / PASS** |

**Phase 1 query policy (implemented):** Only **`locationId`** on business URLs and **`q`** on search URLs; any other query key → **invalid**. Forbidden navigation keys (`route`, `url`, `deeplink`, `link`, `redirect`, `next`, `callback`) → **invalid** on all URLs.

**Phase 2 runtime pipeline (implemented):**

1. **`app_links`** — initial + stream URIs (no production host association / autoVerify / Associated Domains).
2. **`PublicDeepLinkCoordinator`** — single entry: parse → pending or execute; onboarding gate; 2s fingerprint dedupe.
3. **`PublicDeepLinkExecutor`** — locale via **`appLocaleProvider`**; **`deepLinkSessionCitySlugProvider`** for link city (not persisted **`cityProvider`**); go_router routes; business via **`GET /businesses/by-slug/:businessSlug?citySlug=`**; category/subcategory slug resolution via existing catalog APIs.
4. Discovery surfaces (home, categories, search, catalog providers) read **`discoveryCitySlugProvider`** / **`discoveryCityProvider`**.

**Phase 3 Web association (implemented):**

- Routes: `app/.well-known/assetlinks.json/route.ts`, `app/.well-known/apple-app-site-association/route.ts`
- Config: `QALAGO_ANDROID_SHA256_CERT_FINGERPRINTS`, `QALAGO_APPLE_TEAM_ID` (see `apps/consumer-web/README.md`)
- Missing config: `assetlinks.json` → `[]` (200); AASA → empty `details` (404)
- Middleware: `isWellKnownAssociationPath` bypass in `middleware.ts` + redirect matrix

**Phase 4 Android (implemented):**

- Manifest App Links filter on `MainActivity` (`singleTop`, `exported=true` unchanged)
- Package `kz.qalago.qalago_mobile`; paths `/ru*`, `/kk*` under `https://qalago.kz`
- **`QALAGO_ANDROID_SHA256_CERT_FINGERPRINTS`** on Consumer Web must include the certificate of the **installed** APK (debug ≠ Play production)

**Phase 5 iOS (implemented):**

- `Runner.entitlements`: `applinks:qalago.kz` (with existing Sign in with Apple)
- `Info.plist`: `FlutterDeepLinkingEnabled=false` — **app_links** sole Flutter HTTPS path
- AASA remains Phase **3** Web endpoint + **`QALAGO_APPLE_TEAM_ID`** (no Team ID in repo)

**Phase 6 closure QA (verified):**

- Flutter deep-link suite **71** tests (parser/coordinator/executor + Android/iOS config + Phase **6** session-city lifecycle)
- Full mobile suite **1126/1126** at closure run
- Consumer Web **193/193** (incl. F.6 well-known **15/15**, F.5 middleware regression)
- Notifications E mobile tests **40/40** (typed destination; separate from `app_links`)
- Session city: link city = session context; persisted city unchanged; City Picker clears session (automated)
- Production Verified App Links / Universal Links: **NOT VERIFIED** — external debt

**Next:** **F.7** — legal migration — **NOT STARTED** — requires explicit approval.
