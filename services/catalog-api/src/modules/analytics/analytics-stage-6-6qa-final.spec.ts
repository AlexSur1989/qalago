import { ForbiddenException } from '@nestjs/common';
import {
  AnalyticsDimensionType,
  AudienceDistanceBucket,
  BusinessPermission,
  BusinessPlanTier,
  UserRole,
} from '@prisma/client';
import {
  clampAnalyticsDays,
  deltaPercent,
  getAnalyticsCapabilitiesForPlan,
} from '../../common/utils/analytics-capabilities.util';
import { MIN_SEARCH_QUERY_DISPLAY_COUNT } from '../../common/utils/search-query-analytics.util';
import { aggregateSearchQueries } from '../../common/utils/search-query-analytics.util';
import { MIN_AUDIENCE_GEOGRAPHY_SAMPLE } from '../../common/utils/audience-geography.util';
import { aggregateAudienceGeography } from '../../common/utils/audience-geography.util';
import {
  previousCompletedLocalMonthRange,
  previousCompletedLocalWeekRange,
} from '../../common/utils/analytics-report-period.util';
import { buildAnalyticsExportCsv, CSV_UTF8_BOM } from './analytics-csv.serializer';
import { AnalyticsDashboardBuilder } from './analytics-dashboard.builder';
import { AnalyticsService } from './analytics.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createMockBusinessAccess,
  asBusinessAccessService,
} from '../../test-utils/mock-business-access';
import { escapeCsvCell } from '../../common/utils/csv.util';
import { AuthUser } from '../../common/types/jwt-payload.type';

