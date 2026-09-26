import type { PublicLocale } from './public-locale';
import { withPublicLocalePrefix } from './routes';

/** F.4 canonical Consumer Web business URLs (path only, no origin). F.5 adds locale prefix. */

export function parseLocationIdParam(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value == null || value.trim() === '') return undefined;
  return value.trim();
}

export function buildBusinessBySlugRequestPath(
  businessSlug: string,
  citySlug: string,
  locationId?: string | null,
): string {
  const q = new URLSearchParams({ citySlug });
  const trimmed = locationId?.trim();
  if (trimmed) q.set('locationId', trimmed);
  return `/businesses/by-slug/${encodeURIComponent(businessSlug)}?${q.toString()}`;
}

/** Canonical page path; optional branch context via query (excluded from SEO canonical). */
export function canonicalBusinessPagePath(
  locale: PublicLocale,
  citySlug: string,
  businessSlug: string,
  locationId?: string | null,
): string {
  const base = withPublicLocalePrefix(
    locale,
    `/${encodeURIComponent(citySlug)}/business/${encodeURIComponent(businessSlug)}`,
  );
  const trimmed = locationId?.trim();
  if (!trimmed) return base;
  return `${base}?locationId=${encodeURIComponent(trimmed)}`;
}

export const BUSINESS_LOCATION_CITY_MISMATCH_CODE = 'BUSINESS_LOCATION_CITY_MISMATCH';

export type BusinessCityMismatchPayload = {
  businessSlug: string;
  locationId: string;
  citySlug: string;
};

export function parseBusinessCityMismatchBody(body: unknown): BusinessCityMismatchPayload | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  if (o.code !== BUSINESS_LOCATION_CITY_MISMATCH_CODE) return null;
  const businessSlug = typeof o.businessSlug === 'string' ? o.businessSlug : '';
  const locationId = typeof o.locationId === 'string' ? o.locationId : '';
  const citySlug = typeof o.citySlug === 'string' ? o.citySlug : '';
  if (!businessSlug || !locationId || !citySlug) return null;
  return { businessSlug, locationId, citySlug };
}
