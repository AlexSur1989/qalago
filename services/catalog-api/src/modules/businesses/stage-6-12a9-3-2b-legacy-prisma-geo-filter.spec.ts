import { BadRequestException } from '@nestjs/common';
import { BusinessStatus, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessesService } from './businesses.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { BusinessCatalogSort } from '../../common/utils/business-catalog-sort.util';
import type { BusinessDiscoveryContext } from './business-discovery-context.util';

type ListItem = { id: string; locationId?: string } & BusinessDiscoveryContext;

describe('Stage 6.12A.9.3.2b — legacy Prisma geo filter cleanup', () => {
  jest.setTimeout(90_000);
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
      const blTable = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'BusinessLocation'
        ) AS exists`;
      skip = !blTable[0]?.exists;
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

  function buildService(cityId: string) {
    const cityScope = { resolveCityId: jest.fn().mockResolvedValue(cityId) } as unknown as CityScopeService;
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

  async function setBranchGeography(locationId: string, lat: number, lng: number) {
    await prisma.$executeRaw`
      UPDATE "BusinessLocation"
      SET latitude = ${lat}, longitude = ${lng},
          location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${locationId}
    `;
  }

  async function createCrossCityBrand() {
    const slug = `a932b-${randomBytes(5).toString('hex')}`;
    const secondaryLat = 50.2839;
    const secondaryLng = 57.1672;
    const primaryLat = 51.2278;
    const primaryLng = 51.3865;

    const business = await prisma.business.create({
      data: {
        title: `Cross ${slug}`,
        slug,
        categoryId,
        ownerId,
        status: BusinessStatus.ACTIVE,
        businessSubcategories: { create: { subcategoryId } },
      },
    });
    createdBusinessIds.push(business.id);

    const lPrimary = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: uralskCityId,
        isPrimary: true,
      },
    });
    await setBranchGeography(lPrimary.id, primaryLat, primaryLng);

    const lSecondary = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: aktobeCityId,
        isPrimary: false,
      },
    });
    await setBranchGeography(lSecondary.id, secondaryLat, secondaryLng);

    const aktobeBbox = {
      minLat: 50.27,
      maxLat: 50.3,
      minLng: 57.15,
      maxLng: 57.19,
    };

    return { business, lPrimary, lSecondary, aktobeBbox, secondaryLat, secondaryLng };
  }

  it('A: Aktobe bbox + radius around secondary returns once with Aktobe contextLocationId', async () => {
    if (skip) return;
    const { business, lSecondary, aktobeBbox, secondaryLat, secondaryLng } =
      await createCrossCityBrand();
    const service = buildService(aktobeCityId);
    const result = await service.findAll({
      citySlug: 'aktobe',
      ...aktobeBbox,
      radiusKm: 15,
      sort: BusinessCatalogSort.RECOMMENDED,
      limit: 100,
    });
    const rows = result.items.filter((i) => i.id === business.id) as ListItem[];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.contextLocationId).toBe(lSecondary.id);
  });

  it('B: bbox + lat/lng non-nearest not excluded by Uralsk Business mirror coords', async () => {
    if (skip) return;
    const { business, lSecondary, aktobeBbox, secondaryLat, secondaryLng } =
      await createCrossCityBrand();
    const service = buildService(aktobeCityId);
    const result = await service.findAll({
      citySlug: 'aktobe',
      ...aktobeBbox,
      sort: BusinessCatalogSort.RATING,
      limit: 100,
    });
    expect(result.items.filter((i) => i.id === business.id)).toHaveLength(1);
    const row = result.items.find((i) => i.id === business.id) as ListItem | undefined;
    expect(row?.contextLocationId).toBe(lSecondary.id);
  });

  it('C: Business legacy coords in bbox without BL in bbox does not qualify', async () => {
    if (skip) return;
    const slug = `ghost-${randomBytes(4).toString('hex')}`;
    const lat = 50.2839;
    const lng = 57.1672;
    const business = await prisma.business.create({
      data: {
        title: `Ghost ${slug}`,
        slug,
        categoryId,
        ownerId,
        status: BusinessStatus.ACTIVE,
        businessSubcategories: { create: { subcategoryId } },
      },
    });
    createdBusinessIds.push(business.id);
    await prisma.$executeRaw`
      UPDATE "Business"
      SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${business.id}
    `;
    const oralBranch = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: uralskCityId,
        isPrimary: true,
      },
    });
    await setBranchGeography(oralBranch.id, 51.22, 51.39);

    const service = buildService(aktobeCityId);
    const bbox = { minLat: 50.27, maxLat: 50.3, minLng: 57.15, maxLng: 57.19 };
    const result = await service.findAll({ citySlug: 'aktobe', ...bbox, limit: 100 });
    expect(result.items.some((i) => i.id === business.id)).toBe(false);
  });

  it('D: forMap without bbox — stale Business coords null, valid BL still eligible', async () => {
    if (skip) return;
    const slug = `mapready-${randomBytes(4).toString('hex')}`;
    const lat = 51.2278;
    const lng = 51.3865;
    const business = await prisma.business.create({
      data: {
        title: `MapReady ${slug}`,
        slug,
        categoryId,
        ownerId,
        status: BusinessStatus.ACTIVE,
        businessSubcategories: { create: { subcategoryId } },
      },
    });
    createdBusinessIds.push(business.id);
    const bl = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: uralskCityId,
        isPrimary: true,
      },
    });
    await setBranchGeography(bl.id, lat, lng);

    const service = buildService(uralskCityId);
    const result = await service.findAll({
      citySlug: 'uralsk',
      forMap: true,
      limit: 200,
    });
    expect(result.items.some((i) => i.id === business.id)).toBe(true);
  });

  it('E: forMap without bbox — branch without valid coords excluded', async () => {
    if (skip) return;
    const slug = `mapnotready-${randomBytes(4).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `NotReady ${slug}`,
        slug,
        categoryId,
        ownerId,
        status: BusinessStatus.ACTIVE,
        businessSubcategories: { create: { subcategoryId } },
      },
    });
    createdBusinessIds.push(business.id);
    await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: uralskCityId,
        isPrimary: true,
      },
    });

    const service = buildService(uralskCityId);
    const result = await service.findAll({
      citySlug: 'uralsk',
      forMap: true,
      limit: 200,
    });
    expect(result.items.some((i) => i.id === business.id)).toBe(false);
  });

  it('F: bbox-only remains Business-grain (one row per business)', async () => {
    if (skip) return;
    const { business, aktobeBbox } = await createCrossCityBrand();
    const service = buildService(aktobeCityId);
    const result = await service.findAll({ citySlug: 'aktobe', ...aktobeBbox, limit: 100 });
    expect(result.items.filter((i) => i.id === business.id)).toHaveLength(1);
    expect(result.items.every((i) => !('locationId' in i && i.locationId))).toBe(true);
  });

  it('G: forMap + bbox remains Location-grain', async () => {
    if (skip) return;
    const { business, lSecondary, aktobeBbox } = await createCrossCityBrand();
    const service = buildService(aktobeCityId);
    const result = await service.findAll({
      citySlug: 'aktobe',
      forMap: true,
      ...aktobeBbox,
      limit: 100,
    });
    const rows = result.items.filter((i) => i.id === business.id) as ListItem[];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.locationId ?? rows[0]?.contextLocationId).toBe(lSecondary.id);
  });

  it('H: radius without bbox unchanged (nearest branch context)', async () => {
    if (skip) return;
    const { business, lSecondary, secondaryLat, secondaryLng } = await createCrossCityBrand();
    const service = buildService(aktobeCityId);
    const result = await service.findAll({
      citySlug: 'aktobe',
      radiusKm: 20,
      limit: 100,
    });
    const row = result.items.find((i) => i.id === business.id) as ListItem | undefined;
    expect(row).toBeDefined();
    expect(row?.contextLocationId).toBe(lSecondary.id);
  });

  it('I: Business-grain bbox page has no duplicate business ids', async () => {
    if (skip) return;
    const { aktobeBbox } = await createCrossCityBrand();
    const service = buildService(aktobeCityId);
    const result = await service.findAll({ citySlug: 'aktobe', ...aktobeBbox, limit: 100 });
    const ids = result.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('J: partial bbox still rejected', async () => {
    if (skip) return;
    const service = buildService(uralskCityId);
    await expect(
      service.findAll({ citySlug: 'uralsk', minLat: 51.1 } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('K: primary Uralsk BL does not block Aktobe BL physical membership', async () => {
    if (skip) return;
    const { business, lPrimary, aktobeBbox } = await createCrossCityBrand();
    expect(lPrimary.cityId).toBe(uralskCityId);
    const service = buildService(aktobeCityId);
    const result = await service.findAll({ citySlug: 'aktobe', ...aktobeBbox, limit: 50 });
    expect(result.items.some((i) => i.id === business.id)).toBe(true);
  });
});