describe('Stage 6.6QA — Analytics 360 adversarial QA', () => {
  describe('entitlement matrix (capabilities)', () => {
    it('FREE has views only + max 30', () => {
      const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.FREE);
      expect(caps.actions).toBe(false);
      expect(caps.reportExport).toBe(false);
      expect(caps.benchmark).toBe(false);
      expect(caps.maxDays).toBe(30);
    });

    it('BASIC adds actions/impressions, not PRO/VIP', () => {
      const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.BASIC);
      expect(caps.actions).toBe(true);
      expect(caps.trafficSources).toBe(false);
      expect(caps.reportExport).toBe(false);
    });

    it('PREMIUM adds export/sources, not VIP benchmark', () => {
      const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM);
      expect(caps.reportExport).toBe(true);
      expect(caps.benchmark).toBe(false);
      expect(caps.maxDays).toBe(90);
    });

    it('VIP adds benchmark/recommendations + 365d', () => {
      const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP);
      expect(caps.benchmark).toBe(true);
      expect(caps.recommendations).toBe(true);
      expect(caps.maxDays).toBe(365);
    });
  });

  describe('range clamping', () => {
    const vip = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP);
    const free = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.FREE);

    it('clamps abusive day values', () => {
      expect(clampAnalyticsDays(999999, vip)).toBe(365);
      expect(clampAnalyticsDays(91, getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM))).toBe(
        90,
      );
      expect(clampAnalyticsDays(31, free)).toBe(30);
      expect(clampAnalyticsDays(-1, free)).toBe(1);
      expect(clampAnalyticsDays(0, free)).toBe(1);
      expect(clampAnalyticsDays(Number.NaN, free)).toBe(1);
    });
  });

  describe('downgrade — VIP rollups must not leak on FREE dashboard', () => {
    function createDowngradedHarness() {
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
              catalogViews: 3,
              catalogActions: 0,
              uniqueVisitorsApprox: 99,
              sessionsApprox: 88,
            },
          ]),
          groupBy: jest.fn().mockResolvedValue([]),
        },
        analyticsDailyDimensionMetric: {
          findMany: jest.fn().mockResolvedValue([
            {
              dimensionType: AnalyticsDimensionType.VISITOR_TYPE,
              dimensionKey: 'RETURNING',
              metricKey: 'views',
              count: 40,
            },
            {
              dimensionType: AnalyticsDimensionType.DISTANCE_BUCKET,
              dimensionKey: 'KM_1_3',
              metricKey: 'views',
              count: 20,
            },
            {
              dimensionType: AnalyticsDimensionType.SEARCH_QUERY,
              dimensionKey: 'кофе',
              metricKey: 'views',
              count: 5,
            },
          ]),
        },
      };
      const planLimits = {
        getBusinessPlanContext: jest.fn().mockResolvedValue({
          tier: BusinessPlanTier.FREE,
          effectiveTier: BusinessPlanTier.FREE,
          limits: { maxAnalyticsDays: 30, analyticsTier: 'BASIC' },
        }),
      } as unknown as PlanLimitsService;
      return {
        builder: new AnalyticsDashboardBuilder(
          prisma as unknown as PrismaService,
          planLimits,
        ),
        prisma,
      };
    }

    it('nulls VIP sections despite rollup dimensions', async () => {
      const { builder } = createDowngradedHarness();
      const dashboard = await builder.build('biz-1', 365);
      const json = JSON.stringify(dashboard);

      expect(dashboard.audience).toBeNull();
      expect(dashboard.audienceGeography).toBeNull();
      expect(dashboard.benchmark).toBeNull();
      expect(dashboard.recommendations).toBeNull();
      expect(dashboard.catalog).toBeNull();
      expect(dashboard.searchQueries).toBeNull();
      expect(json).not.toContain('"returningShare"');
      expect(json).not.toContain('"cohortSize"');
    });
  });

  describe('privacy thresholds', () => {
    it('search hides count 1 and 2, shows 3', () => {
      const rows = [
        { searchQuery: 'a', count: 1 },
        { searchQuery: 'b', count: 2 },
        { searchQuery: 'c', count: 3 },
      ];
      const result = aggregateSearchQueries(rows);
      expect(result.queries.map((q) => q.query)).toEqual(['c']);
      expect(MIN_SEARCH_QUERY_DISPLAY_COUNT).toBe(3);
    });

    it('geography hides total views 9, allows 10', () => {
      const buckets = [{ bucket: AudienceDistanceBucket.KM_1_3, count: 5 }];
      expect(aggregateAudienceGeography(buckets, 9).status).toBe('INSUFFICIENT_DATA');
      expect(aggregateAudienceGeography(buckets, MIN_AUDIENCE_GEOGRAPHY_SAMPLE).status).toBe(
        'AVAILABLE',
      );
    });
  });

  describe('comparison null-safe deltas', () => {
    it('never returns Infinity for zero previous denominator', () => {
      expect(deltaPercent(10, 0)).toBe(100);
      expect(deltaPercent(0, 0)).toBeNull();
      const bad = deltaPercent(5, 0);
      expect(Number.isFinite(bad ?? 0)).toBe(true);
    });
  });

  describe('conversion zero views', () => {
    function premiumHarness() {
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            city: { timezone: 'Asia/Oral' },
            category: { title: 'C' },
            categoryId: 'c1',
            cityId: 'city-1',
          }),
        },
        analyticsEvent: { findMany: jest.fn(), groupBy: jest.fn() },
        analyticsDailyMetric: {
          findMany: jest.fn().mockResolvedValue([
            {
              metricDate: '2026-09-09',
              impressions: 10,
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
      return new AnalyticsDashboardBuilder(prisma as unknown as PrismaService, planLimits);
    }

    it('conversion.rate is null when views=0 (not fake 0%)', async () => {
      const dashboard = await premiumHarness().build('biz-1', 30);
      expect(dashboard.conversion?.views).toBe(0);
      expect(dashboard.conversion?.rate).toBeNull();
    });
  });

  describe('export authorization', () => {
    it('manager with EXPORT but without VIEW cannot export', async () => {
      const businessAccess = createMockBusinessAccess({
        managerPermissions: [BusinessPermission.ANALYTICS_EXPORT],
      });
      const service = new AnalyticsService(
        { business: { findUnique: jest.fn() } } as unknown as PrismaService,
        {
          getBusinessPlanContext: jest.fn().mockResolvedValue({
            tier: BusinessPlanTier.PREMIUM,
            effectiveTier: BusinessPlanTier.PREMIUM,
            limits: { maxAnalyticsDays: 90, analyticsTier: 'FULL' },
          }),
        } as unknown as PlanLimitsService,
        asBusinessAccessService(businessAccess),
      );
      jest.spyOn(service.reportBuilder, 'buildBusinessAnalyticsReport').mockResolvedValue({
        schemaVersion: 1,
        business: { id: 'b', name: 'T', cityName: 'U', categoryTitle: null },
        period: {
          type: 'CUSTOM',
          timezone: 'Asia/Oral',
          startDate: '2026-09-01',
          endDate: '2026-09-07',
          days: 7,
          generatedAt: new Date().toISOString(),
        },
        previousPeriod: null,
        dashboard: {},
        summary: [],
      });

      const manager: AuthUser = {
        id: 'manager-1',
        sub: 'manager-1',
        phone: '+77000000002',
        role: UserRole.BUSINESS,
      };

      await expect(service.exportCsv(manager, 'business-1', { days: 30 })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('report/export privacy', () => {
    it('CSV has BOM and blocks formula in search query', () => {
      const csv = buildAnalyticsExportCsv({
        schemaVersion: 1,
        business: { id: 'b1', name: 'Biz', cityName: 'U', categoryTitle: null },
        period: {
          type: 'CUSTOM',
          timezone: 'Asia/Oral',
          startDate: '2026-09-01',
          endDate: '2026-09-07',
          days: 7,
          generatedAt: '2026-09-08T00:00:00.000Z',
        },
        previousPeriod: null,
        summary: [],
        dashboard: {
          effectivePlan: 'VIP',
          effectiveRange: { days: 7, from: '', to: '' },
          overview: { views: 1 },
          actions: null,
          conversion: null,
          sources: null,
          searchQueries: [{ query: '@evil', count: 3, percentage: 100 }],
          audienceGeography: null,
          audience: null,
          popularTimes: null,
          benchmark: null,
          recommendations: null,
          comparison: null,
          promotions: null,
          catalog: null,
          trends: { views: [] },
          capabilities: {
            searchQueries: true,
            trafficSources: false,
            audienceGeography: false,
            popularTimes: false,
            benchmark: false,
            recommendations: false,
            impressions: false,
            ctr: false,
            conversion: false,
            audience: false,
            promotionAnalytics: false,
            catalogAnalytics: false,
            visitorMetrics: false,
          },
        },
      });
      expect(CSV_UTF8_BOM).toBe('\ufeff');
      expect(csv).toContain("'@evil");
      expect(csv).not.toMatch(/visitorHash|sessionId|clientEventId/i);
    });

    it('escapeCsvCell handles Kazakh', () => {
      expect(escapeCsvCell('Қазақша')).toBe('Қазақша');
    });
  });

  describe('completed weekly/monthly periods', () => {
    it('weekly on Wed 2026-09-16 uses prior Mon–Sun', () => {
      expect(previousCompletedLocalWeekRange('2026-09-16')).toEqual({
        start: '2026-09-07',
        end: '2026-09-13',
      });
    });

    it('monthly early January uses prior December', () => {
      expect(previousCompletedLocalMonthRange('2026-01-15')).toEqual({
        start: '2025-12-01',
        end: '2025-12-31',
      });
    });
  });

  describe('VIP 365 rollup-first', () => {
    it('does not scan raw events when rollups exist', async () => {
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            city: { timezone: 'Asia/Oral' },
            category: { title: 'C' },
            categoryId: 'c1',
            cityId: 'city-1',
          }),
        },
        analyticsEvent: { findMany: jest.fn(), groupBy: jest.fn() },
        analyticsDailyMetric: {
          findMany: jest.fn().mockResolvedValue([
            {
              metricDate: '2026-09-09',
              impressions: 1,
              views: 1,
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
          groupBy: jest.fn().mockResolvedValue([]),
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
      await builder.build('biz-1', 365);
      expect(prisma.analyticsEvent.findMany).not.toHaveBeenCalled();
    });
  });
});
