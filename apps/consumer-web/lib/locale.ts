export type AppLocale = 'ru' | 'kk';

export const LOCALE_COOKIE_NAME = 'qalago_locale';

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (value === 'kk' || value?.startsWith('kk')) return 'kk';
  if (value === 'ru' || value?.startsWith('ru')) return 'ru';
  return 'kk';
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
  businessBranchesTitle: string;
  businessPrimaryBranchBadge: string;
  businessCardCoverAlt: string;
  skipToContent: string;
  menuOpen: string;
  menuClose: string;
  mainNavAria: string;
  footerLegalAria: string;
  footerPrivacy: string;
  footerTerms: string;
  footerAccountDeletion: string;
  footerSupport: string;
  footerCopyright: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchSubmit: string;
  searchHeading: string;
  searchTooShort: string;
  searchNoQueryHint: string;
  searchNoResults: string;
  citySwitcherLabel: string;
  emptyCategories: string;
  paginationPrev: string;
  paginationNext: string;
  paginationPage: string;
  ratingLabel: string;
  businessGalleryTitle: string;
  businessServicesTitle: string;
  businessPromotionsTitle: string;
  businessReviewsTitle: string;
  businessContactsTitle: string;
  businessLocationTitle: string;
  businessOpenMap: string;
  businessNoReviews: string;
  businessReadMoreReviews: string;
  businessWorkHoursTitle: string;
  businessHoursClosed: string;
  businessSelectedBranch: string;
  businessContactPhone: string;
  businessContactWhatsApp: string;
  businessContactInstagram: string;
  businessContactWebsite: string;
  businessNoRatingYet: string;
  businessOwnerReply: string;
  businessDescriptionTitle: string;
  workHoursWeekdays: readonly [string, string, string, string, string, string, string];
  homeSectionPromotions: string;
  homeSectionFeatured: string;
  categorySponsored: string;
  emptyHomePromotions: string;
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
    businessBranchesTitle: 'Филиалы',
    businessPrimaryBranchBadge: 'Основной филиал',
    businessCardCoverAlt: 'Фото заведения',
    skipToContent: 'Перейти к содержимому',
    menuOpen: 'Меню',
    menuClose: 'Закрыть меню',
    mainNavAria: 'Основная навигация',
    footerLegalAria: 'Правовая информация',
    footerPrivacy: 'Конфиденциальность',
    footerTerms: 'Условия',
    footerAccountDeletion: 'Удаление аккаунта',
    footerSupport: 'Поддержка',
    footerCopyright: '© QalaGo',
    searchLabel: 'Поиск заведений',
    searchPlaceholder: 'Название, адрес или услуга',
    searchSubmit: 'Найти',
    searchHeading: 'Поиск',
    searchTooShort: 'Введите минимум 2 символа.',
    searchNoQueryHint: 'Укажите запрос, чтобы искать заведения в городе.',
    searchNoResults: 'По вашему запросу ничего не найдено.',
    citySwitcherLabel: 'Город',
    emptyCategories: 'Категории для этого города пока недоступны.',
    paginationPrev: '← Назад',
    paginationNext: 'Далее →',
    paginationPage: 'Страницы результатов',
    ratingLabel: 'Рейтинг',
    businessGalleryTitle: 'Фото',
    businessServicesTitle: 'Услуги',
    businessPromotionsTitle: 'Акции',
    businessReviewsTitle: 'Отзывы',
    businessContactsTitle: 'Контакты',
    businessLocationTitle: 'Адрес',
    businessOpenMap: 'Открыть на карте',
    businessNoReviews: 'Отзывов пока нет.',
    businessReadMoreReviews: 'и ещё отзывы',
    businessWorkHoursTitle: 'График работы',
    businessHoursClosed: 'Закрыто',
    businessSelectedBranch: 'Выбранный филиал',
    businessContactPhone: 'Позвонить',
    businessContactWhatsApp: 'WhatsApp',
    businessContactInstagram: 'Instagram',
    businessContactWebsite: 'Сайт',
    businessNoRatingYet: 'Пока нет оценок',
    businessOwnerReply: 'Ответ заведения',
    businessDescriptionTitle: 'Описание',
    workHoursWeekdays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    homeSectionPromotions: 'Акции',
    homeSectionFeatured: 'Популярные места',
    categorySponsored: 'Рекламные места',
    emptyHomePromotions: 'Сейчас нет активных акций в этом городе.',
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
    businessBranchesTitle: 'Филиалдар',
    businessPrimaryBranchBadge: 'Негізгі филиал',
    businessCardCoverAlt: 'Мекеме фотосы',
    skipToContent: 'Мазмұнға өту',
    menuOpen: 'Мәзір',
    menuClose: 'Мәзірді жабу',
    mainNavAria: 'Негізгі навигация',
    footerLegalAria: 'Құқықтық ақпарат',
    footerPrivacy: 'Құпиялылық',
    footerTerms: 'Шарттар',
    footerAccountDeletion: 'Аккаунтты жою',
    footerSupport: 'Қолдау',
    footerCopyright: '© QalaGo',
    searchLabel: 'Мекемелерді іздеу',
    searchPlaceholder: 'Атауы, мекенжайы немесе қызметі',
    searchSubmit: 'Іздеу',
    searchHeading: 'Іздеу',
    searchTooShort: 'Кемінде 2 таңба енгізіңіз.',
    searchNoQueryHint: 'Қалада іздеу үшін сұрау енгізіңіз.',
    searchNoResults: 'Сұрауыңыз бойынша ештеңе табылмады.',
    citySwitcherLabel: 'Қала',
    emptyCategories: 'Бұл қала үшін санаттар әлі қолжетімсіз.',
    paginationPrev: '← Артқа',
    paginationNext: 'Алға →',
    paginationPage: 'Нәтиже беттері',
    ratingLabel: 'Рейтинг',
    businessGalleryTitle: 'Фото',
    businessServicesTitle: 'Қызметтер',
    businessPromotionsTitle: 'Акциялар',
    businessReviewsTitle: 'Пікірлер',
    businessContactsTitle: 'Байланыс',
    businessLocationTitle: 'Мекенжай',
    businessOpenMap: 'Картада ашу',
    businessNoReviews: 'Пікірлер әлі жоқ.',
    businessReadMoreReviews: 'тағы пікірлер',
    businessWorkHoursTitle: 'Жұмыс уақыты',
    businessHoursClosed: 'Жабық',
    businessSelectedBranch: 'Таңдалған филиал',
    businessContactPhone: 'Қоңырау шалу',
    businessContactWhatsApp: 'WhatsApp',
    businessContactInstagram: 'Instagram',
    businessContactWebsite: 'Сайт',
    businessNoRatingYet: 'Бағалаулар әлі жоқ',
    businessOwnerReply: 'Мекеме жауабы',
    businessDescriptionTitle: 'Сипаттама',
    workHoursWeekdays: ['Дс', 'Се', 'Ср', 'Бс', 'Жм', 'Сн', 'Жс'],
    homeSectionPromotions: 'Акциялар',
    homeSectionFeatured: 'Танымал орындар',
    categorySponsored: 'Жарнамалық орындар',
    emptyHomePromotions: 'Бұл қалада белсенді акциялар жоқ.',
  },
};

export function siteMetadataForLocale(locale: AppLocale): { title: string; description: string } {
  const labels = UI_LABELS[locale];
  return { title: labels.siteTitle, description: labels.siteDescription };
}
