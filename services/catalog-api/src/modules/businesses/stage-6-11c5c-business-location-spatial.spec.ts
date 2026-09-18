import { randomBytes } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  POSTGIS_TEST_ROLLBACK,
  withPostgisIntegrationTransaction,
} from './postgis-integration-test.util';

describe('Stage 6.11C.5C — Business.location trigger (runtime DB)', () => {
  const prisma = new PrismaClient();
  let skip = false;
  let cityId = '';
  let categoryId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const col = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'Business'
            AND column_name = 'location'
        ) AS exists
      `;
      if (!col[0]?.exists) {
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

  async function withRollback<T>(
    fn: (tx: Prisma.TransactionClient, slug: string) => Promise<T>,
  ): Promise<T | undefined> {
    if (skip) {
      return undefined;
    }
    const slug = `c5c-trigger-${randomBytes(6).toString('hex')}`;
    try {
      return await withPostgisIntegrationTransaction(prisma, (tx) => fn(tx, slug));
    } finally {
      await prisma.business.deleteMany({
        where: {
          OR: [{ slug }, { slug: { startsWith: `${slug}-` } }],
        },
      });
    }
  }

  async function insertFixture(
    tx: Prisma.TransactionClient,
    slug: string,
    latitude: number | null,
    longitude: number | null,
  ): Promise<string> {
    const created = await tx.business.create({
      data: {
        title: 'C5C Trigger Fixture',
        slug,
        categoryId,
        cityId,
        address: 'Trigger test',
        status: 'PENDING',
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      },
      select: { id: true },
    });
    return created.id;
  }

  async function readLocation(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<{
    locationIsNull: boolean;
    stX: number | null;
    stY: number | null;
  }> {
    const rows = await tx.$queryRaw<
      Array<{ location_is_null: boolean; st_x: number | null; st_y: number | null }>
    >`
      SELECT
        ("location" IS NULL) AS location_is_null,
        CASE WHEN "location" IS NULL THEN NULL ELSE ST_X("location"::geometry) END AS st_x,
        CASE WHEN "location" IS NULL THEN NULL ELSE ST_Y("location"::geometry) END AS st_y
      FROM "Business"
      WHERE id = ${id}
    `;
    const row = rows[0];
    return {
      locationIsNull: row?.location_is_null ?? true,
      stX: row?.st_x ?? null,
      stY: row?.st_y ?? null,
    };
  }

  it('valid coordinates → location populated (lng X, lat Y)', async () => {
    await withRollback(async (tx, slug) => {
      const id = await insertFixture(tx, slug, 51.2224711, 51.3946096);
      const loc = await readLocation(tx, id);
      expect(loc.locationIsNull).toBe(false);
      expect(loc.stX).toBeCloseTo(51.3946096, 5);
      expect(loc.stY).toBeCloseTo(51.2224711, 5);

      await tx.business.update({
        where: { id },
        data: { latitude: 51.23, longitude: 51.4 },
      });
      const updated = await readLocation(tx, id);
      expect(updated.stX).toBeCloseTo(51.4, 5);
      expect(updated.stY).toBeCloseTo(51.23, 5);

      throw new Error(POSTGIS_TEST_ROLLBACK);
    });
  });

  it('NULL partial / both NULL / 0,0 / out-of-range → location NULL', async () => {
    await withRollback(async (tx, slug) => {
      const idNullLat = await insertFixture(tx, `${slug}-a`, null, 51.39);
      expect((await readLocation(tx, idNullLat)).locationIsNull).toBe(true);

      const idNullLng = await insertFixture(tx, `${slug}-b`, 51.22, null);
      expect((await readLocation(tx, idNullLng)).locationIsNull).toBe(true);

      const idBothNull = await insertFixture(tx, `${slug}-c`, null, null);
      expect((await readLocation(tx, idBothNull)).locationIsNull).toBe(true);

      const idZero = await insertFixture(tx, `${slug}-d`, 0, 0);
      expect((await readLocation(tx, idZero)).locationIsNull).toBe(true);

      const idBadLat = await insertFixture(tx, `${slug}-e`, 91, 51.39);
      expect((await readLocation(tx, idBadLat)).locationIsNull).toBe(true);

      const idBadLng = await insertFixture(tx, `${slug}-f`, 51.22, 181);
      expect((await readLocation(tx, idBadLng)).locationIsNull).toBe(true);

      throw new Error(POSTGIS_TEST_ROLLBACK);
    });
  });

  it('restore valid coordinates after NULL → location repopulated', async () => {
    await withRollback(async (tx, slug) => {
      const id = await insertFixture(tx, slug, null, null);
      expect((await readLocation(tx, id)).locationIsNull).toBe(true);

      await tx.business.update({
        where: { id },
        data: { latitude: 51.2224711, longitude: 51.3946096 },
      });
      const loc = await readLocation(tx, id);
      expect(loc.locationIsNull).toBe(false);
      expect(loc.stX).toBeCloseTo(51.3946096, 5);
      expect(loc.stY).toBeCloseTo(51.2224711, 5);

      throw new Error(POSTGIS_TEST_ROLLBACK);
    });
  });

  it('Prisma business findFirst still works with spatial column present', async () => {
    if (skip) return;
    const row = await prisma.business.findFirst({
      where: { status: 'ACTIVE' },
      select: { id: true, latitude: true, longitude: true, locationSource: true },
    });
    expect(row).toBeTruthy();
  });
});
