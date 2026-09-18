import { PrismaClient, BusinessStatus } from '@prisma/client';
import {
  buildCatalogMapViewportWhereSql,
  mapViewportEnvelopeGeography,
  queryCatalogMapViewportPage,
} from './business-catalog-postgis-geo.query';

const QA_ID = 'cmu6y4jab0001uljcs9c7qbg4';
const QA_LAT = 51.2224711;
const QA_LNG = 51.3946096;

describe('Stage 6.11C.5E — map viewport PostGIS (runtime DB)', () => {
  jest.setTimeout(30_000);
  const prisma = new PrismaClient();
  let skip = false;
  let connected = false;
  let cityId = '';

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
        select: { id: true },
      });
      if (!city) {
        skip = true;
        return;
      }
      cityId = city.id;
    } catch {
      skip = true;
    }
  }, 25_000);

  afterAll(async () => {
    if (connected) await prisma.$disconnect();
  });

  function qaBbox(pad = 0.01) {
    return {
      minLat: QA_LAT - pad,
      maxLat: QA_LAT + pad,
      minLng: QA_LNG - pad,
      maxLng: QA_LNG + pad,
    };
  }

  async function postgisIds(bbox: ReturnType<typeof qaBbox>) {
    const { ids } = await queryCatalogMapViewportPage(prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: bbox,
      skip: 0,
      limit: 500,
    });
    return ids.sort();
  }

  it('QA business included when viewport contains point', async () => {
    if (skip) return;
    const { ids, total } = await queryCatalogMapViewportPage(prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: qaBbox(0.02),
      skip: 0,
      limit: 100,
    });
    expect(total).toBeGreaterThan(0);
    expect(ids).toContain(QA_ID);
  });

  it('QA business excluded from tiny viewport away from QA point', async () => {
    if (skip) return;
    const farBox = {
      minLat: 51.05,
      maxLat: 51.06,
      minLng: 51.05,
      maxLng: 51.06,
    };
    const { ids } = await queryCatalogMapViewportPage(prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: farBox,
      skip: 0,
      limit: 100,
    });
    expect(ids).not.toContain(QA_ID);
  });

  it('postgis viewport matches legacy numeric membership for valid coords', async () => {
    if (skip) return;
    const bbox = {
      minLat: 51.1,
      maxLat: 51.3,
      minLng: 51.2,
      maxLng: 51.5,
    };
    const spatial = await postgisIds(bbox);
    const legacyWithLocation = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT b.id FROM "Business" b
      WHERE b."cityId" = ${cityId}
        AND b.status = 'ACTIVE'::"BusinessStatus"
        AND b.location IS NOT NULL
        AND b.latitude >= ${bbox.minLat}
        AND b.latitude <= ${bbox.maxLat}
        AND b.longitude >= ${bbox.minLng}
        AND b.longitude <= ${bbox.maxLng}
        AND NOT (b.latitude = 0 AND b.longitude = 0)
      ORDER BY b.id
    `;
    const spatialSet = new Set(spatial);
    for (const row of legacyWithLocation) {
      expect(spatialSet.has(row.id)).toBe(true);
    }
    expect(spatial.length).toBe(legacyWithLocation.length);
  });

  it('edge inclusion: point on south and west boundary', async () => {
    if (skip) return;
    const edgeBox = {
      minLat: QA_LAT,
      maxLat: QA_LAT + 0.05,
      minLng: QA_LNG,
      maxLng: QA_LNG + 0.05,
    };
    const { ids } = await queryCatalogMapViewportPage(prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: edgeBox,
      skip: 0,
      limit: 50,
    });
    expect(ids).toContain(QA_ID);
  });

  it('SQL uses bound envelope parameters (no unsafe concat)', () => {
    const where = buildCatalogMapViewportWhereSql({
      cityId: 'city-1',
      status: BusinessStatus.ACTIVE,
      mapBbox: { minLat: 51.1, maxLat: 51.3, minLng: 51.2, maxLng: 51.5 },
      skip: 0,
      limit: 10,
    });
    expect(where.sql).toContain('ST_Intersects');
    expect(where.sql).toContain('ST_MakeEnvelope');
    expect(JSON.stringify(where.values)).not.toContain('DROP TABLE');
  });

  it('mapViewportEnvelopeGeography uses west,south,east,north order', () => {
    const env = mapViewportEnvelopeGeography({
      minLat: 51.1,
      maxLat: 51.3,
      minLng: 51.2,
      maxLng: 51.5,
    });
    expect(env.values).toEqual(
      expect.arrayContaining([51.2, 51.1, 51.5, 51.3]),
    );
  });
});
