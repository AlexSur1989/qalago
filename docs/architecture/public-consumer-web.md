# Public consumer web (Stage 6.11F.1+)

## App

- Path: `apps/consumer-web`
- Port: **3005** (`npm run dev:consumer`)
- Stack: Next.js 15 App Router, React 19. **F.5 Phase 1** implements indexable **`/ru/`** / **`/kk/`** URL routing with URL-authoritative locale; locale-neutral routes are compatibility entries (see § F.5). **F.5 Phase 2** locale SEO (canonical, hreflang, sitemap) **physically verified**. **PublicShell** locale UI hotfix (**URL-authoritative shell labels**) **physically verified** — **`docs/changelog.md`**.
- **Client architecture:** Consumer Web is the **canonical public browser surface** (`https://qalago.kz` when configured). **Flutter Web** (`apps/mobile` web target, local e.g. `:8080`) is **DEV/QA only** — **not** a competing production public frontend. Native **Android/iOS** remain **`apps/mobile`** store clients — see **`docs/architecture/overview.md`**.

## F.1 foundation

- **PublicShell:** header nav, locale switcher, footer — legal links (**`/privacy`**, **`/terms`**, **`/account-deletion`**) and public support (**`/help`**) are **same-origin** on Consumer Web. **Business Web `/help`** remains **authenticated owner cabinet help** on the Business Web origin (not public support).
- **Config:** `lib/public-config.ts` — API base, public site base, `DEFAULT_CITY_SLUG`.
- **Cache:** `lib/cache-policy.ts` — ISR-friendly catalog fetches; layout `revalidate = 60`.
- **Branding:** Montserrat, tokens `--blue` / `--accent`, `app/icon.tsx`.

## F.2 city & category discovery

### Root

- **`/`** → **308 permanent redirect** to `/{DEFAULT_CITY_SLUG}` (`/uralsk`). No geolocation.

### City context

- Valid cities from **`GET /cities`** / **`GET /cities/:slug`** (active only). Invalid slug → **404** (no fallback to Uralsk on city routes).
- **City switcher** when multiple active cities; always navigates to `/{citySlug}` landing.

### Routes

| Route | Purpose |
|-------|---------|
| `/{citySlug}` | City discovery landing (categories preview + search form) |
| `/{citySlug}/categories` | All categories for city |
| `/{citySlug}/{categorySlug}` | Category businesses (+ subcategory tiles) |
| `/{citySlug}/{categorySlug}/{subcategorySlug}` | Subcategory-filtered businesses |
| `/{citySlug}/search?q=` | City-scoped search (`GET /businesses?search=&citySlug=`) |

### Reserved segments

Under `/{citySlug}/`, these are **not** category slugs (`lib/reserved-segments.ts`):  
`categories`, `search`, `promotions`, `business`, `privacy`, `terms`, `support`, `account-deletion`.  
Static App Router segments (e.g. `categories/`, `search/`) take precedence over `[categorySlug]`.

### Legacy compatibility

- `/categories` → `/{DEFAULT_CITY_SLUG}/categories`
- `/categories/{categoryId}` → resolve in default city → `/{DEFAULT_CITY_SLUG}/{categorySlug}` or 404

### Business pages (F.4 — CLOSED / PASS)

- **Canonical route (implemented + physical QA verified):** **`/{citySlug}/business/{businessSlug}`** with optional **`?locationId=`** for branch context. Server fetch: **`GET /businesses/by-slug/:businessSlug?citySlug=&locationId=`** (Phase 1 backend). Wrong-city owned **`locationId`** → **`permanentRedirect`** to **`/{actualCitySlug}/business/{businessSlug}?locationId=`** (409 normalization). **404** for unknown city/slug, non-public business, or no branch in city.
- **Discovery links (F.2):** category/search/subcategory **`BusinessList`** → canonical URLs with **`contextLocationId`** preserved in query when present.
- **Legacy compatibility:** **`/businesses/{id}?locationId=`** → **308 permanent redirect** to canonical URL (still **`noindex`** + **`robots.txt` disallow**). Resolves city via active/public branch data — not **`Business.cityId`**.
- **SEO canonical:** indexable business pages use **`/{citySlug}/business/{businessSlug}`** only — **no `?locationId=`** in canonical or sitemap. One sitemap URL per **(citySlug, businessSlug)** membership (deduped multi-branch same city).
- **Showcase (typed v1):** hero, contacts, branches, **`effectiveMedia`**, **`effectiveCatalog`**, **`effectivePromotions`**, read-only reviews preview, OSM map link when coords exist — no Web map, auth, or write review.
- **Structured data:** **`BreadcrumbList`** on business page; **`LocalBusiness` / `AggregateRating`** deferred.
- **Contract reference:** [future-extensibility-contracts.md](./future-extensibility-contracts.md) § Contract 1 + Phase 0.1 addendum; [api-contracts.md](./api-contracts.md) **`GET /businesses/by-slug/:businessSlug`**.

### Cache / rendering

- City/category/subcategory: ISR via fetch `revalidate` + layout revalidate.
- Search: **`dynamic = 'force-dynamic'`** (query-specific).

## F.3 SEO infrastructure

### Public origin (canonical / sitemap / OG)

- **`getConsumerWebOrigin()`** in `lib/seo/canonical.ts` — **not** the business-web legal host from `getPublicSiteBaseUrl()`.
- Env (first wins): `NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL`, `NEXT_PUBLIC_CONSUMER_WEB_URL`; dev default `http://localhost:3005`.
- Production target host: `https://qalago.kz` when configured; never hardcoded in components.
- **`buildCanonicalUrl()`** — controlled segments only; no open redirects; `page > 1` → `?page=N`; page 1 omits query; trailing slash omitted (matches App Router default).

### Metadata

- Root layout: `metadataBase`, title template `%s | QalaGo`, RU/KK description from cookie locale, site-level Open Graph / Twitter (no invented @handles).
- Dynamic: city, city categories, category, subcategory (RU/KK names from API + **URL locale** on **`/ru/`** / **`/kk/`** routes).
- **Search** `/{locale}/{citySlug}/search?q=`: **`robots: noindex, follow`**; locale-prefixed canonical reflects search path + encoded `q` when present.
- **Legacy business** `/businesses/{id}`: **`noindex, follow`** (redirect-only); indexable canonical business metadata on **`/{locale}/{citySlug}/business/{businessSlug}`** only.

### Locale SEO (F.5 — implemented)

- **F.5 CLOSED / PASS:** Indexable **locale-prefixed** URLs (**`/ru/`**, **`/kk/`**), reciprocal **hreflang**, locale **canonical/sitemap**, neutral entry **redirects**, URL-authoritative UI/SEO — see § **F.5** below and **`docs/changelog.md`** umbrella closure **2026-09-27**.

### robots.txt (`app/robots.ts`)

- Allow `/` for discovery pages.
- **Disallow** `/businesses/` (compatibility detail; meta noindex is primary).
- **Sitemap** `{origin}/sitemap.xml`.
- Does not block static assets / `_next`.

### sitemap.xml (`app/sitemap.ts`)

