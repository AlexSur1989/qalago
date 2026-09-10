import { BusinessStatus, BusinessPlanTier } from '@prisma/client';
import {
  buildCategoryBenchmark,
  aggregatePeerMeansForTest,
  type PeerPeriodTotals,
} from '../../common/utils/analytics-benchmark.util';
import { buildDeterministicRecommendations } from '../../common/utils/analytics-recommendations.util';
import {
  BENCHMARK_MIN_PEER_BUSINESSES,
  RECOMMENDATION_MAX_COUNT,
  MIN_IMPRESSIONS_FOR_CTR_INSIGHT,
} from '../../common/utils/analytics-insights.constants';
import {
  emptyDailyTotals,
  viewToIntentConversionPercent,
} from '../../common/utils/analytics-dashboard-metrics.util';
import { getAnalyticsCapabilitiesForPlan } from '../../common/utils/analytics-capabilities.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsDashboardBuilder } from './analytics-dashboard.builder';

function peerGroupRow(
  businessId: string,
  views: number,
  impressions = 0,
  callClicks = 0,
) {
  return {
    businessId,
    _sum: {
      views,
      impressions,
      callClicks,
      whatsappClicks: 0,
      routeClicks: 0,
      websiteClicks: 0,
      instagramClicks: 0,
      favoriteAdds: 0,
    },
  };
}

function fivePeers(viewsEach = 100, impressionsEach = 200) {
  return Array.from({ length: 5 }, (_, i) =>
    peerGroupRow(`peer-${i + 1}`, viewsEach, impressionsEach, 10),
  );
}

