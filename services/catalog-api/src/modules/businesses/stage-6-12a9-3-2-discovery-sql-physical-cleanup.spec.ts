import { BusinessStatus, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessesService } from './businesses.service';
import { PromotionsService } from '../promotions/promotions.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import type { BusinessDiscoveryContext } from './business-discovery-context.util';
import {
  buildCatalogBusinessGrainBboxJoinWhereSql,
  buildCatalogMapLocationViewportWhereSql,
} from './business-catalog-postgis-geo.query';
import {
  computeBusinessSearchRelevanceTier,
  BusinessCatalogSearchRelevanceTier,
} from '../../common/utils/business-catalog-search-relevance.util';

type ListItem = { id: string; address: string; locationId?: string } & BusinessDiscoveryContext;

describe('Stage 6.12A.9.3.2 — discovery SQL physical read cleanup', () => {
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

  function buildBusinessService(cityId: string) {
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

  function buildPromotionsService(cityId: string) {
    const cityScope = { resolveCityId: jest.fn().mockResolvedValue(cityId) } as unknown as CityScopeService;
    const planLimits = {
      getBusinessPlanContext: jest.fn().mockResolvedValue({
        limits: { maxActivePromotions: 50 },
      }),
      applyPublicPromotionLimit: jest.fn((items: unknown[]) => items),
    } as unknown as PlanLimitsService;
    const businessAccess = {
      hasBusinessPermission: jest.fn().mockResolvedValue(false),
    } as unknown as BusinessAccessService;
    return new PromotionsService(
      prisma as unknown as PrismaService,
      cityScope,
      planLimits,
      businessAccess,
      asAuditLogService(createMockAuditLog()),
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

  async function createDualBranchFixture(options: {
    legacyAddress: string;
    primaryAddress: string;
    secondaryAddress: string;
    primaryLat: number;
    primaryLng: number;
    secondaryLat: number;
    secondaryLng: number;
    secondaryCityId: string;
    businessCityId: string;
    mirrorLegacyCoordsOnBusiness?: boolean;
  }) {
    const slug = `a932-${randomBytes(5).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `A932 ${slug}`,
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
        cityId: options.businessCityId,
        isPrimary: true,
      },
    });
    await setBranchGeography(lPrimary.id, options.primaryLat, options.primaryLng);

    const lSecondary = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: options.secondaryCityId,
        isPrimary: false,
      },
    });
    await setBranchGeography(lSecondary.id, options.secondaryLat, options.secondaryLng);

    if (options.mirrorLegacyCoordsOnBusiness) {
      await prisma.$executeRaw`
        UPDATE "Business"
        SET location = ST_SetSRID(ST_MakePoint(${options.primaryLng}, ${options.primaryLat}), 4326)::geography
        WHERE id = ${business.id}
      `;
    }

    return { business, lPrimary, lSecondary };
  }

  it('stale Business.address alone does not match discovery search', async () => {
    if (skip) return;
    const legacyToken = `OLD-LEGACY-STREET-${randomBytes(3).toString('hex')}`;
    const primaryToken = `PRIMARY-STREET-${randomBytes(3).toString('hex')}`;
    const { business } = await createDualBranchFixture({
      legacyAddress: legacyToken,
      primaryAddress: primaryToken,
      secondaryAddress: `SECONDARY-STREET-${randomBytes(3).toString('hex')}`,
      primaryLat: 51.2278,
      primaryLng: 51.3865,
      secondaryLat: 50.283,
      secondaryLng: 57.167,
      secondaryCityId: aktobeCityId,
      businessCityId: uralskCityId,
    });

    const service = buildBusinessService(uralskCityId);
    const legacyHit = await service.findAll({
      citySlug: 'uralsk',
      search: legacyToken,
      limit: 50,
    });
    expect(legacyHit.items.some((i) => i.id === business.id)).toBe(false);

    const primaryHit = await service.findAll({
      citySlug: 'uralsk',
      search: primaryToken,
      limit: 50,
    });
    expect(primaryHit.items.filter((i) => i.id === business.id)).toHaveLength(1);
  });

  it('secondary branch address search returns one Business with secondary contextLocationId', async () => {
    if (skip) return;
    const secondaryToken = `SECONDARY-STREET-${randomBytes(4).toString('hex')}`;
    const { business, lSecondary } = await createDualBranchFixture({
      legacyAddress: 'Legacy mirror only',
      primaryAddress: 'Primary Oral addr',
      secondaryAddress: secondaryToken,
      primaryLat: 51.2278,
      primaryLng: 51.3865,
      secondaryLat: 50.283,
      secondaryLng: 57.167,
      secondaryCityId: aktobeCityId,
      businessCityId: uralskCityId,
    });

    const aktobeService = buildBusinessService(aktobeCityId);
    const hit = await aktobeService.findAll({
      citySlug: 'aktobe',
      search: secondaryToken,
      limit: 50,
    });
    const row = hit.items.find((i) => i.id === business.id) as ListItem | undefined;
    expect(hit.items.filter((i) => i.id === business.id)).toHaveLength(1);
    expect(row?.contextLocationId).toBe(lSecondary.id);
    expect(row?.address).toContain(secondaryToken);
  });

  it('search relevance ignores stale Business.address when branchAddressMatch is false', () => {
    const tier = computeBusinessSearchRelevanceTier(
      {
        id: 'b1',
        title: 'Brand',
        branchAddressMatch: false,
      },
      'OLD LEGACY STREET',
    );
    expect(tier).toBe(BusinessCatalogSearchRelevanceTier.DESCRIPTION);
  });

  it('legacy bbox (forMap omitted): secondary branch inside bbox returns Business once', async () => {
    if (skip) return;
    const { business, lSecondary } = await createDualBranchFixture({
      legacyAddress: 'Legacy',
      primaryAddress: 'Primary far',
      secondaryAddress: 'Aktobe bbox branch',
      primaryLat: 51.05,
      primaryLng: 51.05,
      secondaryLat: 50.2839,
      secondaryLng: 57.1672,
      secondaryCityId: aktobeCityId,
      businessCityId: uralskCityId,
    });

    const bbox = {
      minLat: 50.27,
      maxLat: 50.3,
      minLng: 57.15,
      maxLng: 57.19,
    };
    const service = buildBusinessService(aktobeCityId);
    const result = await service.findAll({
      citySlug: 'aktobe',
      minLat: bbox.minLat,
      maxLat: bbox.maxLat,
      minLng: bbox.minLng,
      maxLng: bbox.maxLng,
      limit: 100,
    });
    const rows = result.items.filter((i) => i.id === business.id) as ListItem[];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.contextLocationId).toBe(lSecondary.id);
  });

  it('legacy bbox: Business.location inside bbox without BL in bbox is excluded', async () => {
    if (skip) return;
    const slug = `a932-ghost-${randomBytes(4).toString('hex')}`;
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
    const oralOnlyBranch = await prisma.businessLocation.create({
      data: {
        address: 'Branch addr',
        businessId: business.id,
        cityId: uralskCityId,
        isPrimary: true,
      },
    });
    await setBranchGeography(oralOnlyBranch.id, 51.22, 51.39);

    const service = buildBusinessService(aktobeCityId);
    const bbox = { minLat: 50.27, maxLat: 50.3, minLng: 57.15, maxLng: 57.19 };
    const result = await service.findAll({
      citySlug: 'aktobe',
      minLat: bbox.minLat,
      maxLat: bbox.maxLat,
      minLng: bbox.minLng,
      maxLng: bbox.maxLng,
      limit: 100,
    });
    expect(result.items.some((i) => i.id === business.id)).toBe(false);
  });

  it('forMap=true bbox returns one row per matching branch', async () => {
    if (skip) return;
    const { business, lPrimary, lSecondary } = await createDualBranchFixture({
      legacyAddress: 'Legacy',
      primaryAddress: 'Oral map',
      secondaryAddress: 'Aktobe map',
      primaryLat: 51.2278,
      primaryLng: 51.3865,
      secondaryLat: 50.2839,
      secondaryLng: 57.1672,
      secondaryCityId: aktobeCityId,
      businessCityId: uralskCityId,
    });

    const wideBbox = { minLat: 50.2, maxLat: 51.3, minLng: 51.3, maxLng: 57.2 };
    const uralskMap = await buildBusinessService(uralskCityId).findAll({
      citySlug: 'uralsk',
      forMap: true,
      minLat: wideBbox.minLat,
      maxLat: wideBbox.maxLat,
      minLng: wideBbox.minLng,
      maxLng: wideBbox.maxLng,
      limit: 200,
    });
    const mapRows = uralskMap.items.filter((i) => i.id === business.id);
    expect(mapRows.length).toBeGreaterThanOrEqual(1);
    const locationIds = mapRows.map((r) => (r as ListItem).locationId ?? (r as ListItem).contextLocationId);
    expect(locationIds).toContain(lPrimary.id);

    const aktobeMap = await buildBusinessService(aktobeCityId).findAll({
      citySlug: 'aktobe',
      forMap: true,
      minLat: 50.27,
      maxLat: 50.3,
      minLng: 57.15,
      maxLng: 57.19,
      limit: 50,
    });
    const aktobeRows = aktobeMap.items.filter((i) => i.id === business.id);
    expect(aktobeRows).toHaveLength(1);
    expect((aktobeRows[0] as ListItem).locationId ?? (aktobeRows[0] as ListItem).contextLocationId).toBe(
      lSecondary.id,
    );
  });

  it('active bbox SQL does not reference Business.location or Business.cityId', () => {
    const bbox = { minLat: 51.1, maxLat: 51.3, minLng: 51.2, maxLng: 51.5 };
    const businessGrain = buildCatalogBusinessGrainBboxJoinWhereSql({
      cityId: 'city-fixture',
      status: BusinessStatus.ACTIVE,
      mapBbox: bbox,
    });
    const locationGrain = buildCatalogMapLocationViewportWhereSql({
      cityId: 'city-fixture',
      status: BusinessStatus.ACTIVE,
      mapBbox: bbox,
    });
    for (const clause of [businessGrain, locationGrain]) {
      expect(clause.sql).toContain('bl."cityId"');
      expect(clause.sql).toContain('ST_Intersects(bl.location');
      expect(clause.sql).not.toContain('b."cityId"');
      expect(clause.sql).not.toContain('b.location');
      expect(clause.sql).not.toMatch(/\bb\.address\b/);
    }
  });

  it('promotion SELECTED branch B nested business address matches branch B', async () => {
    if (skip) return;
    const branchBAddress = `Promo Branch B ${randomBytes(3).toString('hex')}`;
    const { business, lSecondary } = await createDualBranchFixture({
      legacyAddress: 'Primary mirror on Business row',
      primaryAddress: 'Primary promo addr',
      secondaryAddress: branchBAddress,
      primaryLat: 51.2278,
      primaryLng: 51.3865,
      secondaryLat: 50.283,
      secondaryLng: 57.167,
      secondaryCityId: aktobeCityId,
      businessCityId: uralskCityId,
    });

    const promo = await prisma.promotion.create({
      data: {
        businessId: business.id,
        title: `Promo ${randomBytes(3).toString('hex')}`,
        discountText: '10%',
        status: 'ACTIVE',
      },
    });
    await prisma.promotionBranchAvailability.create({
      data: { businessId: business.id, promotionId: promo.id, locationId: lSecondary.id },
    });

    const promoService = buildPromotionsService(aktobeCityId);
    const feed = await promoService.findAll({
      citySlug: 'aktobe',
      activeNow: true,
      limit: 50,
    });
    const row = feed.items.find((p) => p.id === promo.id) as
      | { contextLocationId?: string; business: { address: string } }
      | undefined;
    expect(row?.contextLocationId).toBe(lSecondary.id);
    expect(row?.business.address).toContain(branchBAddress);
    expect(row?.business.address).not.toBe('Primary mirror on Business row');
  });
});
