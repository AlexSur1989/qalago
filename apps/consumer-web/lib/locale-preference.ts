import { cookies } from 'next/headers';
import { LOCALE_COOKIE_NAME, normalizeLocale } from './locale';
import {
  DEFAULT_PUBLIC_LOCALE,
  isSupportedPublicLocale,
  type PublicLocale,
} from './public-locale';

/** Preference for locale-neutral entry redirects only — not SSR on prefixed routes. */
export async function getPreferenceLocaleFromCookies(): Promise<PublicLocale> {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE_NAME)?.value;
  const normalized = normalizeLocale(raw);
  return isSupportedPublicLocale(normalized) ? normalized : DEFAULT_PUBLIC_LOCALE;
}

export function preferenceLocaleFromCookieValue(
  raw: string | null | undefined,
): PublicLocale {
  const normalized = normalizeLocale(raw);
  return isSupportedPublicLocale(normalized) ? normalized : DEFAULT_PUBLIC_LOCALE;
}
