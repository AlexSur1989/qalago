import type { AppLocale } from '@/lib/locale';

function taxonomyName(
  locale: AppLocale,
  nameRu: string,
  nameKk?: string | null,
): string {
  const ru = nameRu.trim();
  const kk = nameKk?.trim();
  if (locale === 'kk') return kk || ru;
  return ru;
}

export function cityDisplayName(
  city: { nameRu: string; nameKk?: string | null },
  locale: AppLocale,
): string {
  return taxonomyName(locale, city.nameRu, city.nameKk);
}

/** Category / subcategory labels from API (no runtime translation). */
export function subcategoryDisplayName(
  sub: { nameRu: string; nameKk?: string | null },
  locale: AppLocale,
): string {
  return taxonomyName(locale, sub.nameRu, sub.nameKk);
}
