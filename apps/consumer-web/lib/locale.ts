export type AppLocale = 'ru' | 'kk';

export const LOCALE_COOKIE_NAME = 'qalago_locale';

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (value === 'kk' || value?.startsWith('kk')) return 'kk';
  if (value === 'ru' || value?.startsWith('ru')) return 'ru';
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

export type UiLabels = {
  siteTitle: string;
  siteDescription: string;
  homeTagline: string;
  navHome: string;
  categories: string;
  allCategories: string;
  subcategories: string;
  allSubcategories: string;
  businesses: string;
  emptyBusinesses: string;
  back: string;
  moreCategories: string;
  moreCategoriesAria: string;
  languageSwitcherAria: string;
  localeRu: string;
  localeKk: string;
  adLabel: string;
  notFoundTitle: string;
  notFoundMessage: string;
  notFoundHome: string;
  errorTitle: string;
  errorMessage: string;
  retry: string;
  businessCoverAlt: string;
  businessCardCoverAlt: string;
  mainNavAria: string;
  footerLegalAria: string;
  footerPrivacy: string;
  footerTerms: string;
  footerAccountDeletion: string;
  footerSupport: string;
  footerCopyright: string;
};

export const UI_LABELS: Record<AppLocale, UiLabels> = {
  ru: {
    siteTitle: 'QalaGo',
    siteDescription: 'Гид по городу — заведения и услуги',
    homeTagline: 'Заведения и услуги Уральска',
    navHome: 'Главная',
    categories: 'Категории',
    allCategories: 'Все категории',
    subcategories: 'Подкатегории',
    allSubcategories: 'Все',
    businesses: 'Заведения',
    emptyBusinesses: 'Заведения не найдены',
    back: '← Назад',
    moreCategories: 'Ещё',
    moreCategoriesAria: 'Ещё категории',
    languageSwitcherAria: 'Язык интерфейса',
    localeRu: 'Русский',
    localeKk: 'Қазақша',
    adLabel: 'Реклама',
    notFoundTitle: 'Страница не найдена',
    notFoundMessage: 'Такой страницы нет или она была удалена.',
    notFoundHome: 'На главную',
    errorTitle: 'Не удалось загрузить страницу',
    errorMessage: 'Проверьте подключение к интернету и попробуйте снова.',
    retry: 'Повторить',
    businessCoverAlt: 'Обложка заведения',
    businessCardCoverAlt: 'Фото заведения',
    mainNavAria: 'Основная навигация',
    footerLegalAria: 'Правовая информация',
    footerPrivacy: 'Конфиденциальность',
    footerTerms: 'Условия',
    footerAccountDeletion: 'Удаление аккаунта',
    footerSupport: 'Поддержка',
    footerCopyright: '© QalaGo',
  },
  kk: {
    siteTitle: 'QalaGo',
    siteDescription: 'Қала бойынша нұсқау — мекемелер мен қызметтер',
    homeTagline: 'Уральск қаласындағы мекемелер мен қызметтер',
    navHome: 'Басты бет',
    categories: 'Санаттар',
    allCategories: 'Барлық санаттар',
    subcategories: 'Ішкі санаттар',
    allSubcategories: 'Барлығы',
    businesses: 'Мекемелер',
    emptyBusinesses: 'Мекемелер табылмады',
    back: '← Артқа',
    moreCategories: 'Тағы',
    moreCategoriesAria: 'Тағы санаттар',
    languageSwitcherAria: 'Интерфейс тілі',
    localeRu: 'Русский',
    localeKk: 'Қазақша',
    adLabel: 'Жарнама',
    notFoundTitle: 'Бет табылмады',
    notFoundMessage: 'Мұндай бет жоқ немесе ол жойылған.',
    notFoundHome: 'Басты бетке',
    errorTitle: 'Бетті жүктеу сәтсіз аяқталды',
    errorMessage: 'Интернет байланысын тексеріп, қайта көріңіз.',
    retry: 'Қайталау',
    businessCoverAlt: 'Мекеме мұқабасы',
    businessCardCoverAlt: 'Мекеме фотосы',
    mainNavAria: 'Негізгі навигация',
    footerLegalAria: 'Құқықтық ақпарат',
    footerPrivacy: 'Құпиялылық',
    footerTerms: 'Шарттар',
    footerAccountDeletion: 'Аккаунтты жою',
    footerSupport: 'Қолдау',
    footerCopyright: '© QalaGo',
  },
};

export function siteMetadataForLocale(locale: AppLocale): { title: string; description: string } {
  const labels = UI_LABELS[locale];
  return { title: labels.siteTitle, description: labels.siteDescription };
}