- **Sources:** `GET /cities`, per city `GET /categories?citySlug=`, per category `GET /categories/:id/subcategories` (bounded parallel per city).
- **Includes (F.5):** **`/ru/…`** and **`/kk/…`** pairs for each indexable path — city home, categories index, category, subcategory, **`/business/{businessSlug}`** (per city membership, deduped).
- **Excludes:** search, legacy `/categories*`, `/businesses/{id}`, business URLs with **`?locationId=`**, owner/admin paths, paginated list URLs (`?page=`).
- **Failure:** API error → **empty sitemap** (no fabricated URLs, no stack traces).
- **Scale:** single sitemap today; structure allows future sitemap index / segmented business sitemap when catalog grows.

### Structured data

- **Implemented:** root `WebSite` JSON-LD; `BreadcrumbList` on city categories / category / subcategory / **canonical business** pages.
- **Deferred:** `LocalBusiness`, branch/location schema, `AggregateRating`, `SearchAction` (F.4 Phase 2 did not add rich snippets).

### Pagination canonical

- Category/subcategory list pages: canonical includes `?page=N` when **N > 1** (distinct paginated content). Invalid `page` query normalized via `parsePageParam` (≤0, non-numeric → 1).

## F.5 locale SEO URL architecture

**Status:** **F.5 CLOSED / PASS — LOCALE SEO URL ARCHITECTURE IMPLEMENTED AND VERIFIED** (Phase **0** contract; Phase **1** + **1.1–1.4** routing; Phase **2** SEO; PublicShell locale UI hotfix — physical QA **`docs/changelog.md`** **2026-09-27**). **Non-blocking follow-up:** root **`<html lang>`** vs URL on soft nav — **not verified**; does not block F.5 closure. **F.6 Phase 0** contract locked — [deep-links.md](./deep-links.md) (**AGREED / NOT IMPLEMENTED**).

**Authority:** This section is the **canonical F.5 contract**. [api-contracts.md](./api-contracts.md) — no Catalog API changes required for locale routing.

### Scope

F.5 = indexable RU/KK public URL variants, **hreflang**, locale-aware canonical/sitemap rules, language-switcher URL semantics, compatibility redirects from locale-neutral entry URLs.

**Not F.5:** Web auth, favorites, interactive map, F.6 deep links / App Links / Universal Links, F.7 legal migration (separate stage — **§ F.7**), F.8 OG image pipeline, Home CMS, Events, City Discovery, 6.12B import, localized Business schema, machine translation of business-generated content.

### 1. Locale URL structure (LOCKED)

First path segment is the **public locale** (lowercase, closed allowlist):

| Segment | Meaning |
|---------|---------|
| **`ru`** | Russian public UI + RU QalaGo-owned metadata templates |
| **`kk`** | Kazakh public UI + KK QalaGo-owned metadata templates |

**Pattern:**

```text
/{locale}/{citySlug}/…
/{locale}/{citySlug}/categories
/{locale}/{citySlug}/{categorySlug}
/{locale}/{citySlug}/{categorySlug}/{subcategorySlug}
/{locale}/{citySlug}/business/{businessSlug}
/{locale}/{citySlug}/search?q=   (non-indexable — see §18)
```

Examples: `/ru/uralsk`, `/kk/uralsk/business/bar-code-51`.

**Parsing invariant:** after a supported locale, the next arbitrary segment is
`citySlug`. Middleware does not keep a city allowlist and does not use current
backend city data to reinterpret it. Locale roots (`/ru`, `/kk`) insert the
default city. The only locale-level default-city compatibility shorthands are
`categories` and `search`, for example `/kk/categories` →
`/kk/uralsk/categories`. `business` is not such a shorthand; canonical
business URLs include the city segment.

**Forbidden for indexable locale identity:**

- `?lang=ru` / `?lang=kk` (or any query-only locale)
- Locale subdomains
- Deriving the **indexable** language version solely from `qalago_locale` cookie or `Accept-Language`

### 2. Slug policy (LOCKED)

Locale changes **UI / QalaGo metadata language**, not entity identity. **No translated slugs in F.5:**

- `citySlug`, `categorySlug`, `subcategorySlug`, `businessSlug` remain **stable** (same as F.2/F.4).
- Example: `/ru/uralsk/business/bar-code-51` and `/kk/uralsk/business/bar-code-51` — same slug, different locale prefix.
- **No** new localized slug columns/tables; **zero** DB/schema impact.

### 3. URL language authority (LOCKED)

On **`/ru/…`** or **`/kk/…`**, the **URL locale is authoritative** for SSR HTML language and QalaGo-owned metadata.

It **must override** `qalago_locale`, `Accept-Language`, and prior browsing preference.

Example: cookie `ru`, request `/kk/uralsk` → **KK UI** (not RU because of cookie).

Required for deterministic SSR, caching, and SEO. **No cookie-dependent HTML language** for the same locale-prefixed URL.

### 4. Cookie role (LOCKED)

`qalago_locale` remains a **user preference** (not SEO page identity after F.5 ships).

- May be **updated** when the user explicitly switches language (§7).
- May be used to choose **destination locale** for **locale-neutral compatibility entry** URLs (§5).
- On **`/ru/…` or `/kk/…`**, cookie must **not** change rendered language vs URL.

### 5. Locale-neutral legacy URLs (LOCKED)

Today’s paths such as `/uralsk`, `/uralsk/categories`, `/uralsk/{categorySlug}`, `/uralsk/business/{businessSlug}` remain **compatibility entry routes** after F.5. They must **not** become a third independently indexable locale version.

**F.5 Phase 1+** permanently redirects them **once** to a locale-prefixed URL (no chains). **Implemented (Phase 1.1):** neutral compatibility is **middleware-only** (no `app/[citySlug]` render tree).

| Condition | Redirect target locale |
|-----------|-------------------------|
| Valid `qalago_locale` cookie (`ru` or `kk`) | That locale |
| No valid cookie | **`ru`** (default) |

Examples:

- `/uralsk` → `/ru/uralsk` (no cookie) or `/kk/uralsk` (cookie `kk`)
- `/uralsk/business/bar-code-51` → `/ru/uralsk/business/bar-code-51` (no cookie)

**Do not** use IP geolocation or city to infer language. **Do not** serve parallel locale-neutral canonical HTML alongside `/ru` and `/kk`.

**Root `/`:** remains F.1 behavior until Phase 1 defines whether it redirects to `/ru/{DEFAULT_CITY_SLUG}` or locale-neutral city first; **default locale for any neutral entry without cookie is `ru`** (§5 table).

### 6. Redirect status (LOCKED)

Locale-neutral → locale-prefixed: **permanent** redirect semantics (Next.js permanent redirect; Phase 1 verifies actual HTTP status). **Single hop** to final `/ru/…` or `/kk/…`.

### 7. Language switcher (LOCKED)

Preserve the **current logical page** by swapping locale segment only:

- `/ru/uralsk` ⇄ `/kk/uralsk`
- `/ru/uralsk/restaurants` ⇄ `/kk/uralsk/restaurants`
- `/ru/uralsk/business/bar-code-51?locationId=ABC` ⇄ `/kk/uralsk/business/bar-code-51?locationId=ABC`

