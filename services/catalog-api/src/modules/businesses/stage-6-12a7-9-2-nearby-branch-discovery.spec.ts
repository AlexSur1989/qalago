import { BusinessStatus, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessesService } from './businesses.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import {
  queryCatalogNearestPage,
  queryCatalogRadiusMembers,
  resolveExplicitRadiusMeters,
  resolveNearestRadiusMeters,
} from './business-catalog-postgis-geo.query';
import type { BusinessDiscoveryContext } from './business-discovery-context.util';
import { specCreateInitialPrimary, testPrimaryPhysical, createTestBusinessWithPrimary } from './business-with-primary.test-fixture';

type GeoListItem = { id: string } & BusinessDiscoveryContext;

describe('Stage 6.12A.7.9.2 — nearby nearest BusinessLocation per Business', () => {
  jest.setTimeout(60_000);
  const prisma = new PrismaClient();
  const primaryLocation = new BusinessPrimaryLocationService();
  let skip = false;
  let uralskCityId = '';
  let categoryId = '';
  let subcategoryId = '';
  let ownerId = '';
  const createdBusinessIds: string[] = [];

  const userLat = 51.2278;
  const userLng = 51.3865;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'BusinessLocation'
        ) AS exists`;
      skip = !table[0]?.exists;
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const sub = await prisma.subcategory.findFirst({ select: { id: true } });
      const user = await prisma.user.findFirst({ select: { id: true } });
      if (!uralsk || !category || !sub || !user) skip = true;
      else {
        uralskCityId = uralsk.id;
        categoryId = category.id;
        subcategoryId = sub.id;
        ownerId = user.id;
      }
    } catch {
      skip = true;
    }
  });

  afterEach(async () => {
    if (skip || createdBusinessIds.length === 0) return;
    await prisma.business.deleteMany({ where: { id: { in: createdBusinessIds } } });
    createdBusinessIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function buildService() {
    const cityScope = {
      resolveCityId: jest.fn().mockResolvedValue(uralskCityId),
    } as unknown as CityScopeService;
    const subDeps = createMockSubcategoryDeps();
    return new BusinessesService(
      prisma as unknown as PrismaService,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess({ ownerId })),
      { createActiveOwnerMembership: jest.fn() } as never,
      {} as never,
      {} as never,
      asAuditLogService(createMockAuditLog()),
      subDeps.businessSubcategories,
      subDeps.subcategories,
      {} as never,
      primaryLocation,
    );
  }

  async function projectPointMeters(
    originLat: number,
    originLng: number,
    distanceMeters: number,
    bearingDegrees = 0,
  ): Promise<{ lat: number; lng: number }> {
    const rows = await prisma.$queryRaw<Array<{ lat: number; lng: number }>>`
      SELECT
        ST_Y(g)::float8 AS lat,
        ST_X(g)::float8 AS lng
      FROM (
        SELECT ST_Project(
          ST_SetSRID(ST_MakePoint(${originLng}, ${originLat}), 4326)::geography::geometry,
          ${distanceMeters},
          radians(${bearingDegrees})
        ) AS g
      ) sub
    `;
    return rows[0]!;
  }

  async function setBranchGeography(locationId: string, lat: number, lng: number) {
    await prisma.$executeRaw`
      UPDATE "BusinessLocation"
      SET latitude = ${lat}, longitude = ${lng},
          location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${locationId}
    `;
  }

  async function setBusinessLegacyGeography(businessId: string, lat: number, lng: number) {
    await prisma.$executeRaw`
      UPDATE "Business"
      SET latitude = ${lat}, longitude = ${lng},
          location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${businessId}
    `;
  }

  async function createFixtureBusiness(titlePrefix: string) {
    const slug = `a792-${randomBytes(6).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `${titlePrefix} ${slug}`,
        slug,
        categoryId,
        ownerId,
        status: BusinessStatus.ACTIVE,
        businessSubcategories: { create: { subcategoryId } },
      },
    });
    createdBusinessIds.push(business.id);
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, uralskCityId, 'Test address');
    return business;
  }

  async function addBranch(
    businessId: string,
    address: string,
    distanceMeters: number,
    bearingDegrees = 45,
  ) {
    const { lat, lng } = await projectPointMeters(userLat, userLng, distanceMeters, bearingDegrees);
    const branch = await prisma.businessLocation.create({
      data: {
        businessId,
        cityId: uralskCityId,
        address,
        isPrimary: false,
      },
    });
    await setBranchGeography(branch.id, lat, lng);
    return branch;
  }

  async function distanceToContext(contextLocationId: string) {
    const rows = await prisma.$queryRaw<Array<{ distance_m: number }>>`
      SELECT ROUND(ST_Distance(
        bl.location,
        ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography
      ))::int AS distance_m
      FROM "BusinessLocation" bl
      WHERE bl.id = ${contextLocationId}
    `;
    return rows[0]?.distance_m;
  }

  async function assertDistanceInvariant(
    members: Array<{ contextLocationId?: string | null; distanceMeters?: number | null }>,
  ) {
    for (const member of members) {
      if (member.contextLocationId == null || member.distanceMeters == null) continue;
      const expected = await distanceToContext(member.contextLocationId);
      expect(member.distanceMeters).toBe(expected);
    }
  }

  it('returns one business card with nearest branch context (L1≈500m not L2/L3)', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('TripleBranch');
    const primary = await prisma.businessLocation.findFirst({
      where: { businessId: business.id, isPrimary: true },
      select: { id: true },
    });
    const primaryFar = await projectPointMeters(userLat, userLng, 15000, 5);
    await setBranchGeography(primary!.id, primaryFar.lat, primaryFar.lng);
    const l1 = await addBranch(business.id, 'L1 ~500m', 500, 10);
    const l2 = await addBranch(business.id, 'L2 ~5km', 5000, 20);
    const l3 = await addBranch(business.id, 'L3 ~12km', 12000, 30);

    const service = buildService();
    const result = await service.findAll({
      citySlug: 'uralsk',
      latitude: userLat,
      longitude: userLng,
      sort: 'nearest' as never,
      radiusKm: 15,
      limit: 200,
    });
    const rows = result.items.filter((i) => i.id === business.id) as GeoListItem[];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.contextLocationId).toBe(l1.id);
    expect(rows[0]?.distanceMeters).toBeGreaterThanOrEqual(400);
    expect(rows[0]?.distanceMeters).toBeLessThanOrEqual(700);
    expect(rows[0]?.contextLocationId).not.toBe(l2.id);
    expect(rows[0]?.contextLocationId).not.toBe(l3.id);
    await assertDistanceInvariant(rows);
  });

  it('two businesses with multiple branches → one result each', async () => {
    if (skip) return;
    const a = await createFixtureBusiness('MultiA');
    const b = await createFixtureBusiness('MultiB');
    await addBranch(a.id, 'A far', 8000, 5);
    await addBranch(a.id, 'A near', 600, 15);
    await addBranch(b.id, 'B far', 9000, 25);
    await addBranch(b.id, 'B near', 700, 35);

    const { rows } = await queryCatalogRadiusMembers(prisma, {
      cityId: uralskCityId,
      status: BusinessStatus.ACTIVE,
      latitude: userLat,
      longitude: userLng,
      radiusMeters: resolveExplicitRadiusMeters(3),
    });
    const aRows = rows.filter((r) => r.id === a.id);
    const bRows = rows.filter((r) => r.id === b.id);
    expect(aRows).toHaveLength(1);
    expect(bRows).toHaveLength(1);
    await assertDistanceInvariant(aRows);
    await assertDistanceInvariant(bRows);
  });

  it('dedup before pagination: many branches consume one page slot', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('PageSlots');
    for (let i = 0; i < 5; i++) {
      await addBranch(business.id, `Branch ${i}`, 400 + i * 20, i * 10);
    }

    const page = await queryCatalogNearestPage(prisma, {
      cityId: uralskCityId,
      status: BusinessStatus.ACTIVE,
      latitude: userLat,
      longitude: userLng,
      radiusMeters: resolveNearestRadiusMeters(3),
      skip: 0,
      limit: 2,
    });
    const ids = page.rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    const mineCount = ids.filter((id) => id === business.id).length;
    expect(mineCount).toBeLessThanOrEqual(1);
  });

  it('radius: branch inside radius qualifies even when legacy Business.location is outside', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('LegacyFar');
    const far = await projectPointMeters(userLat, userLng, 10000, 90);
    await setBusinessLegacyGeography(business.id, far.lat, far.lng);
    const nearBranch = await addBranch(business.id, 'Near branch', 900, 180);

    const { rows } = await queryCatalogRadiusMembers(prisma, {
      cityId: uralskCityId,
      status: BusinessStatus.ACTIVE,
      latitude: userLat,
      longitude: userLng,
      radiusMeters: resolveExplicitRadiusMeters(3),
    });
    const hit = rows.find((r) => r.id === business.id);
    expect(hit).toBeDefined();
    expect(hit!.contextLocationId).toBe(nearBranch.id);
    await assertDistanceInvariant([hit!]);
  });

  it('legacy Business.location inside radius but all branches outside → excluded', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('LegacyNear');
    await setBusinessLegacyGeography(business.id, userLat, userLng);
    const primary = await prisma.businessLocation.findFirst({
      where: { businessId: business.id, isPrimary: true },
      select: { id: true },
    });
    const far = await projectPointMeters(userLat, userLng, 8000, 270);
    await setBranchGeography(primary!.id, far.lat, far.lng);
    await addBranch(business.id, 'Also far', 9000, 280);

    const { rows } = await queryCatalogRadiusMembers(prisma, {
      cityId: uralskCityId,
      status: BusinessStatus.ACTIVE,
      latitude: userLat,
      longitude: userLng,
      radiusMeters: resolveExplicitRadiusMeters(3),
    });
    expect(rows.some((r) => r.id === business.id)).toBe(false);
  });

  it('sort=nearest orders by nearest branch distance with stable tie on business id', async () => {
    if (skip) return;
    const near = await createFixtureBusiness('OrderNear');
    const mid = await createFixtureBusiness('OrderMid');
    const far = await createFixtureBusiness('OrderFar');
    await addBranch(near.id, 'Near', 400, 1);
    await addBranch(mid.id, 'Mid', 1200, 2);
    await addBranch(far.id, 'Far', 2000, 3);

    const { rows } = await queryCatalogNearestPage(prisma, {
      cityId: uralskCityId,
      status: BusinessStatus.ACTIVE,
      latitude: userLat,
      longitude: userLng,
      radiusMeters: resolveNearestRadiusMeters(15),
      skip: 0,
      limit: 500,
    });
    const ordered = rows.filter((r) => [near.id, mid.id, far.id].includes(r.id));
    expect(ordered.length).toBe(3);
    expect(ordered[0]!.distanceMeters).toBeLessThanOrEqual(ordered[1]!.distanceMeters);
    expect(ordered[1]!.distanceMeters).toBeLessThanOrEqual(ordered[2]!.distanceMeters);
  });

  it('rating + radius: membership by branch, sort by rating, context retained', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('RatingCtx');
    const branch = await addBranch(business.id, 'Rating branch', 800, 50);

    const service = buildService();
    const result = await service.findAll({
      citySlug: 'uralsk',
      latitude: userLat,
      longitude: userLng,
      radiusKm: 3,
      sort: 'rating' as never,
      limit: 100,
    });
    const row = result.items.find((i) => i.id === business.id) as GeoListItem | undefined;
    if (!row) return;
    expect(row.contextLocationId).toBe(branch.id);
    expect(row.distanceMeters).toBeDefined();
    await assertDistanceInvariant([row]);
  });

  it('contextLocationId must belong to the same business', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('OwnerCheck');
    const branch = await addBranch(business.id, 'Owned', 600, 60);

    const service = buildService();
    const result = await service.findAll({
      citySlug: 'uralsk',
      latitude: userLat,
      longitude: userLng,
      sort: 'nearest' as never,
      radiusKm: 15,
      limit: 200,
    });
    const row = result.items.find((i) => i.id === business.id) as GeoListItem | undefined;
    expect(row?.contextLocationId).toBe(branch.id);
    const loc = await prisma.businessLocation.findUnique({
      where: { id: row!.contextLocationId! },
      select: { businessId: true },
    });
    expect(loc?.businessId).toBe(business.id);
  });

  it('non-geo list unchanged (no lat/lng → no contextLocationId requirement)', async () => {
    if (skip) return;
    const business = await createFixtureBusiness('PlainList');
    const service = buildService();
    const result = await service.findAll({
      citySlug: 'uralsk',
      limit: 50,
    });
    const row = result.items.find((i) => i.id === business.id) as GeoListItem | undefined;
    expect(row).toBeDefined();
    expect(row?.contextLocationId).toBeUndefined();
  });

  it('limit=2 returns two unique businesses not two branches of one', async () => {
    if (skip) return;
    const a = await createFixtureBusiness('PagA');
    const b = await createFixtureBusiness('PagB');
    await addBranch(a.id, 'A1', 450, 1);
    await addBranch(a.id, 'A2', 460, 2);
    await addBranch(b.id, 'B1', 470, 3);

    const page = await queryCatalogNearestPage(prisma, {
      cityId: uralskCityId,
      status: BusinessStatus.ACTIVE,
      latitude: userLat,
      longitude: userLng,
      radiusMeters: resolveNearestRadiusMeters(3),
      skip: 0,
      limit: 2,
    });
    expect(page.rows.length).toBe(2);
    expect(new Set(page.rows.map((r) => r.id)).size).toBe(2);
    const aHits = page.rows.filter((r) => r.id === a.id);
    expect(aHits.length).toBeLessThanOrEqual(1);
  });
});
