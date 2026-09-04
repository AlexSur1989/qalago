import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AnalyticsEventType, UserRole } from '@prisma/client';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

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
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const planLimits = {
      capAnalyticsDays: jest.fn((_businessId: string, days: number) => Promise.resolve(days)),
    } as unknown as PlanLimitsService;

    return {
      prisma,
      planLimits,
      service: new AnalyticsService(
        prisma as unknown as PrismaService,
        planLimits,
      ),
    };
  }

  it('tracks public events for active businesses', async () => {
    const { prisma, service } = createService();
    prisma.business.findFirst.mockResolvedValue({ id: 'business-1' });
    prisma.analyticsEvent.create.mockResolvedValue({ id: 'event-1' });

    await expect(
      service.track({
        businessId: 'business-1',
        type: AnalyticsEventType.CALL_CLICK,
      }),
    ).resolves.toEqual({ success: true });

    expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: {
        businessId: 'business-1',
        type: AnalyticsEventType.CALL_CLICK,
      },
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
    prisma.business.findUnique.mockResolvedValue({ ownerId: 'other-owner' });
    prisma.analyticsEvent.findMany.mockResolvedValue([
      { type: AnalyticsEventType.VIEW_BUSINESS, createdAt: new Date('2026-08-29T01:00:00.000Z') },
      { type: AnalyticsEventType.VIEW_BUSINESS, createdAt: new Date('2026-08-29T05:00:00.000Z') },
      { type: AnalyticsEventType.ROUTE_CLICK, createdAt: new Date('2026-08-30T05:00:00.000Z') },
    ]);

    await expect(service.trends(admin, 'business-1', { days: 7 })).resolves.toEqual({
      businessId: 'business-1',
      days: 7,
      items: [
        { date: '2026-08-29', type: AnalyticsEventType.VIEW_BUSINESS, count: 2 },
        { date: '2026-08-30', type: AnalyticsEventType.ROUTE_CLICK, count: 1 },
      ],
    });
  });

  it('blocks regular users from business analytics', async () => {
    const { prisma, service } = createService();
    prisma.business.findUnique.mockResolvedValue({ ownerId: owner.id });

    await expect(service.summary(user, 'business-1', {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
