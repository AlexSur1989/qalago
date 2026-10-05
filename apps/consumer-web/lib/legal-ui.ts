import type { AppLocale } from './locale';
import type { ExtendedLegalRootSegment } from './legal-paths';

/** @deprecated 6.15L.2 — bodies load from docs/legal per UI locale (ru/kk). */
export const LEGAL_BODY_SOURCE_LOCALE = 'ru' as const;

export type LegalUiLabels = {
  legalUpdatedLabel: string;
  legalDraftNotice: string;
  legalPrivacyLink: string;
  legalTermsLink: string;
  legalAccountDeletionLink: string;
  legalNavAria: string;
  legalProductionUrlNote: string;
  privacyPageHeading: string;
  privacyPageTitle: string;
  privacyPageDescription: string;
  termsPageHeading: string;
  termsPageTitle: string;
  termsPageDescription: string;
  accountDeletionPageHeading: string;
  accountDeletionPageTitle: string;
  accountDeletionPageDescription: string;
};

export const LEGAL_UI: Record<AppLocale, LegalUiLabels> = {
  ru: {
    legalUpdatedLabel: 'Обновлено',
    legalDraftNotice:
      'Черновик для внутренней и dev-среды. Перед публикацией в production требуется юридическая проверка и заполнение реквизитов оператора.',
    legalPrivacyLink: 'Политика конфиденциальности',
    legalTermsLink: 'Условия использования',
    legalAccountDeletionLink: 'Удаление аккаунта',
    legalNavAria: 'Правовые документы',
    legalProductionUrlNote: 'Production URL: {url} (после развёртывания на qalago.kz)',
    privacyPageHeading: 'Политика конфиденциальности',
    privacyPageTitle: 'Политика конфиденциальности — QalaGo',
    privacyPageDescription: 'Политика конфиденциальности сервиса QalaGo',
    termsPageHeading: 'Условия использования',
    termsPageTitle: 'Условия использования — QalaGo',
    termsPageDescription: 'Условия использования сервиса QalaGo',
    accountDeletionPageHeading: 'Удаление аккаунта QalaGo',
    accountDeletionPageTitle: 'Удаление аккаунта — QalaGo',
    accountDeletionPageDescription: 'Как удалить аккаунт QalaGo и какие данные затрагиваются',
  },
  kk: {
    legalUpdatedLabel: 'Жаңартылды',
    legalDraftNotice:
      'Ішкі және dev ортаға арналған жоба. Production-ға жариялау алдында заңды тексеру және оператор деректемелері толтырылуы керек.',
    legalPrivacyLink: 'Құпиялылық саясаты',
    legalTermsLink: 'Пайдалану шарттары',
    legalAccountDeletionLink: 'Аккаунтты жою',
    legalNavAria: 'Құқықтық құжаттар',
    legalProductionUrlNote: 'Production URL: {url} (qalago.kz-ге орналастырғаннан кейін)',
    privacyPageHeading: 'Құпиялылық саясаты',
    privacyPageTitle: 'Құпиялылық саясаты — QalaGo',
    privacyPageDescription: 'QalaGo сервисінің құпиялылық саясаты',
    termsPageHeading: 'Пайдалану шарттары',
    termsPageTitle: 'Пайдалану шарттары — QalaGo',
    termsPageDescription: 'QalaGo сервисінің пайдалану шарттары',
    accountDeletionPageHeading: 'QalaGo аккаунтын жою',
    accountDeletionPageTitle: 'Аккаунтты жою — QalaGo',
    accountDeletionPageDescription: 'QalaGo аккаунтын қалай жоюға болады және қандай деректерге әсер етеді',
  },
};

const EXTENDED_HEADINGS: Record<AppLocale, Partial<Record<ExtendedLegalRootSegment, string>>> = {
  ru: {
    community: 'Правила контента, отзывов и модерации QalaGo',
    'personal-data-consent': 'Согласие на сбор и обработку персональных данных',
    'business-terms': 'Условия использования QalaGo для бизнеса',
    offer: 'Публичная оферта на оказание платных услуг QalaGo',
    'advertising-rules': 'Правила размещения рекламы в QalaGo',
    cookies: 'Политика использования Cookie и аналитики QalaGo',
  },
  kk: {
    community: 'QalaGo-да контентті, пікірлерді жариялау және модерациялау қағидалары',
    'personal-data-consent': 'Дербес деректерді жинауға және өңдеуге келісім',
    'business-terms': 'QalaGo-ны бизнес үшін пайдалану шарттары',
    offer: 'QalaGo ақылы қызметтерін көрсетуге арналған жария оферта',
    'advertising-rules': 'QalaGo-да жарнама орналастыру қағидалары',
    cookies: 'QalaGo Cookie файлдары мен аналитиканы пайдалану саясаты',
  },
};

export function legalPageHeading(locale: AppLocale, page: ExtendedLegalRootSegment): string {
  const ui = LEGAL_UI[locale];
  switch (page) {
    case 'privacy':
      return ui.privacyPageHeading;
    case 'terms':
      return ui.termsPageHeading;
    case 'account-deletion':
      return ui.accountDeletionPageHeading;
    default:
      return EXTENDED_HEADINGS[locale][page] ?? page;
  }
}

export function legalPageMetadataCopy(
  locale: AppLocale,
  page: ExtendedLegalRootSegment,
): { title: string; description: string } {
  const ui = LEGAL_UI[locale];
  switch (page) {
    case 'privacy':
      return { title: ui.privacyPageTitle, description: ui.privacyPageDescription };
    case 'terms':
      return { title: ui.termsPageTitle, description: ui.termsPageDescription };
    case 'account-deletion':
      return {
        title: ui.accountDeletionPageTitle,
        description: ui.accountDeletionPageDescription,
      };
    default: {
      const heading = EXTENDED_HEADINGS[locale][page] ?? page;
      return { title: `${heading} — QalaGo`, description: heading };
    }
  }
}
