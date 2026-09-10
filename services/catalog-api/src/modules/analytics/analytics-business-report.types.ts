import type { AnalyticsReportPeriodType } from '../../common/utils/analytics-report-period.util';

/** Internal Analytics 360 report payload (schema v1). */
export type BusinessAnalyticsReport = {
  schemaVersion: 1;
  business: {
    id: string;
    name: string;
    cityName: string;
    categoryTitle: string | null;
  };
  period: {
    type: AnalyticsReportPeriodType;
    timezone: string;
    startDate: string;
    endDate: string;
    days: number;
    generatedAt: string;
  };
  previousPeriod: {
    startDate: string;
    endDate: string;
    days: number;
  } | null;
  /** Dashboard payload (capability-filtered, same semantics as GET /dashboard). */
  dashboard: Record<string, unknown>;
  summary: string[];
};
