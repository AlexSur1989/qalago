import type { AppLocale } from './locale';

type L = Record<AppLocale, string>;

function pick(locale: AppLocale, table: L): string {
  return table[locale];
}

export type ContextualLegalUiContext = 'PLAN_PURCHASE' | 'AD_PURCHASE' | 'BUSINESS_APPLICATION';

export function contextualLegalCheckboxLabel(
  locale: AppLocale,
  context: ContextualLegalUiContext,
): string {
  if (context === 'PLAN_PURCHASE') {
    return pick(locale, {
      ru: 'Я принимаю условия Публичной оферты на оказание платных услуг QalaGo',
      kk: 'Мен QalaGo ақылы қызметтерін көрсетуге арналған жария офертаның шарттарын қабылдаймын',
    });
  }
  if (context === 'AD_PURCHASE') {
    return pick(locale, {
      ru: 'Я принимаю Публичную оферту и Правила размещения рекламы и подтверждаю параметры рекламной кампании, указанные в интерфейсе',
      kk: 'Мен Жария офертаны және Жарнама орналастыру қағидаларын қабылдаймын және интерфейсте көрсетілген науқан параметрлерін растаймын',
    });
  }
  return pick(locale, {
    ru: 'Я принимаю Условия использования QalaGo для бизнеса',
    kk: 'Мен QalaGo-ны бизнес үшін пайдалану шарттарын қабылдаймын',
  });
}

export function contextualLegalConfirmRequired(locale: AppLocale): string {
  return pick(locale, {
    ru: 'Подтвердите принятие документов, чтобы продолжить',
    kk: 'Жалғастыру үшін құжаттарды қабылдауды растаңыз',
  });
}

export function contextualLegalVersionStale(locale: AppLocale): string {
  return pick(locale, {
    ru: 'Документы обновлены. Ознакомьтесь и примите актуальные версии',
    kk: 'Құжаттар жаңартылды. Өзекті нұсқалармен танысып, қабылдаңыз',
  });
}

export function contextualLegalUnavailable(locale: AppLocale): string {
  return pick(locale, {
    ru: 'Юридические документы временно недоступны. Попробуйте позже',
    kk: 'Құқықтық құжаттар уақытша қолжетімсіз. Кейінірек көріңіз',
  });
}

export function contextualLegalAcceptFailed(locale: AppLocale): string {
  return pick(locale, {
    ru: 'Не удалось сохранить принятие документов',
    kk: 'Құжаттарды қабылдау сақталмады',
  });
}

export function contextualLegalLinkOffer(locale: AppLocale): string {
  return pick(locale, {
    ru: 'Публичная оферта',
    kk: 'Жария оферта',
  });
}

export function contextualLegalLinkAdvertisingRules(locale: AppLocale): string {
  return pick(locale, {
    ru: 'Правила размещения рекламы',
    kk: 'Жарнама орналастыру қағидалары',
  });
}

export function contextualLegalLinkBusinessTerms(locale: AppLocale): string {
  return pick(locale, {
    ru: 'Условия для бизнеса',
    kk: 'Бизнес шарттары',
  });
}
