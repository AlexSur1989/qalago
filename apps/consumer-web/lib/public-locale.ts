import type { AppLocale } from './locale';

/** F.5 closed allowlist — indexable public locale path segments. */
export const SUPPORTED_PUBLIC_LOCALES = ['ru', 'kk'] as const;

export type PublicLocale = (typeof SUPPORTED_PUBLIC_LOCALES)[number];

export const DEFAULT_PUBLIC_LOCALE: PublicLocale = 'ru';

export function isSupportedPublicLocale(value: string): value is PublicLocale {
  return value === 'ru' || value === 'kk';
}

export function isTopLevelLocaleSegment(segment: string): segment is PublicLocale {
  return isSupportedPublicLocale(segment);
}

/** Route locale is authoritative for SSR when present. */
export function publicLocaleToAppLocale(locale: PublicLocale): AppLocale {
  return locale;
}
