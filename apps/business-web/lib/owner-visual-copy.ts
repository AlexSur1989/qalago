import type { AppLocale } from './locale';
import { businessPermissionLabel } from './presentation';

type L = Record<AppLocale, string>;

function pick(locale: AppLocale, table: L): string {
  return table[locale];
}

function withDays(locale: AppLocale, table: L, days: number): string {
  return pick(locale, table).replace('${days}', String(days));
}

function withCount(locale: AppLocale, table: L, count: number): string {
  return pick(locale, table).replace('${count}', String(count));
}

function withTwoCounts(
  locale: AppLocale,
  table: L,
  a: number,
  b: number,
): string {
  return pick(locale, table)
    .replace('${a}', String(a))
    .replace('${b}', String(b));
}

const ANALYTICS_PERIOD_DAYS: L = {
  ru: 'Период: ${days} дн.',
  kk: 'Кезең: ${days} күн',
};

export function analyticsPeriodDaysLabel(locale: AppLocale, days: number): string {
  return withDays(locale, ANALYTICS_PERIOD_DAYS, days);
}

const ANALYTICS_VIEWS_CHART: L = {
  ru: 'Просмотры за ${days} дн.',
  kk: '${days} күндегі қараулар',
};

export function analyticsViewsChartTitle(locale: AppLocale, days: number): string {
  return withDays(locale, ANALYTICS_VIEWS_CHART, days);
}

const ANALYTICS_ACTIONS_CHART: L = {
  ru: 'Целевые действия за ${days} дн.',
  kk: '${days} күндегі мақсатты әрекеттер',
};

export function analyticsActionsChartTitle(locale: AppLocale, days: number): string {
  return withDays(locale, ANALYTICS_ACTIONS_CHART, days);
}

const ANALYTICS_CTR_DETAIL: L = {
  ru: 'CTR (просмотры / показы):',
  kk: 'CTR (қараулар / көрсетулер):',
};

export function analyticsCtrDetailPrefix(locale: AppLocale): string {
  return pick(locale, ANALYTICS_CTR_DETAIL);
}

const ANALYTICS_CONVERSION_DETAIL: L = {
  ru: 'Конверсия (действия / просмотры):',
  kk: 'Конверсия (әрекеттер / қараулар):',
};

export function analyticsConversionDetailPrefix(locale: AppLocale): string {
  return pick(locale, ANALYTICS_CONVERSION_DETAIL);
}

const UNIQUE_VISITORS_PERIOD: L = {
  ru: 'Уникальные посетители (за период):',
  kk: 'Бірегей келушілер (кезең бойынша):',
};

const UNIQUE_VISITORS_APPROX: L = {
  ru: 'Уникальные посетители (сумма по дням, приближение):',
  kk: 'Бірегей келушілер (күн бойынша жиын, жуық):',
};

const SESSIONS_PERIOD: L = {
  ru: 'Сессии (за период):',
  kk: 'Сессиялар (кезең бойынша):',
};

const SESSIONS_APPROX: L = {
  ru: 'Сессии (сумма по дням, приближение):',
  kk: 'Сессиялар (күн бойынша жиын, жуық):',
};

export function analyticsUniqueVisitorsPeriodLabel(locale: AppLocale): string {
  return pick(locale, UNIQUE_VISITORS_PERIOD);
}

export function analyticsUniqueVisitorsApproxLabel(locale: AppLocale): string {
  return pick(locale, UNIQUE_VISITORS_APPROX);
}

export function analyticsSessionsPeriodLabel(locale: AppLocale): string {
  return pick(locale, SESSIONS_PERIOD);
}

export function analyticsSessionsApproxLabel(locale: AppLocale): string {
  return pick(locale, SESSIONS_APPROX);
}

const BENCHMARK_VIEWS: L = {
  ru: 'Просмотры: ${a} vs среднее ${b}',
  kk: 'Қараулар: ${a} vs орташа ${b}',
};

const BENCHMARK_ACTIONS: L = {
  ru: 'Действия: ${a} vs среднее ${b}',
  kk: 'Әрекеттер: ${a} vs орташа ${b}',
};

export function analyticsBenchmarkViewsLine(
  locale: AppLocale,
  businessViews: number,
  categoryAvg: number,
  formatNumber: (n: number) => string,
): string {
  return pick(locale, BENCHMARK_VIEWS)
    .replace('${a}', formatNumber(businessViews))
    .replace('${b}', formatNumber(categoryAvg));
}

export function analyticsBenchmarkActionsLine(
  locale: AppLocale,
  businessActions: number,
  categoryAvg: number,
  formatNumber: (n: number) => string,
): string {
  const a = formatNumber(businessActions);
  const b = formatNumber(categoryAvg);
  return pick(locale, BENCHMARK_ACTIONS).replace('${a}', a).replace('${b}', b);
}

