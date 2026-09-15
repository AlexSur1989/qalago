import type { AnalyticsDashboard } from '@/lib/api';
import type { AppLocale } from '@/lib/locale';
import * as pres from '@/lib/presentation';

export const INTENT_ACTION_KEYS = [
  'calls',
  'whatsapp',
  'routes',
  'website',
  'instagram',
  'favorites',
] as const;

export type IntentActionKey = (typeof INTENT_ACTION_KEYS)[number];

export const analyticsHeadlineForPlan = pres.analyticsHeadlineForPlan;

export function isLockedSection(
  dashboard: AnalyticsDashboard,
  sectionId: string,
): boolean {
  return dashboard.lockedSections.some((item) => item.id === sectionId);
}

export function lockedSectionMessage(
  dashboard: AnalyticsDashboard,
  sectionId: string,
): string | null {
  return dashboard.lockedSections.find((item) => item.id === sectionId)?.message ?? null;
}

export function availablePeriodOptions(maxDays: number): number[] {
  const options = [7, 30, 90, 365].filter((days) => days <= maxDays);
  return options.length > 0 ? options : [maxDays];
}

export function syncPeriodToEffectiveRange(
  selectedDays: number,
  dashboard: AnalyticsDashboard,
): number {
  return dashboard.effectiveRange.days ?? selectedDays;
}

export const actionMetricLabel = pres.actionMetricLabel;

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  if (value > 0) return `+${value}%`;
  return `${value}%`;
}

export function formatRate(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value}%`;
}

export function formatMetricValue(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) return null;
  return new Intl.NumberFormat('ru-RU').format(value);
}

export function dashboardHasOrganicData(dashboard: AnalyticsDashboard): boolean {
  return (dashboard.overview.views ?? 0) > 0 || (dashboard.actions?.total ?? 0) > 0;
}

export function dashboardIsEmpty(dashboard: AnalyticsDashboard): boolean {
  return (dashboard.overview.views ?? 0) === 0;
}

export function primaryUpgradeMessage(dashboard: AnalyticsDashboard): string | null {
  const priority = [
    'actions',
    'impressions',
    'sources',
    'searchQueries',
    'ctr',
    'audience',
    'catalog',
    'reportExport',
  ];
  for (const id of priority) {
    const msg = lockedSectionMessage(dashboard, id);
    if (msg) return msg;
  }
  return null;
}

export function canShowExport(
  dashboard: AnalyticsDashboard,
  hasExportPermission: boolean,
): boolean {
  return dashboard.capabilities.reportExport === true && hasExportPermission;
}

export const mapAnalyticsExportError = pres.mapAnalyticsExportError;
export const mapAnalyticsLoadError = pres.mapAnalyticsLoadError;

export function normalizeAnalyticsDashboard(
  data: AnalyticsDashboard,
): AnalyticsDashboard {
  const caps = data.capabilities;
  return {
    ...data,
    catalog: data.catalog ?? null,
    audience: data.audience ?? null,
    capabilities: {
      ...caps,
      impressions: caps.impressions ?? caps.actions,
      ctr: caps.ctr ?? caps.conversion,
      promotionBreakdown: caps.promotionBreakdown ?? caps.promotionAnalytics,
      audience: caps.audience ?? caps.audienceGeography,
      catalogAnalytics: caps.catalogAnalytics ?? false,
      visitorMetrics: caps.visitorMetrics ?? caps.audienceGeography,
    },
  };
}

export function intentActionEntries(
  actions: NonNullable<AnalyticsDashboard['actions']>,
): Array<{ key: IntentActionKey; value: number }> {
  return INTENT_ACTION_KEYS.map((key) => ({
    key,
    value: actions[key] ?? 0,
  }));
}

export function funnelSteps(
  locale: AppLocale,
  dashboard: AnalyticsDashboard,
): Array<{
  label: string;
  value: number | null;
}> {
  const { overview, actions } = dashboard;
  const steps: Array<{ label: string; value: number | null }> = [
    { label: pres.funnelStepLabel(locale, 'impressions'), value: overview.impressions ?? null },
    { label: pres.funnelStepLabel(locale, 'views'), value: overview.views ?? null },
    {
      label: pres.funnelStepLabel(locale, 'actions'),
      value: actions?.total ?? overview.actions ?? null,
    },
  ];
  return steps.filter((step) => step.value != null);
}
