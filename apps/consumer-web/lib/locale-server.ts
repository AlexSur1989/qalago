import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { normalizeLocale, type AppLocale } from './locale';
import { ROUTE_LOCALE_HEADER } from './locale-path';
import { getPreferenceLocaleFromCookies } from './locale-preference';
import {
  isSupportedPublicLocale,
  publicLocaleToAppLocale,
  type PublicLocale,
} from './public-locale';

/** Cookie preference only — do not use for prefixed route SSR. */
export async function getServerLocale(): Promise<AppLocale> {
  const jar = await cookies();
  return normalizeLocale(jar.get('qalago_locale')?.value);
}

/** Layout/shell: route locale from middleware header, else cookie preference. */
export async function resolveLayoutLocale(): Promise<AppLocale> {
  const h = await headers();
  const fromRoute = h.get(ROUTE_LOCALE_HEADER);
  if (fromRoute && isSupportedPublicLocale(fromRoute)) {
    return publicLocaleToAppLocale(fromRoute);
  }
  return getServerLocale();
}

export function requirePublicLocaleParam(raw: string): PublicLocale {
  if (!isSupportedPublicLocale(raw)) {
    throw new Error('Unsupported public locale');
  }
  return raw;
}

/** For `[locale]` route pages — URL locale is authoritative. */
export function getRouteLocaleFromParams(localeParam: string): PublicLocale {
  if (!isSupportedPublicLocale(localeParam)) notFound();
  return localeParam;
}

export function getRouteAppLocaleFromParams(localeParam: string): AppLocale {
  return publicLocaleToAppLocale(getRouteLocaleFromParams(localeParam));
}
