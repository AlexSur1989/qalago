import { ForbiddenException } from '@nestjs/common';
import { AnalyticsDimensionType, BusinessPlanTier, BusinessPermission, UserRole } from '@prisma/client';
import {
  clampAnalyticsDays,
  getAnalyticsCapabilitiesForPlan,
  getAnalyticsLockedSections,
} from '../../common/utils/analytics-capabilities.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsDashboardBuilder } from './analytics-dashboard.builder';
import { AnalyticsService } from './analytics.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

function dailyRow(overrides: Record<string, number | string> = {}) {
  return {
    metricDate: '2026-09-09',
    impressions: 100,
    views: 50,
    callClicks: 2,
    whatsappClicks: 1,
    routeClicks: 0,
    websiteClicks: 3,
    instagramClicks: 4,
    favoriteAdds: 1,
    promotionImpressions: 0,
    promotionViews: 10,
    promotionActions: 0,
    catalogImpressions: 0,
    catalogViews: 5,
    catalogActions: 0,
    uniqueVisitorsApprox: 20,
    sessionsApprox: 15,
    ...overrides,
  };
}

describe('Stage 6.6B analytics entitlements', () => {
  function createDashboardHarness(tier: BusinessPlanTier) {
    const prisma = {
      business: {
        findUnique: jest.fn().mockResolvedValue({
          city: { timezone: 'Asia/Oral' },
          category: { title: 'Кафе' },
          categoryId: 'c1',
          cityId: 'city-1',
        }),
      },
      analyticsEvent: { findMany: jest.fn().mockResolvedValue([]), groupBy: jest.fn().mockResolvedValue([]) },
      analyticsDailyMetric: {
        findMany: jest.fn().mockResolvedValue([dailyRow()]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      analyticsDailyDimensionMetric: {
        findMany: jest.fn().mockResolvedValue([
          {
            dimensionType: AnalyticsDimensionType.SOURCE,
            dimensionKey: 'SEARCH',
            metricKey: 'views',
            count: 5,
          },
          {
            dimensionType: AnalyticsDimensionType.VISITOR_TYPE,
            dimensionKey: 'NEW',
            metricKey: 'views',
            count: 3,
          },
        ]),
      },
    };
    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        tier,
        effectiveTier: tier,
        limits: {
          maxAnalyticsDays:
            tier === BusinessPlanTier.VIP ? 365 : tier === BusinessPlanTier.PREMIUM ? 90 : 30,
          analyticsTier: 'FULL',
        },
      }),
    } as unknown as PlanLimitsService;
    const builder = new AnalyticsDashboardBuilder(prisma as unknown as PrismaService, planLimits);
    return { prisma, builder, planLimits };
  }

  describe('maxAnalyticsDays clamp', () => {
    it('FREE clamps 365 → 30', () => {
      const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.FREE);
      expect(clampAnalyticsDays(365, caps)).toBe(30);
      expect(clampAnalyticsDays(31, caps)).toBe(30);
      expect(clampAnalyticsDays(30, caps)).toBe(30);
    });

    it('PREMIUM clamps 91 → 90', () => {
      const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM);
      expect(clampAnalyticsDays(365, caps)).toBe(90);
    });

    it('VIP allows 365', () => {
      const caps = getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP);
      expect(clampAnalyticsDays(365, caps)).toBe(365);
      expect(clampAnalyticsDays(366, caps)).toBe(365);
    });
  });

  describe('FREE dashboard JSON', () => {
    it('exposes views only in overview; no VIP leakage', async () => {
      const { builder } = createDashboardHarness(BusinessPlanTier.FREE);
      const dashboard = await builder.build('biz-1', 365);
      const json = JSON.stringify(dashboard);

      expect(dashboard.effectiveRange.days).toBe(30);
      expect(dashboard.overview.views).toBe(50);
      expect(dashboard.overview.actions).toBeUndefined();
      expect(dashboard.overview.impressions).toBeUndefined();
      expect(dashboard.overview.ctr).toBeUndefined();
      expect(dashboard.overview.conversionRate).toBeUndefined();
      expect(dashboard.overview.uniqueVisitorsDailySumApprox).toBeUndefined();
      expect(dashboard.actions).toBeNull();
      expect(dashboard.sources).toBeNull();
      expect(dashboard.audience).toBeNull();
      expect(dashboard.catalog).toBeNull();
      expect(json).not.toMatch(/uniqueVisitorsPeriodDistinct":\d/);
    });
  });

  describe('BASIC dashboard JSON', () => {
    it('allows actions, impressions, comparison; blocks PRO/VIP sections', async () => {
      const { builder } = createDashboardHarness(BusinessPlanTier.BASIC);
      const dashboard = await builder.build('biz-1', 30);

      expect(dashboard.overview.actions).toBe(11);
      expect(dashboard.overview.impressions).toBe(100);
      expect(dashboard.overview.ctr).toBeUndefined();
      expect(dashboard.comparison).not.toBeNull();
      expect(dashboard.promotions).toEqual(expect.objectContaining({ promotionViews: 10 }));
      expect(dashboard.promotions).not.toHaveProperty('byPromotion');
      expect(dashboard.sources).toBeNull();
      expect(dashboard.audience).toBeNull();
      expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.BASIC).reportExport).toBe(false);
    });
  });

  describe('PREMIUM dashboard JSON', () => {
    it('allows PRO sections; blocks VIP audience/visitor metrics', async () => {
      const { builder } = createDashboardHarness(BusinessPlanTier.PREMIUM);
      const dashboard = await builder.build('biz-1', 90);

      expect(dashboard.effectiveRange.days).toBe(90);
      expect(dashboard.overview.ctr).not.toBeUndefined();
      expect(dashboard.sources).not.toBeNull();
      expect(dashboard.conversion).not.toBeNull();
      expect(dashboard.promotions).toHaveProperty('byPromotion');
      expect(dashboard.audience).toBeNull();
      expect(dashboard.catalog).toBeNull();
      expect(dashboard.benchmark).toBeNull();
      expect(dashboard.overview.uniqueVisitorsDailySumApprox).toBeUndefined();
      expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM).reportExport).toBe(true);
    });
  });

  describe('VIP dashboard JSON', () => {
    it('allows audience, catalog, visitor metrics', async () => {
      const { builder } = createDashboardHarness(BusinessPlanTier.VIP);
      const dashboard = await builder.build('biz-1', 365);

      expect(dashboard.effectiveRange.days).toBe(365);
      expect(dashboard.audience).not.toBeNull();
      expect(dashboard.catalog).not.toBeNull();
      expect(dashboard.overview.uniqueVisitorsDailySumApprox).toBe(20);
      expect(getAnalyticsLockedSections(BusinessPlanTier.VIP)).toHaveLength(0);
    });
  });

  describe('export entitlement', () => {
    const owner = {
      id: 'owner-1',
      sub: 'owner-1',
      phone: '+77000000001',
      role: UserRole.BUSINESS,
    };

    function createExportService(tier: BusinessPlanTier) {
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            title: 'T',
            city: { nameRu: 'U', timezone: 'Asia/Oral' },
            category: { title: 'C' },
            categoryId: 'c1',
            cityId: 'city-1',
          }),
        },
        analyticsEvent: {
          groupBy: jest.fn().mockResolvedValue([]),
          findMany: jest.fn().mockResolvedValue([]),
        },
        analyticsDailyMetric: { findMany: jest.fn().mockResolvedValue([dailyRow()]) },
        analyticsDailyDimensionMetric: { findMany: jest.fn().mockResolvedValue([]) },
      };
      const planLimits = {
        getBusinessPlanContext: jest.fn().mockResolvedValue({
          tier,
          effectiveTier: tier,
          limits: { maxAnalyticsDays: 90, analyticsTier: 'FULL' },
        }),
        getAnalyticsCapabilities: jest.fn(),
      } as unknown as PlanLimitsService;
      const businessAccess = createMockBusinessAccess();
      const service = new AnalyticsService(
        prisma as unknown as PrismaService,
        planLimits,
        asBusinessAccessService(businessAccess),
      );
      return { service, businessAccess };
    }

    it('PREMIUM with ANALYTICS_EXPORT can export', async () => {
      const { service } = createExportService(BusinessPlanTier.PREMIUM);
      const result = await service.exportCsv(owner, 'biz-1', { days: 30 });
      expect(result.body).toContain('QalaGo');
    });

    it('FREE export forbidden by plan', async () => {
      const { service } = createExportService(BusinessPlanTier.FREE);
      await expect(service.exportCsv(owner, 'biz-1', { days: 30 })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('PREMIUM without ANALYTICS_EXPORT forbidden', async () => {
      const { service, businessAccess } = createExportService(BusinessPlanTier.PREMIUM);
      businessAccess.assertBusinessPermission.mockImplementation(
        (_u, _b, perm: BusinessPermission) => {
          if (perm === BusinessPermission.ANALYTICS_EXPORT) {
            throw new ForbiddenException('Insufficient permissions');
          }
          return Promise.resolve({ id: 'biz-1' });
        },
      );
      await expect(service.exportCsv(owner, 'biz-1', { days: 30 })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
