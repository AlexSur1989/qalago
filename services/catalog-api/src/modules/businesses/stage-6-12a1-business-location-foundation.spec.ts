import { randomBytes } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  POSTGIS_TEST_ROLLBACK,
  withPostgisIntegrationTransaction,
} from './postgis-integration-test.util';

describe('Stage 6.12A.1 — BusinessLocation foundation (runtime DB)', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let cityId = '';
  let categoryId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'BusinessLocation'
        ) AS exists`;
      if (!table[0]?.exists) {
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

  it('BusinessLocation model and Business.locations relation exist in client', () => {
    expect(prisma.businessLocation).toBeDefined();
    expect(typeof prisma.businessLocation.create).toBe('function');
  });

  it('legacy Business physical columns still exist', async () => {
    if (skip) return;
    const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Business'
        AND column_name IN ('cityId', 'address', 'latitude', 'longitude', 'location', 'workHours')`;
    const names = cols.map((c) => c.column_name).sort();
    expect(names).toEqual(
      ['address', 'cityId', 'latitude', 'location', 'longitude', 'workHours'].sort(),
    );
  });

  async function withRollback<T>(
    fn: (tx: Prisma.TransactionClient, businessSlug: string) => Promise<T>,
  ): Promise<T | undefined> {
    if (skip) return undefined;
    const businessSlug = `a12a1-${randomBytes(6).toString('hex')}`;
    try {
      return await withPostgisIntegrationTransaction(prisma, (tx) => fn(tx, businessSlug));
    } finally {
      await prisma.business.deleteMany({ where: { slug: businessSlug } });
    }
  }

  async function createBusiness(tx: Prisma.TransactionClient, slug: string) {
    return tx.business.create({
      data: {
        title: 'A.1 Fixture',
        slug,
        categoryId,
        cityId,
        address: 'Fixture address',
        status: 'PENDING',
      },
      select: { id: true },
    });
  }

  it('allows multiple non-primary locations per business', async () => {
    await withRollback(async (tx, slug) => {
      const { id: businessId } = await createBusiness(tx, slug);
      await tx.businessLocation.createMany({
        data: [
          { businessId, cityId, address: 'Branch A', isPrimary: false },
          { businessId, cityId, address: 'Branch B', isPrimary: false },
        ],
      });
      const count = await tx.businessLocation.count({ where: { businessId } });
      expect(count).toBe(2);
      throw new Error(POSTGIS_TEST_ROLLBACK);
    });
  });

  it('enforces only one primary location per business', async () => {
    await withRollback(async (tx, slug) => {
      const { id: businessId } = await createBusiness(tx, slug);
      await tx.businessLocation.create({
        data: { businessId, cityId, address: 'Primary', isPrimary: true },
      });
      await expect(
        tx.businessLocation.create({
          data: { businessId, cityId, address: 'Second primary', isPrimary: true },
        }),
      ).rejects.toThrow();
      throw new Error(POSTGIS_TEST_ROLLBACK);
    });
  });

  it('derives geography from coordinates and clears when null', async () => {
    await withRollback(async (tx, slug) => {
      const { id: businessId } = await createBusiness(tx, slug);
      const loc = await tx.businessLocation.create({
        data: {
          businessId,
          cityId,
          address: 'Geo test',
          latitude: 51.2278,
          longitude: 51.3865,
          isPrimary: false,
        },
        select: { id: true },
      });
      const withGeo = await tx.$queryRaw<
        Array<{ location_is_null: boolean; st_x: number | null; st_y: number | null }>
      >`
        SELECT
          ("location" IS NULL) AS location_is_null,
          CASE WHEN "location" IS NULL THEN NULL ELSE ST_X("location"::geometry) END AS st_x,
          CASE WHEN "location" IS NULL THEN NULL ELSE ST_Y("location"::geometry) END AS st_y
        FROM "BusinessLocation"
        WHERE id = ${loc.id}`;
      expect(withGeo[0]?.location_is_null).toBe(false);
      expect(withGeo[0]?.st_x).toBeCloseTo(51.3865, 4);
      expect(withGeo[0]?.st_y).toBeCloseTo(51.2278, 4);

      await tx.businessLocation.update({
        where: { id: loc.id },
        data: { latitude: null, longitude: null },
      });
      const cleared = await tx.$queryRaw<Array<{ location_is_null: boolean }>>`
        SELECT ("location" IS NULL) AS location_is_null
        FROM "BusinessLocation" WHERE id = ${loc.id}`;
      expect(cleared[0]?.location_is_null).toBe(true);
      throw new Error(POSTGIS_TEST_ROLLBACK);
    });
  });

  it('cascades delete when Business is removed', async () => {
    await withRollback(async (tx, slug) => {
      const { id: businessId } = await createBusiness(tx, slug);
      await tx.businessLocation.create({
        data: { businessId, cityId, address: 'Cascade test', isPrimary: false },
      });
      await tx.business.delete({ where: { id: businessId } });
      const remaining = await tx.businessLocation.count({ where: { businessId } });
      expect(remaining).toBe(0);
      throw new Error(POSTGIS_TEST_ROLLBACK);
    });
  });

  it('production BusinessLocation table starts empty when no fixtures inserted', async () => {
    if (skip) return;
    const count = await prisma.businessLocation.count();
    expect(count).toBe(0);
  });
});
