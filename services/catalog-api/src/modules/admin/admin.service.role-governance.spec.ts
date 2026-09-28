import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResourceType, UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { AuthUser } from '../../common/types/jwt-payload.type';

describe('AdminService.updateUserRole (Stage 6.9.1.1)', () => {
  const superAdmin: AuthUser = {
    id: 'sa-1',
    sub: 'sa-1',
    role: UserRole.SUPER_ADMIN,
    phone: '+77000000001',
    stepUpAt: Math.floor(Date.now() / 1000),
    sid: 'sess-1',
  };

  const platformAdmin: AuthUser = {
    id: 'a-1',
    sub: 'a-1',
    role: UserRole.ADMIN,
    phone: '+77000000005',
  };

  const auditLog = { record: jest.fn().mockResolvedValue({}) };
  const systemAccess = {
    assertSuperAdmin: jest.fn(),
    assertCanDemoteSuperAdmin: jest.fn(),
    validateCityAdminAssignment: jest.fn(),
  };
  const staffStepUp = { assertRecentStepUp: jest.fn() };

  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    staffStepUp.assertRecentStepUp.mockImplementation(() => undefined);
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          user: {
            update: prisma.user.update,
          },
          staffAccess: {
            upsert: jest.fn().mockResolvedValue({}),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          staffCityScope: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
        }),
      ),
    };

    service = new AdminService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      auditLog as never,
      systemAccess as never,
      {} as never,
      {} as never,
      staffStepUp as never,
      {} as never,
    );
  });

  it('rejects non-super-admin actor', async () => {
    systemAccess.assertSuperAdmin.mockImplementation(() => {
      throw new ForbiddenException('Super admin access required');
    });

    await expect(
      service.updateUserRole(platformAdmin, 'target-1', { role: UserRole.USER }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects self role change', async () => {
    systemAccess.assertSuperAdmin.mockImplementation(() => undefined);

    await expect(
      service.updateUserRole(superAdmin, superAdmin.id, { role: UserRole.USER }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'STAFF_SELF_ROLE_CHANGE_FORBIDDEN',
      }),
    });
  });

  it('rejects staff role assignment via legacy endpoint', async () => {
    systemAccess.assertSuperAdmin.mockImplementation(() => undefined);
    prisma.user.findUnique.mockResolvedValue({
      id: 'target-1',
      role: UserRole.USER,
      managedCityId: null,
    });

    await expect(
      service.updateUserRole(superAdmin, 'target-1', { role: UserRole.ADMIN }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'STAFF_PERMISSION_DENIED' }),
    });
  });

  it('audits successful consumer role change by super admin', async () => {
    systemAccess.assertSuperAdmin.mockImplementation(() => undefined);
    prisma.user.findUnique.mockResolvedValue({
      id: 'target-1',
      role: UserRole.USER,
      managedCityId: null,
    });
    prisma.user.update.mockResolvedValue({
      id: 'target-1',
      phone: '+77000000099',
      name: 'User',
      role: UserRole.BUSINESS,
      managedCityId: null,
      managedCity: null,
    });

    await service.updateUserRole(superAdmin, 'target-1', { role: UserRole.BUSINESS });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: superAdmin,
        action: AuditAction.USER_ROLE_CHANGE,
        resourceType: AuditResourceType.USER,
        targetUserId: 'target-1',
        metadata: expect.objectContaining({
          oldRole: UserRole.USER,
          newRole: UserRole.BUSINESS,
        }),
      }),
    );
  });

  it('rejects demoting staff via legacy endpoint', async () => {
    systemAccess.assertSuperAdmin.mockImplementation(() => undefined);
    prisma.user.findUnique.mockResolvedValue({
      id: 'sa-2',
      role: UserRole.SUPER_ADMIN,
      managedCityId: null,
    });

    await expect(
      service.updateUserRole(superAdmin, 'sa-2', { role: UserRole.USER }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'STAFF_PERMISSION_DENIED' }),
    });
  });

  it('throws when target user missing', async () => {
    systemAccess.assertSuperAdmin.mockImplementation(() => undefined);
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.updateUserRole(superAdmin, 'missing', { role: UserRole.USER }),
    ).rejects.toThrow(NotFoundException);
  });
});
