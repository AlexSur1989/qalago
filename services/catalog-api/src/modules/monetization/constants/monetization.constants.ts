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
