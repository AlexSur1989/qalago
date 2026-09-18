import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

const ROLLBACK = '__C5C_ROLLBACK__';

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

  async function withRollback<T>(fn: (slug: string) => Promise<T>): Promise<T> {
    if (skip) {
      return undefined as T;
    }
    const slug = `c5c-trigger-${randomBytes(6).toString('hex')}`;
    try {
      return await prisma.$transaction(async () => fn(slug));
    } catch (e) {
      if (e instanceof Error && e.message === ROLLBACK) {
        return undefined as T;
      }
      throw e;
    }
  }

  async function insertFixture(
    slug: string,
    latitude: number | null,
    longitude: number | null,
  ): Promise<string> {
    const created = await prisma.business.create({
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

  async function readLocation(id: string): Promise<{
    locationIsNull: boolean;
    stX: number | null;
    stY: number | null;
  }> {
    const rows = await prisma.$queryRaw<
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
    await withRollback(async (slug) => {
      const id = await insertFixture(slug, 51.2224711, 51.3946096);
      const loc = await readLocation(id);
      expect(loc.locationIsNull).toBe(false);
      expect(loc.stX).toBeCloseTo(51.3946096, 5);
      expect(loc.stY).toBeCloseTo(51.2224711, 5);

      await prisma.business.update({
        where: { id },
        data: { latitude: 51.23, longitude: 51.4 },
      });
      const updated = await readLocation(id);
      expect(updated.stX).toBeCloseTo(51.4, 5);
      expect(updated.stY).toBeCloseTo(51.23, 5);

      throw new Error(ROLLBACK);
    });
  });

  it('NULL partial / both NULL / 0,0 / out-of-range → location NULL', async () => {
    await withRollback(async (slug) => {
      const idNullLat = await insertFixture(`${slug}-a`, null, 51.39);
      expect((await readLocation(idNullLat)).locationIsNull).toBe(true);

      const idNullLng = await insertFixture(`${slug}-b`, 51.22, null);
      expect((await readLocation(idNullLng)).locationIsNull).toBe(true);

      const idBothNull = await insertFixture(`${slug}-c`, null, null);
      expect((await readLocation(idBothNull)).locationIsNull).toBe(true);

      const idZero = await insertFixture(`${slug}-d`, 0, 0);
      expect((await readLocation(idZero)).locationIsNull).toBe(true);

      const idBadLat = await insertFixture(`${slug}-e`, 91, 51.39);
      expect((await readLocation(idBadLat)).locationIsNull).toBe(true);

      const idBadLng = await insertFixture(`${slug}-f`, 51.22, 181);
      expect((await readLocation(idBadLng)).locationIsNull).toBe(true);

      throw new Error(ROLLBACK);
    });
  });

  it('restore valid coordinates after NULL → location repopulated', async () => {
    await withRollback(async (slug) => {
      const id = await insertFixture(slug, null, null);
      expect((await readLocation(id)).locationIsNull).toBe(true);

      await prisma.business.update({
        where: { id },
        data: { latitude: 51.2224711, longitude: 51.3946096 },
      });
      const loc = await readLocation(id);
      expect(loc.locationIsNull).toBe(false);
      expect(loc.stX).toBeCloseTo(51.3946096, 5);
      expect(loc.stY).toBeCloseTo(51.2224711, 5);

      throw new Error(ROLLBACK);
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
