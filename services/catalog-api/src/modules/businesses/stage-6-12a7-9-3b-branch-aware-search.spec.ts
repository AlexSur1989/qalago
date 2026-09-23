import { BusinessStatus, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessesService } from './businesses.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import type { BusinessDiscoveryContext } from './business-discovery-context.util';
import { BusinessCatalogSort } from '../../common/utils/business-catalog-sort.util';

type ListItem = { id: string } & BusinessDiscoveryContext;

describe('Stage 6.12A.7.9.3B — branch-aware search', () => {
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
      const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'ServiceItemBranchAvailability'
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

  function buildService(cityId: string) {
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

  async function createCrossCityBrand(options: {
    titlePrefix: string;
    businessCityId: string;
    oralAddress: string;
    aktobeAddress: string;
  }) {
    const slug = `a793b-${randomBytes(6).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `${options.titlePrefix} ${slug}`,
        slug,
        categoryId,
        cityId: options.businessCityId,
        address: options.oralAddress,
        ownerId,
        status: BusinessStatus.ACTIVE,
        latitude: 51.2278,
        longitude: 51.3865,
        businessSubcategories: { create: { subcategoryId } },
      },
    });
    createdBusinessIds.push(business.id);

    const l1 = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: options.oralAddress,
        latitude: 51.2278,
        longitude: 51.3865,
        isPrimary: true,
      },
    });
    await setBranchGeography(l1.id, 51.2278, 51.3865);

    const l2 = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: aktobeCityId,
        address: options.aktobeAddress,
        latitude: 50.283,
        longitude: 57.167,
        isPrimary: false,
      },
    });
    await setBranchGeography(l2.id, 50.283, 57.167);

    return { business, l1, l2 };
  }

  async function setBranchGeography(locationId: string, lat: number, lng: number) {
    await prisma.$executeRaw`
      UPDATE "BusinessLocation"
      SET latitude = ${lat}, longitude = ${lng},
          location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${locationId}
    `;
  }

  it('branch address: sibling city address does not match', async () => {
    if (skip) return;
    const { business, l2 } = await createCrossCityBrand({
      titlePrefix: 'AddrCross',
      businessCityId: uralskCityId,
      oralAddress: 'ул. Сейфуллина 22',
      aktobeAddress: 'пр. Абая 88',
    });

    const uralskService = buildService(uralskCityId);
    const oralMiss = await uralskService.findAll({
      citySlug: 'uralsk',
      search: 'Абая 88',
      limit: 50,
    });
    expect(oralMiss.items.some((i) => i.id === business.id)).toBe(false);

    const aktobeService = buildService(aktobeCityId);
    const aktobeHit = await aktobeService.findAll({
      citySlug: 'aktobe',
      search: 'Абая 88',
      limit: 50,
    });
    const row = aktobeHit.items.find((i) => i.id === business.id) as ListItem | undefined;
    expect(row).toBeDefined();
    expect(aktobeHit.items.filter((i) => i.id === business.id)).toHaveLength(1);
    expect(row?.contextLocationId).toBe(l2.id);
  });

  it('SELECTED ServiceItem: match only in assigned city with branch context', async () => {
    if (skip) return;
    const { business, l2 } = await createCrossCityBrand({
      titlePrefix: 'SibaSelected',
      businessCityId: uralskCityId,
      oralAddress: 'Oral main',
      aktobeAddress: 'Aktobe side',
    });
    const itemTitle = `Капучино-${randomBytes(3).toString('hex')}`;
    const item = await prisma.serviceItem.create({
      data: { businessId: business.id, title: itemTitle, sortOrder: 1 },
    });
    await prisma.serviceItemBranchAvailability.create({
      data: { businessId: business.id, serviceItemId: item.id, locationId: l2.id },
    });

    const uralskService = buildService(uralskCityId);
    expect(
      (await uralskService.findAll({ citySlug: 'uralsk', search: itemTitle, limit: 50 })).items.some(
        (i) => i.id === business.id,
      ),
    ).toBe(false);

    const aktobeService = buildService(aktobeCityId);
    const hit = await aktobeService.findAll({
      citySlug: 'aktobe',
      search: itemTitle,
      limit: 50,
    });
    const row = hit.items.find((i) => i.id === business.id) as ListItem | undefined;
    expect(hit.items.filter((i) => i.id === business.id)).toHaveLength(1);
    expect(row?.contextLocationId).toBe(l2.id);
  });

  it('ALL ServiceItem: matches each city with generic city context', async () => {
    if (skip) return;
    const { business, l1, l2 } = await createCrossCityBrand({
      titlePrefix: 'SibaAll',
      businessCityId: uralskCityId,
      oralAddress: 'Oral ALL',
      aktobeAddress: 'Aktobe ALL',
    });
    const itemTitle = `Американо-${randomBytes(3).toString('hex')}`;
    await prisma.serviceItem.create({
      data: { businessId: business.id, title: itemTitle, sortOrder: 1 },
    });

    const uralskService = buildService(uralskCityId);
    const oral = await uralskService.findAll({
      citySlug: 'uralsk',
      search: itemTitle,
      limit: 50,
    });
    const oralRow = oral.items.find((i) => i.id === business.id) as ListItem | undefined;
    expect(oralRow?.contextLocationId).toBe(l1.id);

    const aktobeService = buildService(aktobeCityId);
    const aktobe = await aktobeService.findAll({
      citySlug: 'aktobe',
      search: itemTitle,
      limit: 50,
    });
    const aktobeRow = aktobe.items.find((i) => i.id === business.id) as ListItem | undefined;
    expect(aktobeRow?.contextLocationId).toBe(l2.id);
  });

  it('SELECTED item context beats generic primary in same city', async () => {
    if (skip) return;
    const slug = `a793b-sibling-${randomBytes(4).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `SiblingCtx ${slug}`,
        slug,
        categoryId,
        cityId: uralskCityId,
        address: 'Parent addr',
        ownerId,
        status: BusinessStatus.ACTIVE,
        latitude: 51.2278,
        longitude: 51.3865,
        businessSubcategories: { create: { subcategoryId } },
      },
    });
    createdBusinessIds.push(business.id);

    const l1 = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: 'Branch L1',
        latitude: 51.2278,
        longitude: 51.3865,
        isPrimary: false,
      },
    });
    const l2 = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: uralskCityId,
        address: 'Branch L2 primary',
        latitude: 51.228,
        longitude: 51.387,
        isPrimary: true,
      },
    });
    await setBranchGeography(l1.id, 51.2278, 51.3865);
    await setBranchGeography(l2.id, 51.228, 51.387);

    const itemTitle = `SiblingItem-${randomBytes(3).toString('hex')}`;
    const item = await prisma.serviceItem.create({
      data: { businessId: business.id, title: itemTitle, sortOrder: 1 },
    });
    await prisma.serviceItemBranchAvailability.create({
      data: { businessId: business.id, serviceItemId: item.id, locationId: l1.id },
    });

    const service = buildService(uralskCityId);
    const hit = await service.findAll({ citySlug: 'uralsk', search: itemTitle, limit: 50 });
    const row = hit.items.find((i) => i.id === business.id) as ListItem | undefined;
    expect(row?.contextLocationId).toBe(l1.id);
    expect(row?.contextLocationId).not.toBe(l2.id);
  });

  it('PENDING business excluded despite branch address match', async () => {
    if (skip) return;
    const { business } = await createCrossCityBrand({
      titlePrefix: 'BlockedAddr',
      businessCityId: uralskCityId,
      oralAddress: 'Oral pending',
      aktobeAddress: 'пр. Абая 99 pending',
    });
    await prisma.business.update({
      where: { id: business.id },
      data: { status: BusinessStatus.PENDING },
    });

    const aktobeService = buildService(aktobeCityId);
    const hit = await aktobeService.findAll({
      citySlug: 'aktobe',
      search: 'Абая 99',
      limit: 50,
    });
    expect(hit.items.some((i) => i.id === business.id)).toBe(false);
  });

  it('geo + search preserves nearest contextLocationId over search branch context', async () => {
    if (skip) return;
    const userLat = 50.283;
    const userLng = 57.167;
    const { business, l2 } = await createCrossCityBrand({
      titlePrefix: 'GeoSearch',
      businessCityId: aktobeCityId,
      oralAddress: 'Oral far',
      aktobeAddress: 'пр. Абая geo 77',
    });
    const itemTitle = `GeoItem-${randomBytes(3).toString('hex')}`;
    const item = await prisma.serviceItem.create({
      data: { businessId: business.id, title: itemTitle, sortOrder: 1 },
    });
    await prisma.serviceItemBranchAvailability.create({
      data: { businessId: business.id, serviceItemId: item.id, locationId: l2.id },
    });

    const service = buildService(aktobeCityId);
    const result = await service.findAll({
      citySlug: 'aktobe',
      search: itemTitle,
      latitude: userLat,
      longitude: userLng,
      sort: BusinessCatalogSort.NEAREST,
      limit: 20,
    });
    const row = result.items.find((i) => i.id === business.id) as ListItem & {
      distanceMeters?: number;
    };
    expect(row?.contextLocationId).toBe(l2.id);
    expect(row?.distanceMeters).toBeDefined();
  });
});
