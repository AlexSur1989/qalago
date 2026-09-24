import { ForbiddenException } from '@nestjs/common';
import {
  BusinessStatus,
  ContentReportTargetType,
  ModerationActionType,
  UserRole,
} from '@prisma/client';
import { StaffPolicyService } from '../../common/services/staff-policy.service';
import {
  StaffPermission,
  canActorAssignStaffRole,
  staffRoleHasPermission,
} from '../../common/utils/staff-access.util';
import { CityScopeService } from '../../common/services/city-scope.service';
import { StaffAccessService } from './staff-access.service';
import { ModerationService } from '../safety/moderation.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { OrderService } from '../monetization/order.service';

function user(id: string, role: UserRole): AuthUser {
  return { id, sub: id, role, phone: '+77001112233' };
}

describe('Stage 6.9.1 Staff RBAC', () => {
  it('1. USER cannot hold staff permissions', () => {
    expect(staffRoleHasPermission(UserRole.USER, StaffPermission.STAFF_VIEW)).toBe(false);
  });

  it('3. ADMIN cannot assign SUPER_ADMIN', () => {
    expect(canActorAssignStaffRole(UserRole.ADMIN, UserRole.SUPER_ADMIN)).toBe(false);
  });

  it('4. ADMIN cannot assign ADMIN (default deny)', () => {
    expect(canActorAssignStaffRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(false);
  });

  it('9. SALES_MANAGER cannot confirm payment permission', () => {
    expect(staffRoleHasPermission(UserRole.SALES_MANAGER, StaffPermission.PAYMENT_CONFIRM)).toBe(
      false,
    );
  });

  it('14. SUPER_ADMIN can assign MODERATOR', () => {
    expect(canActorAssignStaffRole(UserRole.SUPER_ADMIN, UserRole.MODERATOR)).toBe(true);
  });

  it('12. ANALYST has no mutation permissions on business ownership', () => {
    expect(
      staffRoleHasPermission(UserRole.ANALYST, StaffPermission.BUSINESS_OWNERSHIP_CHANGE),
    ).toBe(false);
  });

  it('13. TECH_ADMIN has no financial confirm permission', () => {
    expect(staffRoleHasPermission(UserRole.TECH_ADMIN, StaffPermission.PAYMENT_CONFIRM)).toBe(
      false,
    );
  });

  describe('StaffAccessService self-escalation', () => {
    let service: StaffAccessService;
    const txMock = {
      staffAccess: { update: jest.fn(), upsert: jest.fn() },
      user: { update: jest.fn() },
      staffCityScope: { deleteMany: jest.fn() },
    };
    const prisma = {
      staffAccess: { findUnique: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock)),
    };
    const policy = new StaffPolicyService(prisma as never);
    const systemAccess = { assertCanDemoteSuperAdmin: jest.fn() };
    const auditLog = { record: jest.fn() };
    const authSession = { revokeAllUserSessions: jest.fn() };

    beforeEach(() => {
      jest.clearAllMocks();
      service = new StaffAccessService(
        prisma as never,
        policy,
        systemAccess as never,
        auditLog as never,
        authSession as never,
      );
    });

    it('4b. cannot change own staff role', async () => {
      const actor = user('a1', UserRole.SUPER_ADMIN);
      await expect(
        service.updateStaffRole(actor, 'a1', { staffRole: UserRole.ADMIN }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('17. disable staff revokes sessions', async () => {
      const actor = user('sa', UserRole.SUPER_ADMIN);
      prisma.staffAccess.findUnique = jest.fn().mockResolvedValue({
        userId: 't1',
        staffRole: UserRole.MODERATOR,
        isActive: true,
        user: { managedCityId: null },
      });
      await service.disableStaff(actor, 't1');
      expect(authSession.revokeAllUserSessions).toHaveBeenCalledWith('t1');
    });
  });

  describe('CityScopeService CITY_ADMIN IDOR', () => {
    it('5. CITY_ADMIN cannot access city B business (admin BL scope)', async () => {
      const prisma = {
        staffCityScope: {
          findMany: jest.fn().mockResolvedValue([{ cityId: 'city-a' }]),
        },
        user: { findUnique: jest.fn() },
        city: { findFirst: jest.fn() },
        businessLocation: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      const scope = new CityScopeService(prisma as never, { get: () => 'uralsk' } as never);
      const admin = user('ca', UserRole.CITY_ADMIN);
      await expect(scope.assertBusinessInAdminScope(admin, 'biz-b')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('5b. CITY_ADMIN parent-city gate rejects foreign home city', async () => {
      const prisma = {
        staffCityScope: {
          findMany: jest.fn().mockResolvedValue([{ cityId: 'city-a' }]),
        },
        user: { findUnique: jest.fn() },
        city: { findFirst: jest.fn() },
        businessLocation: { findFirst: jest.fn() },
      };
      const scope = new CityScopeService(prisma as never, { get: () => 'uralsk' } as never);
      const admin = user('ca', UserRole.CITY_ADMIN);
      await expect(
        scope.assertBusinessParentCityInAdminScope(admin, 'city-b'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('OrderService payment confirm SoD', () => {
    it('9b. confirmManualPayment rejects SALES_MANAGER', async () => {
      const staffPolicy = new StaffPolicyService({} as never);
      const access = { assertAdminPaymentAccess: jest.fn() };
      const service = new OrderService(
        {} as never,
        access as never,
        {} as never,
        {} as never,
        {} as never,
        { record: jest.fn() } as never,
        {} as never,
        {} as never,
        {} as never,
        staffPolicy,
        { buildAdminBusinessScopeWhere: jest.fn() } as never,
      );
      await expect(
        service.confirmManualPayment(user('s1', UserRole.SALES_MANAGER), 'pay-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('Moderation business restore regression', () => {
    it('23. BUSINESS_RESTORE preserves PENDING status from snapshot', async () => {
      const prisma = {
        moderationCase: { findUnique: jest.fn() },
        $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => {
          const tx = {
            moderationAction: { create: jest.fn() },
            moderationCase: { update: jest.fn() },
            business: { findUnique: jest.fn(), update: jest.fn() },
          };
          return fn(tx);
        }),
      };
      const cityScope = {
        assertCityInAdminScope: jest.fn(),
        assertBusinessInAdminScope: jest.fn(),
      };
      const service = new ModerationService(
        prisma as never,
        cityScope as never,
        { record: jest.fn() } as never,
        { revokeAllUserSessions: jest.fn() } as never,
        {} as never,
        { create: jest.fn(), schedulePushAfterTransaction: jest.fn() } as never,
      );

      prisma.moderationCase.findUnique = jest.fn().mockResolvedValue({
        id: 'case-1',
        targetType: ContentReportTargetType.BUSINESS,
        targetId: 'biz-1',
        cityId: 'city-1',
        targetSnapshot: { businessStatusBeforeModerationHide: BusinessStatus.PENDING },
      });

      const txRef: {
        business?: { update: jest.Mock };
      } = {};
      prisma.$transaction = jest.fn(async (fn: (tx: unknown) => unknown) => {
        const tx = {
          moderationAction: { create: jest.fn() },
          moderationCase: { update: jest.fn() },
          business: {
            findUnique: jest.fn(),
            update: jest.fn().mockImplementation(({ data }) => {
              expect(data.status).toBe(BusinessStatus.PENDING);
            }),
          },
        };
        txRef.business = tx.business;
        return fn(tx);
      });

      await service.applyAction(user('mod', UserRole.MODERATOR), 'case-1', {
        actionType: ModerationActionType.BUSINESS_RESTORE,
      });
      expect(txRef.business?.update).toHaveBeenCalled();
    });
  });
});
