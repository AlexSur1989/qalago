import { ForbiddenException } from '@nestjs/common';
import { BusinessPlanTier } from '@prisma/client';
import { PlanLimitsService, PLAN_CATALOG } from './plan-limits.service';
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
    businessMembership: { count: jest.fn().mockResolvedValue(0) },
    businessInvitation: { count: jest.fn().mockResolvedValue(0) },
  } as unknown as PrismaService;

  const notifications = {
    create: jest.fn(),
  } as unknown as import('../../modules/notifications/notifications.service').NotificationsService;

  const service = new PlanLimitsService(prisma, notifications);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults new businesses to FREE tier limits', () => {
    const limits = service.getLimits(BusinessPlanTier.FREE);
    expect(limits.maxPhotos).toBe(5);
    expect(limits.maxServiceItems).toBe(10);
    expect(limits.maxActivePromotions).toBe(1);
    expect(limits.advertisingDiscountPercent).toBe(0);
  });

  it.each([
    [BusinessPlanTier.FREE, 5, 10, 1, 0, 0, 0, 30, 'BASIC', false],
    [BusinessPlanTier.BASIC, 20, 50, 3, 1, 500, 5, 30, 'EXTENDED', true],
    [BusinessPlanTier.PREMIUM, 50, 150, 10, 3, 1500, 10, 90, 'FULL', true],
    [BusinessPlanTier.VIP, 100, 300, 25, 10, 3500, 15, 365, 'ANALYTICS_360', true],
  ])(
    '%s limits (Stage 6.4)',
    (
      tier,
      photos,
      items,
      promos,
      managers,
      adBonus,
      discount,
      analyticsDays,
      analyticsTier,
      canReply,
    ) => {
      const limits = service.getLimits(tier);
      expect(limits.maxPhotos).toBe(photos);
      expect(limits.maxServiceItems).toBe(items);
      expect(limits.maxActivePromotions).toBe(promos);
      expect(limits.maxManagers).toBe(managers);
      expect(limits.monthlyAdBonusKzt).toBe(adBonus);
      expect(limits.advertisingDiscountPercent).toBe(discount);
      expect(limits.maxAnalyticsDays).toBe(analyticsDays);
      expect(limits.analyticsTier).toBe(analyticsTier);
      expect(limits.canReplyToReviews).toBe(canReply);
      expect(limits.showPlanBadge).toBe(false);
    },
  );

  it('catalog uses public display names', () => {
    const basic = PLAN_CATALOG.find((p) => p.tier === BusinessPlanTier.BASIC);
    expect(basic?.nameRu).toBe('Бизнес');
    expect(basic?.display.publicCode).toBe('BUSINESS');
  });

  it('downgrades expired paid tier to FREE', () => {
    const tier = service.resolveEffectiveTier({
      planTier: BusinessPlanTier.PREMIUM,
      planExpiresAt: new Date('2020-01-01'),
    });
    expect(tier).toBe(BusinessPlanTier.FREE);
  });

  it('keeps active PREMIUM tier', () => {
    const tier = service.resolveEffectiveTier({
      planTier: BusinessPlanTier.PREMIUM,
      planExpiresAt: new Date('2099-01-01'),
    });
    expect(tier).toBe(BusinessPlanTier.PREMIUM);
  });

  it('caps analytics days for FREE', async () => {
    prisma.business.findUnique = jest.fn().mockResolvedValue({
      id: 'b1',
      planTier: BusinessPlanTier.FREE,
      planExpiresAt: null,
      isFeatured: false,
      featuredSlot: null,
      _count: { images: 2, serviceItems: 0, promotions: 0 },
    });

    const days = await service.capAnalyticsDays('b1', 30);
    expect(days).toBe(30);
  });

  it('downgrades expired plan in database to FREE', async () => {
    prisma.business.findUnique = jest.fn()
      .mockResolvedValueOnce({
        planTier: BusinessPlanTier.VIP,
        planExpiresAt: new Date('2020-01-01'),
        title: 'Cafe',
        ownerId: 'owner-1',
      })
      .mockResolvedValue({
        id: 'b1',
        planTier: BusinessPlanTier.FREE,
        planExpiresAt: null,
        isFeatured: false,
        featuredSlot: null,
        _count: { images: 0, serviceItems: 0, promotions: 0 },
      });
    prisma.business.update = jest.fn().mockResolvedValue({});
    prisma.promotion.findMany = jest.fn().mockResolvedValue([]);

    await service.syncExpiredPlan('b1');

    expect(prisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ planTier: BusinessPlanTier.FREE }),
      }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PLAN_EXPIRED', userId: 'owner-1' }),
    );
    expect(prisma.promotion.updateMany).not.toHaveBeenCalled();
  });

  it('rejects photo at limit', async () => {
    prisma.business.findUnique = jest.fn().mockResolvedValue({
      id: 'b1',
      planTier: BusinessPlanTier.FREE,
      planExpiresAt: null,
      isFeatured: false,
      featuredSlot: null,
      _count: { images: 5, serviceItems: 0, promotions: 0 },
    });

    await expect(service.assertCanAddPhoto('b1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows photo at limit - 1', async () => {
    prisma.business.findUnique = jest.fn().mockResolvedValue({
      id: 'b1',
      planTier: BusinessPlanTier.FREE,
      planExpiresAt: null,
      isFeatured: false,
      featuredSlot: null,
      _count: { images: 4, serviceItems: 0, promotions: 0 },
    });

    await expect(service.assertCanAddPhoto('b1')).resolves.toBeUndefined();
  });

  it('rejects service item at limit', async () => {
    prisma.business.findUnique = jest.fn().mockResolvedValue({
      id: 'b1',
      planTier: BusinessPlanTier.BASIC,
      planExpiresAt: new Date('2099-01-01'),
      isFeatured: false,
      featuredSlot: null,
      _count: { images: 0, serviceItems: 50, promotions: 0 },
    });

    await expect(service.assertCanAddServiceItem('b1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows service item at limit - 1', async () => {
    prisma.business.findUnique = jest.fn().mockResolvedValue({
      id: 'b1',
      planTier: BusinessPlanTier.BASIC,
      planExpiresAt: new Date('2099-01-01'),
      isFeatured: false,
      featuredSlot: null,
      _count: { images: 0, serviceItems: 49, promotions: 0 },
    });

    await expect(service.assertCanAddServiceItem('b1')).resolves.toBeUndefined();
  });

  it('exposes plan catalog with four tiers', () => {
    expect(PLAN_CATALOG.map((p) => p.tier)).toEqual([
      BusinessPlanTier.FREE,
      BusinessPlanTier.BASIC,
      BusinessPlanTier.PREMIUM,
      BusinessPlanTier.VIP,
    ]);
    expect(PLAN_CATALOG.find((p) => p.tier === BusinessPlanTier.BASIC)?.priceKzt).toBe(
      4900,
    );
  });

  it('rejects manager invite on FREE tier', async () => {
    prisma.business.findUnique = jest.fn().mockResolvedValue({
      id: 'b1',
      planTier: BusinessPlanTier.FREE,
      planExpiresAt: null,
      isFeatured: false,
      featuredSlot: null,
      _count: { images: 0, serviceItems: 0, promotions: 0 },
    });

    await expect(service.assertCanAddManager('b1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects manager when slots full', async () => {
    prisma.business.findUnique = jest.fn().mockResolvedValue({
      id: 'b1',
      planTier: BusinessPlanTier.BASIC,
      planExpiresAt: new Date('2099-01-01'),
      isFeatured: false,
      featuredSlot: null,
      _count: { images: 0, serviceItems: 0, promotions: 0 },
    });
    prisma.businessMembership.count = jest.fn().mockResolvedValue(1);
    prisma.businessInvitation.count = jest.fn().mockResolvedValue(0);

    await expect(service.assertCanAddManager('b1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('analytics capabilities: FREE views only, BASIC actions, PREMIUM sources', () => {
    expect(service.getAnalyticsCapabilities(BusinessPlanTier.FREE)).toMatchObject({
      maxDays: 30,
      views: true,
      actions: false,
      viewTrend: true,
    });
    expect(service.getAnalyticsCapabilities(BusinessPlanTier.BASIC).actions).toBe(true);
    expect(service.getAnalyticsCapabilities(BusinessPlanTier.PREMIUM).trafficSources).toBe(
      true,
    );
  });
});
