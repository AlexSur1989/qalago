import { ForbiddenException } from '@nestjs/common';
import { BusinessPlanTier, PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { StaffPermission } from '@qalago/shared-types';
import { AdminBusinessLocationService } from './admin-business-location.service';
import { AdminService } from './admin.service';
import { BusinessLocationService } from '../businesses/business-location.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessSubcategoryService } from '../businesses/business-subcategory.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { StaffAuthorizationGuard } from '../../common/guards/staff-authorization.guard';
import { StaffPolicyService } from '../../common/services/staff-policy.service';
import { StaffStepUpService } from '../../common/services/staff-step-up.service';
import { Reflector } from '@nestjs/core';
import {
  ADMIN_STAFF_ROUTE_KEY,
  STAFF_PERMISSIONS_KEY,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  createTestBusinessWithPrimary,
  testPrimaryPhysical,
} from '../businesses/business-with-primary.test-fixture';
import { staffRoleHasPermission } from '@qalago/shared-types';

function mockReflector(permissions: StaffPermission[]) {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === STAFF_PERMISSIONS_KEY) return permissions;
      if (key === ADMIN_STAFF_ROUTE_KEY) return false;
      return undefined;
    }),
  } as unknown as Reflector;
}

describe('AOP.4 — Admin catalog RBAC / CITY_ADMIN scope', () => {
  const prisma = new PrismaClient();
  const auditMock = createMockAuditLog();
  let skip = false;
  let cityAId = '';
  let cityBId = '';
  let categoryId = '';
  let adminId = '';
  let cityAdminAId = '';
  let cityAdminBId = '';
  let contentManagerId = '';
  let analystId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const uralsk = await prisma.city.findFirst({ where: { slug: 'uralsk', isActive: true } });
      const aktobe = await prisma.city.findFirst({ where: { slug: 'aktobe', isActive: true } });
      const category = await prisma.category.findFirst({ select: { id: true } });
      if (!uralsk || !aktobe || !category) {
        skip = true;
        return;
      }
      cityAId = uralsk.id;
      cityBId = aktobe.id;
      categoryId = category.id;
      const suffix = randomBytes(3).toString('hex');
      adminId = `aop4-admin-${suffix}`;
      cityAdminAId = `aop4-ca-${suffix}`;
      cityAdminBId = `aop4-cb-${suffix}`;
      contentManagerId = `aop4-cm-${suffix}`;
      analystId = `aop4-an-${suffix}`;

      for (const row of [
        { id: adminId, phone: `+7720${suffix}0`, role: UserRole.ADMIN },
        { id: cityAdminAId, phone: `+7721${suffix}1`, role: UserRole.CITY_ADMIN },
        { id: cityAdminBId, phone: `+7722${suffix}2`, role: UserRole.CITY_ADMIN },
        { id: contentManagerId, phone: `+7723${suffix}3`, role: UserRole.CONTENT_MANAGER },
        { id: analystId, phone: `+7724${suffix}4`, role: UserRole.ANALYST },
      ]) {
        await prisma.user.create({ data: row });
      }
      await prisma.staffAccess.createMany({
        data: [
          { userId: adminId, staffRole: UserRole.ADMIN, isActive: true },
          { userId: cityAdminAId, staffRole: UserRole.CITY_ADMIN, isActive: true },
          { userId: cityAdminBId, staffRole: UserRole.CITY_ADMIN, isActive: true },
          { userId: contentManagerId, staffRole: UserRole.CONTENT_MANAGER, isActive: true },
          { userId: analystId, staffRole: UserRole.ANALYST, isActive: true },
        ],
      });
      await prisma.staffCityScope.createMany({
        data: [
          { userId: cityAdminAId, cityId: cityAId },
          { userId: cityAdminBId, cityId: cityBId },
        ],
      });
    } catch (error) {
      skip = true;
      console.warn('AOP.4 spec skipped (dev DB fixture):', error);
    }
  });

  afterAll(async () => {
    await prisma.staffCityScope
      .deleteMany({ where: { userId: { in: [cityAdminAId, cityAdminBId] } } })
      .catch(() => undefined);
    await prisma.staffAccess
      .deleteMany({
        where: { userId: { in: [adminId, cityAdminAId, cityAdminBId, contentManagerId, analystId] } },
      })
      .catch(() => undefined);
    await prisma.user
      .deleteMany({
        where: { id: { in: [adminId, cityAdminAId, cityAdminBId, contentManagerId, analystId] } },
      })
      .catch(() => undefined);
    await prisma.$disconnect();
  });

  const adminActor = (): AuthUser => ({
    id: adminId,
    sub: adminId,
    role: UserRole.ADMIN,
    phone: '+77000000001',
  });
  const cityAdminA = (): AuthUser => ({
    id: cityAdminAId,
    sub: cityAdminAId,
    role: UserRole.CITY_ADMIN,
    phone: '+77000000002',
  });
  const cityAdminB = (): AuthUser => ({
    id: cityAdminBId,
    sub: cityAdminBId,
    role: UserRole.CITY_ADMIN,
    phone: '+77000000003',
  });

  function buildCityScope() {
    return new CityScopeService(prisma as unknown as PrismaService, {
      get: () => 'uralsk',
    } as unknown as ConfigService);
  }

  function buildLocationAdminService() {
    const cityScope = buildCityScope();
    const locations = new BusinessLocationService(
      prisma as unknown as PrismaService,
      {} as never,
      new BusinessPrimaryLocationService(),
    );
    return new AdminBusinessLocationService(
      cityScope,
      locations,
      asAuditLogService(auditMock) as AuditLogService,
      prisma as unknown as PrismaService,
    );
  }

  function buildAdminService() {
    const cityScope = buildCityScope();
    const businessSubcategories = new BusinessSubcategoryService(prisma as unknown as PrismaService);
    return new AdminService(
      prisma as never,
      cityScope,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      asAuditLogService(auditMock),
      {} as never,
      {} as never,
      businessSubcategories,
      {} as never,
      new BusinessPrimaryLocationService(),
    );
  }

  async function createMultiCityBusiness(slugPrefix: string) {
    const slug = `${slugPrefix}-${randomBytes(4).toString('hex')}`;
    const { business } = await createTestBusinessWithPrimary(prisma, {
      brand: {
        title: 'AOP4 multi',
        slug,
        categoryId,
        status: 'ACTIVE',
        ownerId: null,
      },
      primaryPhysical: testPrimaryPhysical(cityAId, 'Primary A'),
    });
    const secondaryB = await prisma.businessLocation.create({
      data: {
        businessId: business.id,
        cityId: cityBId,
        address: 'Branch B',
        isPrimary: false,
      },
    });
    return { business, secondaryB, slug };
  }

  async function cleanupSlug(slug: string) {
    await prisma.business.deleteMany({ where: { slug } }).catch(() => undefined);
  }

  describe('role grant facts (shared-types)', () => {
    it('ANALYST lacks catalog permissions (reports-only role)', () => {
      expect(staffRoleHasPermission(UserRole.ANALYST, StaffPermission.BUSINESS_VIEW)).toBe(false);
      expect(staffRoleHasPermission(UserRole.ANALYST, StaffPermission.BUSINESS_EDIT)).toBe(false);
      expect(staffRoleHasPermission(UserRole.ANALYST, StaffPermission.BUSINESS_CREATE)).toBe(false);
    });

    it('CONTENT_MANAGER has BUSINESS_CREATE per AOP.0', () => {
      expect(staffRoleHasPermission(UserRole.CONTENT_MANAGER, StaffPermission.BUSINESS_CREATE)).toBe(
        true,
      );
      expect(staffRoleHasPermission(UserRole.CONTENT_MANAGER, StaffPermission.CATEGORY_EDIT)).toBe(true);
    });

    it('CITY_ADMIN lacks CATEGORY_EDIT (taxonomy route guard)', () => {
      expect(staffRoleHasPermission(UserRole.CITY_ADMIN, StaffPermission.CATEGORY_EDIT)).toBe(false);
    });
  });

  describe('multi-city Business X (primary A, secondary B)', () => {
    it('both city admins can view detail (ANY-BL visibility)', async () => {
      if (skip) return;
      const svc = buildAdminService();
      const { business, slug } = await createMultiCityBusiness('aop4-view');
      try {
        await expect(svc.getBusinessDetail(cityAdminA(), business.id)).resolves.toMatchObject({
          id: business.id,
        });
        await expect(svc.getBusinessDetail(cityAdminB(), business.id)).resolves.toMatchObject({
          id: business.id,
        });
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('city admin B cannot patch catalog (primary-city authority)', async () => {
      if (skip) return;
      const svc = buildAdminService();
      const { business, slug } = await createMultiCityBusiness('aop4-cat');
      try {
        await expect(
          svc.patchBusinessCatalog(cityAdminB(), business.id, { title: 'Hacked' }),
        ).rejects.toBeInstanceOf(ForbiddenException);
        await expect(
          svc.patchBusinessCatalog(cityAdminA(), business.id, { title: 'OK title' }),
        ).resolves.toBeDefined();
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('both city admins see business in scoped list (ANY-BL)', async () => {
      if (skip) return;
      const svc = buildAdminService();
      const { business, slug } = await createMultiCityBusiness('aop7h-list');
      try {
        const listA = await svc.listBusinesses(cityAdminA(), { page: 1, limit: 100 });
        const listB = await svc.listBusinesses(cityAdminB(), { page: 1, limit: 100 });
        expect(listA.items.some((i) => i.id === business.id)).toBe(true);
        expect(listB.items.some((i) => i.id === business.id)).toBe(true);
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('city admin A cannot mutate featured even with primary-city authority (AOP.7H)', async () => {
      if (skip) return;
      const svc = buildAdminService();
      const { business, slug } = await createMultiCityBusiness('aop7h-feat-a');
      try {
        await expect(
          svc.updateBusinessFeatured(cityAdminA(), business.id, {
            isFeatured: true,
            featuredSlot: 1,
          }),
        ).rejects.toBeInstanceOf(ForbiddenException);
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('city admin B cannot mutate featured (AOP.7H)', async () => {
      if (skip) return;
      const svc = buildAdminService();
      const { business, slug } = await createMultiCityBusiness('aop7h-feat-b');
      try {
        await expect(
          svc.updateBusinessFeatured(cityAdminB(), business.id, {
            isFeatured: true,
            featuredSlot: 1,
          }),
        ).rejects.toBeInstanceOf(ForbiddenException);
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('platform ADMIN can mutate featured (AOP.7H)', async () => {
      if (skip) return;
      const svc = buildAdminService();
      const { business, slug } = await createMultiCityBusiness('aop7h-feat-admin');
      try {
        const updated = await svc.updateBusinessFeatured(adminActor(), business.id, {
          isFeatured: true,
          featuredSlot: 2,
        });
        expect(updated.isFeatured).toBe(true);
        expect(updated.featuredSlot).toBe(2);
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('city admins cannot override plan tier (AOP.7H)', async () => {
      if (skip) return;
      const svc = buildAdminService();
      const plans = {
        adminSetTier: jest.fn().mockResolvedValue({ planTier: 'BASIC' }),
      };
      (svc as unknown as { plans: typeof plans }).plans = plans;
      const { business, slug } = await createMultiCityBusiness('aop7h-plan');
      try {
        await expect(
          svc.updateBusinessPlan(cityAdminA(), business.id, { tier: BusinessPlanTier.BASIC }),
        ).rejects.toBeInstanceOf(ForbiddenException);
        await expect(
          svc.updateBusinessPlan(cityAdminB(), business.id, { tier: BusinessPlanTier.BASIC }),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(plans.adminSetTier).not.toHaveBeenCalled();
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('platform ADMIN can override plan tier (AOP.7H)', async () => {
      if (skip) return;
      const svc = buildAdminService();
      const plans = {
        adminSetTier: jest.fn().mockResolvedValue({ planTier: 'PREMIUM' }),
      };
      (svc as unknown as { plans: typeof plans }).plans = plans;
      const { business, slug } = await createMultiCityBusiness('aop7h-plan-admin');
      try {
        await svc.updateBusinessPlan(adminActor(), business.id, { tier: BusinessPlanTier.PREMIUM });
        expect(plans.adminSetTier).toHaveBeenCalledWith(
          adminActor(),
          business.id,
          BusinessPlanTier.PREMIUM,
        );
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('city admin B cannot update status when primary is outside scope (AOP.7H)', async () => {
      if (skip) return;
      const svc = buildAdminService();
      const { business, slug } = await createMultiCityBusiness('aop4-status');
      try {
        await expect(
          svc.updateBusinessStatus(cityAdminB(), business.id, { status: 'BLOCKED' }),
        ).rejects.toBeInstanceOf(ForbiddenException);
        await expect(
          svc.updateBusinessStatus(cityAdminA(), business.id, { status: 'BLOCKED' }),
        ).resolves.toMatchObject({ status: 'BLOCKED' });
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('city admin B cannot set-primary to gain owner-equivalent authority', async () => {
      if (skip) return;
      const locSvc = buildLocationAdminService();
      const { business, secondaryB, slug } = await createMultiCityBusiness('aop4-escalate');
      try {
        await expect(
          locSvc.setPrimary(cityAdminB(), business.id, secondaryB.id),
        ).rejects.toBeInstanceOf(ForbiddenException);
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('city admin A cannot set-primary to out-of-scope City B branch', async () => {
      if (skip) return;
      const locSvc = buildLocationAdminService();
      const { business, secondaryB, slug } = await createMultiCityBusiness('aop4-cross');
      try {
        await expect(
          locSvc.setPrimary(cityAdminA(), business.id, secondaryB.id),
        ).rejects.toBeInstanceOf(ForbiddenException);
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('platform ADMIN can set-primary to City B branch', async () => {
      if (skip) return;
      const locSvc = buildLocationAdminService();
      const { business, secondaryB, slug } = await createMultiCityBusiness('aop4-admin-promote');
      try {
        const promoted = await locSvc.setPrimary(adminActor(), business.id, secondaryB.id);
        expect(promoted.isPrimary).toBe(true);
        const primaries = await prisma.businessLocation.count({
          where: { businessId: business.id, isPrimary: true },
        });
        expect(primaries).toBe(1);
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('city admin B cannot edit foreign-city primary branch', async () => {
      if (skip) return;
      const locSvc = buildLocationAdminService();
      const { business, slug } = await createMultiCityBusiness('aop4-edit-primary');
      try {
        const primary = await prisma.businessLocation.findFirstOrThrow({
          where: { businessId: business.id, isPrimary: true },
        });
        await expect(
          locSvc.update(cityAdminB(), business.id, primary.id, { address: 'X' }),
        ).rejects.toBeInstanceOf(ForbiddenException);
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('city admin B can edit own-city secondary branch', async () => {
      if (skip) return;
      const locSvc = buildLocationAdminService();
      const { business, secondaryB, slug } = await createMultiCityBusiness('aop4-edit-sec');
      try {
        const updated = await locSvc.update(cityAdminB(), business.id, secondaryB.id, {
          address: 'Branch B updated',
        });
        expect(updated.address).toBe('Branch B updated');
      } finally {
        await cleanupSlug(slug);
      }
    });

    it('city admin B cannot move secondary branch to foreign city via PATCH', async () => {
      if (skip) return;
      const locSvc = buildLocationAdminService();
      const { business, secondaryB, slug } = await createMultiCityBusiness('aop4-move');
      try {
        await expect(
          locSvc.update(cityAdminB(), business.id, secondaryB.id, { cityId: cityAId }),
        ).rejects.toBeInstanceOf(ForbiddenException);
      } finally {
        await cleanupSlug(slug);
      }
    });
  });

  describe('StaffAuthorizationGuard', () => {
    const policy = new StaffPolicyService({} as never);
    const stepUp = new StaffStepUpService({ get: () => 600 } as never, { record: jest.fn() } as never);
    const ctx = (user: { role: UserRole; id: string }) =>
      ({
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => ({ user: { sub: user.id, ...user } }) }),
      }) as never;

    it('denies ANALYST for BUSINESS_VIEW admin catalog list guard', () => {
      const guard = new StaffAuthorizationGuard(
        mockReflector([StaffPermission.BUSINESS_VIEW]),
        policy,
        stepUp,
      );
      expect(() => guard.canActivate(ctx({ role: UserRole.ANALYST, id: analystId }))).toThrow(
        ForbiddenException,
      );
    });
  });
});
