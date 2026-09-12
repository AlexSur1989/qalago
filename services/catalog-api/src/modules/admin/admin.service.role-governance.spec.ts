import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditResourceType, UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { AuthUser } from '../../common/types/jwt-payload.type';

describe('AdminService.updateUserRole (Stage 5M.4)', () => {
  const superAdmin: AuthUser = {
    id: 'sa-1',
    sub: 'sa-1',
    role: UserRole.SUPER_ADMIN,
    phone: '+77000000001',
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

  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
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
      service.updateUserRole(superAdmin, superAdmin.id, { role: UserRole.ADMIN }),
    ).rejects.toThrow('Cannot change your own system role');
  });

  it('audits successful role change by super admin', async () => {
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
      role: UserRole.ADMIN,
      managedCityId: null,
      managedCity: null,
    });

    await service.updateUserRole(superAdmin, 'target-1', { role: UserRole.ADMIN });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: superAdmin,
        action: AuditAction.USER_ROLE_CHANGE,
        resourceType: AuditResourceType.USER,
        targetUserId: 'target-1',
        metadata: expect.objectContaining({
          oldRole: UserRole.USER,
          newRole: UserRole.ADMIN,
        }),
      }),
    );
  });

  it('enforces last super admin invariant', async () => {
    systemAccess.assertSuperAdmin.mockImplementation(() => undefined);
    prisma.user.findUnique.mockResolvedValue({
      id: 'sa-2',
      role: UserRole.SUPER_ADMIN,
      managedCityId: null,
    });
    systemAccess.assertCanDemoteSuperAdmin.mockRejectedValue(
      new ForbiddenException('Cannot demote the last super administrator'),
    );

    await expect(
      service.updateUserRole(superAdmin, 'sa-2', { role: UserRole.ADMIN }),
    ).rejects.toThrow('Cannot demote the last super administrator');
  });

  it('requires managed city for CITY_ADMIN assignment', async () => {
    systemAccess.assertSuperAdmin.mockImplementation(() => undefined);
    prisma.user.findUnique.mockResolvedValue({
      id: 'target-1',
      role: UserRole.USER,
      managedCityId: null,
    });
    systemAccess.validateCityAdminAssignment.mockRejectedValue(
      new BadRequestException('managedCityId is required for CITY_ADMIN'),
    );

    await expect(
      service.updateUserRole(superAdmin, 'target-1', {
        role: UserRole.CITY_ADMIN,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when target user missing', async () => {
    systemAccess.assertSuperAdmin.mockImplementation(() => undefined);
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.updateUserRole(superAdmin, 'missing', { role: UserRole.USER }),
    ).rejects.toThrow(NotFoundException);
  });
});
