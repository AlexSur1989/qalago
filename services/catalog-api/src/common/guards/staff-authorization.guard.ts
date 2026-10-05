import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StaffPermission } from '@qalago/shared-types';
import {
  ADMIN_STAFF_ROUTE_KEY,
  STAFF_MFA_SELF_ROUTE_KEY,
  STAFF_PERMISSIONS_KEY,
  STAFF_STEP_UP_KEY,
} from '../decorators/require-staff-permission.decorator';
import { staffForbidden, StaffAuthErrorCode } from '../errors/staff-auth.errors';
import { AuthUser, JwtPayload } from '../types/jwt-payload.type';
import { StaffPolicyService } from '../services/staff-policy.service';
import { StaffStepUpService } from '../services/staff-step-up.service';
import { isStaffRole, staffRoleHasPermission } from '../utils/staff-access.util';
import { ALLOW_MFA_ENROLLMENT_KEY } from '../decorators/allow-mfa-enrollment.decorator';

@Injectable()
export class StaffAuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policy: StaffPolicyService,
    private readonly stepUp: StaffStepUpService,
  ) { }

  canActivate(context: ExecutionContext): boolean {
    const adminStaffRoute = this.reflector.getAllAndOverride<boolean>(ADMIN_STAFF_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const permissions = this.reflector.getAllAndOverride<StaffPermission[]>(
      STAFF_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const needsStepUp = this.reflector.getAllAndOverride<boolean>(STAFF_STEP_UP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const mfaSelfRoute = this.reflector.getAllAndOverride<boolean>(STAFF_MFA_SELF_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<{ user?: AuthUser & JwtPayload }>();
    const user = request.user;
    if (user?.mfaEnrollOnly && !this.reflector.getAllAndOverride<boolean>(
      ALLOW_MFA_ENROLLMENT_KEY, [context.getHandler(), context.getClass()],
    )) {
      throw staffForbidden(StaffAuthErrorCode.MFA_REQUIRED, 'Complete MFA enrollment');
    }
    if (!adminStaffRoute && !permissions?.length && !needsStepUp && !mfaSelfRoute) {
      return true;
    }

    if (!user) {
      throw staffForbidden(StaffAuthErrorCode.STAFF_ACCESS_REQUIRED, 'Authentication required');
    }

    if (mfaSelfRoute) {
      if (!isStaffRole(user.role)) {
        throw staffForbidden(StaffAuthErrorCode.STAFF_ACCESS_REQUIRED, 'Staff access required');
      }
      return true;
    }

    if (adminStaffRoute || permissions?.length) {
      if (!isStaffRole(user.role)) {
        throw staffForbidden(StaffAuthErrorCode.STAFF_ACCESS_REQUIRED, 'Staff access required');
      }
    }

    if (permissions?.length) {
      const ok = permissions.some((p) => staffRoleHasPermission(user.role, p));
      if (!ok) {
        throw staffForbidden(StaffAuthErrorCode.STAFF_PERMISSION_DENIED, 'Staff permission denied');
      }
    }

    if (needsStepUp) {
      this.stepUp.assertRecentStepUp(user);
    }

    return true;
  }
}
