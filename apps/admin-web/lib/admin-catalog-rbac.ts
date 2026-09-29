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

/** BL mutation in a given city — mirrors CityScopeService.assertCityInAdminScope (AOP.7H.1). */
export function canAdminMutateBusinessLocationInCity(
  role: string,
  locationCityId: string,
  managedCityId: string | null | undefined,
): boolean {
  if (!canEditAdminCatalogBusiness(role)) {
    return false;
  }
  if (isPlatformGlobalAdminRole(role)) {
    return true;
  }
  if (role === UserRole.CITY_ADMIN) {
    return !!managedCityId && locationCityId === managedCityId;
  }
  return true;
}

export function canAdminEditBusinessLocation(
  role: string,
  location: { cityId: string; isPrimary: boolean },
  ctx: {
    managedCityId?: string | null;
    managedCitySlug?: string | null;
    businessPrimaryCitySlug?: string | null;
  },
): boolean {
  if (
    !canAdminMutateBusinessLocationInCity(role, location.cityId, ctx.managedCityId ?? null)
  ) {
    return false;
  }
  if (location.isPrimary) {
    return canEditAdminCatalogBusinessPrimaryCity(
      role,
      ctx.managedCitySlug ?? undefined,
      ctx.businessPrimaryCitySlug ?? undefined,
    );
  }
  return true;
}

/** set-primary — primary-city authority + target branch city in scope (AOP.4). */
export function canAdminSetPrimaryBusinessLocation(
  role: string,
  targetLocationCityId: string,
  ctx: {
    managedCityId?: string | null;
    managedCitySlug?: string | null;
    businessPrimaryCitySlug?: string | null;
  },
): boolean {
  if (!canEditAdminCatalogBusiness(role)) {
    return false;
  }
  if (
    !canEditAdminCatalogBusinessPrimaryCity(
      role,
      ctx.managedCitySlug ?? undefined,
      ctx.businessPrimaryCitySlug ?? undefined,
    )
  ) {
    return false;
  }
  return canAdminMutateBusinessLocationInCity(role, targetLocationCityId, ctx.managedCityId ?? null);
}

export function canAdminDeleteBusinessLocation(
  role: string,
  locationCityId: string,
  managedCityId: string | null | undefined,
): boolean {
  return canAdminMutateBusinessLocationInCity(role, locationCityId, managedCityId ?? null);
}

export function canAdminAddBusinessLocation(role: string): boolean {
  return canEditAdminCatalogBusiness(role);
}

/** Cities available in add/edit location selector for current staff session. */
export function adminBusinessLocationCityOptions<T extends { id: string }>(
  role: string,
  cities: T[],
  managedCityId: string | null | undefined,
): T[] {
  if (!canEditAdminCatalogBusiness(role)) {
    return [];
  }
  if (isPlatformGlobalAdminRole(role)) {
    return cities;
  }
  if (role === UserRole.CITY_ADMIN && managedCityId) {
    return cities.filter((c) => c.id === managedCityId);
  }
  return cities;
}
