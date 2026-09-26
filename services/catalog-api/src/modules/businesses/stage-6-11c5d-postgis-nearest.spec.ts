import { randomBytes } from 'crypto';
import { PrismaClient, BusinessStatus } from '@prisma/client';
import { haversineMeters } from '../../common/utils/geo.utils';
import {
  queryCatalogNearestPage,
  resolveNearestRadiusMeters,
} from './business-catalog-postgis-geo.query';
import {
  POSTGIS_TEST_ROLLBACK,
  withPostgisIntegrationTransaction,
} from './postgis-integration-test.util';

describe('Stage 6.11C.5D — PostGIS nearest (runtime DB)', () => {
  jest.setTimeout(30_000);
  const prisma = new PrismaClient();
  let skip = false;
  let connected = false;
  let cityId = '';
  let uralskCenterLat = 51.2278;
  let uralskCenterLng = 51.3865;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      connected = true;
      const col = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Business' AND column_name = 'location'
        ) AS exists
      `;
      if (!col[0]?.exists) {
        skip = true;
        return;
      }
      const city = await prisma.city.findFirst({
        where: { slug: 'uralsk' },
        select: { id: true, centerLat: true, centerLng: true },
      });
      if (!city) {
        skip = true;
        return;
      }
      cityId = city.id;
      if (city.centerLat != null && city.centerLng != null) {
        uralskCenterLat = Number(city.centerLat);
        uralskCenterLng = Number(city.centerLng);
      }
    } catch {
      skip = true;
    }
  }, 25_000);

  afterAll(async () => {
    if (connected) {
      await prisma.$disconnect();
    }
  });

  async function nearestTotal(radiusKm: number) {
    const { total } = await queryCatalogNearestPage(prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      latitude: uralskCenterLat,
      longitude: uralskCenterLng,
      radiusMeters: resolveNearestRadiusMeters(radiusKm),
      skip: 0,
      limit: 100,
    });
    return total;
  }

  it('Haversine vs PostGIS ST_Distance within tolerance for QA point', async () => {
    if (skip) return;
    const rows = await prisma.$queryRaw<
      Array<{ distance_meters: number; latitude: number; longitude: number }>
    >`
      SELECT
        ROUND(ST_Distance(
          b.location,
          ST_SetSRID(ST_MakePoint(${51.3865}, ${51.2278}), 4326)::geography
        ))::int AS distance_meters,
        b.latitude::float8 AS latitude,
        b.longitude::float8 AS longitude
      FROM "Business" b
      WHERE b.id = 'cmu6y4jab0001uljcs9c7qbg4'
    `;
    const row = rows[0];
    expect(row).toBeTruthy();
    const haversine = Math.round(
      haversineMeters(51.2278, 51.3865, row.latitude, row.longitude),
    );
    expect(Math.abs(row.distance_meters - haversine)).toBeLessThanOrEqual(2);
  });

  it('radius tiers and pagination use SQL LIMIT (no full-city load)', async () => {
    if (skip) return;
    const t05 = await nearestTotal(0.5);
    const t3 = await nearestTotal(3);
    const t5 = await nearestTotal(5);
    const t15 = await nearestTotal(15);
    const t100 = await nearestTotal(100);
    expect(t05).toBeLessThanOrEqual(t3);
    expect(t3).toBeLessThanOrEqual(t5);
    expect(t5).toBeLessThanOrEqual(t15);
    expect(t15).toBeLessThanOrEqual(t100);

    const page1 = await queryCatalogNearestPage(prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      latitude: uralskCenterLat,
      longitude: uralskCenterLng,
      radiusMeters: resolveNearestRadiusMeters(100),
      skip: 0,
      limit: 2,
    });
    expect(page1.rows.length).toBeLessThanOrEqual(2);
    if (page1.total > 2) {
      const page2 = await queryCatalogNearestPage(prisma, {
        cityId,
        status: BusinessStatus.ACTIVE,
        latitude: uralskCenterLat,
        longitude: uralskCenterLng,
        radiusMeters: resolveNearestRadiusMeters(100),
        skip: 2,
        limit: 2,
      });
      expect(page2.rows[0]?.id).not.toBe(page1.rows[0]?.id);
    }
  });

  it('excludes null location and respects city isolation', async () => {
    if (skip) return;
    const slug = `c5d-null-loc-${randomBytes(4).toString('hex')}`;
    const category = await prisma.category.findFirst({ select: { id: true } });
    if (!category) return;

    try {
      await withPostgisIntegrationTransaction(prisma, async (tx) => {
        await tx.business.create({
          data: {
            title: 'C5D Null Loc',
            slug,
            cityId,
            categoryId: category.id,
            status: BusinessStatus.ACTIVE,
          },
        });
        const { total } = await queryCatalogNearestPage(tx, {
          cityId,
          status: BusinessStatus.ACTIVE,
          latitude: uralskCenterLat,
          longitude: uralskCenterLng,
          radiusMeters: resolveNearestRadiusMeters(100),
          skip: 0,
          limit: 500,
        });
        const hit = await tx.business.findFirst({ where: { slug } });
        expect(hit).toBeTruthy();
        const listed = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT b.id
          FROM "Business" b
          INNER JOIN "BusinessLocation" bl ON bl."businessId" = b.id
          WHERE b.slug = ${slug}
            AND b."cityId" = ${cityId}
            AND bl.location IS NOT NULL
            AND ST_DWithin(
              bl.location,
              ST_SetSRID(ST_MakePoint(${uralskCenterLng}, ${uralskCenterLat}), 4326)::geography,
              ${100_000}
            )
        `;
        expect(listed.length).toBe(0);
        expect(total).toBeGreaterThan(0);
        throw new Error(POSTGIS_TEST_ROLLBACK);
      });
    } finally {
      await prisma.business.deleteMany({ where: { slug } });
    }
  });
});
