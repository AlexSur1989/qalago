import { DEFAULT_CITY_SLUG } from './public-config';
import { withPublicLocalePrefix } from './routes';
import type { PublicLocale } from './public-locale';

/** `/ru` or `/kk` alone → default city home in that locale. */
export function buildLocaleRootPrefixedPath(locale: PublicLocale): string {
  return withPublicLocalePrefix(locale, `/${DEFAULT_CITY_SLUG}`);
}

/** Explicit shorthands like `/ru/categories` (missing city) → insert default city. */
export function buildMisplacedLocalePrefixedPath(
  locale: PublicLocale,
  tailSegments: string[],
): string {
  const encodedTail = tailSegments.map((s) => encodeURIComponent(s)).join('/');
  const logical = encodedTail
    ? `/${DEFAULT_CITY_SLUG}/${encodedTail}`
    : `/${DEFAULT_CITY_SLUG}`;
  return withPublicLocalePrefix(locale, logical);
}

/** Locale-neutral compatibility path → locale-prefixed URL (one hop). */
export function buildNeutralPrefixedPath(
  locale: PublicLocale,
  logicalPath: string,
): string {
  return withPublicLocalePrefix(locale, logicalPath);
}
