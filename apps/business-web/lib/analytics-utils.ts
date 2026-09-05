import type { AnalyticsDashboard } from '@/lib/api';

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

export function actionMetricLabel(key: keyof NonNullable<AnalyticsDashboard['actions']>): string {
  switch (key) {
    case 'total':
      return 'Всего действий';
    case 'calls':
      return 'Звонки';
    case 'whatsapp':
      return 'WhatsApp';
    case 'routes':
      return 'Маршруты';
    case 'website':
      return 'Сайт';
    case 'instagram':
      return 'Instagram';
    case 'favorites':
      return 'Избранное';
    case 'promotionViews':
      return 'Просмотры акций';
    default:
      return key;
  }
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value > 0) return `+${value}%`;
  return `${value}%`;
}

export function dashboardHasOrganicData(dashboard: AnalyticsDashboard): boolean {
  return (dashboard.overview.views ?? 0) > 0 || (dashboard.actions?.total ?? 0) > 0;
}
