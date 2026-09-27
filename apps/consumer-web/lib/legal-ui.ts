import type { AppLocale } from './locale';

/** QalaGo-owned legal page chrome (RU/KK). Legal body stays RU until counsel review. */
export type LegalUiLabels = {
  legalUpdatedLabel: string;
  legalDraftNotice: string;
  legalPrivacyLink: string;
  legalTermsLink: string;
  legalAccountDeletionLink: string;
  legalNavAria: string;
  legalProductionUrlNote: string;
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
    accountDeletionPageTitle: 'Аккаунтты жою — QalaGo',
    accountDeletionPageDescription: 'QalaGo аккаунтын қалай жоюға болады және қандай деректерге әсер етеді',
  },
};
