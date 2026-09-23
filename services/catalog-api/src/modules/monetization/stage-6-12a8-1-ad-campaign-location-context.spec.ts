import { randomBytes } from 'crypto';
import {
  AdCampaignStatus,
  AnalyticsEventType,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import {
  POSTGIS_TEST_ROLLBACK,
  withPostgisIntegrationTransaction,
} from '../businesses/postgis-integration-test.util';

describe('Stage 6.12A.8.1 — AdCampaign / AnalyticsEvent location context (runtime DB)', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let cityId = '';
  let categoryId = '';
  let productId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'AdCampaign'
          AND column_name = 'targetBusinessLocationId'`;
      if (cols.length === 0) {
        skip = true;
        return;
      }
      const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const product = await prisma.monetizationProduct.findFirst({
        where: { type: 'FEATURED_BUSINESS', isActive: true },
        select: { id: true },
      });
      if (!city || !category || !product) {
        skip = true;
        return;
      }
      cityId = city.id;
      categoryId = category.id;
      productId = product.id;
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function withFixture<T>(
    fn: (ctx: {
      tx: Prisma.TransactionClient;
      businessId: string;
      primaryLocationId: string;
      secondaryLocationId: string;
      otherBusinessId: string;
      otherLocationId: string;
    }) => Promise<T>,
  ): Promise<T | undefined> {
    if (skip) return undefined;
    const slugA = `a81-${randomBytes(6).toString('hex')}`;
    const slugB = `a81b-${randomBytes(6).toString('hex')}`;
    try {
      return await withPostgisIntegrationTransaction(prisma, async (tx) => {
        const businessA = await tx.business.create({
          data: {
            title: 'A.8.1 A',
            slug: slugA,
            categoryId,
            cityId,
            address: 'A street',
            status: 'ACTIVE',
            locations: {
              create: [
                { cityId, address: 'Primary', isPrimary: true },
                { cityId, address: 'Secondary', isPrimary: false },
              ],
            },
          },
          include: { locations: true },
        });
        const businessB = await tx.business.create({
          data: {
            title: 'A.8.1 B',
            slug: slugB,
            categoryId,
            cityId,
            address: 'B street',
            status: 'ACTIVE',
            locations: {
              create: { cityId, address: 'B primary', isPrimary: true },
            },
          },
          include: { locations: true },
        });
        const [primary, secondary] = businessA.locations.sort(
          (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.id.localeCompare(b.id),
        );
        const otherLoc = businessB.locations[0]!;
        const result = await fn({
          tx,
          businessId: businessA.id,
          primaryLocationId: primary!.id,
          secondaryLocationId: secondary!.id,
          otherBusinessId: businessB.id,
          otherLocationId: otherLoc.id,
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

  async function createMinimalCampaign(
    tx: Prisma.TransactionClient,
    businessId: string,
    data?: Partial<{
      targetBusinessLocationId: string | null;
      destinationBusinessLocationId: string | null;
    }>,
  ) {
    const now = new Date();
    return tx.adCampaign.create({
      data: {
        businessId,
        productId,
        cityId,
        status: AdCampaignStatus.SCHEDULED,
        startAt: now,
        endAt: new Date(now.getTime() + 86_400_000),
        targetBusinessLocationId: data?.targetBusinessLocationId ?? null,
        destinationBusinessLocationId: data?.destinationBusinessLocationId ?? null,
      },
    });
  }

  it('C — existing campaigns keep null location fields', async () => {
    if (skip) return;
    const withLocation = await prisma.adCampaign.count({
      where: {
        OR: [
          { targetBusinessLocationId: { not: null } },
          { destinationBusinessLocationId: { not: null } },
        ],
      },
    });
    expect(withLocation).toBe(0);
  });

  it('H — historical AnalyticsEvent rows keep null businessLocationId', async () => {
    if (skip) return;
    const withLocation = await prisma.analyticsEvent.count({
      where: { businessLocationId: { not: null } },
    });
    expect(withLocation).toBe(0);
  });

  it('A/B — AdCampaign remains Business-owned with nullable branch fields', async () => {
    await withFixture(async ({ tx, businessId }) => {
      const campaign = await createMinimalCampaign(tx, businessId);
      expect(campaign.businessId).toBe(businessId);
      expect(campaign.targetBusinessLocationId).toBeNull();
      expect(campaign.destinationBusinessLocationId).toBeNull();
    });
  });

  it('D/E — same-business target and destination locations accepted', async () => {
    await withFixture(async ({ tx, businessId, secondaryLocationId, primaryLocationId }) => {
      const campaign = await createMinimalCampaign(tx, businessId, {
        targetBusinessLocationId: secondaryLocationId,
        destinationBusinessLocationId: primaryLocationId,
      });
      expect(campaign.targetBusinessLocationId).toBe(secondaryLocationId);
      expect(campaign.destinationBusinessLocationId).toBe(primaryLocationId);
    });
  });

  it('F — cross-business target location rejected', async () => {
    await withFixture(async ({ tx, businessId, otherLocationId }) => {
      await expect(
        createMinimalCampaign(tx, businessId, {
          targetBusinessLocationId: otherLocationId,
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  it('G — cross-business destination location rejected', async () => {
    await withFixture(async ({ tx, businessId, otherLocationId }) => {
      await expect(
        createMinimalCampaign(tx, businessId, {
          destinationBusinessLocationId: otherLocationId,
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  it('I — AnalyticsEvent can reference valid branch when businessId matches', async () => {
    await withFixture(async ({ tx, businessId, secondaryLocationId }) => {
      const event = await tx.analyticsEvent.create({
        data: {
          businessId,
          businessLocationId: secondaryLocationId,
          type: AnalyticsEventType.VIEW_BUSINESS,
        },
      });
      expect(event.businessLocationId).toBe(secondaryLocationId);
    });
  });

  it('J — BusinessLocation delete RESTRICT while campaign references branch', async () => {
    await withFixture(async ({ tx, businessId, secondaryLocationId }) => {
      await createMinimalCampaign(tx, businessId, {
        targetBusinessLocationId: secondaryLocationId,
      });
      await expect(
        tx.businessLocation.delete({ where: { id: secondaryLocationId } }),
      ).rejects.toThrow(/RESTRICT|AdCampaign_businessId_targetBusinessLocationId_fkey|23001/i);
    });
  });

  it('K — AnalyticsEvent branch cleared on BusinessLocation delete (SET NULL)', async () => {
    await withFixture(async ({ tx, businessId, secondaryLocationId }) => {
      const event = await tx.analyticsEvent.create({
        data: {
          businessId,
          businessLocationId: secondaryLocationId,
          type: AnalyticsEventType.CALL_CLICK,
        },
      });
      await tx.businessLocation.delete({ where: { id: secondaryLocationId } });
      const refreshed = await tx.analyticsEvent.findUniqueOrThrow({ where: { id: event.id } });
      expect(refreshed.businessLocationId).toBeNull();
      expect(refreshed.businessId).toBe(businessId);
    });
  });
});
