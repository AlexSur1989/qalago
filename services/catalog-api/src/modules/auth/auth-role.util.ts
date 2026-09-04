import { UserRole } from '@prisma/client';

export type AccountType = 'user' | 'business';

export function resolveAccountRole(
  existingRole: UserRole | null,
  accountType?: AccountType,
): UserRole {
  const desired = accountType === 'business' ? UserRole.BUSINESS : UserRole.USER;

  if (!existingRole) {
    return desired;
  }

  if (
    existingRole === UserRole.ADMIN ||
    existingRole === UserRole.CITY_ADMIN ||
    existingRole === UserRole.BUSINESS
  ) {
    return existingRole;
  }

  if (existingRole === UserRole.USER && desired === UserRole.BUSINESS) {
    return UserRole.BUSINESS;
  }

  return existingRole;
}
