import { ForbiddenException } from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessMembershipRole,
  UserRole,
} from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { CityScopeService } from '../../common/services/city-scope.service';

describe('AuditLogService (Stage 5M.3)', () => {
  const admin = {
    id: 'admin-1',
    sub: 'admin-1',
    role: UserRole.ADMIN,
    phone: '+77000000001',
  };
  const cityAdminUralsk = {
    id: 'city-admin-1',
    sub: 'city-admin-1',
    role: UserRole.CITY_ADMIN,
    phone: '+77000000002',
    managedCityId: 'city-uralsk',
  };
  const cityAdminAktobe = {
    id: 'city-admin-2',
    sub: 'city-admin-2',
    role: UserRole.CITY_ADMIN,
    phone: '+77000000003',
    managedCityId: 'city-aktobe',
  };
  const owner = {
    id: 'owner-1',
    sub: 'owner-1',
    role: UserRole.BUSINESS,
    phone: '+77000000004',
  };
  const user = {
    id: 'user-1',
    sub: 'user-1',
    role: UserRole.USER,
    phone: '+77000000005',
  };

  let prisma: {
    auditLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    business: { findUnique: jest.Mock };
  };
  let cityScope: { resolveAdminCityId: jest.Mock };
  let businessAccess: { assertOwner: jest.Mock; resolveAccess: jest.Mock };
  let service: AuditLogService;

  beforeEach(() => {
    prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      business: {
        findUnique: jest.fn().mockResolvedValue({ cityId: 'city-uralsk' }),
      },
    };
    cityScope = { resolveAdminCityId: jest.fn().mockResolvedValue(undefined) };
    businessAccess = {
      assertOwner: jest.fn().mockResolvedValue(undefined),
      resolveAccess: jest.fn().mockResolvedValue({
        business: { id: 'biz-1', cityId: 'city-uralsk', ownerId: 'owner-1', categoryId: 'cat-1' },
        accessRole: 'OWNER',
        permissions: [],
      }),
    };
    service = new AuditLogService(
      prisma as never,
      cityScope as unknown as CityScopeService,
      businessAccess as unknown as BusinessAccessService,
    );
  });

  it('record stores actor from auth context, not client metadata', async () => {
    await service.record({
      actor: admin,
      action: AuditAction.USER_ROLE_CHANGE,
      resourceType: AuditResourceType.USER,
      resourceId: 'target-1',
      targetUserId: 'target-1',
      metadata: {
        actorUserId: 'spoofed',
        actorRole: UserRole.ADMIN,
        oldRole: UserRole.USER,
        newRole: UserRole.ADMIN,
      },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: admin.id,
          actorRole: UserRole.ADMIN,
        }),
      }),
    );
  });

  it('ADMIN can list all audit logs', async () => {
    await service.listAdmin(admin, { page: 1, limit: 50 });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });

  it('CITY_ADMIN is scoped to managed city', async () => {
    cityScope.resolveAdminCityId = jest.fn().mockResolvedValue('city-uralsk');
    await service.listAdmin(cityAdminUralsk, { page: 1 });
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cityId: 'city-uralsk' },
      }),
    );
  });

  it('CITY_ADMIN cannot query foreign cityId filter', async () => {
    cityScope.resolveAdminCityId = jest.fn().mockResolvedValue('city-uralsk');
    await expect(
      service.listAdmin(cityAdminUralsk, { cityId: 'city-aktobe' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('USER cannot list admin audit logs', async () => {
    await expect(service.listAdmin(user, {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('OWNER can list team history for own business', async () => {
    await service.listTeamHistory(owner, 'biz-1', { page: 1 });
    expect(businessAccess.assertOwner).toHaveBeenCalledWith(owner, 'biz-1');
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'biz-1',
          action: { in: expect.arrayContaining([AuditAction.TEAM_INVITE]) },
        }),
      }),
    );
  });

  it('recordBusinessAction captures membership role snapshot', async () => {
    businessAccess.resolveAccess.mockResolvedValue({
      business: { id: 'biz-1', cityId: 'city-uralsk', ownerId: null, categoryId: 'cat-1' },
      accessRole: 'MANAGER',
      permissions: [],
    });

    await service.recordBusinessAction(owner, 'biz-1', {
      action: AuditAction.CATALOG_ITEM_CREATE,
      resourceType: AuditResourceType.SERVICE_ITEM,
      resourceId: 'item-1',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            membershipRole: BusinessMembershipRole.MANAGER,
          }),
        }),
      }),
    );
  });
});
