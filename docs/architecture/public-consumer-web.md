# Public consumer web (Stage 6.11F.1+)

## App

- Path: `apps/consumer-web`
- Port: **3005** (`npm run dev:consumer`)
- Stack: Next.js 15 App Router, React 19. **F.5 Phases 1–1.2** implement indexable **`/ru/`** / **`/kk/`** URL routing with URL-authoritative locale; locale-neutral routes are compatibility entries selected by `qalago_locale` (see § F.5). Phase 2 SEO is not started.

## F.1 foundation

- **PublicShell:** header nav, locale switcher, footer legal links (external to business-web until F.7).
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
- Dynamic: city, city categories, category, subcategory (RU/KK names from API + cookie locale).
- **Search** `/{citySlug}/search?q=`: **`robots: noindex, follow`**; canonical reflects city search path + encoded `q` when present.
- **Legacy business** `/businesses/{id}`: **`noindex, follow`** (redirect-only); canonical business metadata on **`/{citySlug}/business/{businessSlug}`** only.

### Locale SEO (current runtime vs F.5 contract)

- **Implemented (F.3/F.4):** Canonical URLs are **locale-neutral**; RU/KK UI from `qalago_locale` cookie on the same URL. **No hreflang** yet.
- **Locked contract (F.5 Phase 0 — not implemented):** Indexable **locale-prefixed** URLs, hreflang, and rules in § **F.5** below. Phase 1+ will redirect locale-neutral indexable paths to `/ru/…` or `/kk/…`.

### robots.txt (`app/robots.ts`)

- Allow `/` for discovery pages.
- **Disallow** `/businesses/` (compatibility detail; meta noindex is primary).
- **Sitemap** `{origin}/sitemap.xml`.
- Does not block static assets / `_next`.

### sitemap.xml (`app/sitemap.ts`)

- **Sources:** `GET /cities`, per city `GET /categories?citySlug=`, per category `GET /categories/:id/subcategories` (bounded parallel per city).
- **Includes:** `/{citySlug}`, `/{citySlug}/categories`, `/{citySlug}/{categorySlug}`, `/{citySlug}/{categorySlug}/{subcategorySlug}`, **`/{citySlug}/business/{businessSlug}`** (per city membership, deduped).
- **Excludes:** search, legacy `/categories*`, `/businesses/{id}`, business URLs with **`?locationId=`**, owner/admin paths, paginated list URLs (`?page=`).
- **Failure:** API error → **empty sitemap** (no fabricated URLs, no stack traces).
- **Scale:** single sitemap today; structure allows future sitemap index / segmented business sitemap when catalog grows.

### Structured data

- **Implemented:** root `WebSite` JSON-LD; `BreadcrumbList` on city categories / category / subcategory / **canonical business** pages.
- **Deferred:** `LocalBusiness`, branch/location schema, `AggregateRating`, `SearchAction` (F.4 Phase 2 did not add rich snippets).

### Pagination canonical

- Category/subcategory list pages: canonical includes `?page=N` when **N > 1** (distinct paginated content). Invalid `page` query normalized via `parsePageParam` (≤0, non-numeric → 1).

## F.5 locale SEO URL architecture

**Status:** **F.5 PHASE 0 PASS — LOCALE SEO URL CONTRACT LOCKED**; **Phase 1 implemented**, **Phase 1.1 PASS**, **Phase 1.2 PASS**. `/ru/` and `/kk/` routing is live; Phase 2 SEO is not started.

**Authority:** This section is the **canonical F.5 contract**. [api-contracts.md](./api-contracts.md) — no Catalog API changes required for locale routing.

### Scope

F.5 = indexable RU/KK public URL variants, **hreflang**, locale-aware canonical/sitemap rules, language-switcher URL semantics, compatibility redirects from locale-neutral entry URLs.

**Not F.5:** Web auth, favorites, interactive map, F.6 deep links / App Links / Universal Links, F.7 legal migration, F.8 OG image pipeline, Home CMS, Events, City Discovery, 6.12B import, localized Business schema, machine translation of business-generated content.

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

F.8 OG **image asset pipeline** out of scope. OG/Twitter **URLs and text metadata** must stay consistent with active locale canonical. No new OG image generation in F.5.

### 20. F.6 deep-link compatibility (LOCKED)

F.6 (App Links, Universal Links, NavigationTarget API) **not implemented in F.5**. Locale-prefixed URLs are the **stable public URLs** F.6 should later resolve to — do not introduce a routing model that forces another public URL breaking change.

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

## BusinessLocation (6.12A)

**6.12A** location architecture is live. Canonical business paths are **`/{citySlug}/business/{businessSlug}`** today (F.4); **F.5** prepends **`/ru/` or `/kk/`** when implemented. Slug+city API unchanged; legacy **`/businesses/{id}`** redirects per F.4/F.5 §15. See [business-location.md](./business-location.md).
