import { BadRequestException } from '@nestjs/common';
import {
  AnalyticsEventType,
  BusinessTrafficSource,
  UserRole,
} from '@prisma/client';
import { getAnalyticsCapabilitiesForPlan } from '../../common/utils/analytics-capabilities.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsDashboardBuilder } from './analytics-dashboard.builder';
import { AnalyticsService } from './analytics.service';

describe('Stage 5I search query analytics', () => {
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
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const planLimits = {
      getBusinessPlanContext: jest.fn(),
      getAnalyticsCapabilities: jest.fn(),
    } as unknown as PlanLimitsService;

    return {
      prisma,
      planLimits,
      service: new AnalyticsService(
        prisma as unknown as PrismaService,
        planLimits,
      ),
      builder: new AnalyticsDashboardBuilder(
        prisma as unknown as PrismaService,
        planLimits,
      ),
    };
  }

  it('SEARCH view stores normalized searchQuery', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1' });
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await service.track({
      businessId: 'business-1',
      type: AnalyticsEventType.VIEW_BUSINESS,
      trafficSource: BusinessTrafficSource.SEARCH,
      searchQuery: '  Кофе   рядом ',
    });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: {
        businessId: 'business-1',
        type: AnalyticsEventType.VIEW_BUSINESS,
        trafficSource: BusinessTrafficSource.SEARCH,
        searchQuery: 'кофе рядом',
      },
    });
  });

  it('HOME + searchQuery does not store searchQuery', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1' });
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await service.track({
      businessId: 'business-1',
      type: AnalyticsEventType.VIEW_BUSINESS,
      trafficSource: BusinessTrafficSource.HOME,
      searchQuery: 'кофе',
    });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: {
        businessId: 'business-1',
        type: AnalyticsEventType.VIEW_BUSINESS,
        trafficSource: BusinessTrafficSource.HOME,
      },
    });
  });

  it('AD + searchQuery does not store searchQuery', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1' });
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await service.track({
      businessId: 'business-1',
      type: AnalyticsEventType.VIEW_BUSINESS,
      trafficSource: BusinessTrafficSource.AD,
      searchQuery: 'кофе',
    });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: {
        businessId: 'business-1',
        type: AnalyticsEventType.VIEW_BUSINESS,
        trafficSource: BusinessTrafficSource.AD,
      },
    });
  });

  it('rejects searchQuery on non-VIEW_BUSINESS events', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1' });

    await expect(
      service.track({
        businessId: 'business-1',
        type: AnalyticsEventType.CALL_CLICK,
        searchQuery: 'кофе',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('PREMIUM receives search query analytics', async () => {
    const { prisma, planLimits, builder } = createService();
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      tier: 'PREMIUM',
      effectiveTier: 'PREMIUM',
      limits: { maxAnalyticsDays: 90, analyticsTier: 'FULL' },
    });
    prisma.analyticsEvent.findMany.mockResolvedValue([]);
    prisma.analyticsEvent.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { searchQuery: 'кофе рядом', _count: { _all: 5 } },
        { searchQuery: 'кофейня', _count: { _all: 4 } },
      ]);

    const dashboard = await builder.build('business-1', 30);

    expect(dashboard.searchQueries).toEqual([
      expect.objectContaining({ query: 'кофе рядом', count: 5 }),
      expect.objectContaining({ query: 'кофейня', count: 4 }),
    ]);
    expect(dashboard.searchQueriesStatus).toBe('AVAILABLE');
    expect(getAnalyticsCapabilitiesForPlan('PREMIUM').searchQueries).toBe(true);
  });

  it('VIP receives search query analytics within 365-day window cap', async () => {
    const { prisma, planLimits, builder } = createService();
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      tier: 'VIP',
      effectiveTier: 'VIP',
      limits: { maxAnalyticsDays: 365, analyticsTier: 'FULL' },
    });
    prisma.analyticsEvent.findMany.mockResolvedValue([]);
    prisma.analyticsEvent.groupBy.mockResolvedValue([]);

    const dashboard = await builder.build('business-1', 365);
    expect(dashboard.effectiveRange.days).toBe(365);
    expect(getAnalyticsCapabilitiesForPlan('VIP').searchQueries).toBe(true);
  });

  it('FREE does not receive search query values', async () => {
    const { prisma, planLimits, builder } = createService();
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      tier: 'FREE',
      effectiveTier: 'FREE',
      limits: { maxAnalyticsDays: 30, analyticsTier: 'BASIC' },
    });
    prisma.analyticsEvent.findMany.mockResolvedValue([]);

    const dashboard = await builder.build('business-1', 30);
    expect(dashboard.searchQueries).toBeNull();
    expect(getAnalyticsCapabilitiesForPlan('FREE').searchQueries).toBe(false);
  });

  it('BASIC does not receive search query values', async () => {
    const { prisma, planLimits, builder } = createService();
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      tier: 'BASIC',
      effectiveTier: 'BASIC',
      limits: { maxAnalyticsDays: 30, analyticsTier: 'FULL' },
    });
    prisma.analyticsEvent.findMany.mockResolvedValue([]);

    const dashboard = await builder.build('business-1', 30);
    expect(dashboard.searchQueries).toBeNull();
  });

  it('search query aggregation scoped to owner business', async () => {
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
        by: ['searchQuery'],
        where: expect.objectContaining({
          businessId: 'business-xyz',
          trafficSource: BusinessTrafficSource.SEARCH,
        }),
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
