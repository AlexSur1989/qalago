import { randomBytes } from 'crypto';
import {
  AdCampaignStatus,
  MonetizationProductType,
  Prisma,
  PrismaClient,
  PromotionStatus,
} from '@prisma/client';
import {
  POSTGIS_TEST_ROLLBACK,
  withPostgisIntegrationTransaction,
} from '../businesses/postgis-integration-test.util';
import { AdRotationService } from './ad-rotation.service';
import { AdServingService } from './ad-serving.service';
import { batchResolveAdServeLocationContexts } from './utils/ad-serving-location.util';

describe('Stage 6.12A.8.3 — branch-aware ad serving', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let cityUralskId = '';
  let cityAktobeId = '';
  let categoryId = '';
  let productFeaturedId = '';
  let productPromotedId = '';
  let placementFeaturedId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' } });
      const aktobe = await prisma.city.findFirst({ where: { slug: 'aktobe' } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const productFeatured = await prisma.monetizationProduct.findFirst({
        where: { type: 'FEATURED_BUSINESS', isActive: true },
      });
      const productPromoted = await prisma.monetizationProduct.findFirst({
        where: { type: 'PROMOTED_PROMOTION', isActive: true },
      });
      const placement = await prisma.adPlacement.findFirst({
        where: { code: 'HOME_FEATURED', isActive: true },
      });
      if (!uralsk || !aktobe || !category || !productFeatured || !productPromoted || !placement) {
        skip = true;
        return;
      }
      cityUralskId = uralsk.id;
      cityAktobeId = aktobe.id;
      categoryId = category.id;
      productFeaturedId = productFeatured.id;
      productPromotedId = productPromoted.id;
      placementFeaturedId = placement.id;
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function withMultiBranchBusiness<T>(
    fn: (ctx: {
      tx: Prisma.TransactionClient;
      businessId: string;
      l1: string;
      l2: string;
      l3: string;
      aktobeBranchId: string;
    }) => Promise<T>,
  ): Promise<T | undefined> {
    if (skip) return undefined;
    const slug = `a83-${randomBytes(5).toString('hex')}`;
    try {
      return await withPostgisIntegrationTransaction(prisma, async (tx) => {
        const business = await tx.business.create({
          data: {
            title: 'A.8.3 multi',
            slug,
            categoryId,
        phone: 'legacy-phone',
            status: 'ACTIVE',
            locations: {
              create: [
                {
                  cityId: cityUralskId,
                  address: 'Uralsk L1 primary',
                  isPrimary: true,
                  phone: 'l1-phone',
                },
                {
                  cityId: cityUralskId,
                  address: 'Uralsk L2',
                  isPrimary: false,
                },
                {
                  cityId: cityAktobeId,
                  address: 'Aktobe branch',
                  isPrimary: false,
                },
              ],
            },
          },
          include: { locations: true },
        });
        const uralskLocs = business.locations
          .filter((l) => l.cityId === cityUralskId)
          .sort(
            (a, b) =>
              Number(b.isPrimary) - Number(a.isPrimary) ||
              a.createdAt.getTime() - b.createdAt.getTime() ||
              a.id.localeCompare(b.id),
          );
        const aktobe = business.locations.find((l) => l.cityId === cityAktobeId)!;
        const result = await fn({
          tx,
          businessId: business.id,
          l1: uralskLocs[0]!.id,
          l2: uralskLocs[1]!.id,
          l3: uralskLocs[1]!.id,
          aktobeBranchId: aktobe.id,
        });
        throw new Error(POSTGIS_TEST_ROLLBACK);
      });
    } catch (e) {
      if (e instanceof Error && e.message === POSTGIS_TEST_ROLLBACK) {
        return undefined;
      }
      throw e;
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  }

  function campaignInput(
    id: string,
    businessId: string,
    data: Partial<{
      targetBusinessLocationId: string | null;
      destinationBusinessLocationId: string | null;
      promotionId: string | null;
      productType: MonetizationProductType;
      orderItemPromotionId: string | null;
    }>,
  ) {
    return {
      id,
      businessId,
      cityId: cityUralskId,
      targetBusinessLocationId: data.targetBusinessLocationId ?? null,
      destinationBusinessLocationId: data.destinationBusinessLocationId ?? null,
      promotionId: data.promotionId ?? null,
      productType: data.productType ?? MonetizationProductType.FEATURED_BUSINESS,
      orderItemPromotionId: data.orderItemPromotionId ?? null,
    };
  }

  it('1 legacy null/null resolves city context branch in serving city', async () => {
    await withMultiBranchBusiness(async ({ tx, businessId, l1 }) => {
      const map = await batchResolveAdServeLocationContexts(tx, cityUralskId, [
        campaignInput('c-legacy', businessId, {}),
      ]);
      const ctx = map.get('c-legacy');
      expect(ctx).toMatchObject({
        excluded: false,
        destinationLocationId: l1,
        contextLocationId: l1,
      });
    });
  });

  it('2 targeted L1 eligible in L1 city', async () => {
    await withMultiBranchBusiness(async ({ tx, businessId, l1 }) => {
      const map = await batchResolveAdServeLocationContexts(tx, cityUralskId, [
        campaignInput('c-t', businessId, { targetBusinessLocationId: l1 }),
      ]);
      expect(map.get('c-t')).toMatchObject({
        excluded: false,
        destinationLocationId: l1,
      });
    });
  });

  it('3 targeted Uralsk branch excluded when serve city is Aktobe', async () => {
    await withMultiBranchBusiness(async ({ tx, businessId, l1 }) => {
      const map = await batchResolveAdServeLocationContexts(tx, cityAktobeId, [
        campaignInput('c-wrong-city', businessId, { targetBusinessLocationId: l1 }),
      ]);
      expect(map.get('c-wrong-city')).toEqual({ excluded: true });
    });
  });

  it('6 brand-level never picks sibling branch in another city', async () => {
    await withMultiBranchBusiness(async ({ tx, businessId, l1, aktobeBranchId }) => {
      const map = await batchResolveAdServeLocationContexts(tx, cityUralskId, [
        campaignInput('c-brand', businessId, {}),
      ]);
      const ctx = map.get('c-brand')!;
      expect(ctx).toMatchObject({ excluded: false });
      if (!ctx.excluded) {
        expect(ctx.destinationLocationId).toBe(l1);
        expect(ctx.destinationLocationId).not.toBe(aktobeBranchId);
      }
    });
  });

  it('8 business card overlay uses resolved branch address', async () => {
    await withMultiBranchBusiness(async ({ tx, businessId, l1 }) => {
      const map = await batchResolveAdServeLocationContexts(tx, cityUralskId, [
        campaignInput('c-card', businessId, { destinationBusinessLocationId: l1 }),
      ]);
      const ctx = map.get('c-card')!;
      expect(ctx.excluded).toBe(false);
      if (!ctx.excluded) {
        expect(ctx.cardLocation?.address).toBe('Uralsk L1 primary');
        expect(ctx.cardLocation?.phone).toBe('l1-phone');
      }
    });
  });

  it('13 P_ALL resolves valid city branch', async () => {
    await withMultiBranchBusiness(async ({ tx, businessId, l1 }) => {
      const promo = await tx.promotion.create({
        data: { businessId, title: 'All branches', status: PromotionStatus.ACTIVE },
      });
      const map = await batchResolveAdServeLocationContexts(tx, cityUralskId, [
        campaignInput('c-pall', businessId, {
          productType: MonetizationProductType.PROMOTED_PROMOTION,
          promotionId: promo.id,
        }),
      ]);
      expect(map.get('c-pall')).toMatchObject({
        excluded: false,
        destinationLocationId: l1,
      });
    });
  });

  it('15 P_L1 + destination L2 excluded at serve', async () => {
    await withMultiBranchBusiness(async ({ tx, businessId, l1, l2 }) => {
      const promo = await tx.promotion.create({
        data: { businessId, title: 'L1 only', status: PromotionStatus.ACTIVE },
      });
      await tx.promotionBranchAvailability.create({
        data: { businessId, promotionId: promo.id, locationId: l1 },
      });
      const map = await batchResolveAdServeLocationContexts(tx, cityUralskId, [
        campaignInput('c-bad-dest', businessId, {
          productType: MonetizationProductType.PROMOTED_PROMOTION,
          promotionId: promo.id,
          destinationBusinessLocationId: l2,
        }),
      ]);
      expect(map.get('c-bad-dest')).toEqual({ excluded: true });
    });
  });

  it('16 P_L1 null destination resolves L1', async () => {
    await withMultiBranchBusiness(async ({ tx, businessId, l1 }) => {
      const promo = await tx.promotion.create({
        data: { businessId, title: 'L1 only', status: PromotionStatus.ACTIVE },
      });
      await tx.promotionBranchAvailability.create({
        data: { businessId, promotionId: promo.id, locationId: l1 },
      });
      const map = await batchResolveAdServeLocationContexts(tx, cityUralskId, [
        campaignInput('c-pl1', businessId, {
          productType: MonetizationProductType.PROMOTED_PROMOTION,
          promotionId: promo.id,
        }),
      ]);
      expect(map.get('c-pl1')).toMatchObject({
        excluded: false,
        destinationLocationId: l1,
      });
    });
  });

  it('19 PBA changed after campaign — destination no longer effective excludes', async () => {
    await withMultiBranchBusiness(async ({ tx, businessId, l1, l2 }) => {
      const promo = await tx.promotion.create({
        data: { businessId, title: 'Was L2', status: PromotionStatus.ACTIVE },
      });
      await tx.promotionBranchAvailability.create({
        data: { businessId, promotionId: promo.id, locationId: l2 },
      });
      const map = await batchResolveAdServeLocationContexts(tx, cityUralskId, [
        campaignInput('c-stale', businessId, {
          productType: MonetizationProductType.PROMOTED_PROMOTION,
          promotionId: promo.id,
          destinationBusinessLocationId: l1,
        }),
      ]);
      expect(map.get('c-stale')).toEqual({ excluded: true });
    });
  });

  it('25–28 serveAds filters invalid branch before rotation / recordServe', async () => {
    if (skip) return;
    const slug = `a83-serve-${randomBytes(4).toString('hex')}`;
    const rotation = new AdRotationService();
    const cityScope = { resolveCityId: jest.fn().mockResolvedValue(cityUralskId) };
    const serving = new AdServingService(prisma as never, cityScope as never, rotation);

    const business = await prisma.business.create({
      data: {
        title: 'Serve filter',
        slug,
        categoryId,
        status: 'ACTIVE',
        locations: {
          create: [
            { cityId: cityUralskId, address: 'Good', isPrimary: true },
            { cityId: cityAktobeId, address: 'Other city', isPrimary: false },
          ],
        },
      },
      include: { locations: true },
    });
    const goodLoc = business.locations.find((l) => l.cityId === cityUralskId)!;
    const badTarget = business.locations.find((l) => l.cityId === cityAktobeId)!;
    const now = new Date();
    const end = new Date(now.getTime() + 86_400_000 * 30);

    const valid = await prisma.adCampaign.create({
      data: {
        businessId: business.id,
        productId: productFeaturedId,
        cityId: cityUralskId,
        status: AdCampaignStatus.ACTIVE,
        startAt: now,
        endAt: end,
        servedCount: 0,
        campaignPlacements: { create: { placementId: placementFeaturedId } },
      },
    });
    const invalid = await prisma.adCampaign.create({
      data: {
        businessId: business.id,
        productId: productFeaturedId,
        cityId: cityUralskId,
        status: AdCampaignStatus.ACTIVE,
        startAt: now,
        endAt: end,
        targetBusinessLocationId: badTarget.id,
        servedCount: 0,
        campaignPlacements: { create: { placementId: placementFeaturedId } },
      },
    });

    try {
      const result = await serving.serveAds({
        placementCode: 'HOME_FEATURED',
        sessionId: 'sess-a83-filter',
        cityId: cityUralskId,
        limit: 2,
      });
      expect(result.items.map((i) => i.campaignId)).toContain(valid.id);
      expect(result.items.map((i) => i.campaignId)).not.toContain(invalid.id);
      const updatedValid = await prisma.adCampaign.findUnique({ where: { id: valid.id } });
      const updatedInvalid = await prisma.adCampaign.findUnique({ where: { id: invalid.id } });
      expect(updatedValid?.servedCount).toBeGreaterThan(0);
      expect(updatedInvalid?.servedCount).toBe(0);
      const servedItem = result.items.find((i) => i.campaignId === valid.id);
      expect(servedItem?.destinationLocationId).toBe(goodLoc.id);
    } finally {
      await prisma.adCampaign.deleteMany({ where: { businessId: business.id } });
      await prisma.business.delete({ where: { id: business.id } });
    }
  });
});