Preserve **only** explicitly supported safe query context: **`locationId`**, validated **`page`** where applicable, and trimmed **`q`** on search (and anywhere **`q`** defines page state). Do **not** preserve arbitrary tracking/unknown query params unless current routing policy explicitly allows them.

Update `qalago_locale` on explicit switch. **Do not** navigate to Home when an equivalent page exists.

**Implemented (Phase 1.4):** Client **`LocaleSwitcher`** treats **pathname locale** as the current active locale (layout/cookie may lag after soft navigation); fallback layout locale only when the path has no supported prefix.

### 8. Canonical (LOCKED)

Each **locale-prefixed indexable** page is **self-canonical**:

- RU: `https://{origin}/ru/…` — canonical must **not** point to KK.
- KK: `https://{origin}/kk/…` — canonical must **not** point to RU.

Locale-neutral compatibility URLs are **not** independent canonical pages (redirect-only entry).

**F.4 preserved:** **`locationId` must not appear in canonical** (or sitemap). Example: request `/kk/aktobe/business/example?locationId=L2` → canonical `https://{origin}/kk/aktobe/business/example`.

Pagination: F.3 rule applies on locale-prefixed paths (`?page=N` when **N > 1** only).

### 9. hreflang (LOCKED)

For pages with both supported locales, each locale version outputs **reciprocal** alternates:

| `hreflang` | Target |
|------------|--------|
| **`ru`** | `{origin}/ru/…` (same logical path) |
| **`kk`** | `{origin}/kk/…` (same logical path) |
| **`x-default`** | **`{origin}/ru/…`** (same logical path) — **RU** is default when no valid stored preference on neutral entry |

**Do not** point `x-default` at a locale-neutral redirect URL.

Both RU and KK pages list **ru + kk + x-default**.

### 10. Content / translation availability (LOCKED)

F.5 provides **language-specific UI, routing, and SEO identity** — not automatic translation of business-generated content.

- QalaGo UI labels, nav, breadcrumbs framing: follow **URL locale**.
- Business **brand names** unchanged.
- Descriptions/text from API remain in stored language when no localized model exists; **do not** machine-translate business content to “fill” KK/RU routes.
- Do **not** falsely claim translated entity body copy in metadata where the backend has no localized variant.
- RU and KK routes remain valid alternates because the **QalaGo shell + metadata templates** are locale-specific.

### 11. Metadata language (LOCKED)

QalaGo-owned metadata (title/description templates, breadcrumb labels where templated) follows **URL locale** on `/ru/` and `/kk/` pages. Do not fabricate translated business descriptions. Document fallback: use available API fields + locale-appropriate templates; brand names verbatim.

### 12. Sitemap (LOCKED)

**Include** indexable **locale-prefixed** URLs only. For each public page in both locales, emit **both**:

- `/ru/…`
- `/kk/…`

**F.4 multi-city preserved:** e.g. business in Uralsk and Aktobe → four business URLs per slug (ru/kk × city), deduped per city membership, **no** `?locationId=`.

**Exclude:** locale-neutral compatibility URLs, `/businesses/{id}`, search query URLs, non-indexable queries, legacy `/categories*`, paginated list URLs if policy unchanged from F.3.

Optional Next.js sitemap alternate-language metadata in Phase 2+ must not contradict this URL set.

### 13. robots (LOCKED)

Keep **`/businesses/`** disallowed (F.3/F.4). **Do not** disallow `/ru/` or `/kk/` solely as locale variants. Neutral entry relies on **redirect**, not robots blocking of indexable locale routes.

### 14. F.4 multi-city under locale (LOCKED)

Routing stack: **locale → city → business → optional branch context**.

F.4 slug/city/`locationId` semantics unchanged beneath locale prefix.

**Wrong-city owned `locationId`:** normalize city while preserving **locale** and **`locationId`**.

Example: `/kk/uralsk/business/example?locationId=AKTOBE_BRANCH` → `/kk/aktobe/business/example?locationId=AKTOBE_BRANCH` (must **not** switch to `/ru/`).

Foreign/invalid `locationId`: same safe city-default / 404 rules as F.4; no foreign branch leak.

### 15. Temporary `/businesses/{id}` (LOCKED)

F.4 legacy route remains compatibility + **noindex**. After F.5, final redirect target is **locale-prefixed** canonical business URL:

- Locale from cookie if valid, else **`ru`**.
- Preserve valid owned branch/city context; **prefer one direct hop** to `/ru/…` or `/kk/…` (avoid neutral city intermediate if possible).

### 16. Reserved segments (LOCKED)

**`ru`** and **`kk`** are **top-level reserved** segments — never interpreted as `citySlug` or other dynamic public entity.

Extend `lib/reserved-segments.ts` (and routing) in Phase 1. Preserve static routes: `robots.txt`, `sitemap.xml`, `favicon.ico` → `/icon` (F.4 Phase 2.1 — do not regress).

Under `/{locale}/{citySlug}/`, existing F.2 reserved segments unchanged (`categories`, `search`, `business`, …).

### 17. Internal links (LOCKED)

Inside a locale-prefixed session, **server-rendered internal links preserve active locale** (e.g. `/kk/uralsk` → `/kk/uralsk/restaurants` → `/kk/uralsk/business/example`). Do not route KK users through locale-neutral paths on every click.

### 18. Search / non-indexable routes (LOCKED)

F.3 **noindex** for search remains. **`/ru/{citySlug}/search`** and **`/kk/{citySlug}/search`** stay **noindex, follow**; locale prefix does not override route-specific robots policy.

### 19. OG / social (LOCKED)

F.8 OG **image asset pipeline** out of scope for **F.5** (deferred to **`§ F.8`**). OG/Twitter **URLs and text metadata** must stay consistent with active locale canonical. No new OG image generation in F.5.

### 20. F.6 deep-link compatibility (LOCKED)

F.6 (App Links, Universal Links, NavigationTarget) **not implemented in F.5**. Locale-prefixed URLs are the **stable public URLs** F.6 resolves — do not introduce a routing model that forces another public URL breaking change. **Canonical F.6 contract:** [deep-links.md](./deep-links.md) (**Phase 0 — AGREED / CONTRACT LOCKED**).

### 21. Cache / SSR (LOCKED)

Locale-prefixed HTML language **must be derivable from URL alone**. Avoid cache variants keyed on `qalago_locale` for indexable `/ru/` and `/kk/` pages. Cookie affects **neutral entry redirect** and **preference**, not canonical page language.

### 22. Security (LOCKED)

Locale allowlist: **`ru`**, **`kk`** only. No redirect to user-supplied arbitrary locale/path. Language-switch targets built from **validated** route segments. Preserve F.4 validation for `citySlug`, `businessSlug`, `locationId`; no foreign BL leakage via locale redirects.

### 23. DB / API (LOCKED)

**No** Prisma/schema/migration/backfill/locale table. Catalog API unchanged for locale routing; Consumer Web continues public SSR fetches. If implementation discovers a mandatory backend requirement → **stop** for architecture review.

### Implementation phases (reference — not started)

| Phase | Scope |
|-------|--------|
| **0** | This contract — **PASS** |
| **1+** | Routes, redirects, metadata, hreflang, sitemap — **explicit approval required** |

---

## F.7 — Legal migration

