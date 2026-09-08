import { UserRole } from '@prisma/client';
import { AuthUser } from '../types/jwt-payload.type';

export function isSuperAdmin(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === UserRole.SUPER_ADMIN;
}

export function isGlobalAdmin(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
}

export function isCityAdmin(user: Pick<AuthUser, 'role'>): boolean {
  return user.role === UserRole.CITY_ADMIN;
}

/**
 * RolesGuard hierarchy (Stage 5M.4):
 * - exact role match always passes
 * - SUPER_ADMIN inherits operational ADMIN and CITY_ADMIN routes
 * - SUPER_ADMIN-only routes require explicit SUPER_ADMIN in @Roles(...)
 * - ADMIN does NOT inherit SUPER_ADMIN routes
 * - USER may pass BUSINESS routes (Stage 5M.2.1)
 */
export function satisfiesRequiredRoles(
  userRole: UserRole,
  requiredRoles: UserRole[],
): boolean {
  if (!requiredRoles.length) {
    return true;
  }
  if (requiredRoles.includes(userRole)) {
    return true;
  }

  if (userRole === UserRole.SUPER_ADMIN) {
    if (requiredRoles.includes(UserRole.SUPER_ADMIN)) {
      return true;
    }
    if (requiredRoles.includes(UserRole.ADMIN)) {
      return true;
    }
    if (requiredRoles.includes(UserRole.CITY_ADMIN)) {
      return true;
    }
  }

  if (userRole === UserRole.USER && requiredRoles.includes(UserRole.BUSINESS)) {
    return true;
  }

  return false;
}
