import { parsePageParam } from './search-query';
import { isSupportedPublicLocale, type PublicLocale } from './public-locale';

const ROUTE_LOCALE_HEADER = 'x-qalago-route-locale';

export { ROUTE_LOCALE_HEADER };

export function parsePublicLocaleFromPathname(pathname: string): PublicLocale | null {
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0];
  if (first && isSupportedPublicLocale(first)) return first;
  return null;
}

export type PublicQueryInput = {
  locationId?: string | string[] | null;
  page?: string | string[] | null;
  q?: string | string[] | null;
};

/** Allowlisted query fields for locale switch / neutral redirects (F.5). */
export function pickSafePublicQueryFromUrlSearchParams(searchParams: {
  get(name: string): string | null;
}): PublicQueryInput {
  return {
    locationId: searchParams.get('locationId'),
    page: searchParams.get('page'),
    q: searchParams.get('q'),
  };
}

/** Same target URL construction as LocaleSwitcher (path + safe query). */
export function buildLocaleSwitchTarget(
  pathname: string,
  searchParams: { get(name: string): string | null },
  targetLocale: PublicLocale,
): string {
  return swapLocaleInPathname(
    pathname,
    pickSafePublicQueryFromUrlSearchParams(searchParams),
    targetLocale,
  );
}

/** Safe query params preserved across locale switch / neutral redirects (F.5). */
export function buildSafePublicQueryString(searchParams: PublicQueryInput): string {
  const q = new URLSearchParams();
  const locRaw = searchParams.locationId;
  const loc = Array.isArray(locRaw) ? locRaw[0] : locRaw;
  if (loc?.trim()) q.set('locationId', loc.trim());

  const pageRaw = searchParams.page;
  const pageStr = Array.isArray(pageRaw) ? pageRaw[0] : pageRaw;
  const page = parsePageParam(pageStr);
  if (page > 1) q.set('page', String(page));

  const searchRaw = searchParams.q;
  const searchQ = Array.isArray(searchRaw) ? searchRaw[0] : searchRaw;
  if (searchQ?.trim()) q.set('q', searchQ.trim());

  const s = q.toString();
  return s ? `?${s}` : '';
}

export function swapLocaleInPathname(
  pathname: string,
  searchParams: PublicQueryInput,
  targetLocale: PublicLocale,
): string {
  const parts = pathname.split('/').filter(Boolean);
  const rest = isSupportedPublicLocale(parts[0] ?? '') ? parts.slice(1) : parts;
  const path = rest.length ? `/${targetLocale}/${rest.join('/')}` : `/${targetLocale}`;
  return `${path}${buildSafePublicQueryString(searchParams)}`;
}
