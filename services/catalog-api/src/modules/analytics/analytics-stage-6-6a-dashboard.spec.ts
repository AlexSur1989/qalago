import { AnalyticsDimensionType, BusinessPlanTier, UserRole } from '@prisma/client';
import { MIN_AUDIENCE_GEOGRAPHY_SAMPLE } from '../../common/utils/audience-geography.util';
import { getAnalyticsCapabilitiesForPlan } from '../../common/utils/analytics-capabilities.util';
import { MIN_SEARCH_QUERY_DISPLAY_COUNT } from '../../common/utils/search-query-analytics.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsDashboardBuilder } from './analytics-dashboard.builder';

function dailyRow(overrides: Partial<Record<string, number | string>> = {}) {
  return {
    metricDate: '2026-09-09',
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
    ...overrides,
  };
}

describe('Stage 6.6A rollup-backed dashboard', () => {
  function createBuilder(plan: BusinessPlanTier) {
    const prisma = {
      business: {
        findUnique: jest.fn().mockResolvedValue({
          city: { timezone: 'Asia/Oral' },
          category: { title: 'Кафе' },
          categoryId: 'cat-1',
          cityId: 'city-1',
        }),
      },
      analyticsEvent: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      analyticsDailyMetric: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      analyticsDailyDimensionMetric: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        tier: plan,
        effectiveTier: plan,
        limits: {
          maxAnalyticsDays: plan === BusinessPlanTier.VIP ? 365 : 90,
          analyticsTier: 'FULL',
        },
      }),
    } as unknown as PlanLimitsService;

    return {
      prisma,
      builder: new AnalyticsDashboardBuilder(prisma as unknown as PrismaService, planLimits),
    };
  }

  it('reads impressions, views, actions, CTR from rollups', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.PREMIUM);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([
      dailyRow({ impressions: 200, views: 40, callClicks: 2, promotionViews: 3 }),
    ]);

    const dashboard = await builder.build('biz-1', 30);
    const overview = dashboard.overview as Record<string, number | null>;
    expect(overview.views).toBe(40);
    expect(overview.impressions).toBe(200);
    expect(overview.actions).toBe(2);
    expect(overview.ctr).toBe(20);
    expect(overview.conversionRate).toBe(5);
    expect(prisma.analyticsEvent.findMany).not.toHaveBeenCalled();
  });

  it('365-day VIP does not scan raw events when rollups exist', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.VIP);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([
      dailyRow({ views: 50, impressions: 100 }),
    ]);

    await builder.build('biz-1', 365);
    expect(prisma.analyticsEvent.findMany).not.toHaveBeenCalled();
  });

  it('enforces search query threshold on backend', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.PREMIUM);
    prisma.analyticsDailyDimensionMetric.findMany.mockResolvedValue([
      {
        dimensionType: AnalyticsDimensionType.SEARCH_QUERY,
        dimensionKey: 'secret',
        metricKey: 'views',
        count: MIN_SEARCH_QUERY_DISPLAY_COUNT - 1,
      },
      {
        dimensionType: AnalyticsDimensionType.SEARCH_QUERY,
        dimensionKey: 'popular',
        metricKey: 'views',
        count: 5,
      },
    ]);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([dailyRow({ views: 10 })]);

    const dashboard = await builder.build('biz-1', 30);
    expect(dashboard.searchQueries).toEqual([
      expect.objectContaining({ query: 'popular', count: 5 }),
    ]);
    expect(
      (dashboard.searchQueries as Array<{ query: string }>).some((q) => q.query === 'secret'),
    ).toBe(false);
  });

  it('aggregates VISITOR_TYPE as view counts', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.VIP);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([dailyRow({ views: 20 })]);
    prisma.analyticsDailyDimensionMetric.findMany.mockResolvedValue([
      {
        dimensionType: AnalyticsDimensionType.VISITOR_TYPE,
        dimensionKey: 'NEW',
        metricKey: 'views',
        count: 12,
      },
      {
        dimensionType: AnalyticsDimensionType.VISITOR_TYPE,
        dimensionKey: 'RETURNING',
        metricKey: 'views',
        count: 8,
      },
    ]);

    const dashboard = await builder.build('biz-1', 30);
    expect(dashboard.audience).toEqual(
      expect.objectContaining({
        newVisitorViews: 12,
        returningVisitorViews: 8,
        totalClassified: 20,
        newShare: 60,
        returningShare: 40,
      }),
    );
  });

  it('hides geography below sample threshold', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.VIP);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([
      dailyRow({ views: MIN_AUDIENCE_GEOGRAPHY_SAMPLE - 1 }),
    ]);

    const dashboard = await builder.build('biz-1', 30);
    expect(dashboard.audienceGeographyStatus).toBe('INSUFFICIENT_DATA');
    expect(dashboard.audienceGeography).toEqual([]);
  });

  it('marks promotion/catalog actions unavailable', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.VIP);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([
      dailyRow({ promotionViews: 4 }),
    ]);
    prisma.analyticsDailyDimensionMetric.findMany.mockResolvedValue([
      {
        dimensionType: AnalyticsDimensionType.PROMOTION,
        dimensionKey: 'promo-1',
        metricKey: 'views',
        count: 4,
      },
      {
        dimensionType: AnalyticsDimensionType.CATALOG_ITEM,
        dimensionKey: 'item-1',
        metricKey: 'views',
        count: 2,
      },
    ]);

    const dashboard = await builder.build('biz-1', 30);
    expect(dashboard.promotions).toEqual(
      expect.objectContaining({ promotionViews: 4, actionsAvailable: false }),
    );
    expect((dashboard.promotions as { byPromotion: Array<{ actions: null }> }).byPromotion[0]?.actions).toBeNull();
    expect(dashboard.catalog).toEqual(expect.objectContaining({ actionsAvailable: false }));
  });

  it('FREE cannot receive VIP audience section', async () => {
    const { builder } = createBuilder(BusinessPlanTier.FREE);
    const dashboard = await builder.build('biz-1', 30);
    expect(dashboard.audience).toBeNull();
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.FREE).recommendations).toBe(false);
  });

  it('uses HOUR dimension for popular times', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.VIP);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([dailyRow({ views: 5 })]);
    prisma.analyticsDailyDimensionMetric.findMany.mockResolvedValue([
      {
        dimensionType: AnalyticsDimensionType.HOUR,
        dimensionKey: '14',
        metricKey: 'views',
        count: 5,
      },
    ]);

    const dashboard = await builder.build('biz-1', 30);
    const byHour = (dashboard.popularTimes as { byHour: Array<{ hour: number; count: number }> })
      .byHour;
    expect(byHour.find((h) => h.hour === 14)?.count).toBe(5);
  });

  it('preserves legacy overview and actions fields', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.BASIC);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([
      dailyRow({ views: 7, callClicks: 1 }),
    ]);
    prisma.analyticsEvent.groupBy.mockResolvedValue([]);

    const dashboard = await builder.build('biz-1', 7);
    expect((dashboard.overview as { views: number; totalCustomerActions: number }).views).toBe(7);
    expect((dashboard.overview as { totalCustomerActions: number }).totalCustomerActions).toBe(1);
    expect((dashboard.actions as { total: number }).total).toBe(1);
    expect(dashboard.trends).toHaveProperty('views');
  });

  it('aggregates SOURCE dimension for traffic breakdown', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.PREMIUM);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([dailyRow({ views: 10 })]);
    prisma.analyticsDailyDimensionMetric.findMany.mockResolvedValue([
      {
        dimensionType: AnalyticsDimensionType.SOURCE,
        dimensionKey: 'SEARCH',
        metricKey: 'views',
        count: 7,
      },
      {
        dimensionType: AnalyticsDimensionType.SOURCE,
        dimensionKey: 'HOME',
        metricKey: 'views',
        count: 3,
      },
    ]);

    const dashboard = await builder.build('biz-1', 30);
    expect(dashboard.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'SEARCH', views: 7 }),
        expect.objectContaining({ source: 'HOME', views: 3 }),
      ]),
    );
  });

  it('returns null CTR when impressions are zero (PRO+)', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.PREMIUM);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([dailyRow({ views: 5, impressions: 0 })]);
    prisma.analyticsEvent.groupBy.mockResolvedValue([]);

    const dashboard = await builder.build('biz-1', 30);
    expect((dashboard.overview as { ctr: null }).ctr).toBeNull();
  });

  it('comparison periods have equal length from rollups', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.PREMIUM);
    prisma.analyticsDailyMetric.findMany.mockImplementation(({ where }: { where: { metricDate: { gte: string; lte: string } } }) => {
      const gte = where.metricDate.gte;
      const lte = where.metricDate.lte;
      if (gte < '2026-01-01') {
        return Promise.resolve([dailyRow({ metricDate: gte, views: 2 })]);
      }
      return Promise.resolve([dailyRow({ metricDate: lte, views: 5 })]);
    });
    prisma.analyticsDailyDimensionMetric.findMany.mockResolvedValue([]);

    const dashboard = await builder.build('biz-1', 30);
    const comparison = dashboard.comparison as {
      currentDays: number;
      previousDays: number;
      metrics: Array<{ key: string; current: number; previous: number }>;
    };
    expect(comparison.currentDays).toBe(comparison.previousDays);
    expect(comparison.metrics.find((m) => m.key === 'views')?.current).toBe(5);
  });

  it('BASIC cannot receive VIP-only audience section', async () => {
    const { builder } = createBuilder(BusinessPlanTier.BASIC);
    const dashboard = await builder.build('biz-1', 30);
    expect(dashboard.audience).toBeNull();
    expect(dashboard.catalog).toBeNull();
  });

  it('does not expose visitor hashes in dashboard payload', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.PREMIUM);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([dailyRow({ views: 1 })]);
    const dashboard = await builder.build('biz-1', 30);
    expect(JSON.stringify(dashboard)).not.toMatch(/visitorHash/);
  });
});
