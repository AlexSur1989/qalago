/**
 * Public consumer web cache policy (Stage 6.11F.1).
 *
 * - Pages do NOT use `force-dynamic`; catalog fetches use `next.revalidate` below.
 * - HTML is ISR-friendly: stale-while-revalidate on the Next server.
 * - F.3 may add per-route metadata + sitemap; business pages may tighten after 6.12A.
 */
export const REVALIDATE_CITY_SECONDS = 300;
export const REVALIDATE_CATEGORIES_SECONDS = 60;
export const REVALIDATE_BUSINESS_LIST_SECONDS = 30;
export const REVALIDATE_BUSINESS_DETAIL_SECONDS = 60;

/** Default segment revalidate for layout-backed pages without their own export. */
export const DEFAULT_PAGE_REVALIDATE_SECONDS = 60;
