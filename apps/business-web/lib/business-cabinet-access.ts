import type { AuthUser, MyBusinessItem } from './api';

/**
 * Owner/manager cabinet access (BIZ.2).
 * UserRole alone (ADMIN, CITY_ADMIN, SUPER_ADMIN, legacy BUSINESS) does NOT grant access.
 */
export function hasBusinessCabinetAccess(
  user: AuthUser | null,
  items: MyBusinessItem[],
): boolean {
  if (!user) return false;
  return items.length > 0;
}
