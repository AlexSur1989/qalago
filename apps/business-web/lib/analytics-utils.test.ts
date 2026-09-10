import { describe, expect, it } from 'vitest';
import {
  INTENT_ACTION_KEYS,
  actionMetricLabel,
  availablePeriodOptions,
  canShowExport,
  dashboardIsEmpty,
  formatMetricValue,
  formatPercent,
  funnelSteps,
  isLockedSection,
  lockedSectionMessage,
  normalizeAnalyticsDashboard,
  primaryUpgradeMessage,
} from './analytics-utils';
import type { AnalyticsDashboard } from './api';

function mockDashboard(
  plan: 'FREE' | 'BASIC' | 'PREMIUM' | 'VIP',
  overrides: Partial<AnalyticsDashboard> = {},
): AnalyticsDashboard {
  const isFree = plan === 'FREE';
  const isBasic = plan === 'BASIC';
  const isPro = plan === 'PREMIUM';
  const isVip = plan === 'VIP';
  const isProOrVip = isPro || isVip;

  return normalizeAnalyticsDashboard({
    businessId: 'b1',
    plan,
    effectivePlan: plan,
    headline: 'test',
    capabilities: {
      maxDays: isVip ? 365 : isPro ? 90 : 30,
      views: true,
      viewTrend: true,
      actions: !isFree,
      actionTrend: !isFree,
      impressions: !isFree,
      ctr: isProOrVip,
      trafficSources: isProOrVip,
      searchQueries: isProOrVip,
      conversion: isProOrVip,
      periodComparison: !isFree,
      promotionAnalytics: !isFree,
      promotionBreakdown: isProOrVip,
      popularTimes: isVip,
      benchmark: isVip,
      recommendations: isVip,
      audienceGeography: isVip,
      audience: isVip,
      catalogAnalytics: isVip,
      visitorMetrics: isVip,
      reportExport: isProOrVip,
    },
    lockedSections:
      plan === 'FREE'
        ? [{ id: 'actions', label: 'Действия', requiredPlan: 'BASIC', message: 'Бизнес' }]
        : plan === 'BASIC'
          ? [{ id: 'sources', label: 'Источники', requiredPlan: 'PREMIUM', message: 'PRO' }]
          : [],
    effectiveRange: { days: 30, from: '', to: '' },
    overview: {
      views: 100,
      ...(isFree ? {} : { impressions: 1000, actions: 10 }),
      ...(isProOrVip ? { ctr: 10, conversionRate: 10 } : {}),
      ...(isVip ? { uniqueVisitorsPeriodDistinct: 50, sessionsPeriodDistinct: 60 } : {}),
    },
    actions: isFree
      ? null
      : {
          total: 10,
          calls: 1,
          whatsapp: 1,
          routes: 1,
          website: 1,
          instagram: 1,
          favorites: 5,
          promotionViews: 99,
        },
    trends: { views: [{ date: '2026-09-01', count: 2 }] },
    sources: null,
    conversion: null,
    comparison: isFree
      ? null
      : {
          currentDays: 30,
          previousDays: 30,
          metrics: [{ key: 'views', label: 'Просмотры', current: 10, previous: 8, deltaPercent: 25 }],
        },
    promotions: isFree
      ? null
      : {
          promotionViews: 5,
          ...(isProOrVip
            ? {
                byPromotion: [{ promotionId: 'p1', views: 3 }],
                actionsAvailable: false,
              }
            : {}),
        },
    catalog: isVip ? { items: [{ catalogItemId: 'c1', views: 2 }], actionsAvailable: false } : null,
    audience: isVip
      ? {
          newVisitorViews: 10,
          returningVisitorViews: 20,
          totalClassified: 30,
          newShare: 33.3,
          returningShare: 66.7,
        }
      : null,
    popularTimes: isVip ? { byHour: [{ hour: 12, count: 4 }] } : null,
    benchmark: null,
    recommendations: null,
    audienceGeography: null,
    ...overrides,
  });
}