const PLAN_PAGE_META: L = {
  ru: 'Подписка для лимитов и скидки на рекламу — ${name}',
  kk: 'Лимиттер мен жарнама жеңілдігі үшін тариф — ${name}',
};

export function planPageHeaderMeta(locale: AppLocale, businessName: string): string {
  return pick(locale, PLAN_PAGE_META).replace('${name}', businessName);
}

const PLAN_CURRENT_TIER: L = {
  ru: 'Текущий тариф: ${name}',
  kk: 'Ағымдағы тариф: ${name}',
};

export function planCurrentTierTitle(locale: AppLocale, planName: string): string {
  return pick(locale, PLAN_CURRENT_TIER).replace('${name}', planName);
}

export function planQuotaPhotosLabel(locale: AppLocale): string {
  return locale === 'kk' ? 'Фото' : 'Фото';
}

export function planQuotaCatalogLabel(locale: AppLocale): string {
  return businessPermissionLabel(locale, 'CATALOG_EDIT');
}

export function planQuotaPromotionsLabel(locale: AppLocale): string {
  return businessPermissionLabel(locale, 'PROMOTIONS_EDIT');
}

const PLAN_MANAGERS: L = {
  ru: 'Менеджеры: ${a} / ${b}',
  kk: 'Менеджерлер: ${a} / ${b}',
};

export function planManagersUsageLine(locale: AppLocale, active: number, limit: number): string {
  return withTwoCounts(locale, PLAN_MANAGERS, active, limit);
}

const PLAN_VALID_UNTIL: L = {
  ru: 'Действует до',
  kk: 'Мерзімі',
};

export function planValidUntilPrefix(locale: AppLocale): string {
  return pick(locale, PLAN_VALID_UNTIL);
}

const PLAN_FEATURE_PHOTOS: L = {
  ru: 'Фото: ${max}',
  kk: 'Фото: ${max}',
};

const PLAN_FEATURE_ITEMS: L = {
  ru: 'Товары/услуги: ${max}',
  kk: 'Тауарлар/қызметтер: ${max}',
};

const PLAN_FEATURE_PROMOTIONS: L = {
  ru: 'Акции: ${max}',
  kk: 'Акциялар: ${max}',
};

const PLAN_FEATURE_MANAGERS: L = {
  ru: 'Менеджеры: ${max}',
  kk: 'Менеджерлер: ${max}',
};

const PLAN_FEATURE_REVIEWS: L = {
  ru: 'Ответы на отзывы: ${value}',
  kk: 'Пікірлерге жауап: ${value}',
};

const PLAN_FEATURE_ANALYTICS: L = {
  ru: 'Аналитика: ${value}',
  kk: 'Аналитика: ${value}',
};

const PLAN_FEATURE_AD_BONUS: L = {
  ru: 'Бонус на рекламу QalaGo:',
  kk: 'QalaGo жарнама бонусы:',
};

const PLAN_FEATURE_AD_DISCOUNT: L = {
  ru: 'Скидка на рекламу: ${percent}%',
  kk: 'Жарнама жеңілдігі: ${percent}%',
};

export function planFeaturePhotosLine(locale: AppLocale, max: number): string {
  return withCount(locale, PLAN_FEATURE_PHOTOS, max);
}

export function planFeatureServiceItemsLine(locale: AppLocale, max: number): string {
  return withCount(locale, PLAN_FEATURE_ITEMS, max);
}

export function planFeaturePromotionsLine(locale: AppLocale, max: number): string {
  return withCount(locale, PLAN_FEATURE_PROMOTIONS, max);
}

export function planFeatureManagersLine(locale: AppLocale, max: number): string {
  return withCount(locale, PLAN_FEATURE_MANAGERS, max);
}

export function planFeatureReviewsLine(locale: AppLocale, yesNo: string): string {
  return pick(locale, PLAN_FEATURE_REVIEWS).replace('${value}', yesNo);
}

export function planFeatureAnalyticsLine(locale: AppLocale, level: string): string {
  return pick(locale, PLAN_FEATURE_ANALYTICS).replace('${value}', level);
}

export function planFeatureAdBonusPrefix(locale: AppLocale): string {
  return pick(locale, PLAN_FEATURE_AD_BONUS);
}

export function planFeatureAdDiscountLine(locale: AppLocale, percent: number): string {
  return pick(locale, PLAN_FEATURE_AD_DISCOUNT).replace('${percent}', String(percent));
}

const MONETIZATION_AD_DISCOUNT: L = {
  ru: 'Скидка на рекламу: ${percent}%',
  kk: 'Жарнама жеңілдігі: ${percent}%',
};

export function monetizationAdvertisingDiscountLine(locale: AppLocale, percent: number): string {
  return pick(locale, MONETIZATION_AD_DISCOUNT).replace('${percent}', String(percent));
}

const QUOTE_PERIOD: L = { ru: 'Период:', kk: 'Кезең:' };
const QUOTE_START: L = { ru: 'Старт:', kk: 'Басталуы:' };
const QUOTE_NEXT_SLOT: L = { ru: 'Ближайшая дата:', kk: 'Ең жақын күн:' };

