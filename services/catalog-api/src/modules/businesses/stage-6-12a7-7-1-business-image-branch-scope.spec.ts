import { randomBytes } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  POSTGIS_TEST_ROLLBACK,
  withPostgisIntegrationTransaction,
} from './postgis-integration-test.util';

describe('Stage 6.12A.7.7.1 — BusinessImage branch scope (runtime DB)', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let cityId = '';
  let categoryId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const col = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'BusinessImage'
          AND column_name = 'locationId'`;
      if (col.length === 0) {
        skip = true;
        return;
      }
      const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      if (!city || !category) {
        skip = true;
        return;
      }
      cityId = city.id;
      categoryId = category.id;
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
    const slugA = `a771-${randomBytes(6).toString('hex')}`;
    const slugB = `a771b-${randomBytes(6).toString('hex')}`;
    try {
      return await withPostgisIntegrationTransaction(prisma, async (tx) => {
        const businessA = await tx.business.create({
          data: {
            title: 'A.7.7.1 A',
            slug: slugA,
            categoryId,
            cityId,
            status: 'ACTIVE',
            locations: {
              create: [
                {
                  cityId,
                  address: 'Primary A',
                  isPrimary: true,
                },
                {
                  cityId,
                  address: 'Secondary A',
                  isPrimary: false,
                },
              ],
            },
          },
          include: { locations: true },
        });
        const businessB = await tx.business.create({
          data: {
            title: 'A.7.7.1 B',
            slug: slugB,
            categoryId,
            cityId,
            status: 'ACTIVE',
            locations: {
              create: {
                cityId,
                address: 'Primary B',
                isPrimary: true,
              },
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

  it('F — existing production rows remain shared (locationId null)', async () => {
    if (skip) return;
    const scoped = await prisma.businessImage.count({
      where: { locationId: { not: null } },
    });
    expect(scoped).toBe(0);
  });

  it('A — BusinessImage with locationId=null is valid', async () => {
    await withFixture(async ({ tx, businessId }) => {
      const image = await tx.businessImage.create({
        data: {
          businessId,
          imageUrl: '/uploads/a771-shared.jpg',
          locationId: null,
        },
      });
      expect(image.locationId).toBeNull();
    });
  });

  it('B — BusinessImage can reference a location of the same Business', async () => {
    await withFixture(async ({ tx, businessId, secondaryLocationId }) => {
      const image = await tx.businessImage.create({
        data: {
          businessId,
          locationId: secondaryLocationId,
          imageUrl: '/uploads/a771-branch.jpg',
        },
      });
      expect(image.locationId).toBe(secondaryLocationId);
    });
  });

  it('C — cannot reference a BusinessLocation belonging to another Business', async () => {
    await withFixture(async ({ tx, businessId, otherLocationId }) => {
      await expect(
        tx.businessImage.create({
          data: {
            businessId,
            locationId: otherLocationId,
            imageUrl: '/uploads/a771-cross.jpg',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  it('D — deleting Business cascades BusinessImage rows', async () => {
    if (skip) return;
    const slug = `a771-del-${randomBytes(6).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: 'A.7.7.1 delete',
        slug,
        categoryId,
        cityId,
        status: 'ACTIVE',
        images: {
          create: [{ imageUrl: '/uploads/a771-del.jpg', locationId: null }],
        },
        locations: {
          create: { cityId, address: 'Loc', isPrimary: true },
        },
      },
      include: { images: true },
    });
    const imageId = business.images[0]!.id;
    await prisma.business.delete({ where: { id: business.id } });
    const gone = await prisma.businessImage.findUnique({ where: { id: imageId } });
    expect(gone).toBeNull();
  });

  it('E — BusinessLocation delete RESTRICT while branch-scoped images exist', async () => {
    await withFixture(async ({ tx, businessId, secondaryLocationId }) => {
      await tx.businessImage.create({
        data: {
          businessId,
          locationId: secondaryLocationId,
          imageUrl: '/uploads/a771-restrict.jpg',
        },
      });
      await expect(
        tx.businessLocation.delete({ where: { id: secondaryLocationId } }),
      ).rejects.toThrow(/RESTRICT|BusinessImage_businessId_locationId_fkey|23001/i);
    });
  });
});
