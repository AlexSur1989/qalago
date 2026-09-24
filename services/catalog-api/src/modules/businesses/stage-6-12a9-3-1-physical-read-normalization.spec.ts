import { BusinessStatus, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessesService } from './businesses.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { FavoritesService } from '../favorites/favorites.service';
import { attachContextLocationIdForBranch } from './business-discovery-context.util';
import {
  loadBusinessLocationsGroupedByBusinessId,
  normalizePublicBusinessListItems,
} from './business-physical-read-normalization.util';

describe('Stage 6.12A.9.3.1 — public physical read normalization', () => {
  jest.setTimeout(45_000);
  const prisma = new PrismaClient();
  const primaryLocation = new BusinessPrimaryLocationService();
  let skip = false;
  let uralskCityId = '';
  let categoryId = '';
  let subcategoryId = '';
  let ownerId = '';
  let userId = '';
  const createdBusinessIds: string[] = [];

  beforeAll(async () => {
    try {
      await prisma.$connect();
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
        userId = user.id;
      }
    } catch {
      skip = true;
    }
  });

  afterEach(async () => {
    if (skip || createdBusinessIds.length === 0) return;
    await prisma.favorite.deleteMany({ where: { businessId: { in: createdBusinessIds } } });
    await prisma.business.deleteMany({ where: { id: { in: createdBusinessIds } } });
    createdBusinessIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function buildBusinessesService(cityId = uralskCityId) {
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

  async function createBranchBusiness(options: {
    businessAddress: string;
    primaryAddress: string;
    secondaryAddress?: string;
    secondaryLat?: number;
    secondaryLng?: number;
  }) {
    const slug = `a931-${randomBytes(6).toString('hex')}`;
    const business = await prisma.business.create({
      data: {
        title: `A931 ${slug}`,
        slug,
        categoryId,
        cityId: uralskCityId,
        address: options.businessAddress,
        ownerId,
        status: BusinessStatus.ACTIVE,
        latitude: 51.1,
        longitude: 51.2,
        businessSubcategories: { create: { subcategoryId } },
      },
    });
    createdBusinessIds.push(business.id);
    const primary = await primaryLocation.createInitialPrimary(prisma, business);
    await prisma.businessLocation.update({
      where: { id: primary.id },
      data: {
        address: options.primaryAddress,
        latitude: 51.11,
        longitude: 51.21,
      },
    });

    let secondaryId: string | undefined;
    if (options.secondaryAddress) {
      const secondary = await prisma.businessLocation.create({
        data: {
          businessId: business.id,
          cityId: uralskCityId,
          address: options.secondaryAddress,
          latitude: options.secondaryLat ?? 51.24,
          longitude: options.secondaryLng ?? 51.4,
          isPrimary: false,
        },
      });
      secondaryId = secondary.id;
    }

    return { business, secondaryId };
  }

  it('A — GET /businesses list uses primary branch physical, not stale Business mirror', async () => {
    if (skip) return;
    const { business } = await createBranchBusiness({
      businessAddress: 'Stale mirror',
      primaryAddress: 'Primary branch addr',
    });
    const service = buildBusinessesService();
    const result = await service.findAll({
      citySlug: 'uralsk',
      categoryId,
      limit: 50,
    });
    const row = result.items.find((item) => item.id === business.id);
    expect(row).toBeDefined();
    expect(row!.address).toBe('Primary branch addr');
  });

  it('B — list row with contextLocationId uses secondary branch physical', async () => {
    if (skip) return;
    const { business, secondaryId } = await createBranchBusiness({
      businessAddress: 'Mirror',
      primaryAddress: 'Primary A',
      secondaryAddress: 'Secondary B',
    });
    expect(secondaryId).toBeDefined();
    const locationsByBusinessId = await loadBusinessLocationsGroupedByBusinessId(prisma, [business.id]);
    const listRow = {
      id: business.id,
      cityId: uralskCityId,
      address: business.address,
      latitude: business.latitude,
      longitude: business.longitude,
      phone: null,
      whatsapp: null,
      instagram: null,
      website: null,
      workHours: null,
    };
    const withContext = attachContextLocationIdForBranch(listRow, secondaryId!);
    const [normalized] = normalizePublicBusinessListItems([withContext], locationsByBusinessId);
    expect(normalized.address).toBe('Secondary B');
    expect((normalized as { contextLocationId?: string }).contextLocationId).toBe(secondaryId);
  });

  it('D/E — detail top-level physical matches effectivePhysical for secondary locationId', async () => {
    if (skip) return;
    const { business, secondaryId } = await createBranchBusiness({
      businessAddress: 'Mirror',
      primaryAddress: 'Primary A',
      secondaryAddress: 'Secondary B',
    });
    const service = buildBusinessesService();
    const detail = await service.findOne(business.id, { locationId: secondaryId });
    expect(detail.effectivePhysical.address).toBe('Secondary B');
    expect(detail.address).toBe(detail.effectivePhysical.address);
  });

  it('G — favorites return primary branch physical (Business-grain)', async () => {
    if (skip) return;
    const { business } = await createBranchBusiness({
      businessAddress: 'Stale fav mirror',
      primaryAddress: 'Favorite primary addr',
      secondaryAddress: 'Other branch',
    });
    await prisma.business.update({
      where: { id: business.id },
      data: { address: 'Stale fav mirror' },
    });
    await prisma.favorite.create({
      data: { userId, businessId: business.id },
    });
    const favoritesService = new FavoritesService(prisma as unknown as PrismaService);
    const rows = await favoritesService.findAll(userId);
    const fav = rows.find((row) => row.businessId === business.id);
    expect(fav?.business.address).toBe('Favorite primary addr');
    expect(fav).not.toHaveProperty('contextLocationId');
  });

  it('I — forMap=true keeps two branch rows (normalization skipped)', async () => {
    if (skip) return;
    const { business, secondaryId } = await createBranchBusiness({
      businessAddress: 'Map mirror',
      primaryAddress: 'Map primary',
      secondaryAddress: 'Map secondary',
      secondaryLat: 51.2278,
      secondaryLng: 51.3865,
    });
    const service = buildBusinessesService();
    const result = await service.findAll({
      citySlug: 'uralsk',
      forMap: true,
      minLat: 51.2,
      maxLat: 51.25,
      minLng: 51.35,
      maxLng: 51.4,
      limit: 100,
    });
    const rows = result.items.filter((item) => item.id === business.id);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    const addresses = rows.map((row) => row.address).sort();
    expect(addresses).toEqual(expect.arrayContaining(['Map primary', 'Map secondary']));
    expect(rows.every((row) => 'locationId' in row && row.locationId != null)).toBe(true);
    expect(secondaryId).toBeDefined();
  });
});
