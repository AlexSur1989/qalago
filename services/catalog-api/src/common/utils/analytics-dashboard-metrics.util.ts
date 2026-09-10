/** Stage 6.6A — rollup aggregation helpers for owner analytics dashboard. */

import { AnalyticsDimensionType } from '@prisma/client';

/** Raw events older than this are not scanned for dashboard aggregates (retention-aligned). */
export const RAW_EVENT_FALLBACK_MAX_DAYS = 90;

export type DailyMetricRow = {
  metricDate: string;
  impressions: number;
  views: number;
  callClicks: number;
  whatsappClicks: number;
  routeClicks: number;
  websiteClicks: number;
  instagramClicks: number;
  favoriteAdds: number;
  promotionImpressions: number;
  promotionViews: number;
  promotionActions: number;
  catalogImpressions: number;
  catalogViews: number;
  catalogActions: number;
  uniqueVisitorsApprox: number;
  sessionsApprox: number;
};

export type DailyMetricTotals = Omit<DailyMetricRow, 'metricDate'>;

export type DimensionMetricRow = {
  dimensionType: AnalyticsDimensionType;
  dimensionKey: string;
  metricKey: string;
  count: number;
};

const ZERO_TOTALS: DailyMetricTotals = {
  impressions: 0,
  views: 0,
  callClicks: 0,
  whatsappClicks: 0,
  routeClicks: 0,
  websiteClicks: 0,
  instagramClicks: 0,
  favoriteAdds: 0,
  promotionImpressions: 0,
  promotionViews: 0,
  promotionActions: 0,
  catalogImpressions: 0,
  catalogViews: 0,
  catalogActions: 0,
  uniqueVisitorsApprox: 0,
  sessionsApprox: 0,
};

export function emptyDailyTotals(): DailyMetricTotals {
  return { ...ZERO_TOTALS };
}

export function sumDailyMetricRows(rows: DailyMetricRow[]): DailyMetricTotals {
  const totals = emptyDailyTotals();
  for (const row of rows) {
    totals.impressions += row.impressions;
    totals.views += row.views;
    totals.callClicks += row.callClicks;
    totals.whatsappClicks += row.whatsappClicks;
    totals.routeClicks += row.routeClicks;
    totals.websiteClicks += row.websiteClicks;
    totals.instagramClicks += row.instagramClicks;
    totals.favoriteAdds += row.favoriteAdds;
    totals.promotionImpressions += row.promotionImpressions;
    totals.promotionViews += row.promotionViews;
    totals.promotionActions += row.promotionActions;
    totals.catalogImpressions += row.catalogImpressions;
    totals.catalogViews += row.catalogViews;
    totals.catalogActions += row.catalogActions;
    totals.uniqueVisitorsApprox += row.uniqueVisitorsApprox;
    totals.sessionsApprox += row.sessionsApprox;
  }
  return totals;
}

/** @deprecated use sumBusinessIntentActionsFromDaily from analytics-intent-actions.util */
export { sumBusinessIntentActionsFromDaily as sumIntentActionsFromDaily } from './analytics-intent-actions.util';

/** @deprecated use sumBusinessIntentActionsForDailyRow from analytics-intent-actions.util */
export { sumBusinessIntentActionsForDailyRow as sumIntentActionsForDay } from './analytics-intent-actions.util';

/** Period aggregate CTR: views / impressions × 100. */
export function periodCtrPercent(views: number, impressions: number): number | null {
  if (impressions <= 0) return null;
  return Math.round((views / impressions) * 1000) / 10;
}

/** View → intent action conversion (%); not purchase conversion. */
export function viewToIntentConversionPercent(actions: number, views: number): number | null {
  if (views <= 0) return null;
  return Math.round((actions / views) * 1000) / 10;
}

export function aggregateDimensionCounts(
  rows: DimensionMetricRow[],
  dimensionType: AnalyticsDimensionType,
  metricKey = 'views',
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.dimensionType !== dimensionType || row.metricKey !== metricKey) continue;
    map.set(row.dimensionKey, (map.get(row.dimensionKey) ?? 0) + row.count);
  }
  return map;
}

export function addCalendarDaysToMetricDate(metricDate: string, deltaDays: number): string {
  const [y, m, d] = metricDate.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return utc.toISOString().slice(0, 10);
}

/** Contiguous local metric dates immediately before `currentRange` (same length, no overlap). */
export function previousLocalMetricDateRange(currentRange: string[]): string[] {
  if (currentRange.length === 0) return [];
  const len = currentRange.length;
  let end = addCalendarDaysToMetricDate(currentRange[0], -1);
  const out: string[] = [];
  for (let i = 0; i < len; i++) {
    out.unshift(end);
    end = addCalendarDaysToMetricDate(end, -1);
  }
  return out;
}
