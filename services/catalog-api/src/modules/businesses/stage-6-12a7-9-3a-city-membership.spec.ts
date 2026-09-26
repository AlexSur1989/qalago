import { BusinessStatus, PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessesService } from './businesses.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import type { BusinessDiscoveryContext } from './business-discovery-context.util';
import {
  queryCatalogNearestPage,
  resolveNearestRadiusMeters,
} from './business-catalog-postgis-geo.query';

type GeoListItem = { id: string } & BusinessDiscoveryContext;

describe('Stage 6.12A.7.9.3A — BusinessLocation city membership + city context', () => {
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

  async function createBrandBusiness(options: {
    titlePrefix: string;
    businessCityId: string;
    primaryCityId: string;
    primaryAddress: string;
    extraBranches?: Array<{ cityId: string; address: string; lat?: number; lng?: number }>;
    status?: BusinessStatus;
  }) {
    const slug = `a793a-${randomBytes(6).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `${options.titlePrefix} ${slug}`,
        slug,
        categoryId,
        ownerId,
        status: options.status ?? BusinessStatus.ACTIVE,
        businessSubcategories: { create: { subcategoryId } },
      },
    });
    createdBusinessIds.push(business.id);

    const primary = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: options.primaryCityId,
        isPrimary: true,
      },
    });
    await setBranchGeography(primary.id, Number(primary.latitude), Number(primary.longitude));

    for (const branch of options.extraBranches ?? []) {
      const row = await prisma.businessLocation.create({
        data: {
          address: branch.address,
          businessId: business.id,
          cityId: branch.cityId,
          isPrimary: false,
        },
      });
      await setBranchGeography(row.id, branch.lat ?? 51.228, branch.lng ?? 51.387);
    }

    return business;
  }

  async function setBranchGeography(locationId: string, lat: number, lng: number) {
    await prisma.$executeRaw`
      UPDATE "BusinessLocation"
      SET latitude = ${lat}, longitude = ${lng},
          location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${locationId}
    `;
  }

  it('cross-city: Aktobe list uses Aktobe branch context, not Uralsk primary', async () => {
    if (skip) return;
    const business = await createBrandBusiness({
      titlePrefix: 'CrossBrand',
      businessCityId: uralskCityId,
      primaryCityId: uralskCityId,
      primaryAddress: 'Uralsk primary addr',
      extraBranches: [
        { cityId: aktobeCityId, address: 'Aktobe branch addr', lat: 50.283, lng: 57.167 },
      ],
    });
    const aktobeBranch = await prisma.businessLocation.findFirst({
      where: { businessId: business.id, cityId: aktobeCityId },
      select: { id: true },
    });

    const aktobeService = buildService(aktobeCityId);
    const aktobeList = await aktobeService.findAll({ citySlug: 'aktobe', limit: 100 });
    const aktobeRow = aktobeList.items.find((i) => i.id === business.id) as GeoListItem | undefined;
    expect(aktobeRow).toBeDefined();
    expect(aktobeRow?.contextLocationId).toBe(aktobeBranch!.id);

    const uralskService = buildService(uralskCityId);
    const uralskList = await uralskService.findAll({ citySlug: 'uralsk', limit: 100 });
    const uralskRows = uralskList.items.filter((i) => i.id === business.id);
    expect(uralskRows).toHaveLength(1);
    const primary = await prisma.businessLocation.findFirst({
      where: { businessId: business.id, isPrimary: true },
      select: { id: true },
    });
    expect((uralskRows[0] as GeoListItem).contextLocationId).toBe(primary!.id);
  });

  it('phantom: Business.cityId=Uralsk but ONLY Aktobe branch → absent in Uralsk', async () => {
    if (skip) return;
    const business = await createBrandBusiness({
      titlePrefix: 'PhantomParent',
      businessCityId: uralskCityId,
      primaryCityId: aktobeCityId,
      primaryAddress: 'Only Aktobe primary',
    });
    await prisma.businessLocation.deleteMany({
      where: { businessId: business.id, cityId: uralskCityId },
    });

    const uralskService = buildService(uralskCityId);
    const uralskList = await uralskService.findAll({ citySlug: 'uralsk', limit: 200 });
    expect(uralskList.items.some((i) => i.id === business.id)).toBe(false);

    const aktobeService = buildService(aktobeCityId);
    const aktobeList = await aktobeService.findAll({ citySlug: 'aktobe', limit: 200 });
    expect(aktobeList.items.filter((i) => i.id === business.id)).toHaveLength(1);
  });

  it('phantom inverse: parent Aktobe but ONLY Uralsk branch → absent in Aktobe', async () => {
    if (skip) return;
    const business = await createBrandBusiness({
      titlePrefix: 'PhantomAktobe',
      businessCityId: aktobeCityId,
      primaryCityId: uralskCityId,
      primaryAddress: 'Only Uralsk branch',
    });

    const aktobeService = buildService(aktobeCityId);
    expect(
      (await aktobeService.findAll({ citySlug: 'aktobe', limit: 200 })).items.some(
        (i) => i.id === business.id,
      ),
    ).toBe(false);

    const uralskService = buildService(uralskCityId);
    expect(
      (await uralskService.findAll({ citySlug: 'uralsk', limit: 200 })).items.filter(
        (i) => i.id === business.id,
      ).length,
    ).toBe(1);
  });

  it('category and subcategory use branch city membership', async () => {
    if (skip) return;
    const business = await createBrandBusiness({
      titlePrefix: 'CatSub',
      businessCityId: uralskCityId,
      primaryCityId: aktobeCityId,
      primaryAddress: 'Aktobe only cat',
    });

    const uralskService = buildService(uralskCityId);
    const withCat = await uralskService.findAll({
      citySlug: 'uralsk',
      categoryId,
      limit: 200,
    });
    expect(withCat.items.some((i) => i.id === business.id)).toBe(false);

    const aktobeService = buildService(aktobeCityId);
    const aktobeCat = await aktobeService.findAll({
      citySlug: 'aktobe',
      categoryId,
      limit: 200,
    });
    expect(aktobeCat.items.some((i) => i.id === business.id)).toBe(true);

    const aktobeSub = await aktobeService.findAll({
      citySlug: 'aktobe',
      subcategoryId,
      limit: 200,
    });
    expect(aktobeSub.items.some((i) => i.id === business.id)).toBe(true);
  });

  it('search base scope uses branch city membership', async () => {
    if (skip) return;
    const token = `A793A-SEARCH-${randomBytes(4).toString('hex')}`;
    const business = await createBrandBusiness({
      titlePrefix: token,
      businessCityId: uralskCityId,
      primaryCityId: aktobeCityId,
      primaryAddress: 'Search aktobe only',
    });

    const uralskService = buildService(uralskCityId);
    const miss = await uralskService.findAll({ citySlug: 'uralsk', search: token, limit: 50 });
    expect(miss.items.some((i) => i.id === business.id)).toBe(false);

    const aktobeService = buildService(aktobeCityId);
    const hit = await aktobeService.findAll({ citySlug: 'aktobe', search: token, limit: 50 });
    expect(hit.items.filter((i) => i.id === business.id)).toHaveLength(1);
  });

  it('non-geo branch without coordinates still eligible with contextLocationId', async () => {
    if (skip) return;
    const business = await createBrandBusiness({
      titlePrefix: 'NoCoordsCtx',
      businessCityId: uralskCityId,
      primaryCityId: uralskCityId,
      primaryAddress: 'No geo primary',
    });
    const primary = await prisma.businessLocation.findFirst({
      where: { businessId: business.id, isPrimary: true },
      select: { id: true },
    });
    await prisma.$executeRaw`
      UPDATE "BusinessLocation"
      SET latitude = NULL, longitude = NULL, location = NULL
      WHERE id = ${primary!.id}
    `;

    const service = buildService(uralskCityId);
    const list = await service.findAll({ citySlug: 'uralsk', limit: 200 });
    const row = list.items.find((i) => i.id === business.id) as GeoListItem | undefined;
    expect(row).toBeDefined();
    expect(row?.contextLocationId).toBe(primary!.id);
  });

  it('BLOCKED business with branch in city is not exposed', async () => {
    if (skip) return;
    const business = await createBrandBusiness({
      titlePrefix: 'Blocked',
      businessCityId: uralskCityId,
      primaryCityId: uralskCityId,
      primaryAddress: 'Blocked addr',
      status: BusinessStatus.BLOCKED,
    });
    const service = buildService(uralskCityId);
    const list = await service.findAll({ citySlug: 'uralsk', limit: 200 });
    expect(list.items.some((i) => i.id === business.id)).toBe(false);
  });

  it('nearby cross-city: qualifies only through branch in requested city', async () => {
    if (skip) return;
    const business = await createBrandBusiness({
      titlePrefix: 'NearCross',
      businessCityId: uralskCityId,
      primaryCityId: uralskCityId,
      primaryAddress: 'Uralsk far primary',
      extraBranches: [
        { cityId: aktobeCityId, address: 'Aktobe near', lat: 50.283, lng: 57.167 },
      ],
    });
    const aktobeBranch = await prisma.businessLocation.findFirst({
      where: { businessId: business.id, cityId: aktobeCityId },
      select: { id: true },
    });

    const { rows } = await queryCatalogNearestPage(prisma, {
      cityId: aktobeCityId,
      status: BusinessStatus.ACTIVE,
      latitude: 50.283,
      longitude: 57.167,
      radiusMeters: resolveNearestRadiusMeters(15),
      skip: 0,
      limit: 200,
    });
    const hit = rows.find((r) => r.id === business.id);
    expect(hit).toBeDefined();
    expect(hit!.contextLocationId).toBe(aktobeBranch!.id);

    const uralskOnly = await queryCatalogNearestPage(prisma, {
      cityId: uralskCityId,
      status: BusinessStatus.ACTIVE,
      latitude: userLat,
      longitude: userLng,
      radiusMeters: resolveNearestRadiusMeters(0.5),
      skip: 0,
      limit: 500,
    });
    const uralskHit = uralskOnly.rows.find((r) => r.id === business.id);
    if (uralskHit) {
      const primary = await prisma.businessLocation.findFirst({
        where: { businessId: business.id, isPrimary: true },
        select: { id: true },
      });
      expect(uralskHit.contextLocationId).toBe(primary!.id);
    }
  });
});
