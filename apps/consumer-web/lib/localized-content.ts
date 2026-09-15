import type { AppLocale } from './locale';

export function cityDisplayName(
  city: { nameRu: string; nameKk?: string | null },
  locale: AppLocale,
): string {
  const ru = city.nameRu.trim();
  const kk = city.nameKk?.trim();
  if (locale === 'kk') return kk || ru;
  return ru;
}

export function homeTaglineForCity(locale: AppLocale, cityName: string): string {
  if (locale === 'kk') {
    return `${cityName} қаласындағы мекемелер мен қызметтер`;
  }
  return `Заведения и услуги ${cityName}`;
}

export function serviceItemTitle(
  locale: AppLocale,
  item: { title: string; titleKk?: string | null },
): string {
  if (locale === 'kk') {
    const kk = item.titleKk?.trim();
    if (kk) return kk;
  }
  return item.title;
}

export function promotionTitle(
  locale: AppLocale,
  promo: { title: string; titleKk?: string | null },
): string {
  return serviceItemTitle(locale, promo);
}
