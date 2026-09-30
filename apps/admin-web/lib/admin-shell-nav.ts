import { canViewAdminAuditLogs } from './admin-catalog-rbac';
import { canAccessAdminWeb, isSuperAdminRole, type UserRole } from './rbac';

/** SUPER_ADMIN staff management — nav visibility only (RBAC unchanged). */
export function showAdminStaffNav(role: string): boolean {
  return isSuperAdminRole(role as UserRole);
}

/** Any staff with admin-web access may open security settings. */
export function showAdminSettingsNav(role: string): boolean {
  return canAccessAdminWeb(role as UserRole);
}

/** Platform feature toggles tab — SUPER_ADMIN only. */
export function showAdminPlatformSettingsNav(role: string): boolean {
  return isSuperAdminRole(role as UserRole);
}

export function showAdminAuditNav(role: string): boolean {
  return canViewAdminAuditLogs(role);
}
