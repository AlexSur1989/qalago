import { UserRole } from '@prisma/client';
import {
  isStaffRole,
  staffRoleHasPermission,
  StaffPermission,
} from '@qalago/shared-types';

export { StaffPermission, isStaffRole, staffRoleHasPermission };

export const ASSIGNABLE_STAFF_ROLES: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.CITY_ADMIN,
  UserRole.MODERATOR,
  UserRole.SALES_MANAGER,
  UserRole.CONTENT_MANAGER,
  UserRole.FINANCE,
  UserRole.SUPPORT,
  UserRole.ANALYST,
  UserRole.TECH_ADMIN,
] as const;

export function assertStaffPermission(
  role: UserRole,
  permission: StaffPermission,
): boolean {
  return staffRoleHasPermission(role, permission);
}

/** ADMIN cannot create another ADMIN in Stage 6.9.1 (default deny). */
export function canActorAssignStaffRole(
  actorRole: UserRole,
  targetRole: UserRole,
): boolean {
  if (actorRole !== UserRole.SUPER_ADMIN) {
    return false;
  }
  if (targetRole === UserRole.SUPER_ADMIN) {
    return actorRole === UserRole.SUPER_ADMIN;
  }
  if (targetRole === UserRole.ADMIN) {
    return false;
  }
  return ASSIGNABLE_STAFF_ROLES.includes(targetRole);
}
