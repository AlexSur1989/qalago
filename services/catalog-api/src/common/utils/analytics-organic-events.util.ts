import { AnalyticsEventType } from '@prisma/client';

/** Organic consumer events accepted by POST /analytics/events. Ad events use monetization pipeline. */
export const ORGANIC_ANALYTICS_EVENT_TYPES = new Set<AnalyticsEventType>([
  AnalyticsEventType.VIEW_BUSINESS,
  AnalyticsEventType.BUSINESS_IMPRESSION,
  AnalyticsEventType.SEARCH_PERFORMED,
  AnalyticsEventType.SEARCH_RESULT_IMPRESSION,
  AnalyticsEventType.SEARCH_RESULT_OPEN,
  AnalyticsEventType.CALL_CLICK,
  AnalyticsEventType.WHATSAPP_CLICK,
  AnalyticsEventType.ROUTE_CLICK,
  AnalyticsEventType.WEBSITE_CLICK,
  AnalyticsEventType.INSTAGRAM_CLICK,
  AnalyticsEventType.FAVORITE_ADD,
  AnalyticsEventType.FAVORITE_REMOVE,
  AnalyticsEventType.PROMOTION_VIEW,
  AnalyticsEventType.PROMOTION_IMPRESSION,
  AnalyticsEventType.PROMOTION_ACTION,
  AnalyticsEventType.CATALOG_ITEM_IMPRESSION,
  AnalyticsEventType.CATALOG_ITEM_VIEW,
  AnalyticsEventType.CATALOG_ITEM_ACTION,
  AnalyticsEventType.REVIEWS_VIEW,
  AnalyticsEventType.REVIEW_CREATED,
]);

export const ATTRIBUTION_EVENT_TYPES = new Set<AnalyticsEventType>([
  AnalyticsEventType.VIEW_BUSINESS,
  AnalyticsEventType.BUSINESS_IMPRESSION,
  AnalyticsEventType.SEARCH_RESULT_IMPRESSION,
  AnalyticsEventType.SEARCH_RESULT_OPEN,
]);

export const SEARCH_ATTRIBUTION_EVENT_TYPES = new Set<AnalyticsEventType>([
  AnalyticsEventType.SEARCH_RESULT_IMPRESSION,
  AnalyticsEventType.SEARCH_RESULT_OPEN,
  AnalyticsEventType.VIEW_BUSINESS,
]);

export const PROMOTION_EVENT_TYPES = new Set<AnalyticsEventType>([
  AnalyticsEventType.PROMOTION_VIEW,
  AnalyticsEventType.PROMOTION_IMPRESSION,
  AnalyticsEventType.PROMOTION_ACTION,
]);

export const CATALOG_EVENT_TYPES = new Set<AnalyticsEventType>([
  AnalyticsEventType.CATALOG_ITEM_IMPRESSION,
  AnalyticsEventType.CATALOG_ITEM_VIEW,
  AnalyticsEventType.CATALOG_ITEM_ACTION,
]);

export function isOrganicAnalyticsEventType(type: AnalyticsEventType): boolean {
  return ORGANIC_ANALYTICS_EVENT_TYPES.has(type);
}
