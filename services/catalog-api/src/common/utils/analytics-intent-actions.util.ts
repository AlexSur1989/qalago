/** Stage 6.6A.1 — canonical owner business intent actions (not content engagement). */

import { AnalyticsEventType } from '@prisma/client';
export type DailyIntentCounterTotals = {
  callClicks: number;
  whatsappClicks: number;
  routeClicks: number;
  websiteClicks: number;
  instagramClicks: number;
  favoriteAdds: number;
};

/** Positive business-intent events counted in conversion and `actions` totals. */
export const BUSINESS_INTENT_ACTION_EVENT_TYPES: readonly AnalyticsEventType[] = [
  AnalyticsEventType.CALL_CLICK,
  AnalyticsEventType.WHATSAPP_CLICK,
  AnalyticsEventType.ROUTE_CLICK,
  AnalyticsEventType.WEBSITE_CLICK,
  AnalyticsEventType.INSTAGRAM_CLICK,
  AnalyticsEventType.FAVORITE_ADD,
];

export const BUSINESS_INTENT_ACTION_EVENT_TYPE_SET = new Set<AnalyticsEventType>(
  BUSINESS_INTENT_ACTION_EVENT_TYPES,
);

export function isBusinessIntentActionEventType(type: AnalyticsEventType): boolean {
  return BUSINESS_INTENT_ACTION_EVENT_TYPE_SET.has(type);
}

export function sumBusinessIntentActionsFromCounts(
  counts: Partial<Record<AnalyticsEventType, number>>,
): number {
  return BUSINESS_INTENT_ACTION_EVENT_TYPES.reduce(
    (sum, type) => sum + (counts[type] ?? 0),
    0,
  );
}

/** Sum from daily rollup counters (excludes promotionViews and other engagement metrics). */
export function sumBusinessIntentActionsFromDaily(totals: DailyIntentCounterTotals): number {
  return (
    totals.callClicks +
    totals.whatsappClicks +
    totals.routeClicks +
    totals.websiteClicks +
    totals.instagramClicks +
    totals.favoriteAdds
  );
}

export function sumBusinessIntentActionsForDailyRow(
  row: (DailyIntentCounterTotals & { metricDate?: string }) | undefined,
): number {
  if (!row) return 0;
  return sumBusinessIntentActionsFromDaily(row);
}
