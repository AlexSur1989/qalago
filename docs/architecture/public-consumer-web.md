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

### Search indexing (F.3 handoff)

- Arbitrary `?q=` search result pages should likely be **noindex**; F.3 implements robots/canonical. F.2 uses **`force-dynamic`** on search route only.

### Cache / rendering

- City/category/subcategory: ISR via fetch `revalidate` + layout revalidate.
- Search: **`dynamic = 'force-dynamic'`** (query-specific).

## F.3+ (deferred)

- Per-route metadata, canonical, OG, sitemap, JSON-LD, hreflang.

## BusinessLocation (6.12A)

Do not finalize `/{citySlug}/business/{slug}` or branch URLs until **6.12A** and **F.4**.