**Gate:** F.7 — Legal migration  
**Status:** **F.7 CLOSED / PASS — LEGAL MIGRATION FINALIZED**  
**Umbrella:** **CLOSED / PASS** (Phases **0–5** + Hotfix **1** + final read-only audit + umbrella docs closure)

**Authority:** This section is the **canonical F.7 contract**. Other docs **reference** this section; they must not duplicate full contract text.

**Purpose:** Move **public / store-facing legal pages** from **Business Web** to **Consumer Web** so **`qalago.kz`** (Consumer Web origin) is the **canonical public legal host**. This is **not** a broad Consumer Web feature stage.

**Depends on:** F.5 **CLOSED** (discovery locale URLs unchanged); F.6 **CLOSED** (no new deep-link families); Stage **6.3** / **6.9** legal foundation (static pages, API/admin orthogonal).

### 1. Canonical legal URLs (LOCKED)

Production canonical URLs are **locale-neutral** at site root:

```text
https://qalago.kz/privacy
https://qalago.kz/terms
https://qalago.kz/account-deletion
```

**Do not** make **`/ru/privacy`**, **`/kk/privacy`**, or other locale-prefixed paths the **canonical** legal URLs in F.7.

**Reason:** Flutter (`LegalConstants`), store compliance ([store-compliance-links.md](../store/store-compliance-links.md)), and existing configs already target root paths.

Legal pages may render **localized QalaGo-owned chrome** (RU/KK) via the **existing locale preference mechanism** (cookie / client preference — same family as Business Web legal chrome today). **URL path locale prefixes are not introduced** for legal pages in F.7.

**F.5** locale-prefixed **discovery** architecture (`/ru/{citySlug}/…`, `/kk/{citySlug}/…`) remains unchanged.

### 2. Content model (LOCKED)

F.7 **migrates** the existing **static** legal-page implementation and content pattern from **`apps/business-web`** (`/privacy`, `/terms`, `/account-deletion` TSX + env placeholders) to **`apps/consumer-web`**.

**Do not** in F.7:

- Switch Consumer Web legal body rendering to **`GET /legal/documents/:type`**
- Change **Prisma** or run migrations
- Change **Catalog API**
- Redesign **Admin** legal publishing

**`GET /legal/documents/:type`**, acceptance APIs, and **admin-web** legal tooling remain **orthogonal**. A **future separate stage** may connect published legal documents to Consumer Web.

### 3. Legal review / production publication (LOCKED)

**Technical migration** may proceed **before** production legal/counsel approval.

**Do not** claim production legal approval in F.7 milestones.

**Do not** invent operator name, legal address, support/privacy emails, jurisdiction, company identifiers, or other legal facts in code/docs.

**[legal-review-required.md](../legal-review-required.md)** remains the **production publication gate** for real operator data and counsel-approved copy.

Draft notices and env placeholders may remain until that gate clears.

### 4. Support / help

**F.7** migrated legal pages only (`/privacy`, `/terms`, `/account-deletion`). **Public help** was implemented in a **separate post-F.7 stage** (**PUBLIC HELP PASS** — **`docs/changelog.md`**):

- **Canonical public support:** locale-neutral **`/help`** on Consumer Web (`https://qalago.kz/help` when configured).
- **Guest-safe** static consumer FAQ (aligned with Flutter **`ProfileHelpScreen`** RU/KK copy); support contact via env placeholders — not production legal approval.
- **`/support`** on Consumer Web: **compat redirect** to **`/help`** (no duplicate page).
- **Business Web `/help`:** authenticated **owner cabinet help** — unchanged; not a substitute for public browser support.

### 5. Business Web transition (LOCKED)

Consumer Web becomes the **canonical public legal host**.

Business Web **must not** remain a **competing canonical** public legal origin after F.7 implementation.

**Policy:** Business Web legacy public routes **`/privacy`**, **`/terms`**, **`/account-deletion`** **redirect** to the configured **Consumer Web public origin** once migration is implemented (exact redirect mechanism — Phase **3** implementation detail).

Use existing **public-site / base URL configuration** (`NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL`, `getConsumerWebOrigin()` / `getPublicSiteBaseUrl()` family — **environment-safe**; do not hardcode production `qalago.kz` into local dev where helpers already exist).

### 6. Localization (LOCKED)

- **Chrome** (titles, nav labels, draft notices, footer labels): **RU/KK capable** (QalaGo-owned strings).
- **Legal body:** preserve existing **source language** (RU draft today; KK requires proper legal/content approval per [ru-kk-glossary.md](../localization/ru-kk-glossary.md)).
- **Do not** machine-translate legal text.
- **Do not** auto-translate legal body because UI locale is KK.

### 7. SEO (LOCKED)

- **Canonical:** each legal page **self-canonicalizes** to its locale-neutral URL (`/privacy`, `/terms`, `/account-deletion`) on **`getConsumerWebOrigin()`**.
- **Do not** create F.5-style **`/ru/` / `/kk/` hreflang URL pairs** for legal pages in F.7.
- **Do not** add locale-prefixed legal duplicates to **`sitemap.xml`**.
- **Indexability:** legal pages are **indexable** public compliance documents (aligned with store listing requirements in [store-compliance-links.md](../store/store-compliance-links.md)); **one canonical URL per legal type**. Optional: include the three locale-neutral legal URLs in sitemap as **single entries** in a later F.7 phase — **must not** alter F.5 discovery sitemap rules for `/ru/` / `/kk/` catalog paths.
- **Do not** regress F.5 discovery **canonical / hreflang / sitemap** behavior.

### 8. PublicShell (LOCKED)

After F.7 implementation, **PublicShell** footer legal links **must resolve on the same Consumer Web public origin** (same-origin paths or origin from Consumer Web config).

They **must not** depend on Business Web as the legal host.

**Do not** alter unrelated footer navigation (discovery links).

### 9. Flutter (LOCKED)

Flutter legal URLs **remain stable**:

```text
https://qalago.kz/privacy
https://qalago.kz/terms
https://qalago.kz/account-deletion
```

(`QALAGO_PUBLIC_BASE_URL` / `LegalConstants` — no routing redesign.)

**No** F.6 deep-link changes. **No** auth changes for F.7.

### 10. Account deletion boundary (LOCKED)

**`/account-deletion`** on the public site is a **public information** page (process, rights, contacts).

**Authenticated account deletion** remains the existing **in-app / API** flow ([api-contracts.md](./api-contracts.md) account deletion).

F.7 **must not** merge these concepts.

### 11. Compatibility (LOCKED)

| Contour | F.7 impact |
|---------|------------|
| **6.12A** | **None** — no Business / BusinessLocation catalog semantics |
| **F.4** | **None** — no change to public business URLs or slug API |
| **F.5** | **None** — discovery locale-prefixed routes unchanged |
| **F.6** | Legal root URLs are **Web/legal destinations** only; **not** new mobile **`PublicDeepLinkTarget`** families (reserved city segments `privacy` / `terms` / `account-deletion` under `/{locale}/{citySlug}/` remain invalid as category slugs — unchanged) |

### 12. Out of scope (LOCKED)

