# Public consumer web (Stage 6.11F.1+)

## App

- Path: `apps/consumer-web`
- Port: **3005** (`npm run dev:consumer`)
- Stack: Next.js 15 App Router, React 19, RU/KK via `qalago_locale` cookie (routes are locale-neutral; F.5 adds SEO locale URLs)

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

### Business links (temporary)

- Cards link to **`/businesses/{businessId}`** until **6.12A** + **F.4** define branch-aware slug URLs.

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
- **Temporary business** `/businesses/{id}`: **`noindex, follow`** until **6.12A + F.4**; **no** canonical to future slug URLs.

### Locale SEO limitation (F.5 handoff)

- Canonical URLs are **locale-neutral**; same URL serves RU or KK via `qalago_locale` cookie.
- **No hreflang** in F.3; F.5 owns indexable language variants.

### robots.txt (`app/robots.ts`)

- Allow `/` for discovery pages.
- **Disallow** `/businesses/` (compatibility detail; meta noindex is primary).
- **Sitemap** `{origin}/sitemap.xml`.
- Does not block static assets / `_next`.

### sitemap.xml (`app/sitemap.ts`)

- **Sources:** `GET /cities`, per city `GET /categories?citySlug=`, per category `GET /categories/:id/subcategories` (bounded parallel per city).
- **Includes:** `/{citySlug}`, `/{citySlug}/categories`, `/{citySlug}/{categorySlug}`, `/{citySlug}/{categorySlug}/{subcategorySlug}`.
- **Excludes:** search, legacy `/categories*`, `/businesses/{id}`, owner/admin paths, paginated list URLs (`?page=`).
- **Failure:** API error → **empty sitemap** (no fabricated URLs, no stack traces).
- **Scale:** single sitemap today; structure allows future sitemap index / segmented business sitemap when catalog grows.

### Structured data

- **Implemented:** root `WebSite` JSON-LD; `BreadcrumbList` on city categories / category / subcategory (visible breadcrumbs + JSON-LD).
- **Deferred:** `LocalBusiness`, branch/location schema, `AggregateRating`, `SearchAction` until URLs and semantics are final (**6.12A**, F.4).

### Pagination canonical

- Category/subcategory list pages: canonical includes `?page=N` when **N > 1** (distinct paginated content). Invalid `page` query normalized via `parsePageParam` (≤0, non-numeric → 1).

## BusinessLocation (6.12A)

Database foundation (A.1): `BusinessLocation` table exists; **no consumer API or URL changes yet**. Temporary **`/businesses/{id}`** (F.3 noindex) remains until **F.4** after location backfill (A.2+). See [business-location.md](./business-location.md).
