/** MVP default city until F.2 city-segment routes. */
export const DEFAULT_CITY_SLUG = 'uralsk';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';
}

/** Origin for static uploads (no /api/v1 suffix). */
export function getApiOrigin(): string {
  return getApiBaseUrl().replace(/\/api\/v1\/?$/, '') || 'http://localhost:3002';
}

/**
 * Legacy/deferred external public-site base (Business Web origin for non-migrated tooling).
 * F.7 legal pages and public /help are same-origin on Consumer Web via legalPageUrl().
 */
export function getPublicSiteBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_QALAGO_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_BUSINESS_WEB_URL ??
    'http://localhost:3003';
  return raw.replace(/\/$/, '');
}