describe('Stage 6.6E category benchmark (rollup cohort)', () => {
  const baseParams = {
    subjectBusinessId: 'subject-a',
    categoryId: 'cat-1',
    cityId: 'city-1',
    categoryTitle: 'Кафе',
    rangeStart: '2026-08-01',
    rangeEnd: '2026-09-09',
    subjectTotals: emptyDailyTotals(),
  };

  it('excludes subject business from peer query (where.id.not)', async () => {
    const groupBy = jest.fn().mockResolvedValue(fivePeers());
    const prisma = { analyticsDailyMetric: { groupBy } } as unknown as PrismaService;

    await buildCategoryBenchmark({ ...baseParams, prisma });

    const where = groupBy.mock.calls[0][0].where;
    expect(where.business.id).toEqual({ not: 'subject-a' });
    expect(where.business.categoryId).toBe('cat-1');
    expect(where.business.cityId).toBe('city-1');
    expect(where.business.status).toBe(BusinessStatus.ACTIVE);
    expect(where.metricDate).toEqual({ gte: '2026-08-01', lte: '2026-09-09' });
  });

  it('returns INSUFFICIENT_DATA when fewer than 5 peers', async () => {
    const prisma = {
      analyticsDailyMetric: {
        groupBy: jest.fn().mockResolvedValue(fivePeers().slice(0, 4)),
      },
    } as unknown as PrismaService;

    const result = await buildCategoryBenchmark({
      ...baseParams,
      prisma,
      subjectTotals: { ...emptyDailyTotals(), views: 10 },
    });

    expect(result?.status).toBe('INSUFFICIENT_DATA');
    expect(result && 'cohortSize' in result && result.cohortSize).toBe(4);
  });

  it('allows benchmark with exactly 5 peers', async () => {
    const prisma = {
      analyticsDailyMetric: { groupBy: jest.fn().mockResolvedValue(fivePeers(80, 160)) },
    } as unknown as PrismaService;

    const result = await buildCategoryBenchmark({
      ...baseParams,
      prisma,
      subjectTotals: { ...emptyDailyTotals(), views: 40, impressions: 100 },
    });

    expect(result?.status).toBe('AVAILABLE');
    expect(result && 'cohortSize' in result && result.cohortSize).toBe(5);
    expect(result && 'categoryAvgViews' in result && result.categoryAvgViews).toBe(80);
  });

  it('peer average excludes subject (subject not in groupBy result)', () => {
    const peers: PeerPeriodTotals[] = fivePeers(100).map((r) => ({
      businessId: r.businessId,
      views: r._sum.views ?? 0,
      impressions: r._sum.impressions ?? 0,
      actions: r._sum.callClicks ?? 0,
    }));
    const means = aggregatePeerMeansForTest(peers);
    expect(means.categoryAvgViews).toBe(100);
    expect(peers.some((p) => p.businessId === 'subject-a')).toBe(false);
  });

  it('uses same metricDate window for cohort aggregation', async () => {
    const groupBy = jest.fn().mockResolvedValue(fivePeers());
    const prisma = { analyticsDailyMetric: { groupBy } } as unknown as PrismaService;

    await buildCategoryBenchmark({
      ...baseParams,
      rangeStart: '2026-01-01',
      rangeEnd: '2026-01-30',
      prisma,
    });

    expect(groupBy.mock.calls[0][0].where.metricDate).toEqual({
      gte: '2026-01-01',
      lte: '2026-01-30',
    });
  });

  it('suppresses CTR benchmark when fewer than 5 peers with impressions', async () => {
    const rows = [
      ...fivePeers(50, 100).slice(0, 3),
      peerGroupRow('p4', 50, 100),
      peerGroupRow('p5', 50, 0),
    ];
    const prisma = {
      analyticsDailyMetric: { groupBy: jest.fn().mockResolvedValue(rows) },
    } as unknown as PrismaService;

    const result = await buildCategoryBenchmark({
      ...baseParams,
      prisma,
      subjectTotals: { ...emptyDailyTotals(), views: 20, impressions: 100 },
    });

    expect(result?.status).toBe('AVAILABLE');
    if (result?.status === 'AVAILABLE') {
      expect(result.categoryAvgCtr).toBeNull();
      expect(result.ctrDeltaPercent).toBeNull();
    }
  });

  it('returns null conversion when views denominator is zero (subject)', async () => {
    const prisma = {
      analyticsDailyMetric: { groupBy: jest.fn().mockResolvedValue(fivePeers()) },
    } as unknown as PrismaService;

    const result = await buildCategoryBenchmark({
      ...baseParams,
      prisma,
      subjectTotals: { ...emptyDailyTotals(), views: 0, impressions: 0 },
    });

    if (result?.status === 'AVAILABLE') {
      expect(result.businessConversionRate).toBeNull();
      expect(result.businessCtr).toBeNull();
    }
  });

  it('serialized benchmark has no peer business identifiers', async () => {
    const prisma = {
      analyticsDailyMetric: { groupBy: jest.fn().mockResolvedValue(fivePeers()) },
    } as unknown as PrismaService;

    const result = await buildCategoryBenchmark({
      ...baseParams,
      prisma,
      subjectTotals: { ...emptyDailyTotals(), views: 50 },
    });

    const json = JSON.stringify(result);
    expect(json).not.toMatch(/peer-/);
    expect(json).not.toMatch(/businessId/);
  });

  it('VIP 365 dashboard uses rollup groupBy for benchmark, not raw events', async () => {
    const groupBy = jest.fn().mockResolvedValue(fivePeers());
    const prisma = {
      business: {
        findUnique: jest.fn().mockResolvedValue({
          city: { timezone: 'Asia/Oral' },
          category: { title: 'Кафе' },
          categoryId: 'cat-1',
          cityId: 'city-1',
        }),
      },
      analyticsEvent: { findMany: jest.fn(), groupBy: jest.fn() },
      analyticsDailyMetric: {
        findMany: jest.fn().mockResolvedValue([
          {
            metricDate: '2026-09-09',
            impressions: 100,
            views: 50,
            callClicks: 1,
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
        ]),
        groupBy,
      },
      analyticsDailyDimensionMetric: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        tier: BusinessPlanTier.VIP,
        effectiveTier: BusinessPlanTier.VIP,
        limits: { maxAnalyticsDays: 365, analyticsTier: 'FULL' },
      }),
    } as unknown as PlanLimitsService;

    const builder = new AnalyticsDashboardBuilder(
      prisma as unknown as PrismaService,
      planLimits,
    );
    await builder.build('subject-a', 365);

    expect(groupBy).toHaveBeenCalled();
    expect(prisma.analyticsEvent.findMany).not.toHaveBeenCalled();
  });
});

