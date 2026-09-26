import { permanentRedirect } from 'next/navigation';
import { DEFAULT_CITY_SLUG } from './public-config';
import { getPreferenceLocaleFromCookies } from './locale-preference';
import {
  isTopLevelLocaleSegment,
  type PublicLocale,
} from './public-locale';
import { withPublicLocalePrefix } from './routes';

/**
 * Locale-neutral compatibility path → locale-prefixed URL (one hop).
 * @param logicalPath e.g. `/uralsk`, `/uralsk/business/foo` — no locale prefix.
 */
export async function permanentRedirectNeutralPublicPath(
  logicalPath: string,
  querySuffix = '',
): Promise<never> {
  const locale = await getPreferenceLocaleFromCookies();
  const base = withPublicLocalePrefix(locale, logicalPath);
  permanentRedirect(querySuffix ? `${base}${querySuffix}` : base);
}

/** `/ru` or `/kk` alone → default city home in that locale. */
export function permanentRedirectLocaleRoot(locale: PublicLocale): never {
  permanentRedirect(withPublicLocalePrefix(locale, `/${DEFAULT_CITY_SLUG}`));
}

/**
 * Misplaced paths like `/ru/restaurants` (missing city) → insert default city.
 */
export function permanentRedirectMisplacedLocalePath(
  locale: PublicLocale,
  tailSegments: string[],
): never {
  const encodedTail = tailSegments.map((s) => encodeURIComponent(s)).join('/');
  const logical = encodedTail
    ? `/${DEFAULT_CITY_SLUG}/${encodedTail}`
    : `/${DEFAULT_CITY_SLUG}`;
  permanentRedirect(withPublicLocalePrefix(locale, logical));
}

export async function redirectIfCitySlugIsLocaleSegment(citySlug: string): Promise<void> {
  if (isTopLevelLocaleSegment(citySlug)) {
    permanentRedirectLocaleRoot(citySlug);
  }
}
