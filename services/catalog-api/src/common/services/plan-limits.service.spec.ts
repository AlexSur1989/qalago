import { BusinessPlanTier } from '@prisma/client';
import { PlanLimitsService } from './plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PlanLimitsService', () => {
  const prisma = {
    business: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    promotion: {
      count: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const notifications = {
    create: jest.fn(),
  } as unknown as import('../../modules/notifications/notifications.service').NotificationsService;

  const service = new PlanLimitsService(prisma, notifications);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('downgrades expired paid tier to BASIC', () => {
    const tier = service.resolveEffectiveTier({
      planTier: BusinessPlanTier.PRO,
      planExpiresAt: new Date('2020-01-01'),
    });
    expect(tier).toBe(BusinessPlanTier.BASIC);
  });

  it('keeps active PRO tier', () => {
    const tier = service.resolveEffectiveTier({
      planTier: BusinessPlanTier.PRO,
      planExpiresAt: new Date('2099-01-01'),
    });
    expect(tier).toBe(BusinessPlanTier.PRO);
  });

  it('caps analytics days for BASIC', async () => {
    prisma.business.findUnique = jest.fn().mockResolvedValue({
      id: 'b1',
      planTier: BusinessPlanTier.BASIC,
      planExpiresAt: null,
      isFeatured: false,
      featuredSlot: null,
      _count: { images: 2, promotions: 0 },
    });

    const days = await service.capAnalyticsDays('b1', 30);
    expect(days).toBe(7);
  });

  it('downgrades expired plan in database', async () => {
    prisma.business.findUnique = jest.fn()
      .mockResolvedValueOnce({
        planTier: BusinessPlanTier.PRO,
        planExpiresAt: new Date('2020-01-01'),
        title: 'Cafe',
        ownerId: 'owner-1',
      })
      .mockResolvedValue({
        id: 'b1',
        planTier: BusinessPlanTier.BASIC,
        planExpiresAt: null,
        isFeatured: false,
        featuredSlot: null,
        _count: { images: 0, promotions: 0 },
      });
    prisma.business.update = jest.fn().mockResolvedValue({});
    prisma.promotion.findMany = jest.fn().mockResolvedValue([]);

    await service.syncExpiredPlan('b1');

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PLAN_EXPIRED', userId: 'owner-1' }),
    );
  });
});
