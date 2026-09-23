import { BusinessStatus, PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessesService } from './businesses.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import {
  buildCatalogMapLocationViewportWhereSql,
  queryCatalogMapLocationViewportPage,
} from './business-catalog-postgis-geo.query';
import type { MapLocationBusinessListItem } from './business-map-location-list.presenter';

describe('Stage 6.12A.7.1 — map forMap viewport (BusinessLocation grain)', () => {
  jest.setTimeout(45_000);
  const prisma = new PrismaClient();
  const primaryLocation = new BusinessPrimaryLocationService();
  let skip = false;
  let uralskCityId = '';
  let aktobeCityId = '';
  let categoryId = '';
  let subcategoryId = '';
  let ownerId = '';
  const createdBusinessIds: string[] = [];

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
      const aktobe = await prisma.city.findFirst({ where: { slug: 'aktobe' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const sub = await prisma.subcategory.findFirst({ select: { id: true } });
      const user = await prisma.user.findFirst({ select: { id: true } });
      if (!uralsk || !aktobe || !category || !sub || !user) skip = true;
      else {
        uralskCityId = uralsk.id;
        aktobeCityId = aktobe.id;
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

  function buildService(cityId = uralskCityId) {
    const cityScope = {
      resolveCityId: jest.fn().mockResolvedValue(cityId),
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

  async function createMapFixtureBusiness(options?: {
    titlePrefix?: string;
    status?: BusinessStatus;
    primaryLat?: number;
    primaryLng?: number;
    primaryAddress?: string;
  }) {
    const slug = `a7map-${randomBytes(6).toString('hex')}`;
    const lat = options?.primaryLat ?? 51.2278;
    const lng = options?.primaryLng ?? 51.3865;
    const business = await prisma.business.create({
      data: {
        title: `${options?.titlePrefix ?? 'A7 Map'} ${slug}`,
        slug,
        categoryId,
        cityId: uralskCityId,
        address: options?.primaryAddress ?? 'Primary Uralsk addr',
        ownerId,
        status: options?.status ?? BusinessStatus.ACTIVE,
        latitude: lat,
        longitude: lng,
        businessSubcategories: { create: { subcategoryId } },
      },
    });
    createdBusinessIds.push(business.id);
    await primaryLocation.createInitialPrimary(prisma, business);
    return business;
  }

  async function addSecondaryLocation(
    businessId: string,
    data: {
      cityId: string;
      address: string;
      latitude?: number | null;
      longitude?: number | null;
    },
  ) {
    return prisma.businessLocation.create({
      data: {
        businessId,
        cityId: data.cityId,
        address: data.address,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        isPrimary: false,
      },
    });
  }

  const uralskBbox = {
    minLat: 51.2,
    maxLat: 51.25,
    minLng: 51.35,
    maxLng: 51.4,
  };

  it('location viewport SQL filters by bl.cityId and bl.location', () => {
    const where = buildCatalogMapLocationViewportWhereSql({
      cityId: 'city-1',
      status: BusinessStatus.ACTIVE,
      mapBbox: uralskBbox,
    });
    expect(where.sql).toContain('bl."cityId"');
    expect(where.sql).toContain('bl.location IS NOT NULL');
    expect(where.sql).toContain('ST_Intersects(bl.location');
    expect(where.sql).not.toContain('b."cityId"');
  });

  it('returns one map row for one qualifying location', async () => {
    if (skip) return;
    const business = await createMapFixtureBusiness();
    const service = buildService();
    const result = await service.findAll({
      citySlug: 'uralsk',
      forMap: true,
      ...uralskBbox,
      limit: 50,
    });
    const rows = result.items.filter(
      (item): item is MapLocationBusinessListItem =>
        item.id === business.id && 'locationId' in item,
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]?.locationId).toBeDefined();
    expect(rows[0]?.contextLocationId).toBe(rows[0]?.locationId);
    expect(rows[0]?.address).toBe('Primary Uralsk addr');
  });

  it('one business with three locations in viewport returns three rows', async () => {
    if (skip) return;
    const business = await createMapFixtureBusiness({ titlePrefix: 'Triple' });
    const l2 = await addSecondaryLocation(business.id, {
      cityId: uralskCityId,
      address: 'Branch L2 addr',
      latitude: 51.2281,
      longitude: 51.3868,
    });
    const l3 = await addSecondaryLocation(business.id, {
      cityId: uralskCityId,
      address: 'Branch L3 addr',
      latitude: 51.2284,
      longitude: 51.3871,
    });

    const { rows, total } = await queryCatalogMapLocationViewportPage(prisma, {
      cityId: uralskCityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: uralskBbox,
      skip: 0,
      limit: 100,
    });
    const mine = rows.filter((row) => row.businessId === business.id);
    expect(total).toBeGreaterThanOrEqual(3);
    expect(mine).toHaveLength(3);
    expect(new Set(mine.map((r) => r.locationId)).size).toBe(3);
    expect(mine.every((r) => r.businessId === business.id)).toBe(true);

    const service = buildService();
    const api = await service.findAll({
      citySlug: 'uralsk',
      forMap: true,
      ...uralskBbox,
      limit: 100,
    });
    const apiRows = api.items.filter(
      (i): i is MapLocationBusinessListItem =>
        i.id === business.id && 'locationId' in i,
    );
    expect(apiRows).toHaveLength(3);
    const locationIds = apiRows.map((i) => i.locationId).sort();
    const primary = await prisma.businessLocation.findFirst({
      where: { businessId: business.id, isPrimary: true },
      select: { id: true },
    });
    expect(locationIds).toEqual(
      [primary!.id, l2.id, l3.id].sort(),
    );
  });

  it('paginates physical locations not businesses', async () => {
    if (skip) return;
    const business = await createMapFixtureBusiness({ titlePrefix: 'Page' });
    await addSecondaryLocation(business.id, {
      cityId: uralskCityId,
      address: 'Page L2',
      latitude: 51.2282,
      longitude: 51.3869,
    });
    await addSecondaryLocation(business.id, {
      cityId: uralskCityId,
      address: 'Page L3',
      latitude: 51.2283,
      longitude: 51.387,
    });

    const page1 = await queryCatalogMapLocationViewportPage(prisma, {
      cityId: uralskCityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: uralskBbox,
      skip: 0,
      limit: 2,
    });
    const page2 = await queryCatalogMapLocationViewportPage(prisma, {
      cityId: uralskCityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: uralskBbox,
      skip: 2,
      limit: 2,
    });
    const mine1 = page1.rows.filter((r) => r.businessId === business.id);
    const mine2 = page2.rows.filter((r) => r.businessId === business.id);
    expect(mine1.length + mine2.length).toBe(3);
    const allIds = [...mine1, ...mine2].map((r) => r.locationId);
    expect(new Set(allIds).size).toBe(3);
  });

  it('cross-city: Uralsk map shows Uralsk branch only; Aktobe map shows Aktobe branch', async () => {
    if (skip) return;
    const business = await createMapFixtureBusiness({ titlePrefix: 'CrossCity' });
    const aktobeBranch = await addSecondaryLocation(business.id, {
      cityId: aktobeCityId,
      address: 'Aktobe branch addr',
      latitude: 50.283,
      longitude: 57.167,
    });

    const uralskService = buildService(uralskCityId);
    const uralskResult = await uralskService.findAll({
      citySlug: 'uralsk',
      forMap: true,
      ...uralskBbox,
      limit: 100,
    });
    const uralskRows = uralskResult.items.filter(
      (i): i is MapLocationBusinessListItem => i.id === business.id && 'locationId' in i,
    );
    expect(uralskRows.some((r) => r.locationId === aktobeBranch.id)).toBe(false);
    expect(uralskRows.length).toBeGreaterThanOrEqual(1);

    const aktobeBbox = { minLat: 50.27, maxLat: 50.29, minLng: 57.15, maxLng: 57.18 };
    const aktobeService = buildService(aktobeCityId);
    const aktobeResult = await aktobeService.findAll({
      citySlug: 'aktobe',
      forMap: true,
      ...aktobeBbox,
      limit: 50,
    });
    const aktobeRows = aktobeResult.items.filter(
      (i): i is MapLocationBusinessListItem => i.id === business.id && 'locationId' in i,
    );
    expect(aktobeRows).toHaveLength(1);
    expect(aktobeRows[0]?.locationId).toBe(aktobeBranch.id);
    expect(aktobeRows[0]?.address).toBe('Aktobe branch addr');
  });

  it('excludes inactive parent business locations', async () => {
    if (skip) return;
    const business = await createMapFixtureBusiness({
      titlePrefix: 'Inactive',
      status: BusinessStatus.BLOCKED,
    });
    const { rows } = await queryCatalogMapLocationViewportPage(prisma, {
      cityId: uralskCityId,
      status: BusinessStatus.ACTIVE,
      mapBbox: uralskBbox,
      skip: 0,
      limit: 200,
    });
    expect(rows.some((r) => r.businessId === business.id)).toBe(false);
  });

  it('excludes locations without coordinates', async () => {
    if (skip) return;
    const business = await createMapFixtureBusiness({ titlePrefix: 'NoCoords' });
    await addSecondaryLocation(business.id, {
      cityId: uralskCityId,
      address: 'No coords branch',
      latitude: null,
      longitude: null,
    });
    const service = buildService();
    const result = await service.findAll({
      citySlug: 'uralsk',
      forMap: true,
      ...uralskBbox,
      limit: 100,
    });
    const rows = result.items.filter(
      (i): i is MapLocationBusinessListItem => i.id === business.id && 'locationId' in i,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.address).toBe('Primary Uralsk addr');
  });

  it('does not collapse identical coordinates — distinct locationId', async () => {
    if (skip) return;
    const business = await createMapFixtureBusiness({
      titlePrefix: 'SameCoords',
      primaryLat: 51.2279,
      primaryLng: 51.3866,
    });
    const l2 = await addSecondaryLocation(business.id, {
      cityId: uralskCityId,
      address: 'Same coords L2',
      latitude: 51.2279,
      longitude: 51.3866,
    });
    const service = buildService();
    const result = await service.findAll({
      citySlug: 'uralsk',
      forMap: true,
      ...uralskBbox,
      limit: 50,
    });
    const rows = result.items.filter(
      (i): i is MapLocationBusinessListItem => i.id === business.id && 'locationId' in i,
    );
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(new Set(rows.map((r) => r.locationId)).size).toBeGreaterThanOrEqual(2);
    expect(rows.some((r) => r.locationId === l2.id)).toBe(true);
  });

  it('category and subcategory filters apply to parent business', async () => {
    if (skip) return;
    const business = await createMapFixtureBusiness({ titlePrefix: 'CatFilter' });
    await addSecondaryLocation(business.id, {
      cityId: uralskCityId,
      address: 'Cat L2',
      latitude: 51.2285,
      longitude: 51.3872,
    });
    const service = buildService();
    const withCat = await service.findAll({
      citySlug: 'uralsk',
      forMap: true,
      categoryId,
      ...uralskBbox,
      limit: 100,
    });
    const catRows = withCat.items.filter((i) => i.id === business.id);
    expect(catRows.length).toBeGreaterThanOrEqual(2);
    expect(new Set(catRows.map((r) => (r as MapLocationBusinessListItem).locationId)).size)
      .toBeGreaterThanOrEqual(2);

    const withSub = await service.findAll({
      citySlug: 'uralsk',
      forMap: true,
      subcategoryId,
      ...uralskBbox,
      limit: 100,
    });
    expect(withSub.items.filter((i) => i.id === business.id).length).toBeGreaterThanOrEqual(2);
  });

  it('ordinary nearest discovery remains one row per business (no forMap)', async () => {
    if (skip) return;
    const business = await createMapFixtureBusiness({ titlePrefix: 'NearestGrain' });
    await addSecondaryLocation(business.id, {
      cityId: uralskCityId,
      address: 'Nearest L2',
      latitude: 51.2286,
      longitude: 51.3873,
    });
    const service = buildService();
    const result = await service.findAll({
      citySlug: 'uralsk',
      latitude: 51.2278,
      longitude: 51.3865,
      sort: 'nearest' as never,
      limit: 100,
    });
    const nearestRows = result.items.filter((i) => i.id === business.id);
    expect(nearestRows).toHaveLength(1);
    expect(nearestRows[0] != null && 'locationId' in nearestRows[0]).toBe(false);
  });
});
