import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { StaffPermission } from '@qalago/shared-types';
import { StaffAuthorizationGuard } from '../../common/guards/staff-authorization.guard';
import { StaffStepUpService } from '../../common/services/staff-step-up.service';
import { StaffPolicyService } from '../../common/services/staff-policy.service';
import { StaffSessionService } from '../../common/services/staff-session.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

function mockReflector(overrides: {
  permissions?: StaffPermission[];
  stepUp?: boolean;
  adminRoute?: boolean;
}) {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === 'staff_permissions') return overrides.permissions;
      if (key === 'staff_step_up') return overrides.stepUp ?? false;
      if (key === 'admin_staff_route') return overrides.adminRoute ?? false;
      return undefined;
    }),
  } as unknown as Reflector;
}

describe('Stage 6.9.1.1 Staff authorization hardening', () => {
  const policy = new StaffPolicyService({} as never);
  const stepUp = new StaffStepUpService({ get: () => 600 } as never, {
    record: jest.fn(),
  } as never);

  const ctx = (user: { role: UserRole; stepUpAt?: number }) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'u1', sub: 'u1', ...user } }),
      }),
    }) as never;

  describe('StaffAuthorizationGuard SoD', () => {
    it('10. MODERATOR payment confirm denied', () => {
      const guard = new StaffAuthorizationGuard(
        mockReflector({ permissions: [StaffPermission.PAYMENT_CONFIRM] }),
        policy,
        stepUp,
      );
      expect(() => guard.canActivate(ctx({ role: UserRole.MODERATOR }))).toThrow(
        ForbiddenException,
      );
    });

    it('11. SALES_MANAGER payment confirm denied', () => {
      const guard = new StaffAuthorizationGuard(
        mockReflector({ permissions: [StaffPermission.PAYMENT_CONFIRM] }),
        policy,
        stepUp,
      );
      expect(() => guard.canActivate(ctx({ role: UserRole.SALES_MANAGER }))).toThrow(
        ForbiddenException,
      );
    });

    it('15. ANALYST business edit denied', () => {
      const guard = new StaffAuthorizationGuard(
        mockReflector({ permissions: [StaffPermission.BUSINESS_EDIT] }),
        policy,
        stepUp,
      );
      expect(() => guard.canActivate(ctx({ role: UserRole.ANALYST }))).toThrow(
        ForbiddenException,
      );
    });

    it('step-up required when decorator set', () => {
      const guard = new StaffAuthorizationGuard(
        mockReflector({
          permissions: [StaffPermission.STAFF_DISABLE],
          stepUp: true,
        }),
        policy,
        stepUp,
      );
      expect(() => guard.canActivate(ctx({ role: UserRole.SUPER_ADMIN }))).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('StaffSessionService immediate disable', () => {
    it('2. disabled staff access rejected', async () => {
      const prisma = {
        staffAccess: {
          findUnique: jest.fn().mockResolvedValue({
            isActive: false,
            staffRole: UserRole.MODERATOR,
          }),
        },
      };
      const svc = new StaffSessionService(prisma as never);
      await expect(svc.assertStaffAccessActive('u1', UserRole.MODERATOR)).rejects.toMatchObject(
        {
          response: expect.objectContaining({ code: 'STAFF_ACCESS_DISABLED' }),
        },
      );
    });

    it('revoked session rejected', async () => {
      const prisma = {
        authSession: {
          findFirst: jest.fn().mockResolvedValue({
            revokedAt: new Date(),
            expiresAt: new Date(Date.now() + 60000),
          }),
        },
      };
      const svc = new StaffSessionService(prisma as never);
      await expect(svc.assertStaffSessionActive('sid', 'u1')).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'STAFF_SESSION_REVOKED' }),
      });
    });
  });

  describe('JwtAuthGuard staff session binding', () => {
    it('staff without sid rejected', async () => {
      const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) } as never;
      const jwt = {
        verifyAsync: jest.fn().mockResolvedValue({
          sub: 'u1',
          role: UserRole.MODERATOR,
        }),
      };
      const prisma = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'u1',
            phone: '+7700',
            role: UserRole.MODERATOR,
            isActive: true,
          }),
        },
      };
      const staffSession = {
        assertStaffAccessActive: jest.fn().mockResolvedValue(UserRole.MODERATOR),
        assertStaffSessionActive: jest.fn().mockImplementation(() => {
          throw new UnauthorizedException({ code: 'STAFF_SESSION_REVOKED' });
        }),
      };
      const guard = new JwtAuthGuard(
        reflector,
        jwt as never,
        { get: () => 'secret' } as never,
        prisma as never,
        staffSession as never,
      );
      const request: { headers: { authorization: string }; user?: unknown } = {
        headers: { authorization: 'Bearer t' },
      };
      const ctxJwt = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as never;
      await expect(guard.canActivate(ctxJwt)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
