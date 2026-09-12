import { placementLabel as monetizationPlacementLabel } from '../monetization-utils';

export function planTierLabel(tier: string): string {
  switch (tier) {
    case 'FREE':
      return 'Бесплатный';
    case 'BASIC':
      return 'Бизнес';
    case 'PREMIUM':
      return 'PRO';
    case 'VIP':
      return 'VIP';
    default:
      return tier;
  }
}

export const INTENT_ACTION_LABELS: Record<string, string> = {
  callClicks: 'Звонки',
  whatsappClicks: 'WhatsApp',
  routeClicks: 'Маршруты',
  websiteClicks: 'Сайт',
  instagramClicks: 'Instagram',
  favoriteAdds: 'Добавления в избранное',
};

export const CANONICAL_PLACEMENTS = [
  'HOME_VIP_BANNER',
  'CATEGORY_TOP',
  'CATEGORY_BOOST',
  'HOME_FEATURED',
  'HOME_PROMOTIONS',
] as const;

export function reportPlacementLabel(code: string): string {
  const fromMon = monetizationPlacementLabel(code);
  if (fromMon !== code) return fromMon;
  switch (code) {
    case 'CATEGORY_BOOST':
      return 'Boost в категории';
    case 'HOME_PROMOTIONS':
      return 'Акции на главной';
    default:
      return code;
  }
}