export function monetizationQuotePeriodLabel(locale: AppLocale): string {
  return pick(locale, QUOTE_PERIOD);
}

export function monetizationQuoteStartLabel(locale: AppLocale): string {
  return pick(locale, QUOTE_START);
}

export function monetizationQuoteNextAvailableLabel(locale: AppLocale): string {
  return pick(locale, QUOTE_NEXT_SLOT);
}

const LEGAL_CONSENT_PREFIX: L = {
  ru: 'Продолжая, вы принимаете',
  kk: 'Жалғастыра отырып, сіз қабылдайсыз',
};

const LEGAL_CONSENT_MIDDLE: L = {
  ru: 'и подтверждаете, что ознакомились с',
  kk: 'және танысқаныңызды растайсыз',
};

export function legalConsentPrefix(locale: AppLocale): string {
  return pick(locale, LEGAL_CONSENT_PREFIX);
}

export function legalConsentMiddle(locale: AppLocale): string {
  return pick(locale, LEGAL_CONSENT_MIDDLE);
}

const LOGIN_NO_BUSINESS: L = {
  ru: 'Нет бизнеса в QalaGo?',
  kk: 'QalaGo-да бизнес жоқ па?',
};

export function loginNoBusinessPrompt(locale: AppLocale): string {
  return pick(locale, LOGIN_NO_BUSINESS);
}

const TEAM_PAGE_META: L = {
  ru: '${name} · приглашения и права менеджеров',
  kk: '${name} · менеджерлерді шақыру және құқықтар',
};

export function teamPageHeaderMeta(locale: AppLocale, businessTitle: string): string {
  return pick(locale, TEAM_PAGE_META).replace('${name}', businessTitle);
}

const MENU_ITEM_COUNT: L = {
  ru: '${count} поз.',
  kk: '${count} поз.',
};

export function menuSectionItemCountLabel(locale: AppLocale, count: number): string {
  return withCount(locale, MENU_ITEM_COUNT, count);
}

const DASHBOARD_UNTIL: L = { ru: 'до', kk: 'дейін' };

export function dashboardDateUntilWord(locale: AppLocale): string {
  return pick(locale, DASHBOARD_UNTIL);
}

const MONETIZATION_PRODUCTS_META: L = {
  ru: 'Каталог размещений для ${name}',
  kk: '${name} үшін орналастыру каталогы',
};

export function monetizationProductsPageMeta(locale: AppLocale, businessTitle: string): string {
  return pick(locale, MONETIZATION_PRODUCTS_META).replace('${name}', businessTitle);
}

const MONETIZATION_CAMPAIGN_META: L = {
  ru: 'Кампания #${id}',
  kk: 'Науқан #${id}',
};

export function monetizationCampaignPageMeta(locale: AppLocale, idPrefix: string): string {
  return pick(locale, MONETIZATION_CAMPAIGN_META).replace('${id}', idPrefix);
}

const MONETIZATION_ORDER_TITLE: L = {
  ru: 'Заказ ${number}',
  kk: 'Тапсырыс ${number}',
};

export function monetizationOrderPageTitle(locale: AppLocale, orderNumber: string): string {
  return pick(locale, MONETIZATION_ORDER_TITLE).replace('${number}', orderNumber);
}

const NO_ACTIVE_PROMOTIONS: L = {
  ru: 'Нет активных акций.',
  kk: 'Белсенді акциялар жоқ.',
};

export function monetizationNoActivePromotions(locale: AppLocale): string {
  return pick(locale, NO_ACTIVE_PROMOTIONS);
}

const INVITE_RECIPIENT: L = {
  ru: 'Адресат:',
  kk: 'Алушы:',
};

const INVITE_STATUS: L = {
  ru: 'Статус:',
  kk: 'Күйі:',
};

const INVITE_EXPIRES: L = {
  ru: 'Действует до:',
  kk: 'Мерзімі:',
};

export function inviteRecipientLabel(locale: AppLocale): string {
  return pick(locale, INVITE_RECIPIENT);
}

export function inviteStatusLabel(locale: AppLocale): string {
  return pick(locale, INVITE_STATUS);
}

export function inviteExpiresLabel(locale: AppLocale): string {
  return pick(locale, INVITE_EXPIRES);
}

const CAMPAIGN_KPI_SERVED: L = {
  ru: 'Показы (served)',
  kk: 'Көрсетулер (served)',
};

export function campaignKpiServedLabel(locale: AppLocale): string {
  return pick(locale, CAMPAIGN_KPI_SERVED);
}

const STATS_PERIOD_DAYS: L = {
  ru: '${days} дн.',
  kk: '${days} күн',
};

export function statisticsPeriodDaysLabel(locale: AppLocale, days: number): string {
  return pick(locale, STATS_PERIOD_DAYS).replace('${days}', String(days));
}
