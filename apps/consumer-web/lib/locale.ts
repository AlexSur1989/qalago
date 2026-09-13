export type AppLocale = 'ru' | 'kk';

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (value?.startsWith('kk')) return 'kk';
  return 'ru';
}

export function categoryDisplayName(
  item: { nameRu?: string; nameKk?: string; title?: string },
  locale: AppLocale,
): string {
  const nameRu = item.nameRu ?? item.title ?? '';
  const nameKk = item.nameKk ?? nameRu;
  return locale === 'kk' ? nameKk || nameRu : nameRu || item.title || '';
}

export function subcategoryDisplayName(
  item: { nameRu: string; nameKk: string },
  locale: AppLocale,
): string {
  return locale === 'kk' ? item.nameKk : item.nameRu;
}

export const UI_LABELS = {
  ru: {
    categories: 'Категории',
    allCategories: 'Все категории',
    subcategories: 'Подкатегории',
    businesses: 'Заведения',
    emptyBusinesses: 'Заведения не найдены',
    back: '← Назад',
    localeRu: 'RU',
    localeKk: 'KZ',
  },
  kk: {
    categories: 'Санаттар',
    allCategories: 'Барлық санаттар',
    subcategories: 'Ішкі санаттар',
    businesses: 'Мекемелер',
    emptyBusinesses: 'Мекемелер табылмады',
    back: '← Артқа',
    localeRu: 'RU',
    localeKk: 'KZ',
  },
} as const;
