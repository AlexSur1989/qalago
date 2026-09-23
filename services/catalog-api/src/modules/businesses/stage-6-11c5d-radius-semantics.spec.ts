import { PrismaClient, BusinessStatus } from '@prisma/client';
import {
  queryCatalogRadiusMembers,
  resolveExplicitRadiusMeters,
} from './business-catalog-postgis-geo.query';

describe('Stage 6.11C.5D — radius filter independent of sort (runtime DB)', () => {
  jest.setTimeout(30_000);
  const prisma = new PrismaClient();
  let skip = false;
  let connected = false;
  let cityId = '';
  const userLat = 51.2278;
  const userLng = 51.3865;

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

  async function assertAllWithinKm(
    radiusKm: number,
    members: Array<{ id: string; contextLocationId: string; distanceMeters: number }>,
  ) {
    const maxM = radiusKm * 1000;
    for (const member of members) {
      expect(member.distanceMeters).toBeLessThanOrEqual(maxM);
      const rows = await prisma.$queryRaw<Array<{ distance_m: number }>>`
        SELECT ROUND(ST_Distance(
          bl.location,
          ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography
        ))::int AS distance_m
        FROM "BusinessLocation" bl
        WHERE bl.id = ${member.contextLocationId}
      `;
      expect(rows[0]?.distance_m).toBe(member.distanceMeters);
      expect(rows[0]?.distance_m).toBeLessThanOrEqual(maxM);
    }
  }

  async function membersForKm(radiusKm: number) {
    return queryCatalogRadiusMembers(prisma, {
      cityId,
      status: BusinessStatus.ACTIVE,
      latitude: userLat,
      longitude: userLng,
      radiusMeters: resolveExplicitRadiusMeters(radiusKm),
    });
  }

  it('radiusKm=3 membership is <= 3 km (PostGIS)', async () => {
    if (skip) return;
    const { rows } = await membersForKm(3);
    expect(rows.length).toBeGreaterThan(0);
    await assertAllWithinKm(3, rows);
  });

  it('radius tiers monotonic: 0.5 <= 3 <= 5 <= 15 <= 100', async () => {
    if (skip) return;
    const r05 = (await membersForKm(0.5)).rows.length;
    const r3 = (await membersForKm(3)).rows.length;
    const r5 = (await membersForKm(5)).rows.length;
    const r15 = (await membersForKm(15)).rows.length;
    const r100 = (await membersForKm(100)).rows.length;
    expect(r05).toBeLessThanOrEqual(r3);
    expect(r3).toBeLessThanOrEqual(r5);
    expect(r5).toBeLessThanOrEqual(r15);
    expect(r15).toBeLessThanOrEqual(r100);
  });

  it('recommended+3km must not include businesses outside 3km vs whole-city set', async () => {
    if (skip) return;
    const in3 = new Set((await membersForKm(3)).rows.map((r) => r.id));
    const in100 = (await membersForKm(100)).rows.map((r) => r.id);
    const outside3 = in100.filter((id) => !in3.has(id));
    if (outside3.length === 0) return;
    for (const id of outside3) {
      const rows = await prisma.$queryRaw<Array<{ within: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM "BusinessLocation" bl
          WHERE bl."businessId" = ${id}
            AND bl.location IS NOT NULL
            AND ST_DWithin(
              bl.location,
              ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography,
              ${3000}
            )
        ) AS within
      `;
      expect(rows[0]?.within).toBe(false);
    }
  });
});
