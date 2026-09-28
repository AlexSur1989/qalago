import type { AppLocale } from './locale';

/**
 * Consumer public help copy — sourced from Flutter `ProfileHelpScreen` ARB
 * (`profileHelp*` keys in apps/mobile/lib/l10n/app_ru.arb / app_kk.arb).
 */
export type HelpFaqItem = { q: string; a: string };

export type HelpUiLabels = {
  pageHeading: string;
  pageTitle: string;
  pageDescription: string;
  faqTitle: string;
  needSupport: string;
  supportBody: string;
  supportContactLabel: string;
  supportPlaceholderNote: string;
  tagline: string;
  faq: HelpFaqItem[];
};

export const HELP_UI: Record<AppLocale, HelpUiLabels> = {
  ru: {
    pageHeading: 'Помощь',
    pageTitle: 'Помощь — QalaGo',
    pageDescription: 'Частые вопросы и поддержка пользователей QalaGo',
    faqTitle: 'Частые вопросы',
    needSupport: 'Нужна помощь?',
    supportBody:
      'Если у вас возникли вопросы по работе приложения, обратитесь в поддержку QalaGo через официальные каналы вашего города.',
    supportContactLabel: 'Контакт поддержки (email)',
    supportPlaceholderNote:
      'Контактные данные поддержки будут назначены оператором перед production (NEXT_PUBLIC_SUPPORT_CONTACT_EMAIL, docs/legal-review-required.md).',
    tagline: 'QalaGo — городской гид и маркетплейс. MVP запущен в Уральске.',
    faq: [
      {
        q: 'Как добавить заведение?',
        a: 'В профиле выберите «Добавить заведение», заполните форму и дождитесь модерации.',
      },
      {
        q: 'Как сменить город?',
        a: 'Нажмите название города на главной или в профиле → «Мой город». Для аккаунта город сохраняется в облаке.',
      },
      {
        q: 'Как оставить отзыв?',
        a: 'Откройте карточку заведения, прокрутите до блока отзывов и нажмите «Оставить отзыв».',
      },
      {
        q: 'Не приходит код входа',
        a: 'Проверьте номер телефона и подождите минуту. Если код не пришёл, нажмите «Отправить снова» на экране входа.',
      },
    ],
  },
  kk: {
    pageHeading: 'Көмек',
    pageTitle: 'Көмек — QalaGo',
    pageDescription: 'QalaGo пайдаланушыларына жиі қойылатын сұрақтар және қолдау',
    faqTitle: 'Жиі қойылатын сұрақтар',
    needSupport: 'Көмек керек пе?',
    supportBody:
      'Қолданба жұмысы бойынша сұрақтар болса, QalaGo ресми арналары арқылы қолдауға хабарласыңыз.',
    supportContactLabel: 'Қолдау байланысы (email)',
    supportPlaceholderNote:
      'Production алдында оператор қолдау байланысын тағайындайды (NEXT_PUBLIC_SUPPORT_CONTACT_EMAIL, docs/legal-review-required.md).',
    tagline: 'QalaGo — қалалық гид және маркетплейс. MVP Уральскте іске қосылды.',
    faq: [
      {
        q: 'Мекемені қалай қосуға болады?',
        a: 'Профильде «Мекеме қосу» таңдап, форманы толтырып, модерацияны күтіңіз.',
      },
      {
        q: 'Қаланы қалай ауыстыруға болады?',
        a: 'Басты бетте немесе профильде қала атауын басыңыз → «Менің қалам». Аккаунт үшін қала бұлтта сақталады.',
      },
      {
        q: 'Пікір қалай қалдыруға болады?',
        a: 'Мекеме карточкасын ашып, пікірлер бөліміне дейін айналдырып, «Пікір қалдыру» басыңыз.',
      },
      {
        q: 'Кіріс коды келмейді',
        a: 'Телефон нөмірін тексеріп, бір минут күтіңіз. Код келмесе, кіру экранында «Кодты қайта жіберу» басыңыз.',
      },
    ],
  },
};
