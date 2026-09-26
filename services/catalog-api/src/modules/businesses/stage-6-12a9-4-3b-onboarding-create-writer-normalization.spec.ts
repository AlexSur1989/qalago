import { ForbiddenException } from '@nestjs/common';
import {
  BusinessApplicationStatus,
  BusinessLocationSource,
  BusinessStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { BusinessesService } from './businesses.service';
import { BusinessApplicationsService } from '../business-applications/business-applications.service';
import { OnboardingRateLimitService } from '../../common/services/onboarding-rate-limit.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { createMockBusinessAccess, asBusinessAccessService } from '../../test-utils/mock-business-access';
import { createMockSubcategoryDeps } from '../../test-utils/mock-subcategory-deps';
import { POSTGIS_TEST_ROLLBACK, withPostgisIntegrationTransaction } from './postgis-integration-test.util';
import {
  assertPrimaryBusinessCompatibilityParity,
} from './business-location-parity.test-util';
import { buildEffectivePhysicalDto } from './business-effective-physical.util';
import { businessRowToContactDefaults } from './business-physical-read-normalization.util';
import { buildApplicationDedupeKey } from '../../common/utils/business-application-dedupe.util';

describe('Stage 6.12A.9.4.3B — onboarding/create writer normalization', () => {
  const prisma = new PrismaClient();
  const primaryLocation = new BusinessPrimaryLocationService();
  let skip = false;
  let fixtureOwnerId = '';
  let adminUserId = '';
  let uralskCityId = '';
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
      const admin = await prisma.user.findFirst({
        where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } },
        select: { id: true },
      });
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk' }, select: { id: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      if (!user || !admin || !uralsk || !category) skip = true;
      else {
        fixtureOwnerId = user.id;
        adminUserId = admin.id;
        uralskCityId = uralsk.id;
        categoryId = category.id;
      }
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function buildBusinessesService(ownerId = adminUserId) {
    const cityScope = {
      resolveCityId: jest.fn(async (q: { citySlug?: string; cityId?: string }) => {
        if (q.cityId) return q.cityId;
        const city = await prisma.city.findFirst({ where: { slug: q.citySlug ?? 'uralsk' } });
        return city?.id ?? uralskCityId;
      }),
    } as unknown as CityScopeService;
    const subDeps = createMockSubcategoryDeps();
    return new BusinessesService(
      prisma as never,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess({ ownerId })),
      new BusinessMembershipService(
        prisma as never,
        asAuditLogService(createMockAuditLog()),
        {} as PlanLimitsService,
      ),
      {} as PlanLimitsService,
      {} as BusinessPublicContentService,
      asAuditLogService(createMockAuditLog()),
      subDeps.businessSubcategories,
      subDeps.subcategories,
      {} as never,
      primaryLocation,
    );
  }

  function buildApplicationsService() {
    const cityScope = {
      resolveCityId: jest.fn().mockResolvedValue(uralskCityId),
      resolveAdminCityId: jest.fn().mockResolvedValue(uralskCityId),
      assertCityInAdminScope: jest.fn().mockResolvedValue(undefined),
    } as unknown as CityScopeService;
    return new BusinessApplicationsService(
      prisma as never,
      cityScope,
      new BusinessMembershipService(
        prisma as never,
        asAuditLogService(createMockAuditLog()),
        {} as PlanLimitsService,
      ),
      asAuditLogService(createMockAuditLog()),
      { create: jest.fn().mockResolvedValue({ id: 'n1' }), schedulePushAfterTransaction: jest.fn() } as never,
      { assertApplicationCreate: jest.fn(), assertApplicationSubmit: jest.fn(), assertOwnershipClaimCreate: jest.fn() } as unknown as OnboardingRateLimitService,
      primaryLocation,
    );
  }

  it('admin POST /businesses creates Business + one authoritative primary BL (C3)', async () => {
    if (skip) return;
    const slugSuffix = randomBytes(4).toString('hex');
    const svc = buildBusinessesService();
    const admin = { id: adminUserId, sub: adminUserId, phone: '+7', role: UserRole.ADMIN };

    const business = await svc.create(admin, {
      title: `A943B Admin ${slugSuffix}`,
      categoryId,
      citySlug: 'uralsk',
      address: `Admin addr ${slugSuffix}`,
      phone: '+77001234000',
    });

    try {
      const locations = await prisma.businessLocation.findMany({ where: { businessId: business.id } });
      expect(locations).toHaveLength(1);
      expect(locations[0]?.isPrimary).toBe(true);
      expect(locations[0]?.address).toBe(`Admin addr ${slugSuffix}`);
      expect(business.cityId).toBe(uralskCityId);
      await assertPrimaryBusinessCompatibilityParity(prisma, business.id);

      const geoBefore = await prisma.business.findUniqueOrThrow({
        where: { id: business.id },
        select: { address: true, latitude: true, longitude: true },
      });
      await prisma.businessLocation.update({
        where: { id: locations[0]!.id },
        data: { address: `BL-only addr ${slugSuffix}` },
      });
      const geoAfter = await prisma.business.findUniqueOrThrow({
        where: { id: business.id },
        select: { address: true, latitude: true, longitude: true },
      });
      expect(geoAfter.address).toBe(geoBefore.address);
      const bl = await prisma.businessLocation.findUniqueOrThrow({ where: { id: locations[0]!.id } });
      const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
      const dto = buildEffectivePhysicalDto(businessRowToContactDefaults(businessRow), bl);
      expect(dto.address).toBe(`BL-only addr ${slugSuffix}`);
    } finally {
      await prisma.business.delete({ where: { id: business.id } });
    }
  });

  it('denies non-admin direct business create', async () => {
    if (skip) return;
    const svc = buildBusinessesService(fixtureOwnerId);
    const user = { id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.USER };
    await expect(
      svc.create(user, {
        title: 'Blocked',
        categoryId,
        citySlug: 'uralsk',
        address: 'X',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rolls back admin create when primary BL creation fails', async () => {
    if (skip) return;
    const brokenPrimary = new BusinessPrimaryLocationService();
    jest
      .spyOn(brokenPrimary, 'createBusinessWithInitialPrimary')
      .mockRejectedValueOnce(new Error('bl create failed'));

    const cityScope = {
      resolveCityId: jest.fn().mockResolvedValue(uralskCityId),
    } as unknown as CityScopeService;
    const subDeps = createMockSubcategoryDeps();
    const svc = new BusinessesService(
      prisma as never,
      cityScope,
      asBusinessAccessService(createMockBusinessAccess({ ownerId: adminUserId })),
      new BusinessMembershipService(
        prisma as never,
        asAuditLogService(createMockAuditLog()),
        {} as PlanLimitsService,
      ),
      {} as PlanLimitsService,
      {} as BusinessPublicContentService,
      asAuditLogService(createMockAuditLog()),
      subDeps.businessSubcategories,
      subDeps.subcategories,
      {} as never,
      brokenPrimary,
    );

    const beforeCount = await prisma.business.count();
    const admin = { id: adminUserId, sub: adminUserId, phone: '+7', role: UserRole.ADMIN };

    const rollbackSlugPrefix = `a943b-rollback-${randomBytes(3).toString('hex')}`;
    await expect(
      svc.create(admin, {
        title: `A943B Rollback ${rollbackSlugPrefix}`,
        categoryId,
        citySlug: 'uralsk',
        address: 'Rollback addr',
      }),
    ).rejects.toThrow('bl create failed');

    expect(await prisma.business.count()).toBe(beforeCount);
    await prisma.business.deleteMany({ where: { slug: { startsWith: 'a943b-rollback-' } } });
  });

  it('application approval maps physical snapshot to authoritative primary BL (C3)', async () => {
    if (skip) return;
    const title = `A943B Approve ${randomBytes(4).toString('hex')}`;
    const address = `Approve addr ${randomBytes(3).toString('hex')}`;
    const app = await prisma.businessApplication.create({
      data: {
        applicantUserId: fixtureOwnerId,
        cityId: uralskCityId,
        categoryId,
        title,
        address,
        latitude: 51.2278,
        longitude: 51.3865,
        locationSource: BusinessLocationSource.GEOCODED,
        phone: '+77005556677',
        status: BusinessApplicationStatus.PENDING,
        dedupeKey: buildApplicationDedupeKey(uralskCityId, title, address),
      },
    });

    const svc = buildApplicationsService();
    const admin = { id: adminUserId, sub: adminUserId, phone: '+7', role: UserRole.SUPER_ADMIN };

    try {
      const result = await svc.adminApprove(admin, app.id);
      expect(result.application.status).toBe(BusinessApplicationStatus.APPROVED);
      expect(result.business).toBeTruthy();

      const businessId = result.business!.id;
      const locations = await prisma.businessLocation.findMany({ where: { businessId } });
      expect(locations).toHaveLength(1);
      const primary = locations[0]!;
      expect(primary.isPrimary).toBe(true);
      expect(primary.address).toBe(address);
      expect(Number(primary.latitude)).toBeCloseTo(51.2278, 4);
      expect(primary.locationSource).toBe(BusinessLocationSource.GEOCODED);

      const businessRow = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
      expect(businessRow.cityId).toBe(uralskCityId);
      expect(businessRow.status).toBe(BusinessStatus.ACTIVE);
      await assertPrimaryBusinessCompatibilityParity(prisma, businessId);
      const dto = buildEffectivePhysicalDto(businessRowToContactDefaults(businessRow), primary);
      expect(dto.address).toBe(address);

      const membership = await prisma.businessMembership.findFirst({
        where: { businessId, userId: fixtureOwnerId },
      });
      expect(membership).toBeTruthy();
    } finally {
      const linked = await prisma.businessApplication.findUnique({ where: { id: app.id } });
      if (linked?.approvedBusinessId) {
        await prisma.business.delete({ where: { id: linked.approvedBusinessId } }).catch(() => undefined);
      }
      await prisma.businessApplication.delete({ where: { id: app.id } }).catch(() => undefined);
    }
  });

  it('application edit does not mutate existing Business', async () => {
    if (skip) return;
    const svc = buildApplicationsService();
    const user = { id: fixtureOwnerId, sub: fixtureOwnerId, phone: '+7', role: UserRole.USER };
    const draft = await prisma.businessApplication.create({
      data: {
        applicantUserId: fixtureOwnerId,
        cityId: uralskCityId,
        categoryId,
        title: `A943B Draft ${randomBytes(3).toString('hex')}`,
        address: 'Draft addr',
        status: BusinessApplicationStatus.DRAFT,
        dedupeKey: buildApplicationDedupeKey(uralskCityId, 'draft', randomBytes(4).toString('hex')),
      },
    });

    const beforeBusinessCount = await prisma.business.count();
    try {
      await svc.updateOwn(user, draft.id, { shortDesc: 'Updated draft only' });
      expect(await prisma.business.count()).toBe(beforeBusinessCount);
    } finally {
      await prisma.businessApplication.delete({ where: { id: draft.id } });
    }
  });

  it('aggregate helper commits primary BL before compatibility sync (transaction rollback)', async () => {
    if (skip) return;
    const slug = `a943b-tx-${randomBytes(4).toString('hex')}`;

    try {
      await withPostgisIntegrationTransaction(prisma, async (tx) => {
        const { business, primaryLocation: bl } = await primaryLocation.createBusinessWithInitialPrimary(
          tx,
          {
            brand: {
              title: 'A943B TX',
              slug,
              categoryId,
              ownerId: fixtureOwnerId,
              status: BusinessStatus.PENDING,
            },
            primaryPhysical: {
              cityId: uralskCityId,
              address: 'Tx addr',
              latitude: null,
              longitude: null,
              locationSource: null,
              workHours: null,
              phone: null,
              whatsapp: null,
              instagram: null,
              website: null,
            },
          },
        );
        expect(bl.isPrimary).toBe(true);
        expect(business.address).toBe('Tx addr');
        throw new Error(POSTGIS_TEST_ROLLBACK);
      });
    } finally {
      await prisma.business.deleteMany({ where: { slug: { startsWith: 'a943b-tx-' } } });
    }
  });
});
