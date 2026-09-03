import type { AnalyticsSummary, BusinessRow, PromotionRow } from '@/lib/api';

const PROFILE_FIELDS: (keyof BusinessRow)[] = [
  'title',
  'shortDesc',
  'description',
  'address',
  'phone',
  'whatsapp',
  'instagram',
  'website',
];

export function profileCompletion(business: BusinessRow): number {
  let filled = 0;
  for (const key of PROFILE_FIELDS) {
    const value = business[key];
    if (typeof value === 'string' && value.trim()) filled += 1;
  }
  if (business.workHours && Object.keys(business.workHours).length > 0) {
    filled += 1;
  }
  if (business.coverImageUrl) filled += 1;
  const total = PROFILE_FIELDS.length + 2;
  return Math.round((filled / total) * 100);
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Активен';
    case 'PENDING':
      return 'На модерации';
    case 'BLOCKED':
      return 'Заблокирован';
    default:
      return status;
  }
}

export function formatNumber(value: number): string {
  return value.toLocaleString('ru-RU');
}

export function formatDelta(current: number, previous: number): string | null {
  if (previous <= 0) return current > 0 ? '+100%' : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return '0%';
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

export function deltaClass(current: number, previous: number): string {
  if (current <= previous) return 'kpi-delta neutral';
  return 'kpi-delta';
}

export function comparePeriods(
  current: AnalyticsSummary,
  previous: AnalyticsSummary,
): Record<string, { current: number; previous: number }> {
  const keys = new Set([
    ...Object.keys(current.byType),
    ...Object.keys(previous.byType),
  ]);
  const result: Record<string, { current: number; previous: number }> = {};
  for (const key of keys) {
    result[key] = {
      current: current.byType[key] ?? 0,
      previous: previous.byType[key] ?? 0,
    };
  }
  return result;
}

export function buildRecentActions(
  business: BusinessRow,
  promotions: PromotionRow[],
): { icon: string; title: string; time: string }[] {
  const actions: { icon: string; title: string; time: string; ts: number }[] = [];

  if (business.updatedAt) {
    actions.push({
      icon: '✏️',
      title: 'Профиль обновлён',
      time: formatRelativeDate(business.updatedAt),
      ts: new Date(business.updatedAt).getTime(),
    });
  }

  for (const promo of promotions.slice(0, 3)) {
    if (!promo.createdAt) continue;
    actions.push({
      icon: '🏷️',
      title: `Акция «${promo.title}»`,
      time: formatRelativeDate(promo.createdAt),
      ts: new Date(promo.createdAt).getTime(),
    });
  }

  return actions
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 4)
    .map(({ icon, title, time }) => ({ icon, title, time }));
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTodayHeader(): string {
  return new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function businessInitials(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