describe('Analytics 360 utils', () => {
  it('1 FREE sees views only in overview helpers', () => {
    const d = mockDashboard('FREE');
    expect(d.overview.views).toBe(100);
    expect(d.actions).toBeNull();
    expect(d.overview.impressions).toBeUndefined();
  });

  it('2–4 FREE no actions/impressions/CTR caps', () => {
    const d = mockDashboard('FREE');
    expect(d.capabilities.actions).toBe(false);
    expect(d.capabilities.impressions).toBe(false);
    expect(d.capabilities.ctr).toBe(false);
  });

  it('5 FREE upgrade message from locked sections', () => {
    const d = mockDashboard('FREE');
    expect(primaryUpgradeMessage(d)).toBeTruthy();
    expect(isLockedSection(d, 'actions')).toBe(true);
  });

  it('6–8 BUSINESS sees actions impressions comparison', () => {
    const d = mockDashboard('BASIC');
    expect(d.actions?.total).toBe(10);
    expect(d.overview.impressions).toBe(1000);
    expect(d.comparison).not.toBeNull();
  });

  it('9 BUSINESS promotion summary without breakdown', () => {
    const d = mockDashboard('BASIC');
    expect(d.promotions?.promotionViews).toBe(5);
    expect(d.promotions?.byPromotion).toBeUndefined();
  });

  it('10 BUSINESS no sources', () => {
    const d = mockDashboard('BASIC');
    expect(d.capabilities.trafficSources).toBe(false);
    expect(isLockedSection(d, 'sources')).toBe(true);
  });

  it('11–13 PRO sources search funnel caps', () => {
    const d = mockDashboard('PREMIUM', {
      sources: [{ source: 'SEARCH', label: 'Поиск', views: 5, share: 50 }],
      searchQueries: [{ query: 'кофе', count: 3, percentage: 100 }],
    });
    expect(d.capabilities.trafficSources).toBe(true);
    expect(d.sources).toHaveLength(1);
    expect(d.searchQueries).toHaveLength(1);
    expect(funnelSteps(d).length).toBeGreaterThanOrEqual(2);
  });

  it('14 PRO promotion breakdown', () => {
    const d = mockDashboard('PREMIUM');
    expect(d.promotions?.byPromotion).toHaveLength(1);
  });

  it('15–16 PRO export capability and permission gate', () => {
    const d = mockDashboard('PREMIUM');
    expect(d.capabilities.reportExport).toBe(true);
    expect(canShowExport(d, true)).toBe(true);
    expect(canShowExport(d, false)).toBe(false);
  });

  it('17 PRO no VIP audience', () => {
    const d = mockDashboard('PREMIUM');
    expect(d.audience).toBeNull();
    expect(d.capabilities.audience).toBe(false);
  });

  it('18–23 VIP sections', () => {
    const d = mockDashboard('VIP', {
      audienceGeography: [{ bucket: 'LT_1_KM', label: 'До 1 км', count: 1, percentage: 100 }],
      benchmark: { categoryTitle: 'Кафе', businessViews: 1, categoryAvgViews: 2 },
      recommendations: [{ id: 'r1', title: 'T', body: 'B' }],
    });
    expect(d.audience).not.toBeNull();
    expect(d.audienceGeography).toHaveLength(1);
    expect(d.popularTimes?.byHour).toHaveLength(1);
    expect(d.catalog?.items).toHaveLength(1);
    expect(d.benchmark?.categoryTitle).toBe('Кафе');
    expect(d.recommendations).toHaveLength(1);
    expect(canShowExport(d, true)).toBe(true);
  });

  it('25 null values not rendered as 0', () => {
    expect(formatMetricValue(null)).toBeNull();
    expect(formatMetricValue(undefined)).toBeNull();
  });

  it('26 actionsAvailable false on promotions', () => {
    const d = mockDashboard('PREMIUM');
    expect(d.promotions?.actionsAvailable).toBe(false);
  });

  it('27–28 period options 90 PRO and 365 VIP', () => {
    expect(availablePeriodOptions(90)).toEqual([7, 30, 90]);
    expect(availablePeriodOptions(365)).toEqual([7, 30, 90, 365]);
  });

  it('30 legacy dashboard without new caps normalizes', () => {
    const legacy = mockDashboard('BASIC');
    legacy.capabilities = {
      ...legacy.capabilities,
      impressions: undefined,
      ctr: undefined,
      promotionBreakdown: undefined,
    } as AnalyticsDashboard['capabilities'];
    const normalized = normalizeAnalyticsDashboard(legacy);
    expect(normalized.capabilities.impressions).toBe(true);
  });

  it('31 intent keys exclude promotionViews from labels list', () => {
    expect(INTENT_ACTION_KEYS).not.toContain('promotionViews' as never);
    expect(actionMetricLabel('favorites')).toBe('Добавили в избранное');
  });

  it('empty dashboard detection', () => {
    const d = mockDashboard('FREE', { overview: { views: 0 } });
    expect(dashboardIsEmpty(d)).toBe(true);
  });

  it('formatPercent handles null', () => {
    expect(formatPercent(null)).toBe('—');
  });

  it('locked section message lookup', () => {
    const d = mockDashboard('FREE');
    expect(lockedSectionMessage(d, 'actions')).toBe('Бизнес');
  });

  it('no hardcoded VIP-only export in PREMIUM mock', () => {
    const d = mockDashboard('PREMIUM');
    expect(isLockedSection(d, 'reportExport')).toBe(false);
    expect(d.capabilities.reportExport).toBe(true);
  });
});