Web authentication; favorites; Consumer Web interactive map; City Discovery; Home CMS; Events; ads engine; BusinessLocation changes; Prisma changes; Catalog API changes; generalized saves/bookmarks; notification preferences; F.6 deep-link architecture changes; **F.8** OG image pipeline; **`/support`** implementation; legal API integration for page body; Admin legal redesign; **production legal approval itself**.

### 13. Implementation phases — COMPLETED

| Phase | Scope | Status |
|-------|--------|--------|
| **0** | Contract lock — **docs only** | **PASS** |
| **1** | Consumer Web legal routes/pages (static migration from Business Web pattern) | **PASS** |
| **2** | PublicShell / footer / config **same-origin** migration | **PASS** |
| **3** | Business Web legacy legal-route **redirects** to Consumer Web origin | **PASS** |
| **4** | Legal page localization chrome + SEO metadata/robots/sitemap policy implementation | **PASS** |
| **5** | Cross-app + store-compliance regression + physical browser QA (+ Hotfix **1**) | **PASS** |
| **Final** | Read-only umbrella audit + docs closure (**F.7 CLOSED / PASS**) | **PASS** |

**Milestone:** **F.7 PASS — LEGAL MIGRATION FINALIZED**. **F.8** — **`§ F.8`** (**F.8.0 PASS**, **F.8.1 PASS**); **F.8.2+ NOT STARTED**.

**External production legal/content debt** ([legal-review-required.md](../legal-review-required.md)) remains **separate** — operator identity, legal address, privacy/support contacts, jurisdiction/retention/liability/processors/log policy review, approved KK legal translation, production **`LEGAL_*`** values, HTTPS/deploy-dependent claims, documented store/product gaps. **Not** unfinished F.7 technical architecture.

**Next:** **F.8.2+** require **explicit approval** — **`§ F.8`**; **do not auto-start F.8.2**.

---

## F.8 — Social preview / OG image pipeline

**Gate:** F.8 — Social preview / OG image pipeline  
**Status:** **F.8 CLOSED / PASS — SOCIAL PREVIEW / OG IMAGE PIPELINE FINALIZED** (Phases **F.8.0–F.8.5**). **Public HTTPS social crawler previews:** **NOT VERIFIED** — external production debt (**§18**).

**Authority:** This section is the **canonical F.8 contract**. Other docs **reference** this section; they must not duplicate full contract text.

**Purpose:** Complete the **social-preview metadata** work already started by **F.3** (origin, text OG/Twitter), **F.4** (business page metadata text), **F.5** (locale canonical + **`openGraph.url`**), **F.7** (locale-neutral legal metadata text), and **Public Help** (`/help` metadata text). **F.8** adds **preview images** and **`summary_large_image`** card type only — **not** canonical, hreflang, or sitemap redesign.

**Depends on:** F.3 **CLOSED**; F.4 **CLOSED**; F.5 **CLOSED**; F.6 **CLOSED** (no deep-link changes); F.7 **CLOSED**; Public Help **CLOSED**; **6.12A** BusinessLocation semantics unchanged.

### 1. Scope — IN (LOCKED)

- Open Graph preview images (`og:image`)
- Twitter/X card images (`twitter:image`)
- Default **QalaGo** social preview fallback
- Optional **safe Business-specific** social preview image (Business grain)
- **Absolute**, crawler-visible image URLs
- Automated **social-preview regression** coverage (implementation phases)
- **Physical / public** social-preview verification against deployed HTTPS origin (closure phase — separate from local implementation PASS)

### 2. Scope — OUT (LOCKED)

Canonical URL redesign; hreflang redesign; sitemap redesign except image-related metadata if truly necessary; **LocalBusiness / AggregateRating JSON-LD**; Web auth; favorites; Consumer Web interactive map; write reviews; Home CMS; Events; City Discovery; ads engine; notification preferences; Admin CMS; Business Web redesign; **Flutter Web** (DEV/QA only); **F.6** deep-link architecture changes; **BusinessLocation** schema/API changes; **6.12B**; **DB migrations**; **Catalog API** changes unless a **separately approved** dependency becomes necessary.

Historical deferrals in **F.3 / F.5 / F.7** (“F.8 OG image pipeline out of scope”) remain valid history — **F.8** is the stage that implements what those stages deferred.

### 3. Card type (LOCKED)

Participating Consumer Web public pages use:

```text
twitter:card = summary_large_image
```

**Existing** metadata governed by closed SEO stages remains unchanged:

- **title**
- **description**
- **canonical** / **`openGraph.url`** (must stay **equal** to active page canonical)

**F.8** may add **images** and **card type** only. **F.8 MUST NOT** redefine canonical URLs, hreflang pairs, or F.7 locale-neutral legal/help URL policy.

### 4. Image dimensions (LOCKED)

Standard social preview canvas:

```text
1200 × 630 px
```

Aspect ratio approximately **1.91:1** — canonical QalaGo social-preview size.

**One** compatible OG image contract serves **Open Graph** and **Twitter/X**. **No** multiple platform-specific image generators in F.8.

### 5. Default QalaGo fallback (LOCKED)

F.8 must provide **one** canonical QalaGo fallback preview.

**Conceptual content:** QalaGo branding; logo/wordmark; clean branded background; short product identity only.

**Must NOT** include: prices; ads; promotions; dynamic statistics; review ratings; user data; branch-specific information.

**Fallback applies when:**

- Route has no custom image
- Business has no safe eligible cover
- Media URL unavailable
- Media rejected by **§8** safety policy

**F.8.1 implementation (LOCKED):** **static PNG** at **`/og/qalago-default.png`** (**1200×630**) under **`apps/consumer-web/public/`**, composed from repository **`qalago_wordmark.png`** + brand **`#00a8d6`** background. Regenerate via **`apps/consumer-web/tool/generate-default-og.ps1`** when branding changes. Shared metadata: **`lib/seo/social-preview.ts`** + **`withDefaultSocialPreview()`** in **`page-metadata.ts`**. **No** `ImageResponse` OG route in F.8.1.

### 6. Route matrix (LOCKED)

| Route family | Initial F.8 behavior |
|--------------|----------------------|
| **Root / home** (`/` → city landing) | QalaGo fallback |
| **City** `/{locale}/{citySlug}` | QalaGo fallback |
| **Category** `/{locale}/{citySlug}/{categorySlug}` | QalaGo fallback |
| **Subcategory** `/{locale}/{citySlug}/{categorySlug}/{subcategorySlug}` | QalaGo fallback |
| **Search / non-indexable** | **No** special F.8 social contract; preserve existing **noindex** / canonical behavior |
| **Business** `/{locale}/{citySlug}/business/{businessSlug}` | Preferred image order: **(1)** eligible public Business **cover**; **(2)** eligible public **effective Business media** only if explicitly approved by implementation safety rules; **(3)** QalaGo fallback. **Grain: Business** — not BusinessLocation |
| **Legal / help** (see **§10**) | QalaGo fallback; no separate legal/support image generator required for initial F.8 |

### 7. BusinessLocation (LOCKED)

Preserve **6.12A**: **Business** = brand/entity; **BusinessLocation** = physical branch.

