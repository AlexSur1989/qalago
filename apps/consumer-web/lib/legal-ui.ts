import type { AppLocale } from './locale';
import type { PublicLegalRootSegment } from './legal-paths';

/**
 * QalaGo-owned legal page chrome (RU/KK). Legal **body** copy remains Russian until
 * counsel-approved Kazakh (or bilingual) text exists — not machine-translated in F.7.
 */
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

export function legalPageHeading(locale: AppLocale, page: PublicLegalRootSegment): string {
  const ui = LEGAL_UI[locale];
  switch (page) {
    case 'privacy':
      return ui.privacyPageHeading;
    case 'terms':
      return ui.termsPageHeading;
    case 'account-deletion':
      return ui.accountDeletionPageHeading;
  }
}

export function legalPageMetadataCopy(
  locale: AppLocale,
  page: PublicLegalRootSegment,
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
  }
}
