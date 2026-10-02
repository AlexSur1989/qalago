/** Unified monetization placement codes (catalog-api serve contract). */
export const AD_PLACEMENT = {
  HOME_VIP_BANNER: 'HOME_VIP_BANNER',
  HOME_FEATURED: 'HOME_FEATURED',
  HOME_PROMOTIONS: 'HOME_PROMOTIONS',
  CATEGORY_TOP: 'CATEGORY_TOP',
  CATEGORY_BOOST: 'CATEGORY_BOOST',
} as const;

export type AdPlacementCode = (typeof AD_PLACEMENT)[keyof typeof AD_PLACEMENT];

export const AD_EVENT = {
  IMPRESSION: 'AD_IMPRESSION',
  CLICK: 'AD_CLICK',
} as const;
