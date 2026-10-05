import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { StaffAuthorizationGuard } from './staff-authorization.guard';
import { StaffMfaController } from '../../modules/staff-mfa/staff-mfa.controller';
import { UsersController } from '../../modules/users/users.controller';
import { AuthController } from '../../modules/auth/auth.controller';

describe('enrollment allowlist', () => {
  const guard = new StaffAuthorizationGuard(new Reflector(), {} as never, {} as never);
  function context(controller: Function, handler: Function): ExecutionContext {
    return {
      getClass: () => controller, getHandler: () => handler,
      switchToHttp: () => ({ getRequest: () => ({
        user: { id: 'staff', role: UserRole.SUPER_ADMIN, mfaEnrollOnly: true },
      }) }),
    } as unknown as ExecutionContext;
  }
  it('blocks routes without staff metadata', () => {
    expect(() => guard.canActivate(context(class Controller {}, () => undefined))).toThrow(ForbiddenException);
  });
  it.each(['status', 'enrollStart', 'enrollVerify'] as const)('allows MFA %s', method => {
    expect(guard.canActivate(context(StaffMfaController, StaffMfaController.prototype[method]))).toBe(true);
  });
  it.each(['regenerate', 'disable'] as const)('rejects MFA %s before enrollment', method => {
    expect(() => guard.canActivate(context(StaffMfaController, StaffMfaController.prototype[method]))).toThrow(ForbiddenException);
  });
  it('allows own profile read and logout-all', () => {
    expect(guard.canActivate(context(UsersController, UsersController.prototype.getMe))).toBe(true);
    expect(guard.canActivate(context(AuthController, AuthController.prototype.logoutAll))).toBe(true);
  });
  it('rejects own profile mutations and step-up', () => {
    expect(() => guard.canActivate(context(UsersController, UsersController.prototype.updateMe))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context(AuthController, AuthController.prototype.staffStepUp))).toThrow(ForbiddenException);
  });
});
