import { StaffPermission, UserRole, staffRoleHasPermission } from '@qalago/shared-types';

export function canViewAdminCatalog(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_VIEW);
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
