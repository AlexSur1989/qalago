import type { AnalyticsDashboard } from '@/lib/api';

/** Canonical business intent actions (Stage 6.6A.1) — excludes promotionViews. */
export const INTENT_ACTION_KEYS = [
  'calls',
  'whatsapp',
  'routes',
  'website',
  'instagram',
  'favorites',
] as const;

export type IntentActionKey = (typeof INTENT_ACTION_KEYS)[number];

export function analyticsHeadlineForPlan(plan: string | undefined): string {
  switch (plan) {
    case 'FREE':
      return 'Сколько меня смотрят?';
    case 'BASIC':
      return 'Что делают после просмотра?';
    case 'PREMIUM':
      return 'Откуда приходят клиенты и что работает?';
    case 'VIP':
      return 'Почему это происходит и что можно улучшить?';
    default:
      return 'Статистика бизнеса';
  }
}

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

export function actionMetricLabel(
  key: keyof NonNullable<AnalyticsDashboard['actions']> | IntentActionKey,
): string {
  switch (key) {
    case 'total':
      return 'Целевые действия';
    case 'calls':
      return 'Звонки';
    case 'whatsapp':
      return 'WhatsApp';
    case 'routes':
      return 'Маршрут';
    case 'website':
      return 'Сайт';
    case 'instagram':
      return 'Instagram';
    case 'favorites':
      return 'Добавили в избранное';
    case 'promotionViews':
      return 'Просмотры акций';
    default:
      return String(key);
  }
}

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

export function mapAnalyticsExportError(err: unknown): string {
  const raw = String(err);
  if (raw.includes('403') || raw.toLowerCase().includes('forbidden')) {
    return 'Нет прав на экспорт отчёта. Обратитесь к владельцу бизнеса.';
  }
  if (raw.includes('401')) {
    return 'Сессия истекла. Войдите снова.';
  }
  return 'Не удалось сформировать отчёт. Попробуйте позже.';
}

export function mapAnalyticsLoadError(err: unknown): string {
  const raw = String(err);
  if (raw.includes('403') || raw.toLowerCase().includes('forbidden')) {
    return 'Нет доступа к аналитике для этого бизнеса.';
  }
  return 'Не удалось загрузить статистику. Проверьте подключение и попробуйте снова.';
}

/** Parses legacy dashboard JSON missing newer capability flags. */
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

export function funnelSteps(dashboard: AnalyticsDashboard): Array<{
  label: string;
  value: number | null;
}> {
  const { overview, actions } = dashboard;
  const steps: Array<{ label: string; value: number | null }> = [
    { label: 'Показы', value: overview.impressions ?? null },
    { label: 'Просмотры', value: overview.views ?? null },
    {
      label: 'Целевые действия',
      value: actions?.total ?? overview.actions ?? null,
    },
  ];
  return steps.filter((step) => step.value != null);
}
