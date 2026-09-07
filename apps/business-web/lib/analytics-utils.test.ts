import { describe, expect, it } from 'vitest';
import {
  actionMetricLabel,
  availablePeriodOptions,
  formatPercent,
  isLockedSection,
  lockedSectionMessage,
} from './analytics-utils';
import type { AnalyticsDashboard } from './api';

function mockDashboard(plan: string, overrides: Partial<AnalyticsDashboard> = {}): AnalyticsDashboard {
  return {
    businessId: 'b1',
    plan,
    effectivePlan: plan,
    headline: 'test',
    capabilities: {
      maxDays: plan === 'VIP' ? 365 : plan === 'PREMIUM' ? 90 : 30,
      views: true,
      viewTrend: true,
      actions: plan !== 'FREE',
      actionTrend: plan !== 'FREE',
      trafficSources: plan === 'PREMIUM' || plan === 'VIP',
      searchQueries: plan === 'PREMIUM' || plan === 'VIP',
      conversion: plan === 'PREMIUM' || plan === 'VIP',
      periodComparison: plan === 'PREMIUM' || plan === 'VIP',
      promotionAnalytics: plan === 'PREMIUM' || plan === 'VIP',
      popularTimes: plan === 'VIP',
      benchmark: plan === 'VIP',
      recommendations: plan === 'VIP',
      audienceGeography: plan === 'VIP',
    },
    lockedSections:
      plan === 'FREE'
        ? [{ id: 'actions', label: 'Действия клиентов', requiredPlan: 'BASIC', message: 'Доступно с BASIC' }]
        : plan === 'BASIC'
          ? [
              { id: 'sources', label: 'Источники', requiredPlan: 'PREMIUM', message: 'Доступно с PREMIUM' },
              { id: 'searchQueries', label: 'Поисковые запросы', requiredPlan: 'PREMIUM', message: 'Поисковые запросы доступны с PREMIUM' },
              { id: 'audienceGeography', label: 'Аудитория по расстоянию', requiredPlan: 'VIP', message: 'Аналитика аудитории доступна на тарифе VIP' },
            ]
          : plan === 'PREMIUM'
            ? [
                { id: 'audienceGeography', label: 'Аудитория по расстоянию', requiredPlan: 'VIP', message: 'Аналитика аудитории доступна на тарифе VIP' },
              ]
            : [],
    effectiveRange: { days: 30, from: '', to: '' },
    overview: { views: 10 },
    actions: plan === 'FREE' ? null : { total: 3, calls: 1, whatsapp: 1, routes: 1, website: 0, instagram: 0, favorites: 0, promotionViews: 0 },
    trends: { views: [{ date: '2026-09-01', count: 2 }] },
    sources: null,
    conversion: null,
    comparison: null,
    promotions: null,
    popularTimes: null,
    benchmark: null,
    recommendations: null,
    audienceGeography: null,
    ...overrides,
  };
}

describe('analytics-utils', () => {
  it('FREE dashboard locks actions', () => {
    const dashboard = mockDashboard('FREE');
    expect(isLockedSection(dashboard, 'actions')).toBe(true);
    expect(lockedSectionMessage(dashboard, 'actions')).toBe('Доступно с BASIC');
    expect(dashboard.actions).toBeNull();
  });

  it('BASIC dashboard exposes actions and locks premium sections', () => {
    const dashboard = mockDashboard('BASIC');
    expect(dashboard.actions?.total).toBe(3);
    expect(isLockedSection(dashboard, 'sources')).toBe(true);
  });

  it('PREMIUM dashboard exposes conversion and real source breakdown', () => {
    const dashboard = mockDashboard('PREMIUM', {
      sources: [
        { source: 'SEARCH', label: 'Поиск', views: 10, share: 50 },
      ],
      sourcesStatus: null,
      searchQueries: [
        { query: 'кофе рядом', count: 10, percentage: 50 },
      ],
      searchQueriesStatus: 'AVAILABLE',
      conversion: { views: 10, actions: 3, rate: 30 },
      comparison: {
        currentDays: 30,
        previousDays: 30,
        metrics: [{ key: 'views', label: 'Просмотры', current: 10, previous: 8, deltaPercent: 25 }],
      },
    });
    expect(dashboard.sources).toHaveLength(1);
    expect(dashboard.searchQueries).toHaveLength(1);
    expect(dashboard.conversion?.rate).toBe(30);
  });

  it('PREMIUM search queries insufficient data state', () => {
    const dashboard = mockDashboard('PREMIUM', {
      searchQueries: [],
      searchQueriesStatus: 'INSUFFICIENT_DATA',
    });
    expect(dashboard.searchQueriesStatus).toBe('INSUFFICIENT_DATA');
  });

  it('BASIC locks search queries', () => {
    const dashboard = mockDashboard('BASIC');
    expect(isLockedSection(dashboard, 'searchQueries')).toBe(true);
  });

  it('VIP dashboard exposes advanced sections', () => {
    const dashboard = mockDashboard('VIP', {
      popularTimes: { byHour: [{ hour: 12, count: 2 }], byWeekday: [{ weekday: 1, label: 'Пн', count: 2 }] },
      benchmark: {
        categoryTitle: 'Кафе',
        businessViews: 10,
        categoryAvgViews: 8,
        businessActions: 3,
        categoryAvgActions: 2,
      },
      recommendations: [{ id: 'keep-going', title: 'OK', body: 'body' }],
      audienceGeography: [
        { bucket: 'LT_1_KM', label: 'До 1 км', count: 12, percentage: 21.4 },
        { bucket: 'UNKNOWN', label: 'Не определено', count: 2, percentage: 3.6 },
      ],
      audienceGeographyStatus: 'AVAILABLE',
    });
    expect(dashboard.popularTimes?.byHour).toHaveLength(1);
    expect(dashboard.benchmark?.categoryTitle).toBe('Кафе');
    expect(dashboard.recommendations).toHaveLength(1);
    expect(dashboard.audienceGeography).toHaveLength(2);
  });

  it('PREMIUM locks audience geography', () => {
    const dashboard = mockDashboard('PREMIUM');
    expect(isLockedSection(dashboard, 'audienceGeography')).toBe(true);
    expect(dashboard.audienceGeography).toBeNull();
  });

  it('VIP insufficient audience geography data state', () => {
    const dashboard = mockDashboard('VIP', {
      audienceGeography: [],
      audienceGeographyStatus: 'INSUFFICIENT_DATA',
    });
    expect(dashboard.audienceGeographyStatus).toBe('INSUFFICIENT_DATA');
  });

  it('availablePeriodOptions respects maxDays', () => {
    expect(availablePeriodOptions(30)).toEqual([7, 30]);
    expect(availablePeriodOptions(365)).toEqual([7, 30, 90, 365]);
  });

  it('formatPercent renders signed values', () => {
    expect(formatPercent(12)).toBe('+12%');
    expect(formatPercent(-5)).toBe('-5%');
    expect(formatPercent(null)).toBe('—');
  });

  it('actionMetricLabel maps known keys', () => {
    expect(actionMetricLabel('calls')).toBe('Звонки');
    expect(actionMetricLabel('promotionViews')).toBe('Просмотры акций');
  });
});
