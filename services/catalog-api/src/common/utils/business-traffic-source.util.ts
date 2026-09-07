import { BusinessTrafficSource } from '@prisma/client';

export const BUSINESS_TRAFFIC_SOURCE_VALUES = Object.values(BusinessTrafficSource);

export const TRAFFIC_SOURCE_LABELS: Record<BusinessTrafficSource, string> = {
  [BusinessTrafficSource.HOME]: 'Главная',
  [BusinessTrafficSource.SEARCH]: 'Поиск',
  [BusinessTrafficSource.CATEGORY]: 'Категории',
  [BusinessTrafficSource.MAP]: 'Карта',
  [BusinessTrafficSource.PROMOTIONS]: 'Акции',
  [BusinessTrafficSource.FAVORITES]: 'Избранное',
  [BusinessTrafficSource.AD]: 'Реклама',
  [BusinessTrafficSource.DIRECT]: 'Прямые переходы',
  [BusinessTrafficSource.UNKNOWN]: 'Неизвестно',
};

export type TrafficSourceAggregateRow = {
  trafficSource: BusinessTrafficSource | null;
  count: number;
};

export type TrafficSourceAggregateItem = {
  source: string;
  label: string;
  views: number;
  share: number;
};

/** Groups VIEW_BUSINESS counts by explicit source; legacy null → UNKNOWN bucket. */
export function aggregateTrafficSources(
  rows: TrafficSourceAggregateRow[],
): TrafficSourceAggregateItem[] {
  const totalViews = rows.reduce((sum, row) => sum + row.count, 0);
  if (totalViews === 0) return [];

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.trafficSource ?? BusinessTrafficSource.UNKNOWN;
    counts.set(key, (counts.get(key) ?? 0) + row.count);
  }

  return [...counts.entries()]
    .map(([source, views]) => ({
      source,
      label:
        TRAFFIC_SOURCE_LABELS[source as BusinessTrafficSource] ??
        TRAFFIC_SOURCE_LABELS[BusinessTrafficSource.UNKNOWN],
      views,
      share: Math.round((views / totalViews) * 1000) / 10,
    }))
    .sort((a, b) => b.views - a.views);
}
