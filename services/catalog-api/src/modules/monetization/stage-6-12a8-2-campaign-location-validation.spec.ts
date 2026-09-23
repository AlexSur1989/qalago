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
import {
  clearAdCampaignBranchReferencesBeforeDelete,
  validateAndResolveCampaignLocationContext,
} from './utils/campaign-location-context.util';
import { MonetizationErrorCode } from './errors/monetization.errors';

describe('Stage 6.12A.8.2 — campaign location validation + lifecycle', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let cityUralskId = '';
  let cityAktobeId = '';
  let categoryId = '';
  let productFeaturedId = '';
  let productPromotedId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' } });
      const aktobe = await prisma.city.findFirst({ where: { slug: 'aktobe' } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const product = await prisma.monetizationProduct.findFirst({
        where: { type: 'FEATURED_BUSINESS', isActive: true },
      });
      const promotedProduct = await prisma.monetizationProduct.findFirst({
        where: { type: 'PROMOTED_PROMOTION', isActive: true },
      });
      if (!uralsk || !aktobe || !category || !product || !promotedProduct) {
        skip = true;
        return;
      }
      cityUralskId = uralsk.id;
      cityAktobeId = aktobe.id;
      categoryId = category.id;
      productFeaturedId = product.id;
      productPromotedId = promotedProduct.id;
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function withTwoBranchBusiness<T>(
    fn: (ctx: {
      tx: Prisma.TransactionClient;
      businessId: string;
      l1: string;
      l2: string;
      otherBusinessId: string;
      otherLocationId: string;
    }) => Promise<T>,
  ): Promise<T | undefined> {
    if (skip) return undefined;
    const slugA = `a82-${randomBytes(5).toString('hex')}`;
    const slugB = `a82b-${randomBytes(5).toString('hex')}`;
    try {
      return await withPostgisIntegrationTransaction(prisma, async (tx) => {
        const businessA = await tx.business.create({
          data: {
            title: 'A.8.2 A',
            slug: slugA,
            categoryId,
            cityId: cityUralskId,
            address: 'Uralsk HQ',
            status: 'ACTIVE',
            locations: {
              create: [
                { cityId: cityUralskId, address: 'L1', isPrimary: true },
                { cityId: cityUralskId, address: 'L2', isPrimary: false },
              ],
            },
          },
          include: { locations: true },
        });
        const businessB = await tx.business.create({
          data: {
            title: 'A.8.2 B',
            slug: slugB,
            categoryId,
            cityId: cityUralskId,
            address: 'Other',
            status: 'ACTIVE',
            locations: {
              create: { cityId: cityUralskId, address: 'B1', isPrimary: true },
            },
          },
          include: { locations: true },
        });
        const [l1, l2] = businessA.locations.sort(
          (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.id.localeCompare(b.id),
        );
        const result = await fn({
          tx,
          businessId: businessA.id,
          l1: l1!.id,
          l2: l2!.id,
          otherBusinessId: businessB.id,
          otherLocationId: businessB.locations[0]!.id,
        });
        throw new Error(POSTGIS_TEST_ROLLBACK);
      });
    } catch (e) {
      if (e instanceof Error && e.message === POSTGIS_TEST_ROLLBACK) {
        return undefined;
      }
      throw e;
    } finally {
      await prisma.business.deleteMany({ where: { slug: { in: [slugA, slugB] } } });
    }
  }

  async function expectBadRequest(
    promise: Promise<unknown>,
    code: (typeof MonetizationErrorCode)[keyof typeof MonetizationErrorCode],
  ) {
    await expect(promise).rejects.toMatchObject({
      response: { code },
    });
  }

  it('1–2 target same business PASS / cross-business REJECT', async () => {
    await withTwoBranchBusiness(async ({ tx, businessId, l1, otherLocationId }) => {
      const ok = await validateAndResolveCampaignLocationContext(tx, {
        businessId,
        cityId: cityUralskId,
        productType: MonetizationProductType.FEATURED_BUSINESS,
        targetBusinessLocationId: l1,
      });
      expect(ok.targetBusinessLocationId).toBe(l1);

      await expectBadRequest(
        validateAndResolveCampaignLocationContext(tx, {
          businessId,
          cityId: cityUralskId,
          productType: MonetizationProductType.FEATURED_BUSINESS,
          targetBusinessLocationId: otherLocationId,
        }),
        MonetizationErrorCode.INVALID_CAMPAIGN_BRANCH,
      );
    });
  });

  it('3–4 destination same business PASS / cross-business REJECT', async () => {
    await withTwoBranchBusiness(async ({ tx, businessId, l1, otherLocationId }) => {
      const ok = await validateAndResolveCampaignLocationContext(tx, {
        businessId,
        cityId: cityUralskId,
        productType: MonetizationProductType.FEATURED_BUSINESS,
        destinationBusinessLocationId: l1,
      });
      expect(ok.destinationBusinessLocationId).toBe(l1);

      await expectBadRequest(
        validateAndResolveCampaignLocationContext(tx, {
          businessId,
          cityId: cityUralskId,
          productType: MonetizationProductType.FEATURED_BUSINESS,
          destinationBusinessLocationId: otherLocationId,
        }),
        MonetizationErrorCode.INVALID_CAMPAIGN_BRANCH,
      );
    });
  });

  it('5–6 campaign city vs branch city mismatch REJECT', async () => {
    if (skip) return;
    const slug = `a82-city-${randomBytes(4).toString('hex')}`;
    try {
      await withPostgisIntegrationTransaction(prisma, async (tx) => {
        const business = await tx.business.create({
          data: {
            title: 'Multi-city',
            slug,
            categoryId,
            cityId: cityUralskId,
            address: 'HQ',
            status: 'ACTIVE',
            locations: {
              create: [
                { cityId: cityUralskId, address: 'Oral', isPrimary: true },
                { cityId: cityAktobeId, address: 'Aktobe', isPrimary: false },
              ],
            },
          },
          include: { locations: true },
        });
        const aktobeBranch = business.locations.find((l) => l.cityId === cityAktobeId)!;
        await expectBadRequest(
          validateAndResolveCampaignLocationContext(tx, {
            businessId: business.id,
            cityId: cityUralskId,
            productType: MonetizationProductType.FEATURED_BUSINESS,
            targetBusinessLocationId: aktobeBranch.id,
          }),
          MonetizationErrorCode.CAMPAIGN_BRANCH_CITY_MISMATCH,
        );
        await expectBadRequest(
          validateAndResolveCampaignLocationContext(tx, {
            businessId: business.id,
            cityId: cityUralskId,
            productType: MonetizationProductType.FEATURED_BUSINESS,
            destinationBusinessLocationId: aktobeBranch.id,
          }),
          MonetizationErrorCode.CAMPAIGN_BRANCH_CITY_MISMATCH,
        );
        throw new Error(POSTGIS_TEST_ROLLBACK);
      });
    } catch (e) {
      if (!(e instanceof Error && e.message === POSTGIS_TEST_ROLLBACK)) throw e;
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  });

  it('7–10 promotion PBA validation matrix', async () => {
    await withTwoBranchBusiness(async ({ tx, businessId, l1, l2, otherBusinessId }) => {
      const promoAll = await tx.promotion.create({
        data: {
          businessId,
          title: 'All branches',
          status: PromotionStatus.ACTIVE,
        },
      });
      const resolvedAll = await validateAndResolveCampaignLocationContext(tx, {
        businessId,
        cityId: cityUralskId,
        productType: MonetizationProductType.PROMOTED_PROMOTION,
        promotionId: promoAll.id,
        destinationBusinessLocationId: l1,
      });
      expect(resolvedAll.destinationBusinessLocationId).toBe(l1);

      const promoL1 = await tx.promotion.create({
        data: {
          businessId,
          title: 'L1 only',
          status: PromotionStatus.ACTIVE,
        },
      });
      await tx.promotionBranchAvailability.create({
        data: { businessId, promotionId: promoL1.id, locationId: l1 },
      });
      const okL1 = await validateAndResolveCampaignLocationContext(tx, {
        businessId,
        cityId: cityUralskId,
        productType: MonetizationProductType.PROMOTED_PROMOTION,
        promotionId: promoL1.id,
        destinationBusinessLocationId: l1,
      });
      expect(okL1.destinationBusinessLocationId).toBe(l1);

      await expectBadRequest(
        validateAndResolveCampaignLocationContext(tx, {
          businessId,
          cityId: cityUralskId,
          productType: MonetizationProductType.PROMOTED_PROMOTION,
          promotionId: promoL1.id,
          destinationBusinessLocationId: l2,
        }),
        MonetizationErrorCode.PROMOTION_NOT_EFFECTIVE_AT_BRANCH,
      );

      const foreignPromo = await tx.promotion.create({
        data: {
          businessId: otherBusinessId,
          title: 'Foreign',
          status: PromotionStatus.ACTIVE,
        },
      });
      await expectBadRequest(
        validateAndResolveCampaignLocationContext(tx, {
          businessId,
          cityId: cityUralskId,
          productType: MonetizationProductType.PROMOTED_PROMOTION,
          promotionId: foreignPromo.id,
          destinationBusinessLocationId: l1,
        }),
        MonetizationErrorCode.PROMOTION_NOT_OWNED,
      );
    });
  });

  it('11–12 target/destination independence — mismatch REJECT, same PASS', async () => {
    await withTwoBranchBusiness(async ({ tx, businessId, l1, l2 }) => {
      await expectBadRequest(
        validateAndResolveCampaignLocationContext(tx, {
          businessId,
          cityId: cityUralskId,
          productType: MonetizationProductType.FEATURED_BUSINESS,
          targetBusinessLocationId: l1,
          destinationBusinessLocationId: l2,
        }),
        MonetizationErrorCode.CAMPAIGN_TARGET_DESTINATION_MISMATCH,
      );
      const ok = await validateAndResolveCampaignLocationContext(tx, {
        businessId,
        cityId: cityUralskId,
        productType: MonetizationProductType.FEATURED_BUSINESS,
        targetBusinessLocationId: l1,
        destinationBusinessLocationId: l1,
      });
      expect(ok.targetBusinessLocationId).toBe(l1);
      expect(ok.destinationBusinessLocationId).toBe(l1);
    });
  });

  it('13 legacy NULL target + NULL destination PASS', async () => {
    await withTwoBranchBusiness(async ({ tx, businessId }) => {
      const resolved = await validateAndResolveCampaignLocationContext(tx, {
        businessId,
        cityId: cityUralskId,
        productType: MonetizationProductType.FEATURED_BUSINESS,
      });
      expect(resolved.targetBusinessLocationId).toBeNull();
      expect(resolved.destinationBusinessLocationId).toBeNull();
    });
  });

  it('promotion SELECTED multi-branch requires explicit destination', async () => {
    await withTwoBranchBusiness(async ({ tx, businessId, l1, l2 }) => {
      const promo = await tx.promotion.create({
        data: {
          businessId,
          title: 'Two branches',
          status: PromotionStatus.ACTIVE,
        },
      });
      await tx.promotionBranchAvailability.createMany({
        data: [
          { businessId, promotionId: promo.id, locationId: l1 },
          { businessId, promotionId: promo.id, locationId: l2 },
        ],
      });
      await expectBadRequest(
        validateAndResolveCampaignLocationContext(tx, {
          businessId,
          cityId: cityUralskId,
          productType: MonetizationProductType.PROMOTED_PROMOTION,
          promotionId: promo.id,
        }),
        MonetizationErrorCode.PROMOTION_DESTINATION_BRANCH_REQUIRED,
      );
    });
  });

  it('promotion SELECTED single branch auto-derives destination', async () => {
    await withTwoBranchBusiness(async ({ tx, businessId, l1 }) => {
      const promo = await tx.promotion.create({
        data: {
          businessId,
          title: 'Single selected',
          status: PromotionStatus.ACTIVE,
        },
      });
      await tx.promotionBranchAvailability.create({
        data: { businessId, promotionId: promo.id, locationId: l1 },
      });
      const resolved = await validateAndResolveCampaignLocationContext(tx, {
        businessId,
        cityId: cityUralskId,
        productType: MonetizationProductType.PROMOTED_PROMOTION,
        promotionId: promo.id,
      });
      expect(resolved.destinationBusinessLocationId).toBe(l1);
    });
  });

  it('delete lifecycle — clear target then delete branch', async () => {
    await withTwoBranchBusiness(async ({ tx, businessId, l2 }) => {
      const promo = await tx.promotion.create({
        data: {
          businessId,
          title: 'All',
          status: PromotionStatus.ACTIVE,
        },
      });
      await tx.adCampaign.create({
        data: {
          businessId,
          productId: productFeaturedId,
          cityId: cityUralskId,
          promotionId: promo.id,
          targetBusinessLocationId: l2,
          status: AdCampaignStatus.SCHEDULED,
          startAt: new Date(),
          endAt: new Date(Date.now() + 86_400_000),
        },
      });
      await clearAdCampaignBranchReferencesBeforeDelete(tx, businessId, l2);
      await tx.businessLocation.delete({ where: { id: l2 } });
      const remaining = await tx.adCampaign.findFirst({
        where: { businessId, targetBusinessLocationId: l2 },
      });
      expect(remaining).toBeNull();
    });
  });

  it('delete lifecycle — blocks when clearing leaves invalid promotion config', async () => {
    await withTwoBranchBusiness(async ({ tx, businessId, l1, l2 }) => {
      const promo = await tx.promotion.create({
        data: {
          businessId,
          title: 'Selected two',
          status: PromotionStatus.ACTIVE,
        },
      });
      await tx.promotionBranchAvailability.createMany({
        data: [
          { businessId, promotionId: promo.id, locationId: l1 },
          { businessId, promotionId: promo.id, locationId: l2 },
        ],
      });
      await tx.adCampaign.create({
        data: {
          businessId,
          productId: productPromotedId,
          cityId: cityUralskId,
          promotionId: promo.id,
          destinationBusinessLocationId: l1,
          status: AdCampaignStatus.SCHEDULED,
          startAt: new Date(),
          endAt: new Date(Date.now() + 86_400_000),
        },
      });
      await expect(
        clearAdCampaignBranchReferencesBeforeDelete(tx, businessId, l1),
      ).rejects.toMatchObject({
        response: { code: 'BUSINESS_LOCATION_DELETE_BLOCKED' },
      });
    });
  });
});
