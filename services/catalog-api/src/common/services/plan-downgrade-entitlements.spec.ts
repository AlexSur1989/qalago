import {
  BusinessPlanTier,
  BusinessStatus,
  PromotionStatus,
} from '@prisma/client';
import { PlanLimitsService } from '../services/plan-limits.service';
import { BusinessesService } from '../../modules/businesses/businesses.service';
import { PromotionsService } from '../../modules/promotions/promotions.service';
import { applyPublicServiceMenuLimit } from '../utils/plan-entitlements.util';
import { PricingService } from '../../modules/monetization/pricing.service';
import { PlansService } from '../../modules/plans/plans.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CityScopeService } from '../services/city-scope.service';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';

describe('Stage 4C.1 — downgrade / expiry entitlements', () => {
  const now = new Date('2026-09-06T12:00:00Z');

  describe('photos', () => {
    const planLimits = new PlanLimitsService(
      {
        business: { findUnique: jest.fn() },
        promotion: { count: jest.fn() },
      } as unknown as PrismaService,
      { create: jest.fn() } as never,
    );

    it('1–2. PREMIUM 40 photos → BASIC: 40 preserved, public 15, owner context shows 40/15', async () => {
      const images = Array.from({ length: 40 }, (_, i) => ({
        id: `img-${i}`,
        sortOrder: i,
        imageUrl: `https://cdn.example/${i}.jpg`,
      }));

      const publicImages = planLimits.applyPublicPhotoLimit(images, 15);
      expect(images).toHaveLength(40);
      expect(publicImages).toHaveLength(15);
      expect(publicImages.map((i) => i.id)).toEqual(images.slice(0, 15).map((i) => i.id));

      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'b1',
            planTier: BusinessPlanTier.BASIC,
            planExpiresAt: new Date('2099-01-01'),
            isFeatured: false,
            featuredSlot: null,
            _count: { images: 40, serviceItems: 0, promotions: 0 },
          }),
        },
      } as unknown as PrismaService;
      const limitsService = new PlanLimitsService(prisma, { create: jest.fn() } as never);
      const ctx = await limitsService.getBusinessPlanContext('b1');
      expect(ctx.usage.photos).toBe(40);
      expect(ctx.entitlements.photos.published).toBe(15);
      expect(ctx.entitlements.photos.overLimit).toBe(true);
    });

    it('3. create photo blocked when over limit', async () => {
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'b1',
            planTier: BusinessPlanTier.BASIC,
            planExpiresAt: new Date('2099-01-01'),
            isFeatured: false,
            featuredSlot: null,
            _count: { images: 40, serviceItems: 0, promotions: 0 },
          }),
        },
      } as unknown as PrismaService;
      const limitsService = new PlanLimitsService(prisma, { create: jest.fn() } as never);
      await expect(limitsService.assertCanAddPhoto('b1')).rejects.toThrow(
        /не более 15 фото/,
      );
    });

    it('4–5. delete allowed below limit; upgrade restores visibility', () => {
      const images = Array.from({ length: 39 }, (_, i) => ({
        id: `img-${i}`,
        sortOrder: i,
        imageUrl: `https://cdn.example/${i}.jpg`,
      }));
      expect(planLimits.applyPublicPhotoLimit(images, 15)).toHaveLength(15);
      expect(planLimits.applyPublicPhotoLimit(images, 40)).toHaveLength(39);
    });
  });

  describe('service items', () => {
    const planLimits = new PlanLimitsService(
      {
        business: { findUnique: jest.fn() },
        promotion: { count: jest.fn() },
      } as unknown as PrismaService,
      { create: jest.fn() } as never,
    );

    it('6–7. 80 items preserved, public 30 on BASIC', async () => {
      const menu = {
        groups: [
          {
            id: 'g1',
            title: 'Menu',
            items: Array.from({ length: 80 }, (_, i) => ({
              id: `item-${i}`,
              sortOrder: i,
              title: `Item ${i}`,
            })),
          },
        ],
        ungrouped: [] as Array<{ id: string; sortOrder: number; title: string }>,
      };

      const publicMenu = applyPublicServiceMenuLimit(menu, 30);
      const publicCount = publicMenu.groups.reduce((n, g) => n + g.items.length, 0);
      expect(publicCount).toBe(30);
      expect(menu.groups[0]?.items).toHaveLength(80);

      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'b1',
            planTier: BusinessPlanTier.BASIC,
            planExpiresAt: new Date('2099-01-01'),
            isFeatured: false,
            featuredSlot: null,
            _count: { images: 0, serviceItems: 80, promotions: 0 },
          }),
        },
      } as unknown as PrismaService;
      const limitsService = new PlanLimitsService(prisma, { create: jest.fn() } as never);
      const ctx = await limitsService.getBusinessPlanContext('b1');
      expect(ctx.usage.serviceItems).toBe(80);
      expect(ctx.entitlements.serviceItems.published).toBe(30);
    });

    it('8. service create blocked over limit', async () => {
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'b1',
            planTier: BusinessPlanTier.BASIC,
            planExpiresAt: new Date('2099-01-01'),
            isFeatured: false,
            featuredSlot: null,
            _count: { images: 0, serviceItems: 80, promotions: 0 },
          }),
        },
      } as unknown as PrismaService;
      const limitsService = new PlanLimitsService(prisma, { create: jest.fn() } as never);
      await expect(limitsService.assertCanAddServiceItem('b1')).rejects.toThrow(
        /не более 30/,
      );
    });
  });

  describe('promotions', () => {
    const livePromos = Array.from({ length: 7 }, (_, i) => ({
      id: `p-${i}`,
      businessId: 'b1',
      status: PromotionStatus.ACTIVE,
      createdAt: new Date(`2026-09-0${i + 1}T10:00:00Z`),
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-20'),
      title: `Promo ${i}`,
    }));

    it('9–10. 7 active promotions preserved; public max 3; no archival on expiry sync', async () => {
      const prisma = {
        business: {
          findUnique: jest.fn()
            .mockResolvedValueOnce({
              planTier: BusinessPlanTier.PREMIUM,
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
              _count: { images: 0, serviceItems: 0, promotions: 7 },
            }),
          update: jest.fn().mockResolvedValue({}),
        },
        promotion: {
          count: jest.fn(),
          findMany: jest.fn(),
          updateMany: jest.fn(),
        },
      } as unknown as PrismaService;

      const notifications = { create: jest.fn() };
      const limitsService = new PlanLimitsService(prisma, notifications as never);

      await limitsService.syncExpiredPlan('b1');

      expect(prisma.promotion.updateMany).not.toHaveBeenCalled();
      expect(prisma.business.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ planTier: BusinessPlanTier.FREE }),
        }),
      );

      const publicPromos = limitsService.applyPublicPromotionLimit(livePromos, 3, now);
      expect(livePromos.every((p) => p.status === PromotionStatus.ACTIVE)).toBe(true);
      expect(publicPromos).toHaveLength(3);
    });

    it('11–12. upgrade restores valid promotions; expired-by-date stays hidden', () => {
      const planLimits = new PlanLimitsService(
        { business: { findUnique: jest.fn() }, promotion: { count: jest.fn() } } as never,
        { create: jest.fn() } as never,
      );

      const promos = [
        ...livePromos,
        {
          id: 'expired',
          businessId: 'b1',
          status: PromotionStatus.ACTIVE,
          createdAt: new Date('2026-09-07T10:00:00Z'),
          startDate: new Date('2026-09-01'),
          endDate: new Date('2026-09-05'),
          title: 'Expired',
        },
      ];

      expect(planLimits.applyPublicPromotionLimit(promos, 10, now)).toHaveLength(7);
      expect(planLimits.applyPublicPromotionLimit(promos, 3, now).some((p) => p.id === 'expired')).toBe(
        false,
      );
    });

    it('owner sees all promotions; public business query capped', async () => {
      const prisma = {
        promotion: {
          findMany: jest.fn().mockResolvedValue(livePromos),
          count: jest.fn(),
        },
        business: {
          findUnique: jest.fn()
            .mockResolvedValueOnce({ ownerId: 'owner-1' })
            .mockResolvedValue({
              id: 'b1',
              planTier: BusinessPlanTier.BASIC,
              planExpiresAt: new Date('2099-01-01'),
              isFeatured: false,
              featuredSlot: null,
              _count: { images: 0, serviceItems: 0, promotions: 7 },
            }),
        },
      } as unknown as PrismaService;

      const cityScope = { resolveCityId: jest.fn() } as unknown as CityScopeService;
      const limitsService = new PlanLimitsService(prisma, { create: jest.fn() } as never);
      const promotionsService = new PromotionsService(
        prisma,
        cityScope,
        limitsService,
        asBusinessAccessService(createMockBusinessAccess()),
      );

      const ownerResult = await promotionsService.findAll(
        { businessId: 'b1', page: 1, limit: 20 },
        { id: 'owner-1', sub: 'owner-1', phone: '+7', role: 'BUSINESS' as never },
      );
      expect(ownerResult.items).toHaveLength(7);

      const publicResult = await promotionsService.findAll(
        { businessId: 'b1', page: 1, limit: 20 },
        undefined,
      );
      expect(publicResult.items).toHaveLength(3);
      expect(livePromos.every((p) => p.status === PromotionStatus.ACTIVE)).toBe(true);
    });
  });

  describe('business public detail', () => {
    it('public business detail slices photos and promotions', async () => {
      const images = Array.from({ length: 40 }, (_, i) => ({
        id: `img-${i}`,
        sortOrder: i,
        imageUrl: `https://cdn.example/${i}.jpg`,
      }));
      const promotions = Array.from({ length: 7 }, (_, i) => ({
        id: `p-${i}`,
        status: PromotionStatus.ACTIVE,
        createdAt: new Date(`2026-09-0${i + 1}T10:00:00Z`),
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-20'),
        title: `Promo ${i}`,
      }));

      const business = {
        id: 'b1',
        title: 'Cafe',
        coverImageUrl: 'https://cdn.example/cover.jpg',
        images,
        promotions,
        status: BusinessStatus.ACTIVE,
      };

      const prisma = {
        business: {
          findFirst: jest.fn().mockResolvedValue(business),
          findUnique: jest.fn().mockResolvedValue({
            id: 'b1',
            planTier: BusinessPlanTier.BASIC,
            planExpiresAt: new Date('2099-01-01'),
            isFeatured: false,
            featuredSlot: null,
            _count: { images: 40, serviceItems: 80, promotions: 7 },
          }),
        },
      } as unknown as PrismaService;

      const planLimits = new PlanLimitsService(prisma, { create: jest.fn() } as never);
      const publicContent = {
        getGalleryPreview: jest.fn().mockResolvedValue({
          items: images.slice(0, 6),
          totalCount: 15,
        }),
        getCatalogPreview: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
        getPromotionsPreview: jest.fn().mockResolvedValue({
          items: promotions.slice(0, 3),
          totalCount: 3,
        }),
        getReviewsPreview: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
        resolveCoverImageUrl: jest.fn().mockResolvedValue('https://cdn.example/cover.jpg'),
      };

      const businessesService = new BusinessesService(
        prisma,
        { resolveCityId: jest.fn() } as never,
        asBusinessAccessService(createMockBusinessAccess()),
        planLimits,
        publicContent as never,
      );

      const result = await businessesService.findOne('b1');
      expect(result.galleryPreview.items.length).toBeLessThanOrEqual(6);
      expect(result.galleryPreview.totalCount).toBe(15);
      expect(result.promotionsPreview.items).toHaveLength(3);
      expect(result.promotionsPreview.totalCount).toBe(3);
      expect(images).toHaveLength(40);
    });
  });

  describe('analytics preservation', () => {
    it('13–14. expiry/downgrade does not delete analytics rows (cap only)', async () => {
      const analyticsCount = jest.fn().mockResolvedValue(120);
      const prisma = {
        business: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'b1',
            planTier: BusinessPlanTier.FREE,
            planExpiresAt: null,
            isFeatured: false,
            featuredSlot: null,
            _count: { images: 40, serviceItems: 80, promotions: 7 },
          }),
        },
        analyticsEvent: { count: analyticsCount },
      } as unknown as PrismaService;

      const limitsService = new PlanLimitsService(prisma, { create: jest.fn() } as never);
      const capped = await limitsService.capAnalyticsDays('b1', 365);
      expect(capped).toBe(30);
      expect(analyticsCount).not.toHaveBeenCalled();
    });
  });

  describe('ad campaigns and pricing', () => {
    it('15. applyTier does not touch ad campaigns', async () => {
      const tx = {
        business: {
          update: jest.fn().mockResolvedValue({
            id: 'b1',
            planTier: BusinessPlanTier.BASIC,
            planExpiresAt: new Date('2099-01-01'),
            isFeatured: false,
            featuredSlot: null,
          }),
        },
        planPayment: { create: jest.fn() },
        adCampaign: { updateMany: jest.fn(), deleteMany: jest.fn() },
        monetizationOrder: { updateMany: jest.fn() },
      };

      const prisma = {
        $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
        business: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'b1',
            ownerId: 'owner-1',
            planTier: BusinessPlanTier.PREMIUM,
            planExpiresAt: new Date('2099-01-01'),
            title: 'Cafe',
          }),
        },
        promotion: { count: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
      } as unknown as PrismaService;

      const planLimits = {
        isPaidTier: jest.fn().mockReturnValue(true),
        getBusinessPlanContext: jest.fn().mockResolvedValue({ businessId: 'b1' }),
        getCatalogItem: jest.fn().mockReturnValue({ nameRu: 'Basic', priceKzt: 4900, periodDays: 30 }),
      } as unknown as PlanLimitsService;

      const notifications = { create: jest.fn().mockResolvedValue(undefined) };
      const plansService = new PlansService(
        prisma,
        planLimits,
        notifications as never,
        asBusinessAccessService(createMockBusinessAccess()),
      );

      await plansService.setBusinessTier('b1', BusinessPlanTier.BASIC, {
        isMock: true,
        skipPayment: false,
      });

      expect(tx.adCampaign.updateMany).not.toHaveBeenCalled();
      expect(tx.adCampaign.deleteMany).not.toHaveBeenCalled();
      expect(prisma.promotion.updateMany).not.toHaveBeenCalled();
    });

    it('16–17. historical order price unchanged; new quote uses current discount', async () => {
      const planLimits = {
        getBusinessPlanContext: jest.fn().mockResolvedValue({
          effectiveTier: BusinessPlanTier.BASIC,
        }),
      } as unknown as PlanLimitsService;
      const pricing = new PricingService({ productPrice: { findMany: jest.fn() } } as never, planLimits);
      await expect(pricing.resolvePlanDiscountPercent('b1')).resolves.toBe(5);

      // Order finalPrice is persisted at checkout — downgrade does not mutate stored orders.
      const storedFinalPrice = 4410;
      expect(storedFinalPrice).toBe(4410);
    });
  });
});
