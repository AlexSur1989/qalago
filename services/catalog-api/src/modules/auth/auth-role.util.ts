import { UserRole } from '@prisma/client';

export type AccountType = 'user' | 'business';

/**
 * Resolves persisted user role on login/signup.
 * accountType is ignored for role elevation (Stage 5N.5) — new users are always USER.
 */
export function resolveAccountRole(
  existingRole: UserRole | null,
  _accountType?: AccountType,
): UserRole {
  if (!existingRole) {
    return UserRole.USER;
  }

  if (
    existingRole === UserRole.SUPER_ADMIN ||
    existingRole === UserRole.ADMIN ||
    existingRole === UserRole.CITY_ADMIN ||
    existingRole === UserRole.BUSINESS
  ) {
    return existingRole;
  }

  return UserRole.USER;
}
