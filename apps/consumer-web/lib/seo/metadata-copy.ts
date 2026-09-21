import type { AppLocale } from '@/lib/locale';

export function citySeoTitle(cityName: string, locale: AppLocale): string {
  return locale === 'kk'
    ? `QalaGo — ${cityName} қаласындағы орындар мен мекемелер`
    : `QalaGo — места и заведения в ${cityName}`;
}

export function citySeoDescription(cityName: string, locale: AppLocale): string {
  return locale === 'kk'
    ? `${cityName} қаласындағы мекемелер мен қызметтер каталогы — QalaGo арқылы табыңыз.`
    : `Каталог заведений и услуг в ${cityName} — откройте для себя город с QalaGo.`;
}

export function cityCategoriesSeoTitle(cityName: string, locale: AppLocale): string {
  return locale === 'kk'
    ? `Санаттар — ${cityName} | QalaGo`
    : `Категории — ${cityName} | QalaGo`;
}

export function cityCategoriesSeoDescription(cityName: string, locale: AppLocale): string {
  return locale === 'kk'
    ? `${cityName} қаласындағы барлық санаттар — QalaGo.`
    : `Все категории заведений и услуг в ${cityName} на QalaGo.`;
}

export function categorySeoTitle(
  categoryName: string,
  cityName: string,
  locale: AppLocale,
): string {
  return locale === 'kk'
    ? `${categoryName} — ${cityName} | QalaGo`
    : `${categoryName} — ${cityName} | QalaGo`;
}

export function categorySeoDescription(
  categoryName: string,
  cityName: string,
  locale: AppLocale,
): string {
  return locale === 'kk'
    ? `${cityName} қаласындағы «${categoryName}» — QalaGo каталогы.`
    : `«${categoryName}» в ${cityName} — каталог QalaGo.`;
}

export function subcategorySeoTitle(
  subName: string,
  categoryName: string,
  cityName: string,
  locale: AppLocale,
): string {
  return `${subName} — ${categoryName}, ${cityName} | QalaGo`;
}

export function subcategorySeoDescription(
  subName: string,
  categoryName: string,
  cityName: string,
  locale: AppLocale,
): string {
  return locale === 'kk'
    ? `${cityName}, ${categoryName}: ${subName} — QalaGo.`
    : `${subName} (${categoryName}, ${cityName}) на QalaGo.`;
}

export function searchSeoTitle(cityName: string, locale: AppLocale): string {
  return locale === 'kk' ? `Іздеу — ${cityName} | QalaGo` : `Поиск — ${cityName} | QalaGo`;
}
