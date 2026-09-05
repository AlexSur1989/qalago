import { BusinessPlanTier, MonetizationProductType } from '@prisma/client';

/** Legacy plan tier → monetization discount percent (Stage 2 temporary mapping). */
export const LEGACY_PLAN_DISCOUNT_PERCENT: Record<BusinessPlanTier, number> = {
  [BusinessPlanTier.BASIC]: 0,
  [BusinessPlanTier.PRO]: 10,
  [BusinessPlanTier.TOP_CITY]: 15,
};

/** Package orders never receive plan-tier discounts on Stage 2. */
export const PACKAGE_DISCOUNT_PERCENT = 0;

/** Product type → AdPlacement.code for campaign provisioning. */
export const PRODUCT_PLACEMENT_MAP: Partial<Record<MonetizationProductType, string>> = {
  [MonetizationProductType.BOOST]: 'CATEGORY_BOOST',
  [MonetizationProductType.TOP_CATEGORY]: 'CATEGORY_TOP',
  [MonetizationProductType.FEATURED_BUSINESS]: 'HOME_FEATURED',
  [MonetizationProductType.VIP_BANNER]: 'HOME_VIP_BANNER',
  [MonetizationProductType.PROMOTED_PROMOTION]: 'HOME_PROMOTIONS',
};

/** Placements that enforce scoped availability limits. */
export const SCOPED_AVAILABILITY_PLACEMENTS = new Set([
  'HOME_VIP_BANNER',
  'CATEGORY_TOP',
  'HOME_FEATURED',
]);

/** Campaign statuses that consume placement capacity. */
export const CAPACITY_CAMPAIGN_STATUSES = ['ACTIVE', 'SCHEDULED'] as const;

/** Monetization product code used for package order line items. */
export const PACKAGE_PRODUCT_CODE = 'PACKAGE';

export const ORDER_NUMBER_PREFIX = 'QLG';

/** Placements with active ad serving (Stage 3A). */
export const SERVING_PLACEMENT_CODES = [
  'HOME_VIP_BANNER',
  'HOME_FEATURED',
  'HOME_PROMOTIONS',
  'CATEGORY_TOP',
  'CATEGORY_BOOST',
] as const;

export type ServingPlacementCode = (typeof SERVING_PLACEMENT_CODES)[number];

/** Reserved for future stages — not served yet. */
export const INACTIVE_SERVING_PLACEMENTS = ['SEARCH_TOP', 'MAP_FEATURED'] as const;

/** Analytics event types accepted by POST /monetization/ads/events. */
export const AD_ANALYTICS_EVENT_TYPES = [
  'AD_IMPRESSION',
  'AD_CLICK',
  'AD_CARD_OPEN',
  'AD_CALL_CLICK',
  'AD_WHATSAPP_CLICK',
  'AD_ROUTE_CLICK',
  'AD_WEBSITE_CLICK',
  'AD_INSTAGRAM_CLICK',
  'AD_PROMOTION_OPEN',
] as const;

export type AdAnalyticsEventType = (typeof AD_ANALYTICS_EVENT_TYPES)[number];

/** Dedupe window for qualified AD_IMPRESSION per session. */
export const IMPRESSION_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

export const SESSION_ID_MAX_LENGTH = 128;

export const SPONSORED_DISPLAY_LABEL = 'Реклама';

/** Placements that require categoryId in serve query. */
export const CATEGORY_SCOPED_PLACEMENTS = new Set<ServingPlacementCode>([
  'CATEGORY_TOP',
  'CATEGORY_BOOST',
]);

/** Placements that require approved creative on campaign. */
export const CREATIVE_REQUIRED_PLACEMENTS = new Set<ServingPlacementCode>([
  'HOME_VIP_BANNER',
]);
