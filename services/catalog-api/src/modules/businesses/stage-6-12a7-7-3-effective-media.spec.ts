import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  asReviewAggregationService,
  createMockReviewAggregation,
} from '../../test-utils/mock-review-aggregation';
import { attachEffectivePhysicalToDetail } from './business-effective-physical.util';
import { BusinessPublicContentService } from './business-public-content.service';
describe('Stage 6.12A.7.7.3 — effective public media', () => {
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

  function buildPublicContent(planLimits: {
    getBusinessPlanContext: jest.Mock;
    applyPublicPhotoLimit: jest.Mock;
  }) {
    return new BusinessPublicContentService(
      prisma as never,
      planLimits as never,
      asReviewAggregationService(createMockReviewAggregation()),
    );
  }

  const unlimitedPlan = {
    getBusinessPlanContext: jest.fn().mockResolvedValue({
      effectiveTier: 'VIP',
      limits: { maxPhotos: 100, maxServiceItems: 300, maxActivePromotions: 25 },
    }),
    applyPublicPhotoLimit: jest.fn((items: unknown[], limit: number) =>
      (items as unknown[]).slice(0, limit),
    ),
  };

  async function withMediaFixture(
    fn: (ctx: {
      businessId: string;
      l1Id: string;
      l2Id: string;
      otherBusinessId: string;
      otherBranchId: string;
    }) => Promise<void>,
  ) {
    if (skip) return;
    const slug = `a773-${randomBytes(5).toString('hex')}`;
    const slugOther = `a773o-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: 'A773',
        slug,
        categoryId,
        cityId,
        address: 'HQ',
        status: 'ACTIVE',
        coverImageUrl: '/uploads/SHARED-B',
        locations: {
          create: [
            { cityId, address: 'L1', isPrimary: true },
            { cityId, address: 'L2', isPrimary: false },
          ],
        },
      },
      include: { locations: true },
    });
    const l1 = business.locations.find((loc) => loc.isPrimary)!;
    const l2 = business.locations.find((loc) => !loc.isPrimary)!;

    const other = await prisma.business.create({
      data: {
        title: 'Other',
        slug: slugOther,
        categoryId,
        cityId,
        address: 'O',
        status: 'ACTIVE',
        locations: { create: { cityId, address: 'OB', isPrimary: true } },
        images: {
          create: { imageUrl: '/uploads/FOREIGN-ONLY.jpg', sortOrder: 0 },
        },
      },
      include: { locations: true, images: true },
    });

    await prisma.businessImage.createMany({
      data: [
        { businessId: business.id, imageUrl: '/uploads/SHARED-A', sortOrder: 1, locationId: null },
        { businessId: business.id, imageUrl: '/uploads/SHARED-B', sortOrder: 2, locationId: null },
        {
          businessId: business.id,
          imageUrl: '/uploads/HIDDEN-SHARED',
          sortOrder: 3,
          locationId: null,
          moderationHidden: true,
        },
        { businessId: business.id, imageUrl: '/uploads/L1-A', sortOrder: 1, locationId: l1.id },
        { businessId: business.id, imageUrl: '/uploads/L1-B', sortOrder: 2, locationId: l1.id },
        { businessId: business.id, imageUrl: '/uploads/L2-A', sortOrder: 1, locationId: l2.id },
        { businessId: business.id, imageUrl: '/uploads/L2-B', sortOrder: 2, locationId: l2.id },
        {
          businessId: business.id,
          imageUrl: '/uploads/HIDDEN-L2',
          sortOrder: 3,
          locationId: l2.id,
          moderationHidden: true,
        },
      ],
    });

    try {
      await fn({
        businessId: business.id,
        l1Id: l1.id,
        l2Id: l2.id,
        otherBusinessId: other.id,
        otherBranchId: other.locations[0]!.id,
      });
    } finally {
      await prisma.business.deleteMany({ where: { slug: { in: [slug, slugOther] } } });
    }
  }

  it('A — effectiveMedia DTO is additive on detail path', async () => {
    await withMediaFixture(async ({ businessId, l2Id }) => {
      const publicContent = buildPublicContent(unlimitedPlan);
      const effectiveMedia = await publicContent.getEffectiveMediaForDetail(
        businessId,
        l2Id,
        '/uploads/SHARED-B',
      );
      expect(effectiveMedia.activeLocationId).toBe(l2Id);
      expect(effectiveMedia.galleryPreview).toBeDefined();
      expect(effectiveMedia.coverImageUrl).toBeDefined();
    });
  });

  it('B/C/D — L1 and L2 branch+shared ordering excludes sibling branch', async () => {
    await withMediaFixture(async ({ businessId, l1Id, l2Id }) => {
      const publicContent = buildPublicContent(unlimitedPlan);
      const l1 = await publicContent.getEffectiveMediaForDetail(
        businessId,
        l1Id,
        '/uploads/SHARED-B',
      );
      expect(l1.galleryPreview.items.map((i) => i.imageUrl)).toEqual([
        '/uploads/L1-A',
        '/uploads/L1-B',
        '/uploads/SHARED-A',
        '/uploads/SHARED-B',
      ]);
      expect(l1.galleryPreview.items.some((i) => i.imageUrl.includes('L2'))).toBe(false);

      const l2 = await publicContent.getEffectiveMediaForDetail(
        businessId,
        l2Id,
        '/uploads/SHARED-B',
      );
      expect(l2.galleryPreview.items.map((i) => i.imageUrl)).toEqual([
        '/uploads/L2-A',
        '/uploads/L2-B',
        '/uploads/SHARED-A',
        '/uploads/SHARED-B',
      ]);
      expect(l2.galleryPreview.items.some((i) => i.imageUrl.includes('L1'))).toBe(false);
    });
  });

  it('E — branch-first ordering within scopes', async () => {
    await withMediaFixture(async ({ businessId, l2Id }) => {
      const publicContent = buildPublicContent(unlimitedPlan);
      const media = await publicContent.getEffectiveMediaForDetail(
        businessId,
        l2Id,
        null,
      );
      expect(media.galleryPreview.items[0]?.scope).toBe('branch');
      expect(media.galleryPreview.items[2]?.scope).toBe('brand');
    });
  });

  it('F/G — hidden branch and shared excluded from effective set', async () => {
    await withMediaFixture(async ({ businessId, l2Id }) => {
      const publicContent = buildPublicContent(unlimitedPlan);
      const media = await publicContent.getEffectiveMediaForDetail(
        businessId,
        l2Id,
        '/uploads/SHARED-B',
      );
      const urls = media.galleryPreview.items.map((i) => i.imageUrl);
      expect(urls).not.toContain('/uploads/HIDDEN-L2');
      expect(urls).not.toContain('/uploads/HIDDEN-SHARED');
    });
  });

  it('H/I — branch effective cover is first visible branch image', async () => {
    await withMediaFixture(async ({ businessId, l2Id }) => {
      const publicContent = buildPublicContent(unlimitedPlan);
      const media = await publicContent.getEffectiveMediaForDetail(
        businessId,
        l2Id,
        '/uploads/SHARED-B',
      );
      expect(media.coverImageUrl).toBe('/uploads/L2-A');
    });
  });

  it('J — brand-cover fallback when branch images hidden', async () => {
    await withMediaFixture(async ({ businessId, l2Id }) => {
      await prisma.businessImage.updateMany({
        where: { businessId, locationId: l2Id, moderationHidden: false },
        data: { moderationHidden: true },
      });
      const publicContent = buildPublicContent(unlimitedPlan);
      const media = await publicContent.getEffectiveMediaForDetail(
        businessId,
        l2Id,
        '/uploads/SHARED-B',
      );
      expect(media.coverImageUrl).toBe('/uploads/SHARED-B');
      expect(media.galleryPreview.items.every((i) => i.scope === 'brand')).toBe(true);
    });
  });

  it('K/L — invalid and foreign locationId fall back to primary (L1)', async () => {
    await withMediaFixture(async ({ businessId, l1Id, otherBranchId }) => {
      const locations = await prisma.businessLocation.findMany({ where: { businessId } });
      const physicalSeed = {
        cityId,
        address: 'x',
        latitude: null,
        longitude: null,
        phone: null,
        whatsapp: null,
        instagram: null,
        website: null,
        workHours: null,
      };
      const invalid = attachEffectivePhysicalToDetail(
        physicalSeed,
        locations,
        'not-a-real-location',
      );
      expect(invalid.activeLocationId).toBe(l1Id);

      const foreign = attachEffectivePhysicalToDetail(
        physicalSeed,
        locations,
        otherBranchId,
      );
      expect(foreign.activeLocationId).toBe(l1Id);

      const publicContent = buildPublicContent(unlimitedPlan);
      const media = await publicContent.getEffectiveMediaForDetail(
        businessId,
        foreign.activeLocationId,
        '/uploads/SHARED-B',
      );
      expect(media.galleryPreview.items.map((i) => i.imageUrl)).toEqual([
        '/uploads/L1-A',
        '/uploads/L1-B',
        '/uploads/SHARED-A',
        '/uploads/SHARED-B',
      ]);
      expect(media.galleryPreview.items.some((i) => i.imageUrl.includes('FOREIGN'))).toBe(false);
    });
  });

  it('M — plan limit applied after eligibility and moderation', async () => {
    await withMediaFixture(async ({ businessId, l2Id }) => {
      const cappedPlan = {
        getBusinessPlanContext: jest.fn().mockResolvedValue({
          effectiveTier: 'FREE',
          limits: { maxPhotos: 2, maxServiceItems: 10, maxActivePromotions: 1 },
        }),
        applyPublicPhotoLimit: jest.fn((items: unknown[], limit: number) =>
          (items as unknown[]).slice(0, limit),
        ),
      };
      const publicContent = buildPublicContent(cappedPlan);
      const media = await publicContent.getEffectiveMediaForDetail(
        businessId,
        l2Id,
        '/uploads/SHARED-B',
      );
      expect(media.galleryPreview.totalCount).toBe(2);
      expect(media.galleryPreview.items).toHaveLength(2);
      expect(cappedPlan.applyPublicPhotoLimit).toHaveBeenCalled();
    });
  });

  it('N — /photos?locationId=L2 matches effective resolution', async () => {
    await withMediaFixture(async ({ businessId, l2Id }) => {
      const publicContent = buildPublicContent(unlimitedPlan);
      const page = await publicContent.findPublicPhotos(businessId, {
        locationId: l2Id,
        page: 1,
        limit: 20,
      });
      expect(page.items.map((i) => i.imageUrl)).toEqual([
        '/uploads/L2-A',
        '/uploads/L2-B',
        '/uploads/SHARED-A',
        '/uploads/SHARED-B',
      ]);
      expect(page.items.every((i) => 'scope' in i && 'locationId' in i)).toBe(true);
    });
  });

  it('O/P — legacy /photos and galleryPreview remain business-wide compatible', async () => {
    await withMediaFixture(async ({ businessId, l2Id }) => {
      const publicContent = buildPublicContent(unlimitedPlan);
      const legacyPhotos = await publicContent.findPublicPhotos(businessId, {
        page: 1,
        limit: 50,
      });
      expect(legacyPhotos.totalCount).toBe(6);
      expect(legacyPhotos.items.some((i) => i.imageUrl === '/uploads/L1-A')).toBe(true);
      expect(legacyPhotos.items.some((i) => i.imageUrl === '/uploads/L2-A')).toBe(true);

      const legacyPreview = await publicContent.getGalleryPreview(businessId);
      expect(legacyPreview.totalCount).toBe(6);

      const effective = await publicContent.getEffectiveMediaForDetail(
        businessId,
        l2Id,
        '/uploads/SHARED-B',
      );
      expect(effective.galleryPreview.totalCount).toBe(4);
    });
  });
});
