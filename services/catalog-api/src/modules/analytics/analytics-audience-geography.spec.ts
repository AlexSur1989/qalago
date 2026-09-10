import { BadRequestException } from '@nestjs/common';
import {
  AnalyticsEventType,
  AudienceDistanceBucket,
  BusinessPlanTier,
  BusinessTrafficSource,
  UserRole,
} from '@prisma/client';
import {
  aggregateAudienceGeography,
  MIN_AUDIENCE_GEOGRAPHY_SAMPLE,
} from '../../common/utils/audience-geography.util';
import { getAnalyticsCapabilitiesForPlan } from '../../common/utils/analytics-capabilities.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsDashboardBuilder } from './analytics-dashboard.builder';
import { AnalyticsService } from './analytics.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

describe('Stage 5J audience geography analytics', () => {
  const owner: AuthUser = {
    id: 'owner-1',
    sub: 'owner-1',
    phone: '+77000000002',
    role: UserRole.BUSINESS,
  };

  function createService() {
    const prisma = {
      business: {
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ city: { timezone: 'Asia/Oral' } }),
      },
      analyticsEvent: {
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn(),
      },
      analyticsDailyMetric: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      analyticsDailyDimensionMetric: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const planLimits = {
      getBusinessPlanContext: jest.fn(),
      getAnalyticsCapabilities: jest.fn(),
    } as unknown as PlanLimitsService;

    const businessAccess = createMockBusinessAccess();

    return {
      prisma,
      planLimits,
      businessAccess,
      service: new AnalyticsService(
        prisma as unknown as PrismaService,
        planLimits,
        asBusinessAccessService(businessAccess),
      ),
      builder: new AnalyticsDashboardBuilder(
        prisma as unknown as PrismaService,
        planLimits,
      ),
    };
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

  function mockViewEvents(count: number) {
    return Array.from({ length: count }, () => ({
      type: AnalyticsEventType.VIEW_BUSINESS,
      createdAt: new Date('2026-09-07T12:00:00Z'),
    }));
  }

  it('stores valid audienceDistanceBucket on VIEW_BUSINESS', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1', cityId: 'city-1' });
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await service.track({
      businessId: 'business-1',
      type: AnalyticsEventType.VIEW_BUSINESS,
      audienceDistanceBucket: AudienceDistanceBucket.KM_1_3,
    });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        businessId: 'business-1',
        type: AnalyticsEventType.VIEW_BUSINESS,
        audienceDistanceBucket: AudienceDistanceBucket.KM_1_3,
      }),
    });
  });

  it('rejects audienceDistanceBucket on non-VIEW_BUSINESS events', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1', cityId: 'city-1' });

    await expect(
      service.track({
        businessId: 'business-1',
        type: AnalyticsEventType.CALL_CLICK,
        audienceDistanceBucket: AudienceDistanceBucket.LT_1_KM,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('legacy null bucket accepted (omitted field)', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1', cityId: 'city-1' });
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await service.track({
      businessId: 'business-1',
      type: AnalyticsEventType.VIEW_BUSINESS,
      trafficSource: BusinessTrafficSource.HOME,
    });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        businessId: 'business-1',
        type: AnalyticsEventType.VIEW_BUSINESS,
        trafficSource: BusinessTrafficSource.HOME,
      }),
    });
  });

  it('create payload has no raw coordinate fields', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1', cityId: 'city-1' });
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await service.track({
      businessId: 'business-1',
      type: AnalyticsEventType.VIEW_BUSINESS,
      audienceDistanceBucket: AudienceDistanceBucket.UNKNOWN,
    });

    const payload = prisma.analyticsEvent.create.mock.calls[0][0].data;
    expect(payload).not.toHaveProperty('userLatitude');
    expect(payload).not.toHaveProperty('userLongitude');
    expect(payload).not.toHaveProperty('rawDistanceMeters');
    expect(payload).not.toHaveProperty('rawDistanceKm');
  });

  it('bucket coexists with SEARCH + searchQuery', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1', cityId: 'city-1' });
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await service.track({
      businessId: 'business-1',
      type: AnalyticsEventType.VIEW_BUSINESS,
      trafficSource: BusinessTrafficSource.SEARCH,
      searchQuery: 'кофе',
      audienceDistanceBucket: AudienceDistanceBucket.KM_3_5,
    });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        businessId: 'business-1',
        type: AnalyticsEventType.VIEW_BUSINESS,
        trafficSource: BusinessTrafficSource.SEARCH,
        searchQuery: 'кофе',
        audienceDistanceBucket: AudienceDistanceBucket.KM_3_5,
      }),
    });
  });

  it('bucket coexists with AD traffic source', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1', cityId: 'city-1' });
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await service.track({
      businessId: 'business-1',
      type: AnalyticsEventType.VIEW_BUSINESS,
      trafficSource: BusinessTrafficSource.AD,
      audienceDistanceBucket: AudienceDistanceBucket.GT_10_KM,
    });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: 'business-1',
          type: AnalyticsEventType.VIEW_BUSINESS,
          trafficSource: BusinessTrafficSource.AD,
          audienceDistanceBucket: AudienceDistanceBucket.GT_10_KM,
        }),
      }),
    );
  });

  it('FREE/BASIC/PREMIUM locked; VIP unlocked', () => {
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.FREE).audienceGeography).toBe(
      false,
    );
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.BASIC).audienceGeography).toBe(
      false,
    );
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.PREMIUM).audienceGeography).toBe(
      false,
    );
    expect(getAnalyticsCapabilitiesForPlan(BusinessPlanTier.VIP).audienceGeography).toBe(true);
  });

  it('VIP dashboard aggregates geography with 365-day cap', async () => {
    const { prisma, planLimits, builder } = createService();
    mockVipContext(planLimits);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([
      {
        metricDate: '2026-09-09',
        impressions: 0,
        views: 12,
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
    prisma.analyticsDailyDimensionMetric.findMany.mockResolvedValue([
      {
        dimensionType: 'DISTANCE_BUCKET',
        dimensionKey: AudienceDistanceBucket.KM_1_3,
        metricKey: 'views',
        count: 8,
      },
      {
        dimensionType: 'DISTANCE_BUCKET',
        dimensionKey: AudienceDistanceBucket.UNKNOWN,
        metricKey: 'views',
        count: 4,
      },
    ]);

    const dashboard = await builder.build('business-1', 365);
    expect(dashboard.effectiveRange.days).toBe(365);
    expect(dashboard.audienceGeographyStatus).toBe('AVAILABLE');
    expect(dashboard.audienceGeography).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bucket: 'KM_1_3', count: 8 }),
        expect.objectContaining({ bucket: 'UNKNOWN', count: 4, label: 'Не определено' }),
      ]),
    );
  });

  it('PREMIUM does not receive geography values', async () => {
    const { prisma, planLimits, builder } = createService();
    mockPremiumContext(planLimits);
    prisma.analyticsEvent.findMany.mockResolvedValue(mockViewEvents(20));
    prisma.analyticsEvent.groupBy.mockResolvedValue([]);

    const dashboard = await builder.build('business-1', 30);
    expect(dashboard.audienceGeography).toBeNull();
    expect(dashboard.audienceGeographyStatus).toBeNull();
  });

  it('returns INSUFFICIENT_DATA when total views below sample threshold', async () => {
    const { prisma, planLimits, builder } = createService();
    mockVipContext(planLimits);
    prisma.analyticsEvent.findMany
      .mockResolvedValueOnce(mockViewEvents(MIN_AUDIENCE_GEOGRAPHY_SAMPLE - 1))
      .mockResolvedValueOnce([]);
    prisma.analyticsEvent.groupBy.mockResolvedValue([]);

    const dashboard = await builder.build('business-1', 30);
    expect(dashboard.audienceGeographyStatus).toBe('INSUFFICIENT_DATA');
    expect(dashboard.audienceGeography).toEqual([]);
  });

  it('returns AVAILABLE when total views meet sample threshold', () => {
    const result = aggregateAudienceGeography(
      [{ bucket: AudienceDistanceBucket.LT_1_KM, count: 10 }],
      MIN_AUDIENCE_GEOGRAPHY_SAMPLE,
    );
    expect(result.status).toBe('AVAILABLE');
    expect(result.buckets[0]?.percentage).toBe(100);
  });

  it('denominator includes UNKNOWN legacy null buckets', () => {
    const result = aggregateAudienceGeography(
      [
        { bucket: AudienceDistanceBucket.KM_1_3, count: 6 },
        { bucket: null, count: 4 },
      ],
      10,
    );
    expect(result.status).toBe('AVAILABLE');
    const known = result.buckets.find((b) => b.bucket === AudienceDistanceBucket.KM_1_3);
    const unknown = result.buckets.find((b) => b.bucket === AudienceDistanceBucket.UNKNOWN);
    expect(known?.percentage).toBe(60);
    expect(unknown?.percentage).toBe(40);
  });

  it('geography dimension query scoped to owner business', async () => {
    const { prisma, planLimits, builder } = createService();
    mockVipContext(planLimits);
    prisma.analyticsDailyMetric.findMany.mockResolvedValue([
      {
        metricDate: '2026-09-09',
        impressions: 0,
        views: 12,
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

    await builder.build('business-xyz', 30);

    expect(prisma.analyticsDailyDimensionMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ businessId: 'business-xyz' }),
      }),
    );
  });

  it('blocks regular users from dashboard', async () => {
    const { prisma, service } = createService();
    prisma.business.findUnique.mockResolvedValue({ ownerId: owner.id });

    await expect(
      service.dashboard(
        {
          id: 'user-1',
          sub: 'user-1',
          phone: '+77000000003',
          role: UserRole.USER,
        },
        'business-1',
        {},
      ),
    ).rejects.toThrow();
  });
});
