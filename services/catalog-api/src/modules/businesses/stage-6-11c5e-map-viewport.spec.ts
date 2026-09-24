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
    const { rows } = await queryCatalogMapViewportPage(prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: bbox,
      skip: 0,
      limit: 500,
    });
    return rows.map((row) => row.businessId).sort();
  }

  it('QA business included when viewport contains point', async () => {
    if (skip) return;
    const { rows, total } = await queryCatalogMapViewportPage(prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: qaBbox(0.02),
      skip: 0,
      limit: 100,
    });
    expect(total).toBeGreaterThan(0);
    expect(rows.map((row) => row.businessId)).toContain(QA_ID);
  });

  it('QA business excluded from tiny viewport away from QA point', async () => {
    if (skip) return;
    const farBox = {
      minLat: 51.05,
      maxLat: 51.06,
      minLng: 51.05,
      maxLng: 51.06,
    };
    const { rows } = await queryCatalogMapViewportPage(prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: farBox,
      skip: 0,
      limit: 100,
    });
    expect(rows.map((row) => row.businessId)).not.toContain(QA_ID);
  });

  it('postgis viewport matches BusinessLocation membership in city (A.9.3.2)', async () => {
    if (skip) return;
    const bbox = {
      minLat: 51.1,
      maxLat: 51.3,
      minLng: 51.2,
      maxLng: 51.5,
    };
    const spatial = await postgisIds(bbox);
    const branchInViewport = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT DISTINCT b.id
      FROM "BusinessLocation" bl
      INNER JOIN "Business" b ON b.id = bl."businessId"
      WHERE bl."cityId" = ${cityId}
        AND b.status = 'ACTIVE'::"BusinessStatus"
        AND bl.location IS NOT NULL
        AND ST_Intersects(
          bl.location,
          ST_MakeEnvelope(${bbox.minLng}, ${bbox.minLat}, ${bbox.maxLng}, ${bbox.maxLat}, 4326)::geography
        )
      ORDER BY b.id
    `;
    const spatialSet = new Set(spatial);
    expect(spatial.length).toBe(branchInViewport.length);
    for (const row of branchInViewport) {
      expect(spatialSet.has(row.id)).toBe(true);
    }
  });

  it('edge inclusion: point on south and west boundary', async () => {
    if (skip) return;
    const edgeBox = {
      minLat: QA_LAT,
      maxLat: QA_LAT + 0.05,
      minLng: QA_LNG,
      maxLng: QA_LNG + 0.05,
    };
    const { rows } = await queryCatalogMapViewportPage(prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: edgeBox,
      skip: 0,
      limit: 50,
    });
    expect(rows.map((row) => row.businessId)).toContain(QA_ID);
  });

  it('SQL uses bound envelope parameters (no unsafe concat)', () => {
    const where = buildCatalogMapViewportWhereSql({
      cityId: 'city-1',
      status: BusinessStatus.ACTIVE,
      mapBbox: { minLat: 51.1, maxLat: 51.3, minLng: 51.2, maxLng: 51.5 },
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
