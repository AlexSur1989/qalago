import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../types/jwt-payload.type';
import { satisfiesRequiredRoles } from '../utils/system-access.util';
import { isStaffRole } from '../utils/staff-access.util';
import { staffForbidden, StaffAuthErrorCode } from '../errors/staff-auth.errors';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Missing user context');
    }

    if (user.mfaEnrollOnly && isStaffRole(user.role)) {
      throw staffForbidden(
        StaffAuthErrorCode.MFA_REQUIRED,
        'Complete MFA enrollment before accessing admin features',
      );
    }

    if (!satisfiesRequiredRoles(user.role, requiredRoles)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
