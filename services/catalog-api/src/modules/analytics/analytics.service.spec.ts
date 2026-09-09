import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AnalyticsEventType, UserRole } from '@prisma/client';
import { getAnalyticsCapabilitiesForPlan } from '../../common/utils/analytics-capabilities.util';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

describe('AnalyticsService', () => {
  const owner: AuthUser = {
    id: 'owner-1',
    sub: 'owner-1',
    phone: '+77000000002',
    role: UserRole.BUSINESS,
  };

  const admin: AuthUser = {
    id: 'admin-1',
    sub: 'admin-1',
    phone: '+77000000001',
    role: UserRole.ADMIN,
  };

  const user: AuthUser = {
    id: 'user-1',
    sub: 'user-1',
    phone: '+77000000003',
    role: UserRole.USER,
  };

  function createService() {
    const prisma = {
      business: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      analyticsEvent: {
        create: jest.fn(),
        findUnique: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      analyticsDailyMetric: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        effectiveTier: 'PREMIUM',
        limits: { maxAnalyticsDays: 365, analyticsTier: 'FULL' },
      }),
      getAnalyticsCapabilities: jest.fn().mockReturnValue({
        tier: 'FULL',
        maxDays: 365,
        summary: true,
        trends: true,
      }),
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
    };
  }

  it('tracks public events for active businesses', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1', cityId: 'city-1' });
    prisma.analyticsEvent.findUnique.mockResolvedValue(null);
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await expect(
      service.track({
        businessId: 'business-1',
        type: AnalyticsEventType.CALL_CLICK,
      }),
    ).resolves.toEqual({ success: true });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        businessId: 'business-1',
        cityId: 'city-1',
        type: AnalyticsEventType.CALL_CLICK,
        isInternal: false,
      }),
    });
  });

  it('rejects events for missing or inactive businesses', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue(null);

    await expect(
      service.track({
        businessId: 'missing',
        type: AnalyticsEventType.VIEW_BUSINESS,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns stable summary counts for every event type', async () => {
    const { prisma, service } = createService();
    prisma.business.findUnique.mockResolvedValue({ ownerId: owner.id });
    prisma.analyticsEvent.groupBy.mockResolvedValue([
      { type: AnalyticsEventType.VIEW_BUSINESS, _count: { _all: 7 } },
      { type: AnalyticsEventType.CALL_CLICK, _count: { _all: 2 } },
    ]);

    const result = await service.summary(owner, 'business-1', { days: 14 });

    expect(result).toMatchObject({
      businessId: 'business-1',
      days: 14,
      analyticsTier: 'FULL',
      total: 9,
      byType: {
        [AnalyticsEventType.VIEW_BUSINESS]: 7,
        [AnalyticsEventType.CALL_CLICK]: 2,
        [AnalyticsEventType.WHATSAPP_CLICK]: 0,
      },
    });
    expect(prisma.analyticsEvent.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['type'],
        where: expect.objectContaining({
          businessId: 'business-1',
          createdAt: { gte: expect.any(Date) },
        }),
      }),
    );
  });

  it('aggregates trends by UTC date and type', async () => {
    const { prisma, service } = createService();
    prisma.business.findUnique.mockResolvedValue({
      ownerId: 'other-owner',
      city: { timezone: 'Asia/Oral' },
    });
    prisma.analyticsEvent.findMany.mockResolvedValue([
      { type: AnalyticsEventType.VIEW_BUSINESS, createdAt: new Date('2026-08-29T01:00:00.000Z') },
      { type: AnalyticsEventType.VIEW_BUSINESS, createdAt: new Date('2026-08-29T05:00:00.000Z') },
      { type: AnalyticsEventType.ROUTE_CLICK, createdAt: new Date('2026-08-30T05:00:00.000Z') },
    ]);

    await expect(service.trends(admin, 'business-1', { days: 7 })).resolves.toEqual({
      businessId: 'business-1',
      days: 7,
      analyticsTier: 'FULL',
      items: [
        { date: '2026-08-29', type: AnalyticsEventType.VIEW_BUSINESS, count: 2 },
        { date: '2026-08-30', type: AnalyticsEventType.ROUTE_CLICK, count: 1 },
      ],
    });
  });

  it('filters action counts for FREE summary', async () => {
    const { prisma, planLimits, service } = createService();
    prisma.business.findUnique.mockResolvedValue({ ownerId: owner.id });
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      effectiveTier: 'FREE',
      limits: { maxAnalyticsDays: 30, analyticsTier: 'BASIC' },
    });
    planLimits.getAnalyticsCapabilities = jest.fn().mockReturnValue(
      getAnalyticsCapabilitiesForPlan('FREE' as never),
    );
    prisma.analyticsEvent.groupBy.mockResolvedValue([
      { type: AnalyticsEventType.VIEW_BUSINESS, _count: { _all: 7 } },
      { type: AnalyticsEventType.CALL_CLICK, _count: { _all: 2 } },
    ]);

    const result = await service.summary(owner, 'business-1', { days: 30 });

    expect(result.byType[AnalyticsEventType.VIEW_BUSINESS]).toBe(7);
    expect(result.byType[AnalyticsEventType.CALL_CLICK]).toBe(0);
    expect(result.total).toBe(7);
  });

  it('allows view trends for FREE tier', async () => {
    const { prisma, planLimits, service } = createService();
    prisma.business.findUnique.mockResolvedValue({
      ownerId: owner.id,
      city: { timezone: 'Asia/Oral' },
    });
    planLimits.getBusinessPlanContext = jest.fn().mockResolvedValue({
      effectiveTier: 'FREE',
      limits: { maxAnalyticsDays: 30, analyticsTier: 'BASIC' },
    });
    planLimits.getAnalyticsCapabilities = jest.fn().mockReturnValue(
      getAnalyticsCapabilitiesForPlan('FREE' as never),
    );
    prisma.analyticsEvent.findMany.mockResolvedValue([
      { type: AnalyticsEventType.VIEW_BUSINESS, createdAt: new Date('2026-08-29T01:00:00.000Z') },
      { type: AnalyticsEventType.CALL_CLICK, createdAt: new Date('2026-08-29T05:00:00.000Z') },
    ]);

    const result = await service.trends(owner, 'business-1', { days: 7 });
    expect(result.items).toEqual([
      { date: '2026-08-29', type: AnalyticsEventType.VIEW_BUSINESS, count: 1 },
    ]);
  });

  it('blocks regular users from business analytics dashboard', async () => {
    const { service } = createService();

    await expect(service.dashboard(user, 'business-1', {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('blocks owner from another business analytics dashboard', async () => {
    const { businessAccess, service } = createService();
    businessAccess.assertCanViewBusinessAnalytics.mockRejectedValue(
      new ForbiddenException('Not allowed to manage this business'),
    );

    await expect(service.dashboard(owner, 'business-1', {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
