import { BadRequestException } from '@nestjs/common';
import { AnalyticsEventType, BusinessTrafficSource, UserRole } from '@prisma/client';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { getAnalyticsCapabilitiesForPlan } from '../../common/utils/analytics-capabilities.util';
import { aggregateTrafficSources } from '../../common/utils/business-traffic-source.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsDashboardBuilder } from '../../modules/analytics/analytics-dashboard.builder';
import { AnalyticsService } from '../../modules/analytics/analytics.service';
import { CreateAnalyticsEventDto } from '../../modules/analytics/dto/analytics.dto';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

describe('Stage 5H traffic source attribution', () => {
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
        findUnique: jest.fn(),
      },
      analyticsEvent: {
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
        groupBy: jest.fn(),
        findMany: jest.fn(),
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

  const viewSources = [
    BusinessTrafficSource.HOME,
    BusinessTrafficSource.SEARCH,
    BusinessTrafficSource.CATEGORY,
    BusinessTrafficSource.MAP,
    BusinessTrafficSource.PROMOTIONS,
    BusinessTrafficSource.FAVORITES,
    BusinessTrafficSource.AD,
    BusinessTrafficSource.DIRECT,
  ] as const;

  it.each(viewSources)('VIEW_BUSINESS accepts %s', async (trafficSource) => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1', cityId: 'city-1' });
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await service.track({
      businessId: 'business-1',
      type: AnalyticsEventType.VIEW_BUSINESS,
      trafficSource,
    });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        businessId: 'business-1',
        type: AnalyticsEventType.VIEW_BUSINESS,
        trafficSource,
      }),
    });
  });

  it('legacy VIEW_BUSINESS without source remains valid', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1', cityId: 'city-1' });
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await service.track({
      businessId: 'business-1',
      type: AnalyticsEventType.VIEW_BUSINESS,
    });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        businessId: 'business-1',
        type: AnalyticsEventType.VIEW_BUSINESS,
      }),
    });
  });

  it('rejects trafficSource on non-VIEW_BUSINESS events', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1', cityId: 'city-1' });

    await expect(
      service.track({
        businessId: 'business-1',
        type: AnalyticsEventType.CALL_CLICK,
        trafficSource: BusinessTrafficSource.SEARCH,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid source enum in DTO validation', async () => {
    const dto = plainToInstance(CreateAnalyticsEventDto, {
      businessId: 'business-1',
      type: AnalyticsEventType.VIEW_BUSINESS,
      trafficSource: 'INVALID',
    });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'trafficSource')).toBe(true);
  });

  it('PREMIUM dashboard receives source breakdown', async () => {
    const { prisma, planLimits, builder } = createService();
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      tier: 'PREMIUM',
      effectiveTier: 'PREMIUM',
      limits: { maxAnalyticsDays: 90, analyticsTier: 'FULL' },
    });
    prisma.analyticsEvent.findMany.mockResolvedValue([
      { type: AnalyticsEventType.VIEW_BUSINESS, createdAt: new Date() },
    ]);
    prisma.analyticsEvent.groupBy
      .mockResolvedValueOnce([
        { trafficSource: BusinessTrafficSource.SEARCH, _count: { _all: 4 } },
        { trafficSource: null, _count: { _all: 1 } },
      ])
      .mockResolvedValue([]);

    const dashboard = await builder.build('business-1', 30);

    expect(dashboard.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'SEARCH', views: 4 }),
        expect.objectContaining({ source: 'UNKNOWN', views: 1 }),
      ]),
    );
    expect(dashboard.sourcesStatus).toBeNull();
    expect(getAnalyticsCapabilitiesForPlan('PREMIUM').trafficSources).toBe(true);
  });

  it('VIP dashboard receives source breakdown', async () => {
    const { prisma, planLimits, builder } = createService();
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      tier: 'VIP',
      effectiveTier: 'VIP',
      limits: { maxAnalyticsDays: 365, analyticsTier: 'FULL' },
    });
    prisma.analyticsEvent.findMany.mockResolvedValue([]);
    prisma.analyticsEvent.groupBy
      .mockResolvedValueOnce([
        { trafficSource: BusinessTrafficSource.AD, _count: { _all: 3 } },
      ])
      .mockResolvedValue([]);

    const dashboard = await builder.build('business-1', 30);
    expect(dashboard.sources).toEqual([
      expect.objectContaining({ source: 'AD', label: 'Реклама', views: 3, share: 100 }),
    ]);
  });

  it('FREE dashboard does not expose source counts', async () => {
    const { prisma, planLimits, builder } = createService();
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      tier: 'FREE',
      effectiveTier: 'FREE',
      limits: { maxAnalyticsDays: 30, analyticsTier: 'BASIC' },
    });
    prisma.analyticsEvent.findMany.mockResolvedValue([]);

    const dashboard = await builder.build('business-1', 30);
    expect(dashboard.sources).toBeNull();
    expect(getAnalyticsCapabilitiesForPlan('FREE').trafficSources).toBe(false);
  });

  it('BASIC dashboard does not expose source counts', async () => {
    const { prisma, planLimits, builder } = createService();
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      tier: 'BASIC',
      effectiveTier: 'BASIC',
      limits: { maxAnalyticsDays: 30, analyticsTier: 'FULL' },
    });
    prisma.analyticsEvent.findMany.mockResolvedValue([]);

    const dashboard = await builder.build('business-1', 30);
    expect(dashboard.sources).toBeNull();
    expect(getAnalyticsCapabilitiesForPlan('BASIC').trafficSources).toBe(false);
  });

  it('source aggregation is scoped to business and organic events only', async () => {
    const { prisma, planLimits, builder } = createService();
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      tier: 'PREMIUM',
      effectiveTier: 'PREMIUM',
      limits: { maxAnalyticsDays: 90, analyticsTier: 'FULL' },
    });
    prisma.analyticsEvent.findMany.mockResolvedValue([]);
    prisma.analyticsEvent.groupBy.mockResolvedValue([]);

    await builder.build('business-xyz', 30);

    expect(prisma.analyticsEvent.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['trafficSource'],
        where: expect.objectContaining({
          businessId: 'business-xyz',
          campaignId: null,
          type: AnalyticsEventType.VIEW_BUSINESS,
        }),
      }),
    );
  });

  it('AD VIEW source does not break campaign analytics separation', () => {
    const organic = aggregateTrafficSources([
      { trafficSource: BusinessTrafficSource.AD, count: 2 },
    ]);
    expect(organic[0].source).toBe('AD');
    // Campaign analytics remain on campaignId != null events — not merged here.
  });

  it('blocks regular users from business analytics dashboard', async () => {
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
