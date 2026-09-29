import {
  StaffPermission,
  UserRole,
  isPlatformGlobalAdminRole,
  staffRoleHasPermission,
  canStaffMutateBusinessFeatured,
  canStaffOverrideBusinessPlan,
} from '@qalago/shared-types';

export function canViewAdminCatalog(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_VIEW);
}

/** Brand-wide core catalog + lifecycle — primary-city authority for CITY_ADMIN (AOP.7H). */
export function canEditAdminCatalogBusinessPrimaryCity(
  role: string,
  managedCitySlug: string | undefined,
  businessPrimaryCitySlug: string | undefined,
): boolean {
  if (!staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_EDIT)) {
    return false;
  }
  if (isPlatformGlobalAdminRole(role)) {
    return true;
  }
  if (role === UserRole.CITY_ADMIN) {
    return (
      !!managedCitySlug &&
      !!businessPrimaryCitySlug &&
      managedCitySlug === businessPrimaryCitySlug
    );
  }
  return false;
}

export { canStaffMutateBusinessFeatured, canStaffOverrideBusinessPlan };

export function canViewAdminAuditLogs(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.AUDIT_VIEW);
}

export function canCreateAdminCatalogBusiness(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_CREATE);
}

export function canEditAdminCatalogBusiness(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_EDIT);
}

export function canEditCatalogTaxonomy(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.CATEGORY_EDIT);
}
