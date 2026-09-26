import { LOCALE_COOKIE_NAME } from './locale';
import { buildSafePublicQueryString } from './locale-path';
import { preferenceLocaleFromCookieValue } from './locale-preference';
import {
  buildMisplacedLocalePrefixedPath,
  buildLocaleRootPrefixedPath,
  buildNeutralPrefixedPath,
} from './public-locale-redirect-paths';
import {
  isSupportedPublicLocale,
  type PublicLocale,
} from './public-locale';
import { DEFAULT_CITY_SLUG } from './public-config';
import { isReservedCitySegment } from './reserved-segments';

export type MiddlewareLocaleRedirect =
  | { kind: 'none'; routeLocale?: PublicLocale }
  | { kind: 'permanent'; pathname: string; search: string };

const LEGACY_TOP_LEVEL_PREFIXES = new Set(['businesses', 'categories']);

function safeQueryFromUrl(searchParams: URLSearchParams): string {
  return buildSafePublicQueryString({
    locationId: searchParams.get('locationId'),
    page: searchParams.get('page'),
    q: searchParams.get('q'),
  });
}

/** True when `/ru/...` was previously handled by misplaced `[citySlug]` compatibility pages. */
function isMisplacedLocalePrefixedPath(parts: string[]): boolean {
  if (parts.length < 2) return false;
  const tail = parts[1]!;
  if (tail === DEFAULT_CITY_SLUG) return false;
  if (isReservedCitySegment(tail)) return true;
  if (tail === 'business') return true;
  // `/ru/{categorySlug}` without city segment (Phase 1 compatibility).
  if (parts.length === 2) return true;
  return false;
}

/**
 * Pure redirect matrix for locale-neutral and misplaced locale-prefixed entry URLs.
 * Returns `none` for `/`, legacy routes, already-canonical paths, and unsupported locales like `/en/...`.
 */
export function resolveMiddlewareLocaleRedirect(
  pathname: string,
  searchParams: URLSearchParams,
  cookieHeader: string | null | undefined,
): MiddlewareLocaleRedirect {
  if (pathname === '/') {
    return { kind: 'none' };
  }

  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length) {
    return { kind: 'none' };
  }

  const first = parts[0]!;

  if (LEGACY_TOP_LEVEL_PREFIXES.has(first)) {
    return { kind: 'none' };
  }

  const cookieLocale = readCookieValue(cookieHeader, LOCALE_COOKIE_NAME);
  const preference = preferenceLocaleFromCookieValue(cookieLocale);

  if (isSupportedPublicLocale(first)) {
    const locale = first;

    if (parts.length === 1) {
      return {
        kind: 'permanent',
        pathname: buildLocaleRootPrefixedPath(locale),
        search: safeQueryFromUrl(searchParams),
      };
    }

    if (isMisplacedLocalePrefixedPath(parts)) {
      const tail = parts.slice(1);
      return {
        kind: 'permanent',
        pathname: buildMisplacedLocalePrefixedPath(locale, tail),
        search: safeQueryFromUrl(searchParams),
      };
    }

    return { kind: 'none', routeLocale: locale };
  }

  // Unsupported locale-shaped prefix (e.g. `/en/uralsk`) — App Router `[locale]` layout → notFound.
  if (parts.length >= 2 && !isSupportedPublicLocale(first)) {
    const maybeLocale = first.toLowerCase();
    if (maybeLocale.length === 2 || maybeLocale === 'en') {
      return { kind: 'none' };
    }
  }

  const logicalPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return {
    kind: 'permanent',
    pathname: buildNeutralPrefixedPath(preference, logicalPath),
    search: safeQueryFromUrl(searchParams),
  };
}

function readCookieValue(
  cookieHeader: string | null | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  const segments = cookieHeader.split(';');
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed.startsWith(`${name}=`)) continue;
    return decodeURIComponent(trimmed.slice(name.length + 1));
  }
  return undefined;
}

export function joinRedirectTarget(pathname: string, search: string): string {
  return search ? `${pathname}${search}` : pathname;
}