- **No** location-specific **canonical** social URLs
- For `...?locationId=...`: **`openGraph.url`** remains canonical Business URL **without** `locationId`
- Social preview identity remains **Business-grain**
- **`locationId`** must **not** select a separate canonical OG identity
- **No** BusinessLocation schema/API changes for F.8
- **No** sibling BusinessLocation media leakage into Business OG image

### 8. Business media safety (LOCKED)

**Mandatory:**

- F.8 **must NOT** introduce unrestricted server-side fetching/compositing of arbitrary **`http(s)`** business image URLs
- An arbitrary remote URL must **never** automatically become a server-side **`ImageResponse`** fetch target

Before Business media may appear in social previews, implementation **must classify media origin**. Eligible media is limited to **QalaGo-controlled / publicly trusted** media origins per existing upload/media architecture (e.g. same-origin Consumer Web, configured API **`/uploads/`** rewrite family — exact allowlist is an **F.8.1+** implementation detail).

If safety cannot be proven → **QalaGo fallback**. **Do not** fail page metadata or page render when Business media is invalid. **No** private/authenticated media. **No** PII in preview images.

### 9. Locale — discovery / business (LOCKED)

RU and KK keep existing **locale-prefixed canonical URLs** (e.g. `/ru/uralsk/…`, `/kk/uralsk/…`).

**`openGraph.url`** continues to equal the **active locale canonical**.

The **image URL** **may** be shared across RU/KK when the image contains **no locale-dependent text**. F.8 does **not** require duplicate RU/KK image assets unless a later phase has a real locale-specific requirement.

### 10. Locale-neutral public pages (LOCKED)

These remain **locale-neutral** (no `/ru/privacy`, `/kk/help`, etc. via F.8):

```text
/privacy
/terms
/account-deletion
/help
```

**`openGraph.url`** remains each page’s **neutral canonical** URL. Initial F.8: **common QalaGo fallback image** for all four.

### 11. Twitter / X (LOCKED)

**`twitter:card` = `summary_large_image`**. Twitter/X image uses the **same eligible preview image** as Open Graph. **No** separate visual pipeline unless a **future** requirement justifies it.

### 12. Absolute URL (LOCKED)

Crawler-facing image metadata resolves to **absolute** URLs under:

- Configured public **Consumer Web** origin (`getConsumerWebOrigin()` / **`NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL`**, **`NEXT_PUBLIC_CONSUMER_WEB_URL`**), **or**
- An **explicitly trusted** public QalaGo media origin per **§8**

Production public origin: **`https://qalago.kz`** when configured — **not** hardcoded into components; **not** derived from arbitrary request **Host** headers. Local dev may emit **localhost** URLs for automated/local validation; that does **not** count as production social-preview verification.

### 13. Failure (LOCKED)

OG image handling is **fail-safe**. On missing/invalid/untrusted/unsupported media, lookup failure, or unsafe metadata construction → **QalaGo fallback**. Public page **must** continue rendering. F.8 image failure **must not** convert a valid public page into **500**.

### 14. Cache (LOCKED)

Prefer **cacheable / stable** preview assets. **No** per-request random output. **No** timestamps or volatile content in generated previews. Business image updates may change referenced media naturally; **no** artificial cache busting unless technically necessary.

### 15. Security / privacy (LOCKED)

- No arbitrary server-side remote image fetching
- No private or authenticated resources in previews
- No secrets in metadata
- No user PII in previews
- No raw HTML rendering into generated images
- Cap/sanitize dynamic textual content if dynamic images are introduced later
- Invalid media → fallback
- Use configured public origin
- Page availability independent of OG image availability

### 16. Implementation phases (LOCKED)

| Phase | Scope | Status |
|-------|--------|--------|
| **F.8.0** | Contract lock — **docs only** | **PASS** |
| **F.8.1** | Default QalaGo OG image + shared metadata plumbing | **PASS** |
| **F.8.2** | Shared fallback on indexable public route families; preserve F.5/F.7 canonical behavior | **PASS** (F.8.1 plumbing + route matrix verified; **`f8-phase2-route-rollout.test.ts`**) |
| **F.8.3** | Business-specific eligible cover + strict trusted-media fallback | **PASS** — **`lib/seo/business-social-preview.ts`**; **`coverImageUrl` only**; **`effectiveMedia` deferred** (branch-grain ambiguity) |
| **F.8.4** | Full automated regression (metadata, canonical, locale, legal/help, business fallback, build) | **PASS** — **`f8-phase4-automated-gate.test.ts`**; § **F.8.17** criteria **1–18** automated (**19** = F.8.5 external) |
| **F.8.5** | Physical/public social-preview QA + F.8 closure | **PASS** — local physical browser QA (**localhost:3005**, **2026-09-28**); public crawler QA **NOT VERIFIED** (**§18**) |

**Do not auto-start F.8.1** without explicit approval.

### 17. Final F.8 acceptance (LOCKED)

F.8 umbrella **CLOSED / PASS** requires **all** of:

1. Participating public pages expose **`og:image`**
2. Participating public pages expose **`twitter:image`**
3. Twitter card is **`summary_large_image`**
4. Image dimensions contract = **1200×630**
5. Absolute production image URLs valid under configured public origin / trusted media origin
6. Existing **`openGraph.url`** remains equal to **canonical**
7. RU/KK canonical behavior unchanged
8. Legal/help routes remain locale-neutral
9. Business pages safely use eligible Business image or fallback
10. **`locationId`** does not change Business OG identity
11. Missing/invalid/untrusted Business media falls back safely
12. No arbitrary server-side remote image fetch
13. **F.4** regression PASS
14. **F.5** regression PASS
15. **F.7** regression PASS
16. **Public Help** regression PASS
17. Consumer Web full tests PASS
18. Consumer Web production **build** PASS
19. **Physical/public crawler preview verification** recorded separately (**§18**)

### 18. Production verification debt (LOCKED)

Local tests and localhost builds **cannot** prove external social previews. Final production verification requires **deployed HTTPS** origin and may include Telegram, WhatsApp, Facebook/Open Graph debugger, X/Twitter-compatible preview tools. **Do not** claim these verified during local implementation-only milestones.

**Criterion 19 closure interpretation (LOCKED intent, not a contract rewrite):** § **F.8.17** item **19** is satisfied when **physical/local** social-preview QA is **recorded** and **public HTTPS crawler** verification is **recorded separately** as **external production debt** — same pattern as **F.6** (implementation **CLOSED / PASS** with production association verification deferred). **Do not** conflate localhost view-source QA with Telegram/WhatsApp/Facebook/X crawler PASS.

**F.8.5 local physical QA (recorded — 2026-09-28, Consumer Web `http://localhost:3005`):** **PASS** on tested surfaces: **`/ru/uralsk`**, **`/kk/uralsk`**, **`/help`**, **`/privacy`**, **`/terms`**, **`/account-deletion`**, **`/ru/uralsk/search`** (**noindex** preserved), **`/support` → `/help`**, **`/ru/uralsk/business/bar-code-51`** (with and without real **`locationId`** — OG URL without query; fallback image), **`/ru/uralsk/business/coffee-house-uralsk`** (external Unsplash **`coverImageUrl`** → QalaGo fallback). Direct **`/og/qalago-default.png`** render **PASS**. **Trusted `/uploads/…` Business cover:** **NOT OBSERVED** in catalog during manual QA (automated **F.8.3/F.8.4** remain authoritative for that path). Legacy **`/businesses/test`** invalid id → **404** (not a full legacy redirect matrix sign-off).

