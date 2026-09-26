import { permanentRedirect } from 'next/navigation';
import { getPreferenceLocaleFromCookies } from './locale-preference';
import {
  buildLocaleRootPrefixedPath,
  buildMisplacedLocalePrefixedPath,
  buildNeutralPrefixedPath,
} from './public-locale-redirect-paths';
import { isTopLevelLocaleSegment, type PublicLocale } from './public-locale';

/**
 * Locale-neutral compatibility path → locale-prefixed URL (one hop).
 * @param logicalPath e.g. `/uralsk`, `/uralsk/business/foo` — no locale prefix.
 */
export async function permanentRedirectNeutralPublicPath(
  logicalPath: string,
  querySuffix = '',
): Promise<never> {
  const locale = await getPreferenceLocaleFromCookies();
  const base = buildNeutralPrefixedPath(locale, logicalPath);
  permanentRedirect(querySuffix ? `${base}${querySuffix}` : base);
}

/** `/ru` or `/kk` alone → default city home in that locale. */
export function permanentRedirectLocaleRoot(locale: PublicLocale): never {
  permanentRedirect(buildLocaleRootPrefixedPath(locale));
}

/**
 * Misplaced paths like `/ru/restaurants` (missing city) → insert default city.
 */
export function permanentRedirectMisplacedLocalePath(
  locale: PublicLocale,
  tailSegments: string[],
): never {
  permanentRedirect(buildMisplacedLocalePrefixedPath(locale, tailSegments));
}

export async function redirectIfCitySlugIsLocaleSegment(citySlug: string): Promise<void> {
  if (isTopLevelLocaleSegment(citySlug)) {
    permanentRedirectLocaleRoot(citySlug);
  }
}
