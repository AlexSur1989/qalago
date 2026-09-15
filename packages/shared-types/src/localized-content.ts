export type AppLocaleCode = 'ru' | 'kk';

export function resolveLocaleCode(value?: string | null): AppLocaleCode {
  if (value === 'kk' || value?.startsWith('kk')) return 'kk';
  return 'ru';
}

export function normalizeOptionalLocaleText(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function taxonomyDisplayName(
  locale: AppLocaleCode,
  ru: string,
  kk?: string | null,
  legacy?: string | null,
): string {
  const nameRu = (ru || legacy || '').trim();
  const nameKk = normalizeOptionalLocaleText(kk);
  if (locale === 'kk') {
    return nameKk ?? nameRu;
  }
  return nameRu || (legacy ?? '').trim();
}

export function cityDisplayName(
  city: { nameRu: string; nameKk?: string | null },
  locale: AppLocaleCode,
): string {
  return taxonomyDisplayName(locale, city.nameRu, city.nameKk);
}

export function businessAuthoredText(
  locale: AppLocaleCode,
  primary: string,
  kk?: string | null,
): string {
  const base = primary.trim();
  if (locale === 'kk') {
    const localized = normalizeOptionalLocaleText(kk);
    if (localized) return localized;
  }
  return base;
}