**External production debt (NOT VERIFIED):** deployed **`https://qalago.kz`** HTTPS social crawlers (Telegram, WhatsApp, Facebook/Open Graph debugger, X/Twitter-compatible preview). **No** claim of production or crawler verification in F.8 closure.

**Milestone:** **F.8 PASS — SOCIAL PREVIEW / OG IMAGE PIPELINE FINALIZED**.

**Next (architecture):** **F.4–F.8 remain CLOSED** — do not rebuild. Product completion follows **§ CW** (CW.1 locked **2026-10-02**).

---

## CW — Consumer Web product track (v1)

**Status:** **CW.1 PASS — CONSUMER WEB PRODUCT SCOPE LOCKED** (docs only; **no implementation** in CW.1).  
**Authority:** This section is the **canonical Consumer Web v1 contract** after closed **F.4–F.8** architecture. **Do not reopen** F-series routing/SEO/legal/OG decisions except to preserve them during CW implementation.

### CW.0 baseline (read-only audit)

CW.0 established: **`apps/consumer-web`** implements guest discovery shell (city home, categories, search, canonical business pages, legal/help); **323** vitest tests; **not in CI**; no web auth, ads, analytics, promotions page, or backend home config yet. See engineering history **`docs/changelog.md`**.

### CW.1 — Product scope lock (APPROVED)

**Selected scope:** **Option B — GUEST + RICHER DISCOVERY**.

Consumer Web v1 is a **strong public discovery product** for multi-city local discovery (MVP city **Uralsk / Oral**). It **does not** require full authenticated mobile parity. **Flutter Mobile** remains the richer authenticated consumer surface.

**Closed tracks (must not reopen):** **6.12A**, **MAP** closed substages, **AOP**, **BIZ**, **UXA**, **F.4–F.8**, **KZ-C.1** Android FCM physical QA.

### CW v1 — IN SCOPE (must complete before CW CLOSED)

1. Rich public **city home** (driven by backend home configuration — § CW home)
2. **Categories** and **subcategories**
3. **Search** (city-scoped; preserve F.5 search noindex)
4. **Business detail** pages (branch-aware; § CW business detail)
5. **BusinessLocation / branch selection** (`?locationId=`; public branches list)
6. **Address** and **external navigation/map link** (§ CW map — not embedded map)
7. **Work hours** on detail (from effective physical / branch data)
8. **Business contacts** (phone, WhatsApp, Instagram, website)
9. **Read-only reviews** (§ CW reviews)
10. **Promotions** on business pages **and** dedicated **city promotions discovery** page (§ CW promotions)
11. **Web advertising** via unified monetization backend (§ CW ads)
12. **Web analytics** via unified analytics backend (§ CW analytics)
13. **RU / KK** (preserve **KZ-C.1C** URL/cookie semantics; do not regress F.5)
14. **Responsive** desktop and mobile web
15. **Brand alignment** (§ CW brand — consumer-oriented; not UXA backoffice clone)
16. **Loading / empty / error** states on major surfaces
17. **Accessibility baseline** (not formal WCAG certification in CW unless explicitly staged)
18. **SEO** — **preserve** closed F.3/F.4/F.5/F.8 behavior; LocalBusiness/AggregateRating JSON-LD remain **enhancements** unless later promoted
19. **Deep links** — preserve F.6 code paths; production domain verification remains external debt until recorded
20. **CI coverage** — consumer-web **build + test** in CI (CW.8)
21. **Production browser QA** matrix (CW.8)
22. **Backend/Admin-controlled home sections** (§ CW home — **hard requirement**)

### CW v1 — OUT OF SCOPE (unless later explicitly approved)

- Consumer Web **login / OTP**
- Consumer **profile** or **settings**
- **Favorites** or saved businesses (no browser-local favorites — conflicts with account-centric API)
- **Review submission** on web
- Consumer **notification inbox** or **browser push**
- **Full authenticated parity** with mobile
- **Embedded interactive city map** or new map product on web
- Dedicated **search engine** cluster
- **AI consumer assistant**
- **SCALE** / microservices / premature worker/HA systems (see [future-ready-platform.md](./future-ready-platform.md) — discipline only)

**Report-review** in-app mechanism remains a separate legal/safety product item — **not** conflated with review submission in CW.

### CW map (LOCKED)

- **Embedded map:** **NOT required** for Consumer Web v1.
- **Minimum UX:** correct branch **address**; coordinates from **BusinessLocation** / **`effectivePhysical`**; working **external** navigation/map link; branch selection preserves **location context**.

### CW promotions (LOCKED)

- Business-page **promotion previews** remain.
- v1 **includes** a dedicated **city-scoped promotions discovery** surface.
- **Expected route pattern (implementation):** locale-prefixed city route consistent with F.5, e.g. **`/{locale}/{citySlug}/promotions`** (segment already **reserved** in `lib/reserved-segments.ts`).
- Reuse public **`GET /promotions?citySlug=`** (and branch/city rules from **6.12A.7.9.4**); SEO rules defined in implementation stage **CW.7**.

### CW ads (LOCKED)

- **Web advertising IS in v1.** Reuse **one** monetization / ad-serving backend — **no separate web ad engine**.
- Existing placement concepts include: **`HOME_VIP_BANNER`**, **`HOME_FEATURED`**, **`HOME_PROMOTIONS`**, **`CATEGORY_TOP`**, **`CATEGORY_BOOST`**.
- Serve via existing **`GET /monetization/ads/serve`** with **`platform=WEB`** ( **`AnalyticsPlatform.WEB`** ); impression/click tracking via existing ad analytics endpoints.
- Implementation must include: web ad **session**, serve calls, rendering, impression/click tracking, **KZ-C.4**-aligned ad labels/transparency (implementation + compliance gates later).
- Campaign-level **APP vs WEB channel filter** remains **future**; client **`platform`** distinguishes web today.

### CW analytics (LOCKED)

- **Web analytics IS in v1.** Reuse **`POST /analytics/events`** (and related contracts) where possible.
- **Minimum event coverage (implementation):** page/business view, search, category/subcategory navigation, promotion view/click where applicable, phone/WhatsApp/website clicks, map/navigation click, branch selection, ad impression, ad click.
- Do not fork a separate web-only analytics pipeline.

### CW home configuration (HARD REQUIREMENT)

Home page **section order** and **enabled/disabled** state **must not** remain permanently hardcoded in Consumer Web or Flutter.

- **Simple** backend-controlled section configuration (not an over-complex CMS).
- **Admin** can enable/order sections without client store releases for layout-only changes.
- **Consumer Web and mobile** eventually consume the **same logical** home configuration; **platform-specific rendering** allowed.
- Concepts (minimum): section **identifier/type**, **enabled**, **display order**, **platform/surface applicability** where needed, optional **city scope**, extensibility for future section types.
- **Example logical sections:** VIP banner, categories, featured, promotions, nearby, recommendations (if later introduced).
- **Implementation:** stage **CW.3** (API + admin); **CW.4** renders home from config.

