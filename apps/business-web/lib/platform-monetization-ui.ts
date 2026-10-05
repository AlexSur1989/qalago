import type { AppLocale } from './locale';
import { MonetizationMode } from '@qalago/shared-types';

type L = Record<AppLocale, string>;

function pick(locale: AppLocale, table: L): string {
  return table[locale];
}

const LAUNCH_ACCESS_BANNER: L = {
  ru: 'Доступ на период запуска активен: покупки тарифов и рекламы временно недоступны, лимиты заведения расширены в рамках launch-профиля.',
  kk: 'Іске қосу кезеңіне қол жеткізу белсенді: тариф пен жарнама сатып алу уақытша өшірілген, лимиттер launch профилі аясында кеңейтілген.',
};

const LAUNCH_ACCESS_BADGE: L = {
  ru: 'Бесплатный доступ на период запуска',
  kk: 'Іске қосу кезеңіне тегін қол жеткізу',
};

const MONETIZATION_DISABLED_NOTICE: L = {
  ru: 'Монетизация временно недоступна.',
  kk: 'Монетизация уақытша қолжетімсіз.',
};

export function launchAccessBanner(locale: AppLocale): string {
  return pick(locale, LAUNCH_ACCESS_BANNER);
}

export function launchAccessBadge(locale: AppLocale): string {
  return pick(locale, LAUNCH_ACCESS_BADGE);
}

export function monetizationPurchasesDisabledNotice(locale: AppLocale): string {
  return pick(locale, MONETIZATION_DISABLED_NOTICE);
}

/** UX-only; backend remains authoritative. */
export function platformMonetizationFromFlags(input: {
  monetizationMode: MonetizationMode;
  canPurchasePlans: boolean;
  canPurchaseAds: boolean;
  launchAccessActive: boolean;
}) {
  return input;
}
