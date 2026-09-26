import { randomBytes } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { POSTGIS_TEST_ROLLBACK, withPostgisIntegrationTransaction } from './postgis-integration-test.util';

const BACKFILL_INSERT_SQL = Prisma.sql`
  INSERT INTO "BusinessLocation" (
    "id", "businessId", "cityId", "address", "latitude", "longitude",
    "locationSource", "workHours", "phone", "whatsapp", "instagram", "website",
    "isPrimary", "createdAt", "updatedAt"
  )
  SELECT
    'bl' || substr(md5(b."id" || ':6.12A.2-primary'), 1, 22),
    b."id", b."cityId", b."address", b."latitude", b."longitude",
    b."locationSource", b."workHours", b."phone", b."whatsapp", b."instagram", b."website",
    true, b."createdAt", CURRENT_TIMESTAMP
  FROM "Business" b
  WHERE NOT EXISTS (SELECT 1 FROM "BusinessLocation" bl WHERE bl."businessId" = b."id")
`;

describe('Stage 6.12A.2 — BusinessLocation backfill integrity (runtime DB)', () => {
  const prisma = new PrismaClient();
  let skip = false;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'BusinessLocation'
        ) AS exists`;
      skip = !table[0]?.exists;
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('every Business has exactly one primary BusinessLocation', async () => {
    if (skip) return;
    const businesses = await prisma.business.count();
    const locations = await prisma.businessLocation.count();
    const primaries = await prisma.businessLocation.count({ where: { isPrimary: true } });
    expect(locations).toBe(businesses);
    expect(primaries).toBe(businesses);

    const orphans = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*)::bigint AS n
      FROM "Business" b
      LEFT JOIN "BusinessLocation" bl ON bl."businessId" = b."id"
      WHERE bl."id" IS NULL`;
    expect(Number(orphans[0]?.n ?? 0)).toBe(0);

    const multiPrimary = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*)::bigint AS n FROM (
        SELECT bl."businessId"
        FROM "BusinessLocation" bl
        WHERE bl."isPrimary" = true
        GROUP BY bl."businessId"
        HAVING COUNT(*) > 1
      ) t`;
    expect(Number(multiPrimary[0]?.n ?? 0)).toBe(0);
  });

  it('field parity between Business and primary BusinessLocation', async () => {
    if (skip) return;
    const mismatches = await prisma.$queryRaw<Array<{ field: string; n: bigint }>>`
      SELECT 'cityId' AS field, COUNT(*)::bigint AS n
      FROM "Business" b
      JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
      WHERE b."cityId" IS DISTINCT FROM bl."cityId"
      UNION ALL
      SELECT 'address', COUNT(*)::bigint
      FROM "Business" b
      JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
      WHERE b."address" IS DISTINCT FROM bl."address"
      UNION ALL
      SELECT 'latitude', COUNT(*)::bigint
      FROM "Business" b
      JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
      WHERE b."latitude" IS DISTINCT FROM bl."latitude"
      UNION ALL
      SELECT 'longitude', COUNT(*)::bigint
      FROM "Business" b
      JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
      WHERE b."longitude" IS DISTINCT FROM bl."longitude"
      UNION ALL
      SELECT 'locationSource', COUNT(*)::bigint
      FROM "Business" b
      JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
      WHERE b."locationSource" IS DISTINCT FROM bl."locationSource"
      UNION ALL
      SELECT 'workHours', COUNT(*)::bigint
      FROM "Business" b
      JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
      WHERE b."workHours" IS DISTINCT FROM bl."workHours"
      UNION ALL
      SELECT 'phone', COUNT(*)::bigint
      FROM "Business" b
      JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
      WHERE b."phone" IS DISTINCT FROM bl."phone"
      UNION ALL
      SELECT 'whatsapp', COUNT(*)::bigint
      FROM "Business" b
      JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
      WHERE b."whatsapp" IS DISTINCT FROM bl."whatsapp"
      UNION ALL
      SELECT 'instagram', COUNT(*)::bigint
      FROM "Business" b
      JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
      WHERE b."instagram" IS DISTINCT FROM bl."instagram"
      UNION ALL
      SELECT 'website', COUNT(*)::bigint
      FROM "Business" b
      JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
      WHERE b."website" IS DISTINCT FROM bl."website"`;
    for (const row of mismatches) {
      expect(Number(row.n)).toBe(0);
    }
  });

  it('geo parity: coordinates imply location; null coords imply null location', async () => {
    if (skip) return;
    const withCoordsNullGeo = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*)::bigint AS n
      FROM "BusinessLocation" bl
      WHERE bl."latitude" IS NOT NULL AND bl."longitude" IS NOT NULL
        AND bl."location" IS NULL`;
    expect(Number(withCoordsNullGeo[0]?.n ?? 0)).toBe(0);

    const nullCoordsWithGeo = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*)::bigint AS n
      FROM "BusinessLocation" bl
      WHERE (bl."latitude" IS NULL OR bl."longitude" IS NULL)
        AND bl."location" IS NOT NULL`;
    expect(Number(nullCoordsWithGeo[0]?.n ?? 0)).toBe(0);

    const geoDrift = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*)::bigint AS n
      FROM "Business" b
      JOIN "BusinessLocation" bl ON bl."businessId" = b."id" AND bl."isPrimary" = true
      WHERE b."location" IS NOT NULL AND bl."location" IS NOT NULL
        AND ST_Distance(b."location", bl."location") > 0.5`;
    expect(Number(geoDrift[0]?.n ?? 0)).toBe(0);
  });

  it('idempotent backfill insert affects zero rows when all businesses already have locations', async () => {
    if (skip) return;
    const before = await prisma.businessLocation.count();
    const inserted = await prisma.$executeRaw(BACKFILL_INSERT_SQL);
    const after = await prisma.businessLocation.count();
    expect(inserted).toBe(0);
    expect(after).toBe(before);
  });

  it('skips businesses that already have a location (transaction fixture)', async () => {
    if (skip) return;
    const city = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
    const category = await prisma.category.findFirst({ select: { id: true } });
    if (!city || !category) return;

    const slug = `a12a2-skip-${randomBytes(5).toString('hex')}`;
    try {
      await withPostgisIntegrationTransaction(prisma, async (tx) => {
        const biz = await tx.business.create({
          data: {
            title: 'Skip test',
            slug,
            categoryId: category.id,
            cityId: city.id,
            status: 'PENDING',
          },
        });
        await tx.businessLocation.create({
          data: {
            address: 'Branch addr',
            businessId: biz.id,
            cityId: city.id,
            isPrimary: true,
          },
        });
        const n = await tx.$executeRaw`
          INSERT INTO "BusinessLocation" (
            "id", "businessId", "cityId", "address", "isPrimary", "createdAt", "updatedAt"
          )
          SELECT
            'bl' || substr(md5(b."id" || ':6.12A.2-primary'), 1, 22),
            b."id", b."cityId", b."address", true, b."createdAt", CURRENT_TIMESTAMP
          FROM "Business" b
          WHERE b."id" = ${biz.id}
            AND NOT EXISTS (
              SELECT 1 FROM "BusinessLocation" bl WHERE bl."businessId" = b."id"
            )`;
        expect(n).toBe(0);
        expect(await tx.businessLocation.count({ where: { businessId: biz.id } })).toBe(1);
        throw new Error(POSTGIS_TEST_ROLLBACK);
      });
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  });

  it('domain relations unchanged (reviews, favorites, memberships)', async () => {
    if (skip) return;
    const reviewCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Review'
        AND column_name = 'businessLocationId'`;
    expect(reviewCols).toHaveLength(0);
    expect(await prisma.review.count()).toBeGreaterThanOrEqual(0);
    expect(await prisma.favorite.count()).toBeGreaterThanOrEqual(0);
    expect(await prisma.businessMembership.count()).toBeGreaterThanOrEqual(0);
  });
});
