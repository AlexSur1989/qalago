import { MonetizationProductType } from '@prisma/client';

export type PurchasePolicy = 'SINGLE_PER_SCOPE' | 'MULTI_DISTINCT_TARGETS';
export type RenewalPolicy = 'SCHEDULE' | 'APPEND' | 'BLOCK';

export const PRODUCT_PURCHASE_POLICY: Partial<
  Record<MonetizationProductType, PurchasePolicy>
> = {
  VIP_BANNER: 'SINGLE_PER_SCOPE',
  TOP_CATEGORY: 'SINGLE_PER_SCOPE',
  BOOST: 'SINGLE_PER_SCOPE',
  FEATURED_BUSINESS: 'SINGLE_PER_SCOPE',
  PROMOTED_PROMOTION: 'MULTI_DISTINCT_TARGETS',
};

export const PRODUCT_RENEWAL_POLICY: Partial<
  Record<MonetizationProductType, RenewalPolicy>
> = {
  VIP_BANNER: 'SCHEDULE',
  TOP_CATEGORY: 'SCHEDULE',
  BOOST: 'SCHEDULE',
  FEATURED_BUSINESS: 'SCHEDULE',
  PROMOTED_PROMOTION: 'SCHEDULE',
};
