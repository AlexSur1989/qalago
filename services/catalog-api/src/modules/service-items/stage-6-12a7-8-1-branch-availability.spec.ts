import { randomBytes } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  POSTGIS_TEST_ROLLBACK,
  withPostgisIntegrationTransaction,
} from '../businesses/postgis-integration-test.util';

describe('Stage 6.12A.7.8.1 — branch availability (runtime DB)', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let cityId = '';
  let categoryId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const table = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ServiceItemBranchAvailability'`;
      if (table.length === 0) {
        skip = true;
        return;
      }
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

  async function withFixture<T>(
    fn: (ctx: {
      tx: Prisma.TransactionClient;
      businessId: string;
      l1Id: string;
      l2Id: string;
      l3Id: string;
      otherBusinessId: string;
      otherLocationId: string;
    }) => Promise<T>,
  ): Promise<T | undefined> {
    if (skip) return undefined;
    const slugA = `a781-${randomBytes(6).toString('hex')}`;
    const slugB = `a781b-${randomBytes(6).toString('hex')}`;
    try {
      return await withPostgisIntegrationTransaction(prisma, async (tx) => {
        const businessA = await tx.business.create({
          data: {
            title: 'A.7.8.1 A',
            slug: slugA,
            categoryId,
            status: 'ACTIVE',
            locations: {
              create: [
                { cityId, address: 'L1', isPrimary: true },
                { cityId, address: 'L2', isPrimary: false },
                { cityId, address: 'L3', isPrimary: false },
              ],
            },
          },
          include: { locations: true },
        });
        const businessB = await tx.business.create({
          data: {
            title: 'A.7.8.1 B',
            slug: slugB,
            categoryId,
            status: 'ACTIVE',
            locations: { create: { cityId, address: 'B1', isPrimary: true } },
          },
          include: { locations: true },
        });
        const locs = [...businessA.locations].sort((a, b) => a.address.localeCompare(b.address));
        const result = await fn({
          tx,
          businessId: businessA.id,
          l1Id: locs[0]!.id,
          l2Id: locs[1]!.id,
          l3Id: locs[2]!.id,
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

  it('M — zero assignments means all branches (data contract; no backfill)', async () => {
    if (skip) return;
    const total = await prisma.serviceItemBranchAvailability.count();
    const promoTotal = await prisma.promotionBranchAvailability.count();
    expect(total).toBe(0);
    expect(promoTotal).toBe(0);
    await withFixture(async ({ tx, businessId }) => {
      const item = await tx.serviceItem.create({
        data: { businessId, title: 'All branches item' },
      });
      const count = await tx.serviceItemBranchAvailability.count({
        where: { serviceItemId: item.id },
      });
      expect(count).toBe(0);
    });
  });

  it('A — ServiceItem assignment to same-business L1 succeeds', async () => {
    await withFixture(async ({ tx, businessId, l1Id }) => {
      const item = await tx.serviceItem.create({
        data: { businessId, title: 'L1 only' },
      });
      const row = await tx.serviceItemBranchAvailability.create({
        data: { businessId, serviceItemId: item.id, locationId: l1Id },
      });
      expect(row.locationId).toBe(l1Id);
    });
  });

  it('B — same ServiceItem assignment to L2 also succeeds', async () => {
    await withFixture(async ({ tx, businessId, l1Id, l2Id }) => {
      const item = await tx.serviceItem.create({
        data: { businessId, title: 'L1+L2' },
      });
      await tx.serviceItemBranchAvailability.create({
        data: { businessId, serviceItemId: item.id, locationId: l1Id },
      });
      const row2 = await tx.serviceItemBranchAvailability.create({
        data: { businessId, serviceItemId: item.id, locationId: l2Id },
      });
      expect(row2.locationId).toBe(l2Id);
    });
  });

  it('C — duplicate ServiceItem→L1 assignment fails', async () => {
    await withFixture(async ({ tx, businessId, l1Id }) => {
      const item = await tx.serviceItem.create({
        data: { businessId, title: 'Dup' },
      });
      await tx.serviceItemBranchAvailability.create({
        data: { businessId, serviceItemId: item.id, locationId: l1Id },
      });
      await expect(
        tx.serviceItemBranchAvailability.create({
          data: { businessId, serviceItemId: item.id, locationId: l1Id },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    });
  });

  it('D — ServiceItem Business A → Location Business B fails', async () => {
    await withFixture(async ({ tx, businessId, otherLocationId }) => {
      const item = await tx.serviceItem.create({
        data: { businessId, title: 'Cross' },
      });
      await expect(
        tx.serviceItemBranchAvailability.create({
          data: {
            businessId,
            serviceItemId: item.id,
            locationId: otherLocationId,
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  it('E — Promotion assignment to same-business L1 succeeds', async () => {
    await withFixture(async ({ tx, businessId, l1Id }) => {
      const promo = await tx.promotion.create({
        data: { businessId, title: 'Promo L1' },
      });
      const row = await tx.promotionBranchAvailability.create({
        data: { businessId, promotionId: promo.id, locationId: l1Id },
      });
      expect(row.promotionId).toBe(promo.id);
    });
  });

  it('F — Promotion assignment to multiple locations succeeds', async () => {
    await withFixture(async ({ tx, businessId, l1Id, l3Id }) => {
      const promo = await tx.promotion.create({
        data: { businessId, title: 'Promo L1+L3' },
      });
      await tx.promotionBranchAvailability.create({
        data: { businessId, promotionId: promo.id, locationId: l1Id },
      });
      const row = await tx.promotionBranchAvailability.create({
        data: { businessId, promotionId: promo.id, locationId: l3Id },
      });
      expect(row.locationId).toBe(l3Id);
    });
  });

  it('G — duplicate Promotion→location fails', async () => {
    await withFixture(async ({ tx, businessId, l2Id }) => {
      const promo = await tx.promotion.create({
        data: { businessId, title: 'Dup promo' },
      });
      await tx.promotionBranchAvailability.create({
        data: { businessId, promotionId: promo.id, locationId: l2Id },
      });
      await expect(
        tx.promotionBranchAvailability.create({
          data: { businessId, promotionId: promo.id, locationId: l2Id },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    });
  });

  it('H — Promotion Business A → Location Business B fails', async () => {
    await withFixture(async ({ tx, businessId, otherLocationId }) => {
      const promo = await tx.promotion.create({
        data: { businessId, title: 'Cross promo' },
      });
      await expect(
        tx.promotionBranchAvailability.create({
          data: {
            businessId,
            promotionId: promo.id,
            locationId: otherLocationId,
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  it('I — deleting ServiceItem cascades assignment rows', async () => {
    if (skip) return;
    const slug = `a781-del-item-${randomBytes(6).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: 'Del item',
        slug,
        categoryId,
        status: 'ACTIVE',
        locations: { create: { cityId, address: 'Loc', isPrimary: true } },
        serviceItems: { create: { title: 'T' } },
      },
      include: { locations: true, serviceItems: true },
    });
    const itemId = business.serviceItems[0]!.id;
    const locId = business.locations[0]!.id;
    await prisma.serviceItemBranchAvailability.create({
      data: { businessId: business.id, serviceItemId: itemId, locationId: locId },
    });
    await prisma.serviceItem.delete({ where: { id: itemId } });
    const left = await prisma.serviceItemBranchAvailability.count({
      where: { serviceItemId: itemId },
    });
    expect(left).toBe(0);
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('J — deleting Promotion cascades assignment rows', async () => {
    if (skip) return;
    const slug = `a781-del-promo-${randomBytes(6).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: 'Del promo',
        slug,
        categoryId,
        status: 'ACTIVE',
        locations: { create: { cityId, address: 'Loc', isPrimary: true } },
        promotions: { create: { title: 'P' } },
      },
      include: { locations: true, promotions: true },
    });
    const promoId = business.promotions[0]!.id;
    const locId = business.locations[0]!.id;
    await prisma.promotionBranchAvailability.create({
      data: { businessId: business.id, promotionId: promoId, locationId: locId },
    });
    await prisma.promotion.delete({ where: { id: promoId } });
    const left = await prisma.promotionBranchAvailability.count({
      where: { promotionId: promoId },
    });
    expect(left).toBe(0);
    await prisma.business.delete({ where: { id: business.id } });
  });

  it('K — deleting Business removes assignments (no orphans)', async () => {
    if (skip) return;
    const slug = `a781-del-biz-${randomBytes(6).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: 'Del biz',
        slug,
        categoryId,
        status: 'ACTIVE',
        locations: { create: { cityId, address: 'Loc', isPrimary: true } },
        serviceItems: { create: { title: 'I' } },
        promotions: { create: { title: 'Pr' } },
      },
      include: { locations: true, serviceItems: true, promotions: true },
    });
    const locId = business.locations[0]!.id;
    const assignId = (
      await prisma.serviceItemBranchAvailability.create({
        data: {
          businessId: business.id,
          serviceItemId: business.serviceItems[0]!.id,
          locationId: locId,
        },
      })
    ).id;
    await prisma.business.delete({ where: { id: business.id } });
    const orphan = await prisma.serviceItemBranchAvailability.findUnique({
      where: { id: assignId },
    });
    expect(orphan).toBeNull();
  });

  it('L — BusinessLocation delete RESTRICT while assignments exist (no silent broaden)', async () => {
    await withFixture(async ({ tx, businessId, l2Id }) => {
      const item = await tx.serviceItem.create({
        data: { businessId, title: 'L2 scoped' },
      });
      await tx.serviceItemBranchAvailability.create({
        data: { businessId, serviceItemId: item.id, locationId: l2Id },
      });
      await expect(
        tx.businessLocation.delete({ where: { id: l2Id } }),
      ).rejects.toThrow(/RESTRICT|ServiceItemBranchAvailability_businessId_locationId_fkey|23001/i);
    });
  });
});