### CW brand (LOCKED)

- Align with **QalaGo product brand**; reuse **`@qalago/brand`** tokens/components **where appropriate** for a **consumer** surface.
- **Do not** blindly copy Admin/Business UXA UI; **do not reopen UXA**.
- Preserve **Montserrat** unless later design evidence says otherwise; use consistent **logo/wordmark** assets; establish reusable **consumer** components (CW.2).

### CW business detail (v1 target)

Must eventually include: name; category/subcategory; cover/gallery; description; rating/review count; address; selected branch; branch list; **work hours**; phone; WhatsApp; Instagram; website; **navigation link**; promotions preview; service/catalog preview where API supports; **read-only reviews** with **owner reply** when exposed by public API; correct **SEO/OG** (F.8 preserved). **No** review writing on web v1.

### CW reviews (LOCKED)

- **Read-only** on Consumer Web v1.
- No web auth added solely for review submission.
- UX: rating summary, count, previews/list as scoped, owner replies when available, empty states, moderation-hidden content must not appear on public surfaces.

### CW auth / favorites (LOCKED)

- **Guest-first** v1: no login, OTP, favorites, profile, or consumer inbox on web.

### CW SEO preservation (LOCKED)

**Do not rebuild F.4–F.8.** Implementation stages must preserve: canonical business URLs; locale URLs; hreflang; sitemap; robots; search noindex; legacy redirects; OG/Twitter pipeline; App Links / AASA routes; legal/help migration (F.7).

### CW closure gates (CW.8)

Consumer Web **CW STATUS: CLOSED** only when:

- **CI:** `consumer-web` **build + test** pass in pipeline
- **Physical browser matrix:** desktop Chrome/Edge; mobile Android Chrome; iPhone Safari when available (or documented deferred environmental debt); widths ~320, ~390, 768, 1024, 1440; **RU + KK**
- Flows: home, city/locale switch, category, subcategory, search, business, branch switch, contacts, promotions (when built), reviews read-only, legal, 404, SEO/deep-link spot checks on production host when available

**Final milestone text:** **CW PASS — CONSUMER WEB PRODUCT FINALIZED** · **CW STATUS: CLOSED**.

### CW implementation sequence (LOCKED — do not reorder without audit)

| Stage | Name | Summary |
|-------|------|---------|
| **CW.1** | Product scope lock | **CLOSED** — Option B scope lock (docs) |
| **CW.2** | Public UI foundation | **CLOSED** — see § **CW.2** below |
| **CW.3** | Backend-controlled home system | **CLOSED** — see § **CW.3** below |
| **CW.4** | Discovery home | Render home from configuration (categories, featured, promos, VIP, etc.) |
| **CW.5** | Business detail completion | Hours, branch UX, contacts, reviews read-only polish, states |
| **CW.6** | Web ads + analytics | Unified serve + event ingest on web surfaces |
| **CW.7** | Promotions discovery | Dedicated city promotions page |
| **CW.8** | CI + performance + final physical QA | Closure |

**Do not start CW.3** until CW.2 is committed and verified.

### CW.2 — Public UI foundation (IMPLEMENTED)

**Goal:** Reusable public-product chrome and primitives for later CW stages — **not** discovery home content.

**Stack (consumer-web):**

- **Brand tokens:** import **`@qalago/brand/qalago-theme.css`** in **`app/globals.css`** (Montserrat, shared color/spacing/focus tokens). **No** backoffice React primitives on the public site.
- **Consumer layer:** **`apps/consumer-web/styles/consumer-public.css`** — shell, mobile nav, page layout, buttons/links, search, category/business cards, breadcrumbs, skeletons, empty states.
- **Shell:** **`PublicShell`** + **`SkipToMain`**, **`QalaGoWordmark`**, **`MobileNav`** (drawer, **`aria-expanded`**), desktop nav with **`aria-current`**, city/locale controls, footer legal links. Single **`<main id="main-content">`** in shell; route bodies use **`<div className="page">`** (no nested `<main>`).
- **Media:** **`PublicMediaImage`** (`next/image` + **`normalizePublicMediaSrc`**); **`next.config.ts`** `images.remotePatterns` for `/uploads` and HTTPS externals.
- **States:** **`PublicPageLoading`** / route **`loading.tsx`**; **`PublicEmptyState`** for empty/no-results/error/not-found patterns where wired in CW.2.
- **Labels:** extend **`UI_LABELS`** (RU/KK) for skip link and mobile menu — preserve KZ-C.1C locale cookie/routing semantics.

**Explicitly out of CW.2:** home CMS sections, ads, analytics, **`/promotions`**, web auth, new backend fields.

### CW.3 — Backend-controlled home system (IMPLEMENTED)

**Model:** `HomeSectionConfig` — `sectionType`, `enabled`, `position`, `platform` (`APP` | `WEB` | `ALL`), optional `cityId` (null = global default).

**DB uniqueness (CW.3A):** PostgreSQL partial indexes — at most **one global row per `sectionType`** (`cityId IS NULL`) and at most **one city row per (`cityId`, `sectionType`)** (`cityId IS NOT NULL`). Plain `UNIQUE(cityId, sectionType)` is **not** sufficient (NULL duplicates).

**Platform semantics (CW.1 aligned):** one configuration row per scope + `sectionType`; `platform` expresses **applicability** (ALL / APP-only / WEB-only), **not** separate order rows for APP vs WEB for the same section. Example: you cannot have CATEGORIES at position 10 on APP and 30 on WEB as two rows for the same city — use one row with `platform=ALL` or choose a single applicability.

**Resolution (public `GET /home/sections`):** global rows + city rows → city overrides global per type → filter `enabled` → filter platform → sort by `position`, then **`sectionType`** (stable tie-break).

**Default global seed:** `HOME_VIP_BANNER` (10), `CATEGORIES` (20), `HOME_FEATURED` (30), `HOME_PROMOTIONS` (40), `NEARBY` (50); all `enabled`, `platform=ALL`.

**Admin:** `GET/PATCH /admin/home-sections` — staff permissions `HOME_CONFIG_VIEW` / `HOME_CONFIG_EDIT`; ADMIN/SUPER_ADMIN global + any city; CITY_ADMIN city overrides only.

**Ads separation:** section config controls **whether/where** a logical block appears; monetization serve controls **paid content** inside ad-backed blocks.

**Mobile:** Flutter home order unchanged in CW.3; API ready for later client adoption.

**Consumer Web:** `lib/home-sections-api.ts` fetch helper only — **CW.4** renders UI from config.

### Global continuity (after CW closes — not started now)

Intended high-level order: **CW** → **KZ-C.2** → **KZ-C.3** → **Production Safety / Ops** → **KZ-C.7 / KZ-C.9** → **Mobile Release** → **PSP** (if required) → optional polish → **SCALE** when justified. Change only after new evidence-based audit.

---

## BusinessLocation (6.12A)

**6.12A** location architecture is live. Canonical business paths are **`/{citySlug}/business/{businessSlug}`** today (F.4); **F.5** prepends **`/ru/` or `/kk/`** when implemented. Slug+city API unchanged; legacy **`/businesses/{id}`** redirects per F.4/F.5 §15. See [business-location.md](./business-location.md).
