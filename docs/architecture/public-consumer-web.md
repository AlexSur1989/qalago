# Public consumer web (Stage 6.11F.1+)

## App

- Path: `apps/consumer-web`
- Port: **3005** (`npm run dev:consumer`)
- Stack: Next.js 15 App Router, React 19, RU/KK via `qalago_locale` cookie

## F.1 foundation

- **PublicShell:** header nav (home, categories), locale switcher, footer legal links (external to business-web until F.7).
- **Config:** `lib/public-config.ts` — API base, public site base, `DEFAULT_CITY_SLUG` (`uralsk` until F.2 city routes).
- **Cache:** `lib/cache-policy.ts` — ISR-friendly fetches (`next.revalidate`); no global `force-dynamic` on catalog pages.
- **Branding:** Montserrat, tokens `--blue` / `--accent`, generated `app/icon.tsx`.

## Deferred (F.2+)

- City slug URL segments, category/business slug routes, SEO metadata/sitemap, locale-prefixed URLs, rich business detail, Universal Links.

## BusinessLocation (6.12A)

Final canonical business/branch public URLs wait until **6.12A**; do not lock branch-specific routes in F.1–F.3.
