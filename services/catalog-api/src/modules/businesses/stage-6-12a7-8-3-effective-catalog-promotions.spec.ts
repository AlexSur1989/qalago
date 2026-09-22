import { randomBytes } from 'crypto';
import { BusinessPlanTier, PrismaClient } from '@prisma/client';
import {
  asReviewAggregationService,
  createMockReviewAggregation,
} from '../../test-utils/mock-review-aggregation';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { attachEffectivePhysicalToDetail } from './business-effective-physical.util';
import { BusinessPublicContentService } from './business-public-content.service';

describe('Stage 6.12A.7.8.3 — effective catalog / promotions', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let cityId = '';
  let categoryId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      if (!city || !category) skip = true;
      else {
        cityId = city.id;
        categoryId = category.id;
      }
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function buildPublicContent(planOverrides?: Partial<{ maxServiceItems: number; maxActivePromotions: number }>) {
    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        effectiveTier: BusinessPlanTier.VIP,
        limits: {
          maxPhotos: 100,
          maxServiceItems: planOverrides?.maxServiceItems ?? 300,
          maxActivePromotions: planOverrides?.maxActivePromotions ?? 25,
        },
      }),
      applyPublicPhotoLimit: jest.fn((items: unknown[], limit: number) =>
        (items as unknown[]).slice(0, limit),
      ),
      applyPublicPromotionLimit: jest.fn((items: unknown[], limit: number) =>
        (items as unknown[]).slice(0, limit),
      ),
    } as unknown as PlanLimitsService;

    return new BusinessPublicContentService(
      prisma as never,
      planLimits,
      asReviewAggregationService(createMockReviewAggregation()),
    );
  }

  async function seedCatalogMatrix(slug: string) {
    const business = await prisma.business.create({
      data: {
        title: 'A783 catalog',
        slug,
        categoryId,
        cityId,
        address: 'HQ',
        status: 'ACTIVE',
        locations: {
          create: [
            { cityId, address: 'L1', isPrimary: true },
            { cityId, address: 'L2', isPrimary: false },
            { cityId, address: 'L3', isPrimary: false },
          ],
        },
        serviceMenuGroups: {
          create: [
            { title: 'Menu A', sortOrder: 1, isActive: true },
            { title: 'Empty section', sortOrder: 2, isActive: true },
          ],
        },
      },
      include: { locations: true, serviceMenuGroups: true },
    });
    const l1 = business.locations.find((l) => l.address === 'L1')!;
    const l2 = business.locations.find((l) => l.address === 'L2')!;
    const l3 = business.locations.find((l) => l.address === 'L3')!;
    const groupA = business.serviceMenuGroups.find((g) => g.title === 'Menu A')!;

    const shared = await prisma.serviceItem.create({
      data: { businessId: business.id, title: 'SHARED', sortOrder: 1, groupId: groupA.id },
    });
    const l1Only = await prisma.serviceItem.create({
      data: { businessId: business.id, title: 'L1_ONLY', sortOrder: 2 },
    });
    const l2Only = await prisma.serviceItem.create({
      data: { businessId: business.id, title: 'L2_ONLY', sortOrder: 3 },
    });
    const l1L3 = await prisma.serviceItem.create({
      data: { businessId: business.id, title: 'L1_L3', sortOrder: 4, groupId: groupA.id },
    });
    const inactive = await prisma.serviceItem.create({
      data: { businessId: business.id, title: 'INACTIVE', sortOrder: 5, isActive: false },
    });
    const inactiveGroupItem = await prisma.serviceItem.create({
      data: {
        businessId: business.id,
        title: 'INACTIVE_GROUP',
        sortOrder: 6,
        groupId: (
          await prisma.serviceMenuGroup.create({
            data: { businessId: business.id, title: 'Off', sortOrder: 9, isActive: false },
          })
        ).id,
      },
    });

    await prisma.serviceItemBranchAvailability.createMany({
      data: [
        { businessId: business.id, serviceItemId: l1Only.id, locationId: l1.id },
        { businessId: business.id, serviceItemId: l2Only.id, locationId: l2.id },
        { businessId: business.id, serviceItemId: l1L3.id, locationId: l1.id },
        { businessId: business.id, serviceItemId: l1L3.id, locationId: l3.id },
      ],
    });

    const promoShared = await prisma.promotion.create({
      data: { businessId: business.id, title: 'P_SHARED', status: 'ACTIVE' },
    });
    const promoL1 = await prisma.promotion.create({
      data: { businessId: business.id, title: 'P_L1', status: 'ACTIVE' },
    });
    const promoL2 = await prisma.promotion.create({
      data: { businessId: business.id, title: 'P_L2', status: 'ACTIVE' },
    });
    const promoL1L3 = await prisma.promotion.create({
      data: { businessId: business.id, title: 'P_L1_L3', status: 'ACTIVE' },
    });
    const promoHidden = await prisma.promotion.create({
      data: {
        businessId: business.id,
        title: 'P_HIDDEN',
        status: 'ACTIVE',
        moderationHidden: true,
      },
    });

    await prisma.promotionBranchAvailability.createMany({
      data: [
        { businessId: business.id, promotionId: promoL1.id, locationId: l1.id },
        { businessId: business.id, promotionId: promoL2.id, locationId: l2.id },
        { businessId: business.id, promotionId: promoL1L3.id, locationId: l1.id },
        { businessId: business.id, promotionId: promoL1L3.id, locationId: l3.id },
      ],
    });

    return { business, l1, l2, l3, titles: { shared, l1Only, l2Only, l1L3, inactive, inactiveGroupItem, promoShared, promoL1, promoL2, promoL1L3, promoHidden } };
  }

  function titlesOf(items: Array<{ title: string }>) {
    return items.map((i) => i.title).sort();
  }

  it('catalog matrix L1 / L2 / L3 via effectiveCatalog', async () => {
    if (skip) return;
    const slug = `a783-${randomBytes(5).toString('hex')}`;
    const { business, l1, l2, l3 } = await seedCatalogMatrix(slug);
    const service = buildPublicContent();
    try {
      const atL1 = await service.getEffectiveCatalogForDetail(business.id, l1.id);
      expect(titlesOf(atL1.items)).toEqual(['L1_L3', 'L1_ONLY', 'SHARED']);
      expect(atL1.sections.map((s) => s.title)).toEqual(['Menu A']);

      const atL2 = await service.getEffectiveCatalogForDetail(business.id, l2.id);
      expect(titlesOf(atL2.items)).toEqual(['L2_ONLY', 'SHARED']);

      const atL3 = await service.getEffectiveCatalogForDetail(business.id, l3.id);
      expect(titlesOf(atL3.items)).toEqual(['L1_L3', 'SHARED']);
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  });

  it('promotions matrix L1 / L2 / L3 via effectivePromotions', async () => {
    if (skip) return;
    const slug = `a783p-${randomBytes(5).toString('hex')}`;
    const { business, l1, l2, l3 } = await seedCatalogMatrix(slug);
    const service = buildPublicContent();
    try {
      expect(
        titlesOf((await service.getEffectivePromotionsForDetail(business.id, l1.id)).items),
      ).toEqual(['P_L1', 'P_L1_L3', 'P_SHARED']);
      expect(
        titlesOf((await service.getEffectivePromotionsForDetail(business.id, l2.id)).items),
      ).toEqual(['P_L2', 'P_SHARED']);
      expect(
        titlesOf((await service.getEffectivePromotionsForDetail(business.id, l3.id)).items),
      ).toEqual(['P_L1_L3', 'P_SHARED']);
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  });

  it('legacy catalogPreview / promotionsPreview remain business-wide', async () => {
    if (skip) return;
    const slug = `a783leg-${randomBytes(5).toString('hex')}`;
    const { business } = await seedCatalogMatrix(slug);
    const service = buildPublicContent();
    try {
      const catalogPreview = await service.getCatalogPreview(business.id);
      expect(catalogPreview.totalCount).toBe(4);
      const promotionsPreview = await service.getPromotionsPreview(business.id);
      expect(promotionsPreview.totalCount).toBe(5);
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  });

  it('/catalog without locationId stays business-wide; with locationId is branch-effective', async () => {
    if (skip) return;
    const slug = `a783cat-${randomBytes(5).toString('hex')}`;
    const { business, l2 } = await seedCatalogMatrix(slug);
    const service = buildPublicContent();
    try {
      const legacy = await service.findPublicCatalog(business.id, { page: 1, limit: 50 });
      expect(legacy).not.toHaveProperty('activeLocationId');
      expect(legacy.pagination.total).toBe(4);

      const scoped = await service.findPublicCatalog(business.id, {
        page: 1,
        limit: 50,
        locationId: l2.id,
      });
      expect(scoped.activeLocationId).toBe(l2.id);
      expect(scoped.items.map((i) => i.title).sort()).toEqual(['L2_ONLY', 'SHARED']);
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  });

  it('detail effective* activeLocationId aligns with effectivePhysical', async () => {
    if (skip) return;
    const slug = `a783align-${randomBytes(5).toString('hex')}`;
    const { business, l1, l2, l3 } = await seedCatalogMatrix(slug);
    const otherSlug = `a783o-${randomBytes(5).toString('hex')}`;
    const other = await prisma.business.create({
      data: {
        title: 'Other',
        slug: otherSlug,
        categoryId,
        cityId,
        address: 'O',
        status: 'ACTIVE',
        locations: { create: { cityId, address: 'OB', isPrimary: true } },
      },
      include: { locations: true },
    });
    const service = buildPublicContent();
    try {
      const locations = await prisma.businessLocation.findMany({
        where: { businessId: business.id },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      });
      const withPhysical = attachEffectivePhysicalToDetail(business, locations, l2.id);
      const [effectiveCatalog, effectivePromotions] = await Promise.all([
        service.getEffectiveCatalogForDetail(business.id, withPhysical.activeLocationId),
        service.getEffectivePromotionsForDetail(business.id, withPhysical.activeLocationId),
      ]);
      expect(withPhysical.activeLocationId).toBe(l2.id);
      expect(effectiveCatalog.activeLocationId).toBe(l2.id);
      expect(effectivePromotions.activeLocationId).toBe(l2.id);

      const foreignPhysical = attachEffectivePhysicalToDetail(
        business,
        locations,
        other.locations[0]!.id,
      );
      expect(foreignPhysical.activeLocationId).toBe(l1.id);
      const foreignCatalog = await service.getEffectiveCatalogForDetail(
        business.id,
        foreignPhysical.activeLocationId,
      );
      expect(foreignCatalog.activeLocationId).toBe(l1.id);
      expect(titlesOf(foreignCatalog.items)).toEqual(['L1_L3', 'L1_ONLY', 'SHARED']);

      const invalidPhysical = attachEffectivePhysicalToDetail(business, locations, 'not-a-location');
      expect(invalidPhysical.activeLocationId).toBe(l1.id);
    } finally {
      await prisma.business.deleteMany({ where: { slug: { in: [slug, otherSlug] } } });
    }
  });

  it('branch filter before plan cap on /catalog?locationId=', async () => {
    if (skip) return;
    const slug = `a783cap-${randomBytes(5).toString('hex')}`;
    const { business, l1, l2 } = await seedCatalogMatrix(slug);
    const service = buildPublicContent({ maxServiceItems: 2 });
    try {
      const scoped = await service.findPublicCatalog(business.id, {
        locationId: l2.id,
        page: 1,
        limit: 10,
      });
      expect(scoped.items.map((i) => i.title).sort()).toEqual(['L2_ONLY', 'SHARED']);
      expect(scoped.pagination.publishedTotal).toBe(2);
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  });
});
