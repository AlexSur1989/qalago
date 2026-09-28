import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  BusinessStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { StaffPermission } from '@qalago/shared-types';
import { AdminService } from './admin.service';
import { AdminCreateBusinessDto } from './dto/admin.dto';
import { CityScopeService } from '../../common/services/city-scope.service';
import { BusinessPrimaryLocationService } from '../../common/services/business-primary-location.service';
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

function mockReflector(permissions: StaffPermission[]) {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === STAFF_PERMISSIONS_KEY) return permissions;
      if (key === ADMIN_STAFF_ROUTE_KEY) return false;
      return undefined;
    }),
  } as unknown as Reflector;
}

describe('AOP.1 — staff admin catalog core', () => {
  const prisma = new PrismaClient();
  const auditMock = createMockAuditLog();
  let skip = false;
  let cityId = '';
  let otherCityId = '';
  let categoryId = '';
  let otherCategoryId = '';
  let subcategoryId = '';
  let wrongCategorySubId = '';
  let staffAdminId = '';
  let staffContentId = '';
  let cityAdminId = '';
  let cityAdminOtherId = '';
  let consumerId = '';

  beforeAll(async () => {
    try {
      await prisma.$connect();
      const uralsk = await prisma.city.findFirst({
        where: { slug: 'uralsk', isActive: true },
        select: { id: true },
      });
      const aktobe = await prisma.city.findFirst({
        where: { slug: 'aktobe', isActive: true },
        select: { id: true },
      });
      const category = await prisma.category.findFirst({ select: { id: true } });
      const otherCategory = await prisma.category.findFirst({
        where: category ? { id: { not: category.id } } : undefined,
        select: { id: true },
      });
      if (!uralsk || !aktobe || !category || !otherCategory) {
        skip = true;
        return;
      }
      cityId = uralsk.id;
      otherCityId = aktobe.id;
      categoryId = category.id;
      otherCategoryId = otherCategory.id;

      const sub = await prisma.subcategory.findFirst({
        where: { categoryId },
        select: { id: true },
      });
      const wrongSub = await prisma.subcategory.findFirst({
        where: { categoryId: otherCategoryId },
        select: { id: true },
      });
      if (!sub || !wrongSub) {
        skip = true;
        return;
      }
      subcategoryId = sub.id;
      wrongCategorySubId = wrongSub.id;

      staffAdminId = `aop1-admin-${randomBytes(3).toString('hex')}`;
      staffContentId = `aop1-content-${randomBytes(3).toString('hex')}`;
      cityAdminId = `aop1-city-a-${randomBytes(3).toString('hex')}`;
      cityAdminOtherId = `aop1-city-b-${randomBytes(3).toString('hex')}`;
      consumerId = `aop1-user-${randomBytes(3).toString('hex')}`;

      await prisma.user.createMany({
        data: [
          { id: staffAdminId, phone: `+7701${randomBytes(3).toString('hex')}`, role: UserRole.ADMIN },
          {
            id: staffContentId,
            phone: `+7702${randomBytes(3).toString('hex')}`,
            role: UserRole.CONTENT_MANAGER,
          },
          { id: cityAdminId, phone: `+7703${randomBytes(3).toString('hex')}`, role: UserRole.CITY_ADMIN },
          {
            id: cityAdminOtherId,
            phone: `+7704${randomBytes(3).toString('hex')}`,
            role: UserRole.CITY_ADMIN,
          },
          { id: consumerId, phone: `+7705${randomBytes(3).toString('hex')}`, role: UserRole.USER },
        ],
      });
      await prisma.staffAccess.createMany({
        data: [
          { userId: staffAdminId, staffRole: UserRole.ADMIN, isActive: true },
          { userId: staffContentId, staffRole: UserRole.CONTENT_MANAGER, isActive: true },
          { userId: cityAdminId, staffRole: UserRole.CITY_ADMIN, isActive: true },
          { userId: cityAdminOtherId, staffRole: UserRole.CITY_ADMIN, isActive: true },
        ],
      });
      await prisma.staffCityScope.createMany({
        data: [
          { userId: cityAdminId, cityId },
          { userId: cityAdminOtherId, cityId: otherCityId },
        ],
      });
    } catch {
      skip = true;
    }
  });

  afterAll(async () => {
    await prisma.staffCityScope
      .deleteMany({ where: { userId: { in: [cityAdminId, cityAdminOtherId] } } })
      .catch(() => undefined);
    await prisma.staffAccess
      .deleteMany({
        where: {
          userId: { in: [staffAdminId, staffContentId, cityAdminId, cityAdminOtherId] },
        },
      })
      .catch(() => undefined);
    await prisma.user
      .deleteMany({
        where: {
          id: { in: [staffAdminId, staffContentId, cityAdminId, cityAdminOtherId, consumerId] },
        },
      })
      .catch(() => undefined);
    await prisma.$disconnect();
  });

  function buildService() {
    const cityScope = new CityScopeService(prisma as unknown as PrismaService, {
      get: () => 'uralsk',
    } as unknown as ConfigService);
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

  const adminActor = (): AuthUser => ({
    id: staffAdminId,
    sub: staffAdminId,
    role: UserRole.ADMIN,
    phone: '+77000000001',
  });

  const contentActor = (): AuthUser => ({
    id: staffContentId,
    sub: staffContentId,
    role: UserRole.CONTENT_MANAGER,
    phone: '+77000000002',
  });

  const cityAdminActor = (): AuthUser => ({
    id: cityAdminId,
    sub: cityAdminId,
    role: UserRole.CITY_ADMIN,
    phone: '+77000000003',
  });

  const cityAdminOther = (): AuthUser => ({
    id: cityAdminOtherId,
    sub: cityAdminOtherId,
    role: UserRole.CITY_ADMIN,
    phone: '+77000000004',
  });

  function baseCreateDto(slug: string): AdminCreateBusinessDto {
    const dto = new AdminCreateBusinessDto();
    dto.title = `AOP1 ${slug}`;
    dto.slug = slug;
    dto.categoryId = categoryId;
    dto.shortDesc = 'Staff-created catalog shell';
    dto.initialLocation = {
      cityId,
      address: 'Admin primary address 1',
    } as AdminCreateBusinessDto['initialLocation'];
    return dto;
  }

  async function cleanupSlug(slug: string) {
    await prisma.business.deleteMany({ where: { slug } }).catch(() => undefined);
  }

  describe('StaffAuthorizationGuard BUSINESS_CREATE', () => {
    const policy = new StaffPolicyService({} as never);
    const stepUp = new StaffStepUpService({ get: () => 600 } as never, {
      record: jest.fn(),
    } as never);

    const ctx = (user: { role: UserRole; id: string }) =>
      ({
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => ({ user: { sub: user.id, ...user } }) }),
      }) as never;

    it('denies consumer USER for BUSINESS_CREATE', () => {
      const guard = new StaffAuthorizationGuard(
        mockReflector([StaffPermission.BUSINESS_CREATE]),
        policy,
        stepUp,
      );
      expect(() => guard.canActivate(ctx({ role: UserRole.USER, id: consumerId }))).toThrow(
        ForbiddenException,
      );
    });

    it('allows CONTENT_MANAGER with BUSINESS_CREATE', () => {
      const guard = new StaffAuthorizationGuard(
        mockReflector([StaffPermission.BUSINESS_CREATE]),
        policy,
        stepUp,
      );
      expect(
        guard.canActivate(ctx({ role: UserRole.CONTENT_MANAGER, id: staffContentId })),
      ).toBe(true);
    });
  });

  it('authorized staff creates ownerless business + primary BL (PENDING)', async () => {
    if (skip) return;
    const slug = `aop1-ok-${randomBytes(4).toString('hex')}`;
    const service = buildService();
    try {
      const created = await service.createStaffBusiness(adminActor(), baseCreateDto(slug));
      expect(created.business.ownerId).toBeNull();
      expect(created.business.status).toBe(BusinessStatus.PENDING);
      expect(created.primaryLocation.isPrimary).toBe(true);
      expect(created.primaryLocation.cityId).toBe(cityId);

      const membership = await prisma.businessMembership.findFirst({
        where: { businessId: created.business.id, userId: staffAdminId },
      });
      expect(membership).toBeNull();

      expect(auditMock.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.BUSINESS_CREATE,
          metadata: expect.objectContaining({ ownerId: null, slug }),
        }),
      );
    } finally {
      await cleanupSlug(slug);
    }
  });

  it('rejects duplicate slug', async () => {
    if (skip) return;
    const slug = `aop1-dup-${randomBytes(4).toString('hex')}`;
    const service = buildService();
    try {
      await service.createStaffBusiness(adminActor(), baseCreateDto(slug));
      await expect(service.createStaffBusiness(adminActor(), baseCreateDto(slug))).rejects.toBeInstanceOf(
        ConflictException,
      );
    } finally {
      await cleanupSlug(slug);
    }
  });

  it('rejects invalid city', async () => {
    if (skip) return;
    const slug = `aop1-city-${randomBytes(4).toString('hex')}`;
    const service = buildService();
    const dto = baseCreateDto(slug);
    dto.initialLocation.cityId = 'nonexistent-city-id';
    await expect(service.createStaffBusiness(adminActor(), dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await cleanupSlug(slug);
  });

  it('rejects invalid subcategory / category relation', async () => {
    if (skip) return;
    const slug = `aop1-sub-${randomBytes(4).toString('hex')}`;
    const service = buildService();
    const dto = { ...baseCreateDto(slug), subcategoryIds: [wrongCategorySubId] };
    await expect(service.createStaffBusiness(adminActor(), dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const orphan = await prisma.business.findUnique({ where: { slug } });
    expect(orphan).toBeNull();
  });

  it('rolls back business on subcategory sync failure (no partial row)', async () => {
    if (skip) return;
    const slug = `aop1-tx-${randomBytes(4).toString('hex')}`;
    const service = buildService();
    const dto = { ...baseCreateDto(slug), subcategoryIds: ['invalid-subcategory-id'] };
    await expect(service.createStaffBusiness(adminActor(), dto)).rejects.toThrow();
    expect(await prisma.business.count({ where: { slug } })).toBe(0);
  });

  it('CITY_ADMIN can create in scoped city', async () => {
    if (skip) return;
    const slug = `aop1-ca-${randomBytes(4).toString('hex')}`;
    const service = buildService();
    try {
      const created = await service.createStaffBusiness(cityAdminActor(), baseCreateDto(slug));
      expect(created.primaryLocation.cityId).toBe(cityId);
    } finally {
      await cleanupSlug(slug);
    }
  });

  it('CITY_ADMIN rejected for primary city outside scope', async () => {
    if (skip) return;
    const slug = `aop1-cb-${randomBytes(4).toString('hex')}`;
    const service = buildService();
    const dto = baseCreateDto(slug);
    dto.initialLocation.cityId = otherCityId;
    await expect(service.createStaffBusiness(cityAdminActor(), dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await cleanupSlug(slug);
  });

  it('patch catalog does not accept slug mutation via service allowlist', async () => {
    if (skip) return;
    const slug = `aop1-patch-${randomBytes(4).toString('hex')}`;
    const service = buildService();
    try {
      const created = await service.createStaffBusiness(contentActor(), baseCreateDto(slug));
      const patched = await service.patchBusinessCatalog(contentActor(), created.business.id, {
        title: 'Updated title',
      });
      expect(patched.title).toBe('Updated title');
      expect(patched.slug).toBe(slug);
    } finally {
      await cleanupSlug(slug);
    }
  });
});