describe('Stage 6.6E deterministic recommendations', () => {
  const vipCaps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP);

  function ctx(
    overrides: Partial<Parameters<typeof buildDeterministicRecommendations>[0]> = {},
  ) {
    return {
      caps: vipCaps,
      subjectTotals: emptyDailyTotals(),
      benchmark: null,
      promotionViews: 0,
      searchAttributedViews: null,
      returningShare: null,
      classifiedAudienceViews: 0,
      peakHourLabel: null,
      ...overrides,
    };
  }

  it('same input yields same output and order', () => {
    const input = ctx({
      subjectTotals: { ...emptyDailyTotals(), views: 25, impressions: 0 },
      benchmark: {
        status: 'AVAILABLE',
        categoryTitle: 'C',
        cohortSize: 5,
        businessViews: 25,
        categoryAvgViews: 100,
        viewsDeltaPercent: -75,
        businessActions: 0,
        categoryAvgActions: 10,
        actionsDeltaPercent: null,
        businessConversionRate: 0,
        categoryAvgConversionRate: 5,
        conversionDeltaPercent: null,
        businessCtr: null,
        categoryAvgCtr: null,
        ctrDeltaPercent: null,
      },
    });
    const a = buildDeterministicRecommendations(input);
    const b = buildDeterministicRecommendations(input);
    expect(a).toEqual(b);
  });

  it('returns empty when insufficient data for insights', () => {
    const recs = buildDeterministicRecommendations(
      ctx({ subjectTotals: { ...emptyDailyTotals(), views: 2 } }),
    );
    expect(recs).toEqual([]);
  });

  it('visibility below category when benchmark valid', () => {
    const recs = buildDeterministicRecommendations(
      ctx({
        subjectTotals: { ...emptyDailyTotals(), views: 20 },
        benchmark: {
          status: 'AVAILABLE',
          categoryTitle: 'C',
          cohortSize: 5,
          businessViews: 20,
          categoryAvgViews: 100,
          viewsDeltaPercent: -80,
          businessActions: 0,
          categoryAvgActions: 5,
          actionsDeltaPercent: null,
          businessConversionRate: null,
          categoryAvgConversionRate: null,
          conversionDeltaPercent: null,
          businessCtr: null,
          categoryAvgCtr: null,
          ctrDeltaPercent: null,
        },
      }),
    );
    expect(recs.some((r) => r.id === 'visibility-below-category')).toBe(true);
  });

  it('CTR recommendation requires minimum impressions', () => {
    const lowImp = buildDeterministicRecommendations(
      ctx({
        subjectTotals: {
          ...emptyDailyTotals(),
          views: 5,
          impressions: MIN_IMPRESSIONS_FOR_CTR_INSIGHT - 1,
        },
        benchmark: {
          status: 'AVAILABLE',
          categoryTitle: 'C',
          cohortSize: 5,
          businessViews: 5,
          categoryAvgViews: 50,
          viewsDeltaPercent: null,
          businessActions: 0,
          categoryAvgActions: 5,
          actionsDeltaPercent: null,
          businessConversionRate: null,
          categoryAvgConversionRate: null,
          conversionDeltaPercent: null,
          businessCtr: 10,
          categoryAvgCtr: 40,
          ctrDeltaPercent: null,
        },
      }),
    );
    expect(lowImp.some((r) => r.id === 'ctr-below-category')).toBe(false);

    const ok = buildDeterministicRecommendations(
      ctx({
        subjectTotals: {
          ...emptyDailyTotals(),
          views: 4,
          impressions: MIN_IMPRESSIONS_FOR_CTR_INSIGHT,
        },
        benchmark: {
          status: 'AVAILABLE',
          categoryTitle: 'C',
          cohortSize: 5,
          businessViews: 4,
          categoryAvgViews: 50,
          viewsDeltaPercent: null,
          businessActions: 0,
          categoryAvgActions: 5,
          actionsDeltaPercent: null,
          businessConversionRate: null,
          categoryAvgConversionRate: null,
          conversionDeltaPercent: null,
          businessCtr: 20,
          categoryAvgCtr: 40,
          ctrDeltaPercent: null,
        },
      }),
    );
    expect(ok.some((r) => r.id === 'ctr-below-category')).toBe(true);
  });

  it('weak intent conversion with sufficient views', () => {
    const recs = buildDeterministicRecommendations(
      ctx({
        subjectTotals: { ...emptyDailyTotals(), views: 30, callClicks: 1 },
        benchmark: {
          status: 'AVAILABLE',
          categoryTitle: 'C',
          cohortSize: 5,
          businessViews: 30,
          categoryAvgViews: 30,
          viewsDeltaPercent: 0,
          businessActions: 1,
          categoryAvgActions: 10,
          actionsDeltaPercent: null,
          businessConversionRate: viewToIntentConversionPercent(1, 30),
          categoryAvgConversionRate: 20,
          conversionDeltaPercent: null,
          businessCtr: null,
          categoryAvgCtr: null,
          ctrDeltaPercent: null,
        },
      }),
    );
    expect(recs.some((r) => r.id === 'intent-conversion-weak')).toBe(true);
  });

  it('never generates lost-demand style recommendation', () => {
    const recs = buildDeterministicRecommendations(
      ctx({
        subjectTotals: { ...emptyDailyTotals(), views: 100 },
        searchAttributedViews: 0,
      }),
    );
    const joined = JSON.stringify(recs);
    expect(joined).not.toMatch(/не находят/i);
    expect(joined).not.toMatch(/lost/i);
    expect(recs.every((r) => r.id !== 'lost-demand')).toBe(true);
  });

  it('promotion recommendation does not claim conversion', () => {
    const recs = buildDeterministicRecommendations(
      ctx({
        subjectTotals: { ...emptyDailyTotals(), views: 30 },
        promotionViews: 0,
      }),
    );
    const promo = recs.find((r) => r.id === 'promotions-visibility');
    if (promo) {
      expect(promo.body).not.toMatch(/конверт/i);
    }
  });

  it('respects maximum recommendation count and stable priority', () => {
    const recs = buildDeterministicRecommendations(
      ctx({
        subjectTotals: {
          ...emptyDailyTotals(),
          views: 30,
          impressions: 50,
          callClicks: 0,
        },
        benchmark: {
          status: 'AVAILABLE',
          categoryTitle: 'C',
          cohortSize: 5,
          businessViews: 30,
          categoryAvgViews: 200,
          viewsDeltaPercent: -85,
          businessActions: 0,
          categoryAvgActions: 15,
          actionsDeltaPercent: null,
          businessConversionRate: 0,
          categoryAvgConversionRate: 25,
          conversionDeltaPercent: null,
          businessCtr: 5,
          categoryAvgCtr: 40,
          ctrDeltaPercent: null,
        },
        searchAttributedViews: 1,
        promotionViews: 0,
        returningShare: 10,
        classifiedAudienceViews: 50,
        peakHourLabel: 'с 18:00 до 19:00',
      }),
    );
    expect(recs.length).toBeLessThanOrEqual(RECOMMENDATION_MAX_COUNT);
    expect(recs[0]?.id).toBe('visibility-below-category');
  });

  it('serialized recommendations contain no PII fields', () => {
    const recs = buildDeterministicRecommendations(
      ctx({
        subjectTotals: { ...emptyDailyTotals(), views: 25 },
        benchmark: {
          status: 'AVAILABLE',
          categoryTitle: 'C',
          cohortSize: 5,
          businessViews: 25,
          categoryAvgViews: 100,
          viewsDeltaPercent: null,
          businessActions: 0,
          categoryAvgActions: 5,
          actionsDeltaPercent: null,
          businessConversionRate: null,
          categoryAvgConversionRate: null,
          conversionDeltaPercent: null,
          businessCtr: null,
          categoryAvgCtr: null,
          ctrDeltaPercent: null,
        },
      }),
    );
    const json = JSON.stringify(recs);
    expect(json).not.toMatch(/visitorHash|userId|sessionId|businessId/);
  });

  it('PREMIUM dashboard omits recommendations (plan gating via builder)', async () => {
    const prisma = {
      business: {
        findUnique: jest.fn().mockResolvedValue({
          city: { timezone: 'Asia/Oral' },
          category: { title: 'C' },
          categoryId: 'c1',
          cityId: 'city-1',
        }),
      },
      analyticsEvent: { findMany: jest.fn().mockResolvedValue([]), groupBy: jest.fn() },
      analyticsDailyMetric: {
        findMany: jest.fn().mockResolvedValue([
          {
            metricDate: '2026-09-09',
            impressions: 10,
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
        ]),
        groupBy: jest.fn(),
      },
      analyticsDailyDimensionMetric: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        tier: BusinessPlanTier.PREMIUM,
        effectiveTier: BusinessPlanTier.PREMIUM,
        limits: { maxAnalyticsDays: 90, analyticsTier: 'FULL' },
      }),
    } as unknown as PlanLimitsService;

    const dashboard = await new AnalyticsDashboardBuilder(
      prisma as unknown as PrismaService,
      planLimits,
    ).build('biz-1', 30);

    expect(dashboard.recommendations).toBeNull();
    expect(dashboard.benchmark).toBeNull();
    expect(prisma.analyticsDailyMetric.groupBy).not.toHaveBeenCalled();
  });
});

describe('Stage 6.6E benchmark constants', () => {
  it('minimum peer cohort is 5 excluding subject', () => {
    expect(BENCHMARK_MIN_PEER_BUSINESSES).toBe(5);
  });
});
