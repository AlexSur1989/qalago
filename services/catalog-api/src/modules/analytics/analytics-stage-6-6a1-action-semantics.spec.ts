import { AnalyticsEventType, BusinessPlanTier } from '@prisma/client';
import {
  isBusinessIntentActionEventType,
  sumBusinessIntentActionsFromCounts,
  sumBusinessIntentActionsFromDaily,
} from '../../common/utils/analytics-intent-actions.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsDashboardBuilder } from './analytics-dashboard.builder';

describe('Stage 6.6A.1 business intent action semantics', () => {
  const intentTypes = [
    AnalyticsEventType.CALL_CLICK,
    AnalyticsEventType.WHATSAPP_CLICK,
    AnalyticsEventType.ROUTE_CLICK,
    AnalyticsEventType.WEBSITE_CLICK,
    AnalyticsEventType.INSTAGRAM_CLICK,
    AnalyticsEventType.FAVORITE_ADD,
  ] as const;

  const nonIntentTypes = [
    AnalyticsEventType.FAVORITE_REMOVE,
    AnalyticsEventType.PROMOTION_VIEW,
    AnalyticsEventType.PROMOTION_IMPRESSION,
    AnalyticsEventType.CATALOG_ITEM_VIEW,
    AnalyticsEventType.REVIEW_CREATED,
  ] as const;

  it.each(intentTypes)('%s is a business intent action', (type) => {
    expect(isBusinessIntentActionEventType(type)).toBe(true);
  });

  it.each(nonIntentTypes)('%s is NOT a business intent action', (type) => {
    expect(isBusinessIntentActionEventType(type)).toBe(false);
  });

  it('sumBusinessIntentActionsFromCounts includes only intent types', () => {
    const counts: Partial<Record<AnalyticsEventType, number>> = {
      [AnalyticsEventType.CALL_CLICK]: 1,
      [AnalyticsEventType.WHATSAPP_CLICK]: 2,
      [AnalyticsEventType.ROUTE_CLICK]: 3,
      [AnalyticsEventType.WEBSITE_CLICK]: 4,
      [AnalyticsEventType.INSTAGRAM_CLICK]: 5,
      [AnalyticsEventType.FAVORITE_ADD]: 6,
      [AnalyticsEventType.PROMOTION_VIEW]: 99,
      [AnalyticsEventType.FAVORITE_REMOVE]: 88,
    };
    expect(sumBusinessIntentActionsFromCounts(counts)).toBe(21);
  });

  it('sumBusinessIntentActionsFromDaily ignores promotionViews', () => {
    expect(
      sumBusinessIntentActionsFromDaily({
        callClicks: 1,
        whatsappClicks: 0,
        routeClicks: 0,
        websiteClicks: 0,
        instagramClicks: 0,
        favoriteAdds: 0,
      }),
    ).toBe(1);
  });

  function createBuilder(tier: BusinessPlanTier = BusinessPlanTier.PREMIUM) {
    const prisma = {
      business: {
        findUnique: jest.fn().mockResolvedValue({
          city: { timezone: 'Asia/Oral' },
          category: { title: 'Test' },
          categoryId: 'c1',
          cityId: 'city-1',
        }),
      },
      analyticsEvent: {
        findMany: jest.fn(),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      analyticsDailyMetric: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      analyticsDailyDimensionMetric: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        tier,
        effectiveTier: tier,
        limits: {
          maxAnalyticsDays: tier === BusinessPlanTier.VIP ? 365 : 90,
          analyticsTier: 'FULL',
        },
      }),
    } as unknown as PlanLimitsService;
    return {
      prisma,
      builder: new AnalyticsDashboardBuilder(prisma as unknown as PrismaService, planLimits),
    };
  }

  it('rollup path: promotionViews do not inflate actions or conversion', async () => {
    const { prisma, builder } = createBuilder();
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([
      {
        metricDate: '2026-09-09',
        impressions: 0,
        views: 10,
        callClicks: 1,
        whatsappClicks: 0,
        routeClicks: 0,
        websiteClicks: 0,
        instagramClicks: 0,
        favoriteAdds: 0,
        promotionImpressions: 0,
        promotionViews: 7,
        promotionActions: 0,
        catalogImpressions: 0,
        catalogViews: 0,
        catalogActions: 0,
        uniqueVisitorsApprox: 0,
        sessionsApprox: 0,
      },
    ]);

    const dashboard = await builder.build('biz-1', 30);
    const overview = dashboard.overview as {
      actions: number;
      conversionRate: number | null;
    };
    expect(overview.actions).toBe(1);
    expect(overview.conversionRate).toBe(10);
    expect((dashboard.actions as { promotionViews: number }).promotionViews).toBe(7);
    expect((dashboard.actions as { total: number }).total).toBe(1);
  });

  it('raw fallback path matches rollup intent semantics', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.BASIC);
    prisma.analyticsEvent.findMany.mockImplementation(async (args: { where: { createdAt?: unknown } }) => {
      const isPrevious = args.where.createdAt === undefined;
      void isPrevious;
      return [
        { type: AnalyticsEventType.VIEW_BUSINESS, createdAt: new Date('2026-09-09T10:00:00Z') },
        { type: AnalyticsEventType.CALL_CLICK, createdAt: new Date('2026-09-09T10:01:00Z') },
        { type: AnalyticsEventType.PROMOTION_VIEW, createdAt: new Date('2026-09-09T10:02:00Z') },
        { type: AnalyticsEventType.FAVORITE_REMOVE, createdAt: new Date('2026-09-09T10:03:00Z') },
      ];
    });

    const dashboard = await builder.build('biz-1', 7);
    expect((dashboard.overview as { actions: number }).actions).toBe(1);
    expect((dashboard.actions as { total: number; promotionViews: number }).total).toBe(1);
    expect((dashboard.actions as { promotionViews: number }).promotionViews).toBe(1);
    expect(dashboard.conversion).toBeNull();
  });

  it('comparison uses canonical actions only', async () => {
    const { prisma, builder } = createBuilder();
    const currentRow = {
      metricDate: '2026-09-09',
      impressions: 0,
      views: 10,
      callClicks: 2,
      whatsappClicks: 0,
      routeClicks: 0,
      websiteClicks: 0,
      instagramClicks: 0,
      favoriteAdds: 0,
      promotionImpressions: 0,
      promotionViews: 5,
      promotionActions: 0,
      catalogImpressions: 0,
      catalogViews: 0,
      catalogActions: 0,
      uniqueVisitorsApprox: 0,
      sessionsApprox: 0,
    };
    const previousRow = {
      ...currentRow,
      metricDate: '2026-08-01',
      views: 5,
      callClicks: 0,
      promotionViews: 3,
    };
    let dailyFetch = 0;
    prisma.analyticsDailyMetric.findMany.mockImplementation(() => {
      dailyFetch += 1;
      return Promise.resolve(dailyFetch === 1 ? [currentRow] : [previousRow]);
    });

    const dashboard = await builder.build('biz-1', 30);
    const actionsMetric = (
      dashboard.comparison as { metrics: Array<{ key: string; current: number; previous: number }> }
    ).metrics.find((m) => m.key === 'actions');
    expect(actionsMetric?.current).toBe(2);
    expect(actionsMetric?.previous).toBe(0);
  });

  it('recommendations use canonical actions (promotionViews alone do not count as actions)', async () => {
    const { prisma, builder } = createBuilder(BusinessPlanTier.VIP);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([
      {
        metricDate: '2026-09-09',
        impressions: 0,
        views: 20,
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
      },
    ]);

    const dashboard = await builder.build('biz-1', 30);
    const recs = dashboard.recommendations as Array<{ id: string }>;
    expect(recs.some((r) => r.id === 'no-intent-actions')).toBe(true);
    expect(recs.some((r) => r.id === 'keep-going')).toBe(false);
  });
});
