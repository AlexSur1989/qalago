import { canViewAdminAuditLogs } from './admin-catalog-rbac';
import { canAccessAdminWeb, isGlobalAdminRole, isSuperAdminRole, type UserRole } from './rbac';

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

/** CW.3 — home section config (ADMIN/SUPER_ADMIN global; CITY_ADMIN city-scoped). */
export function showAdminHomeSectionsNav(role: string): boolean {
  const r = role as UserRole;
  return isGlobalAdminRole(r) || r === 'CITY_ADMIN';
}

export function showAdminAuditNav(role: string): boolean {
  return canViewAdminAuditLogs(role);
}
