import { BusinessStatus, PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { attachEffectivePhysicalToDetail } from './business-effective-physical.util';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { BusinessesService } from './businesses.service';
import { BusinessLocationService } from './business-location.service';
import { PrismaService } from '../../prisma/prisma.service';
import { assertPrimaryBusinessCompatibilityParity } from './business-location-parity.test-util';
import { specCreateInitialPrimary, testPrimaryPhysical, createTestBusinessWithPrimary } from './business-with-primary.test-fixture';

describe('Stage 6.12A.9.4.4C1 — stop Business geo mirror writes', () => {
  jest.setTimeout(90_000);
  const prisma = new PrismaClient();
  const primaryLocation = new BusinessPrimaryLocationService();
  let skip = false;
  let fixtureOwnerId = '';
  let uralskCityId = '';
  let aktobeCityId = '';
  let categoryId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const table = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'BusinessLocation'
        ) AS exists`;
      skip = !table[0]?.exists;
      const user = await prisma.user.findFirst({ select: { id: true } });
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const aktobe = await prisma.city.findFirst({ where: { slug: 'aktobe' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      if (!user || !uralsk || !aktobe || !category) skip = true;
      else {
        fixtureOwnerId = user.id;
        uralskCityId = uralsk.id;
        aktobeCityId = aktobe.id;
        categoryId = category.id;
      }
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const owner = () =>
    ({ id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.BUSINESS }) as const;

  function buildBusinessesService() {
    const cityScope = {
      resolveCityId: jest.fn(async (q: { citySlug?: string; cityId?: string }) => {
        if (q.cityId) return q.cityId;
        const city = await prisma.city.findFirst({ where: { slug: q.citySlug ?? 'uralsk' } });
        return city?.id ?? 'missing-city';
      }),
    } as unknown as CityScopeService;
    const subDeps = createMockSubcategoryDeps();
    return new BusinessesService(
      prisma as never,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess({ ownerId: fixtureOwnerId })),
      { createActiveOwnerMembership: jest.fn() } as never,
      {} as PlanLimitsService,
      {} as BusinessPublicContentService,
      asAuditLogService(createMockAuditLog()),
      subDeps.businessSubcategories,
      subDeps.subcategories,
      {} as never,
      primaryLocation,
    );
  }

  function buildLocationService() {
    return new BusinessLocationService(
      prisma as unknown as PrismaService,
      asBusinessAccessService(createMockBusinessAccess({ ownerId: fixtureOwnerId })),
      primaryLocation,
    );
  }

  async function createSlug(prefix: string) {
    return `${prefix}-${randomBytes(5).toString('hex')}`;
  }

  it('A — owner primary physical edit updates BL only; runtime DTO uses BL', async () => {
    if (skip) return;
    const slug = await createSlug('c1-owner-primary');
    const svc = buildBusinessesService();
    const staleMirror = 'Stale Business mirror';
    const business = await prisma.business.create({
      data: {
        title: 'C1 owner primary',
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId: fixtureOwnerId,
        status: BusinessStatus.ACTIVE,
      },
    });
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, business.cityId, staleMirror);
    await prisma.businessLocation.updateMany({
      where: { businessId: business.id, isPrimary: true },
      data: { address: 'Primary BL before' },
    });

    try {
      await svc.update(business.id, owner(), { address: 'Primary BL after edit' });
      const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      const primary = await prisma.businessLocation.findFirstOrThrow({
        where: { businessId: business.id, isPrimary: true },
      });
      expect(primary.address).toBe('Primary BL after edit');
      expect(businessRow.cityId).toBe(uralskCityId);

      const locations = await prisma.businessLocation.findMany({ where: { businessId: business.id } });
      const detail = attachEffectivePhysicalToDetail(
        {
          id: businessRow.id,
          cityId: businessRow.cityId,
          phone: businessRow.phone,
          whatsapp: businessRow.whatsapp,
          instagram: businessRow.instagram,
          website: businessRow.website,
          workHours: businessRow.workHours,
        },
        locations,
      );
      expect(detail.effectivePhysical.address).toBe('Primary BL after edit');
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('D — contact-only PATCH does not overwrite primary BL geo when Business mirror is stale', async () => {
    if (skip) return;
    const slug = await createSlug('c1-contact-stale');
    const svc = buildBusinessesService();
    const business = await prisma.business.create({
      data: {
        title: 'C1 contact stale',
        slug,
        categoryId,
        cityId: uralskCityId,
        phone: '+7000',
        ownerId: fixtureOwnerId,
        status: BusinessStatus.ACTIVE,
      },
    });
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, business.cityId, 'STALE Business address');
    await prisma.businessLocation.updateMany({
      where: { businessId: business.id, isPrimary: true },
      data: { address: 'Fresh BL address' },
    });

    try {
      await svc.update(business.id, owner(), { phone: '+7111' });
      const primary = await prisma.businessLocation.findFirstOrThrow({
        where: { businessId: business.id, isPrimary: true },
      });
      expect(primary.address).toBe('Fresh BL address');
      expect(primary.phone).toBe('+7111');
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('C — promote secondary: Business geo stale; cityId compatibility preserved', async () => {
    if (skip) return;
    const slug = await createSlug('c1-promote');
    const locSvc = buildLocationService();
    const business = await prisma.business.create({
      data: {
        title: 'C1 promote',
        slug,
        categoryId,
        cityId: uralskCityId,
        ownerId: fixtureOwnerId,
        status: BusinessStatus.ACTIVE,
      },
    });
    await specCreateInitialPrimary(primaryLocation, prisma, business.id, business.cityId, 'Legacy Uralsk mirror', { latitude: 51.2278, longitude: 51.3865 });
    const l2 = await locSvc.createLocation(owner(), business.id, {
      address: 'Branch addr',
      cityId: aktobeCityId,
    });

    try {
      await locSvc.setPrimaryLocation(owner(), business.id, l2.id);
      const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      expect(businessRow.cityId).toBe(aktobeCityId);
      await assertPrimaryBusinessCompatibilityParity(prisma, business.id);

      const locations = await prisma.businessLocation.findMany({ where: { businessId: business.id } });
      const detail = attachEffectivePhysicalToDetail(
        {
          id: businessRow.id,
          cityId: businessRow.cityId,
          phone: businessRow.phone,
          whatsapp: businessRow.whatsapp,
          instagram: businessRow.instagram,
          website: businessRow.website,
          workHours: businessRow.workHours,
        },
        locations,
        l2.id,
      );
      expect(detail.effectivePhysical.address).toBe('Branch addr');
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });
});
