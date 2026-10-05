import { ForbiddenException } from '@nestjs/common';
import { MonetizationMode } from '@qalago/shared-types';
import { BusinessPlanTier } from '@prisma/client';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { getLaunchPlanLimits, mergePlanLimitsMax } from '../../common/utils/launch-plan-limits.util';
import { MonetizationModeService } from './monetization-mode.service';
import { OrderService } from '../monetization/order.service';
import { PlansService } from '../plans/plans.service';

describe('6.18L.1 Launch mode', () => {
  const launch = getLaunchPlanLimits();

  describe('mergePlanLimitsMax', () => {
    it('launch profile has no ad discount or bonus', () => {
      expect(launch.advertisingDiscountPercent).toBe(0);
      expect(launch.monthlyAdBonusKzt).toBe(0);
    });

    it('FREE + launch merge yields launch limits', () => {
      const free = {
        maxPhotos: 5,
        maxServiceItems: 10,
        maxActivePromotions: 1,
        maxPromotionDurationDays: 14,
        maxPromotionsCreatedPerDay: 1,
        maxManagers: 0,
        maxAnalyticsDays: 30,
        advertisingDiscountPercent: 0,
        monthlyAdBonusKzt: 0,
        canReplyToReviews: false,
        extendedStyling: false,
        analyticsTier: 'BASIC' as const,
        supportPriority: 'STANDARD' as const,
        moderationPriority: 'STANDARD' as const,
        showPlanBadge: false,
      };
      const merged = mergePlanLimitsMax(free, launch);
      expect(merged.maxPhotos).toBe(20);
      expect(merged.canReplyToReviews).toBe(true);
    });

    it('PREMIUM never loses capability vs launch', () => {
      const premium = {
        maxPhotos: 50,
        maxServiceItems: 150,
        maxActivePromotions: 10,
        maxPromotionDurationDays: 90,
        maxPromotionsCreatedPerDay: 5,
        maxManagers: 3,
        maxAnalyticsDays: 90,
        advertisingDiscountPercent: 10,
        monthlyAdBonusKzt: 1500,
        canReplyToReviews: true,
        extendedStyling: true,
        analyticsTier: 'FULL' as const,
        supportPriority: 'PRIORITY' as const,
        moderationPriority: 'PRIORITY' as const,
        showPlanBadge: false,
      };
      const merged = mergePlanLimitsMax(premium, launch);
      expect(merged.maxPhotos).toBe(50);
      expect(merged.advertisingDiscountPercent).toBe(10);
      expect(merged.analyticsTier).toBe('FULL');
    });
  });

  describe('MonetizationModeService', () => {
    it('resolve modes from flags', async () => {
      const prisma = {
        featureFlagDefinition: {
          findMany: jest.fn().mockResolvedValue([
            { key: 'monetizationPurchasesEnabled', globalEnabled: false },
            { key: 'freeLaunchAccessEnabled', globalEnabled: true },
          ]),
        },
      };
      const svc = new MonetizationModeService(prisma as never);
      expect(await svc.getMode()).toBe(MonetizationMode.LAUNCH);
      expect((await svc.getPublicDto()).canPurchasePlans).toBe(false);
      expect((await svc.getPublicDto()).launchAccessActive).toBe(true);
    });

    it('assertPurchasesAllowed throws MONETIZATION_DISABLED in LAUNCH', async () => {
      const prisma = {
        featureFlagDefinition: {
          findMany: jest.fn().mockResolvedValue([
            { key: 'monetizationPurchasesEnabled', globalEnabled: false },
            { key: 'freeLaunchAccessEnabled', globalEnabled: true },
          ]),
        },
      };
      const svc = new MonetizationModeService(prisma as never);
      await expect(svc.assertPurchasesAllowed()).rejects.toMatchObject({
        response: { code: 'MONETIZATION_DISABLED' },
      });
    });
  });

  describe('PlanLimitsService effective limits', () => {
    function buildPlanLimits(mode: MonetizationMode) {
      const monetizationMode = {
        getMode: jest.fn().mockResolvedValue(mode),
      };
      const prisma = {
        business: {
          findUnique: jest
            .fn()
            .mockResolvedValueOnce({
              planTier: BusinessPlanTier.FREE,
              planExpiresAt: null,
              title: 'T',
              ownerId: 'o1',
            })
            .mockResolvedValueOnce({
              id: 'b1',
              planTier: BusinessPlanTier.FREE,
              planExpiresAt: null,
              isFeatured: false,
              featuredSlot: null,
              _count: { images: 0, serviceItems: 0, promotions: 0 },
            }),
          updateMany: jest.fn(),
        },
        businessMembership: { count: jest.fn().mockResolvedValue(0) },
        businessInvitation: { count: jest.fn().mockResolvedValue(0) },
      };
      return new PlanLimitsService(
        prisma as never,
        { create: jest.fn() } as never,
        monetizationMode as never,
      );
    }

    it('FREE + NORMAL keeps FREE limits', async () => {
      const svc = buildPlanLimits(MonetizationMode.NORMAL);
      const ctx = await svc.getBusinessPlanContext('b1');
      expect(ctx.limits.maxPhotos).toBe(5);
      expect(ctx.launchAccessActive).toBe(false);
    });

    it('FREE + LAUNCH gets launch limits', async () => {
      const svc = buildPlanLimits(MonetizationMode.LAUNCH);
      const ctx = await svc.getBusinessPlanContext('b1');
      expect(ctx.limits.maxPhotos).toBe(20);
      expect(ctx.launchAccessActive).toBe(true);
    });
  });

  describe('purchase guards', () => {
    it('createPlanPurchase calls assertPurchasesAllowed before DB', async () => {
      const monetizationMode = {
        assertPurchasesAllowed: jest.fn().mockRejectedValue(new ForbiddenException({ code: 'MONETIZATION_DISABLED' })),
      };
      const service = new PlansService(
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        monetizationMode as never,
      );
      await expect(
        service.createPlanPurchase(
          { id: 'u1', role: 'BUSINESS', sub: 'u1' } as never,
          'b1',
          BusinessPlanTier.BASIC,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(monetizationMode.assertPurchasesAllowed).toHaveBeenCalled();
    });

    it('createOrder calls assertPurchasesAllowed first', async () => {
      const monetizationMode = {
        assertPurchasesAllowed: jest.fn().mockRejectedValue(new ForbiddenException({ code: 'MONETIZATION_DISABLED' })),
      };
      const service = new OrderService(
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        monetizationMode as never,
      );
      await expect(
        service.createOrder({ id: 'u1', sub: 'u1', role: 'BUSINESS' } as never, {
          businessId: 'b1',
          items: [{ productCode: 'BOOST', durationDays: 7 }],
        } as never),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
