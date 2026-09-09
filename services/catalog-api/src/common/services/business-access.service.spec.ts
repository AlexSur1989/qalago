import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessPermission,
  UserRole,
} from '@prisma/client';
import { BusinessAccessService } from './business-access.service';
import { BusinessMembershipService } from './business-membership.service';
import { CityScopeService } from './city-scope.service';
import { createMockAuditLog, asAuditLogService } from '../../test-utils/mock-audit-log';

describe('BusinessAccessService (Stage 5M.2)', () => {
  const uralskCityId = 'city-uralsk';
  const aktobeCityId = 'city-aktobe';
  const businessUralsk = {
    id: 'biz-uralsk',
    ownerId: 'owner-1',
    cityId: uralskCityId,
    categoryId: 'cat-1',
  };
  const businessAktobe = {
    id: 'biz-aktobe',
    ownerId: 'owner-2',
    cityId: aktobeCityId,
    categoryId: 'cat-1',
  };
  const businessOrphanOwner = {
    id: 'biz-orphan',
    ownerId: null,
    cityId: uralskCityId,
    categoryId: 'cat-1',
  };

  let prisma: {
    business: { findUnique: jest.Mock };
    businessMembership: { findFirst: jest.Mock; findUnique: jest.Mock };
  };
  let cityScope: CityScopeService;
  let membership: BusinessMembershipService;
  let service: BusinessAccessService;

  beforeEach(() => {
    prisma = {
      business: { findUnique: jest.fn() },
      businessMembership: { findFirst: jest.fn(), findUnique: jest.fn().mockResolvedValue(null) },
    };
    cityScope = new CityScopeService(prisma as never, {} as never);
    jest.spyOn(cityScope, 'assertBusinessInAdminScope').mockImplementation(async (_user, cityId) => {
      if (cityId === aktobeCityId) {
        throw new ForbiddenException('Not allowed to manage businesses in this city');
      }
    });
    membership = new BusinessMembershipService(prisma as never, asAuditLogService(createMockAuditLog()));
    service = new BusinessAccessService(prisma as never, cityScope, membership);
  });

  const legacyOwner = {
    id: 'owner-1',
    sub: 'owner-1',
    role: UserRole.BUSINESS,
    phone: '+1',
  } as const;
  const manager = {
    id: 'manager-1',
    sub: 'manager-1',
    role: UserRole.USER,
    phone: '+6',
  } as const;
  const cityAdmin = {
    id: 'admin-city',
    sub: 'admin-city',
    role: UserRole.CITY_ADMIN,
    phone: '+3',
  } as const;
  const admin = { id: 'admin', sub: 'admin', role: UserRole.ADMIN, phone: '+4' } as const;
  const user = { id: 'user-1', sub: 'user-1', role: UserRole.USER, phone: '+5' } as const;

  function mockManager(permissions: BusinessPermission[]) {
    prisma.businessMembership.findFirst.mockResolvedValue({
      id: 'mem-mgr',
      userId: manager.id,
      businessId: businessOrphanOwner.id,
      role: BusinessMembershipRole.MANAGER,
      status: BusinessMembershipStatus.ACTIVE,
      permissions,
    });
  }

  it('legacy owner has all permissions when no membership row exists', async () => {
    prisma.business.findUnique.mockResolvedValue(businessUralsk);
    prisma.businessMembership.findUnique.mockResolvedValue(null);
    const access = await service.resolveAccess(legacyOwner, businessUralsk.id);
    expect(access.accessRole).toBe('OWNER');
    expect(access.permissions).toContain(BusinessPermission.CATALOG_EDIT);
  });

  it('REVOKED OWNER denied even when ownerId matches (Stage 5N.1)', async () => {
    prisma.business.findUnique.mockResolvedValue(businessUralsk);
    prisma.businessMembership.findUnique.mockResolvedValue({
      role: BusinessMembershipRole.OWNER,
      status: BusinessMembershipStatus.REVOKED,
    });
    await expect(service.resolveAccess(legacyOwner, businessUralsk.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('ACTIVE MANAGER with CATALOG_EDIT may assert permission', async () => {
    prisma.business.findUnique.mockResolvedValue(businessOrphanOwner);
    mockManager([BusinessPermission.CATALOG_EDIT]);
    await expect(
      service.assertBusinessPermission(manager, businessOrphanOwner.id, BusinessPermission.CATALOG_EDIT),
    ).resolves.toEqual(businessOrphanOwner);
  });

  it('denied permission uses generic message without enum leak', async () => {
    prisma.business.findUnique.mockResolvedValue(businessOrphanOwner);
    mockManager([BusinessPermission.CATALOG_EDIT]);
    await expect(
      service.assertBusinessPermission(manager, businessOrphanOwner.id, BusinessPermission.PAYMENTS_VIEW),
    ).rejects.toMatchObject({ message: 'Insufficient permissions' });
  });

  it('ACTIVE MANAGER without ANALYTICS_VIEW denied analytics', async () => {
    prisma.business.findUnique.mockResolvedValue(businessOrphanOwner);
    mockManager([BusinessPermission.CATALOG_EDIT]);
    await expect(
      service.assertCanViewBusinessAnalytics(manager, businessOrphanOwner.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('MANAGER cannot assertOwner', async () => {
    prisma.business.findUnique.mockResolvedValue(businessOrphanOwner);
    mockManager([BusinessPermission.CATALOG_EDIT, BusinessPermission.PROMOTIONS_EDIT]);
    await expect(service.assertOwner(manager, businessOrphanOwner.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('SUSPENDED MANAGER denied (no active membership)', async () => {
    prisma.business.findUnique.mockResolvedValue(businessOrphanOwner);
    prisma.businessMembership.findFirst.mockResolvedValue(null);
    await expect(
      service.assertBusinessPermission(manager, businessOrphanOwner.id, BusinessPermission.CATALOG_EDIT),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('CITY_ADMIN other city → deny', async () => {
    prisma.business.findUnique.mockResolvedValue(businessAktobe);
    await expect(service.resolveAccess(cityAdmin, businessAktobe.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('ADMIN → all permissions', async () => {
    prisma.business.findUnique.mockResolvedValue(businessAktobe);
    const access = await service.resolveAccess(admin, businessAktobe.id);
    expect(access.accessRole).toBe('ADMIN');
    expect(access.permissions.length).toBeGreaterThan(5);
  });

  it('throws when business not found', async () => {
    prisma.business.findUnique.mockResolvedValue(null);
    await expect(service.resolveAccess(user, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
