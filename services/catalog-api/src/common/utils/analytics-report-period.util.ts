/** Stage 6.6F — completed local calendar periods for business analytics reports. */

import { addCalendarDaysToMetricDate } from './analytics-dashboard-metrics.util';
import { toLocalMetricDate } from './analytics-timezone.util';

export type AnalyticsReportPeriodType = 'CUSTOM' | 'WEEKLY' | 'MONTHLY';

export type LocalMetricDateRange = { start: string; end: string };

/** Monday=0 … Sunday=6 for a local metric date (YYYY-MM-DD). */
export function localWeekdayMondayZero(metricDate: string): number {
  const [y, m, d] = metricDate.split('-').map(Number);
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function enumerateInclusiveLocalMetricDates(start: string, end: string): string[] {
  if (start > end) return [];
  const out: string[] = [];
  let current = start;
  for (;;) {
    out.push(current);
    if (current === end) break;
    current = addCalendarDaysToMetricDate(current, 1);
  }
  return out;
}

/**
 * Previous completed Mon–Sun week in local metric dates.
 * Example: reference Wed 2026-09-16 → 2026-09-07 … 2026-09-13.
 */
export function previousCompletedLocalWeekRange(referenceLocalDate: string): LocalMetricDateRange {
  const mondayOffset = localWeekdayMondayZero(referenceLocalDate);
  const thisWeekMonday = addCalendarDaysToMetricDate(referenceLocalDate, -mondayOffset);
  const prevSunday = addCalendarDaysToMetricDate(thisWeekMonday, -1);
  const prevMonday = addCalendarDaysToMetricDate(prevSunday, -6);
  return { start: prevMonday, end: prevSunday };
}

/** Previous completed calendar month in local metric dates. */
export function previousCompletedLocalMonthRange(referenceLocalDate: string): LocalMetricDateRange {
  const [y, m] = referenceLocalDate.split('-').map(Number);
  let py = y;
  let pm = m - 1;
  if (pm === 0) {
    pm = 12;
    py -= 1;
  }
  const start = `${py}-${String(pm).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
  const end = `${py}-${String(pm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export function resolveReportPeriodRange(params: {
  type: AnalyticsReportPeriodType;
  timezone?: string | null;
  referenceUtc?: Date;
  customDays?: number;
  customEndLocal?: string;
}): LocalMetricDateRange {
  const referenceUtc = params.referenceUtc ?? new Date();
  const referenceLocal = params.customEndLocal ?? toLocalMetricDate(referenceUtc, params.timezone);

  switch (params.type) {
    case 'WEEKLY':
      return previousCompletedLocalWeekRange(referenceLocal);
    case 'MONTHLY':
      return previousCompletedLocalMonthRange(referenceLocal);
    case 'CUSTOM':
    default: {
      const days = Math.max(1, Math.floor(params.customDays ?? 30));
      const end = referenceLocal;
      const start = addCalendarDaysToMetricDate(end, -(days - 1));
      return { start, end };
    }
  }
}

export function previousPeriodRangeFor(range: LocalMetricDateRange): LocalMetricDateRange {
  const dates = enumerateInclusiveLocalMetricDates(range.start, range.end);
  const len = dates.length;
  if (len === 0) {
    return { start: range.start, end: range.end };
  }
  const prevEnd = addCalendarDaysToMetricDate(range.start, -1);
  const prevStart = addCalendarDaysToMetricDate(prevEnd, -(len - 1));
  return { start: prevStart, end: prevEnd };
}
