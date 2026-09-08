import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BusinessPlanTier, UserRole } from '@prisma/client';
import { getAnalyticsCapabilitiesForPlan } from '../../common/utils/analytics-capabilities.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsDashboardBuilder } from './analytics-dashboard.builder';
import { AnalyticsService } from './analytics.service';
import { CSV_UTF8_BOM } from './analytics-csv.serializer';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

describe('Stage 5K analytics CSV export', () => {
  const owner: AuthUser = {
    id: 'owner-1',
    sub: 'owner-1',
    phone: '+77000000002',
    role: UserRole.BUSINESS,
  };

  const otherOwner: AuthUser = {
    id: 'owner-2',
    sub: 'owner-2',
    phone: '+77000000099',
    role: UserRole.BUSINESS,
  };

  const dashboardFixture = {
    businessId: 'business-1',
    plan: BusinessPlanTier.VIP,
    effectivePlan: BusinessPlanTier.VIP,
    headline: 'VIP',
    capabilities: getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP),
    lockedSections: [],
    effectiveRange: {
      days: 30,
      from: '2026-08-10T00:00:00.000Z',
      to: '2026-09-08T23:59:59.999Z',
    },
    overview: { views: 12, totalCustomerActions: 4 },
    actions: {
      total: 4,
      calls: 1,
      whatsapp: 1,
      routes: 1,
      website: 0,
      instagram: 0,
      favorites: 1,
      promotionViews: 0,
    },
    trends: { views: [{ date: '2026-09-01', count: 3 }] },
    sources: [{ source: 'SEARCH', label: 'Поиск', views: 6, share: 50 }],
    sourcesStatus: null,
    searchQueries: [{ query: 'кофе', count: 5, percentage: 41.7 }],
    searchQueriesStatus: 'AVAILABLE' as const,
    searchQueriesOtherCount: null,
    conversion: { views: 12, actions: 4, rate: 33.3 },
    comparison: null,
    promotions: null,
    popularTimes: {
      byHour: [{ hour: 12, count: 2 }],
      byWeekday: [{ weekday: 1, label: 'Пн', count: 2 }],
    },
    benchmark: {
      status: 'AVAILABLE' as const,
      categoryTitle: 'Кафе',
      businessViews: 12,
      categoryAvgViews: 8,
      businessActions: 4,
      categoryAvgActions: 3,
      cohortSize: 10,
    },
    recommendations: [{ id: 'r1', title: 'OK', body: 'body' }],
    audienceGeography: [{ bucket: 'KM_1_3', label: '1–3 км', count: 8, percentage: 66.7 }],
    audienceGeographyStatus: 'AVAILABLE' as const,
  };

  function createService() {
    const prisma = {
      business: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      analyticsEvent: {
        create: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const planLimits = {
      getBusinessPlanContext: jest.fn(),
      getAnalyticsCapabilities: jest.fn(),
    } as unknown as PlanLimitsService;

    const businessAccess = createMockBusinessAccess();

    const service = new AnalyticsService(
      prisma as unknown as PrismaService,
      planLimits,
      asBusinessAccessService(businessAccess),
    );

    const builder = (service as unknown as { dashboardBuilder: AnalyticsDashboardBuilder })
      .dashboardBuilder;
    const buildSpy = jest.spyOn(builder, 'build').mockResolvedValue(dashboardFixture as never);

    return { prisma, planLimits, service, builder, buildSpy, businessAccess };
  }

  function mockVipContext(planLimits: PlanLimitsService) {
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      tier: BusinessPlanTier.VIP,
      effectiveTier: BusinessPlanTier.VIP,
      limits: { maxAnalyticsDays: 365, analyticsTier: 'FULL' },
    });
  }

  function mockPremiumContext(planLimits: PlanLimitsService) {
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      tier: BusinessPlanTier.PREMIUM,
      effectiveTier: BusinessPlanTier.PREMIUM,
      limits: { maxAnalyticsDays: 90, analyticsTier: 'FULL' },
    });
  }

  it('VIP owner can export CSV', async () => {
    const { prisma, planLimits, service } = createService();
    mockVipContext(planLimits);
    prisma.business.findUnique.mockResolvedValue({
      title: 'Кофейня',
      city: { nameRu: 'Уральск' },
    });

    const result = await service.exportCsv(owner, 'business-1', { days: 30 });

    expect(result.body.startsWith(CSV_UTF8_BOM)).toBe(true);
    expect(result.body).toContain('QalaGo — Аналитика бизнеса');
    expect(result.body).toContain('Просмотры карточки;12');
    expect(result.body).toContain('Поиск;6;50%');
    expect(result.body).toContain('кофе;5;41.7%');
    expect(result.body).toContain('1–3 км;8;66.7%');
    expect(result.filename).toMatch(/^qalago-analytics-.*\.csv$/);
    expect(result.contentDisposition).toContain('attachment');
  });

  it('rejects FREE/BASIC/PREMIUM export', async () => {
    for (const tier of [
      BusinessPlanTier.FREE,
      BusinessPlanTier.BASIC,
      BusinessPlanTier.PREMIUM,
    ]) {
      const { prisma, planLimits, service } = createService();
      planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
        tier,
        effectiveTier: tier,
        limits: { maxAnalyticsDays: 30, analyticsTier: 'BASIC' },
      });
      prisma.business.findUnique.mockResolvedValue({
        title: 'Test',
        city: { nameRu: 'Уральск' },
      });

      await expect(service.exportCsv(owner, 'business-1', { days: 30 })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    }
  });

  it('rejects cross-owner export', async () => {
    const { planLimits, service, businessAccess } = createService();
    mockVipContext(planLimits);
    businessAccess.assertCanViewBusinessAnalytics.mockRejectedValue(
      new ForbiddenException('Not allowed to manage this business'),
    );

    await expect(
      service.exportCsv(otherOwner, 'business-1', { days: 30 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('supports 30/90/365 day periods via dashboard builder', async () => {
    const { prisma, planLimits, service, buildSpy } = createService();
    mockVipContext(planLimits);
    prisma.business.findUnique.mockImplementation(async () => ({
      title: 'Test',
      city: { nameRu: 'Уральск' },
    }));

    for (const days of [30, 90, 365]) {
      await service.exportCsv(owner, 'business-1', { days });
      expect(buildSpy).toHaveBeenCalledWith('business-1', days);
    }
  });

  it('empty analytics still succeeds', async () => {
    const { prisma, planLimits, service, buildSpy } = createService();
    mockVipContext(planLimits);
    buildSpy.mockResolvedValueOnce({
      ...dashboardFixture,
      overview: { views: 0 },
      actions: { ...dashboardFixture.actions!, total: 0, calls: 0, whatsapp: 0, routes: 0, favorites: 0 },
      sources: [],
      searchQueries: [],
      searchQueriesStatus: 'INSUFFICIENT_DATA',
      audienceGeography: [],
      audienceGeographyStatus: 'INSUFFICIENT_DATA',
      conversion: { views: 0, actions: 0, rate: 0 },
      trends: { views: [{ date: '2026-09-01', count: 0 }] },
    } as never);
    prisma.business.findUnique
      .mockResolvedValueOnce({ title: 'Empty', city: { nameRu: 'Уральск' } });

    const result = await service.exportCsv(owner, 'business-1', { days: 30 });
    expect(result.body).toContain('Просмотры карточки;0');
    expect(result.body).toContain('Недостаточно данных');
  });

  it('does not include raw GPS or user identity fields', async () => {
    const { prisma, planLimits, service } = createService();
    mockVipContext(planLimits);
    prisma.business.findUnique.mockImplementation(async () => ({
      title: 'Test',
      city: { nameRu: 'Уральск' },
    }));

    const result = await service.exportCsv(owner, 'business-1', { days: 30 });
    expect(result.body).not.toMatch(/userLatitude|userLongitude|distanceKm|distanceMeters|userId|phone/i);
  });

  it('escapes formula injection in business title', async () => {
    const { prisma, planLimits, service } = createService();
    mockVipContext(planLimits);
    prisma.business.findUnique.mockImplementation(async () => ({
      title: '=HYPERLINK("evil")',
      city: { nameRu: 'Уральск' },
    }));

    const result = await service.exportCsv(owner, 'business-1', { days: 30 });
    expect(result.body).toMatch(/'=HYPERLINK\(""evil""\)/);
  });

  it('throws when business not found during export metadata lookup', async () => {
    const { prisma, planLimits, service } = createService();
    mockVipContext(planLimits);
    prisma.business.findUnique.mockResolvedValue(null);

    await expect(service.exportCsv(owner, 'business-1', { days: 30 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reportExport capability is VIP-only', () => {
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP).reportExport).toBe(true);
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM).reportExport).toBe(false);
  });
});
