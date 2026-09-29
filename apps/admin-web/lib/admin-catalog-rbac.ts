import {
  StaffPermission,
  UserRole,
  isPlatformGlobalAdminRole,
  staffRoleHasPermission,
  canStaffMutateBusinessFeatured,
  canStaffOverrideBusinessPlan,
} from '@qalago/shared-types';
import type { AdminCatalogStaffScope } from './admin-catalog-staff-scope';

export function canViewAdminCatalog(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_VIEW);
}

/** 2 — Business core profile (PRIMARY-city authority for CITY_ADMIN). */
export function canEditBusinessCore(
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

/** @deprecated use canEditBusinessCore */
export const canEditAdminCatalogBusinessPrimaryCity = canEditBusinessCore;

export { canStaffMutateBusinessFeatured, canStaffOverrideBusinessPlan };

/** 11 — Audit */
export function canViewAdminAuditLogs(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.AUDIT_VIEW);
}

export function canCreateAdminCatalogBusiness(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_CREATE);
}

/** 5 — Taxonomy */
export function canEditCatalogTaxonomy(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.CATEGORY_EDIT);
}

/** 6 — Lifecycle (same PRIMARY-city rule as core). */
export function canChangeBusinessLifecycle(
  role: string,
  managedCitySlug: string | undefined,
  businessPrimaryCitySlug: string | undefined,
): boolean {
  return canEditBusinessCore(role, managedCitySlug, businessPrimaryCitySlug);
}

/** 7 — Featured */
export function canChangeBusinessFeatured(role: string): boolean {
  return canStaffMutateBusinessFeatured(role);
}

/** 8 — Plan */
export function canChangeBusinessPlan(role: string): boolean {
  return canStaffOverrideBusinessPlan(role);
}

function isLocationCityInStaffScope(
  role: string,
  locationCityId: string,
  managedCityIds: string[],
): boolean {
  if (!staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_EDIT)) {
    return false;
  }
  if (isPlatformGlobalAdminRole(role)) {
    return true;
  }
  if (role === UserRole.CITY_ADMIN) {
    return managedCityIds.length > 0 && managedCityIds.includes(locationCityId);
  }
  return true;
}

/** 10 — Edit specific location (decoupled from brand core). */
export function canEditSpecificLocation(
  role: string,
  location: { cityId: string; isPrimary: boolean },
  scope: AdminCatalogStaffScope,
  businessPrimaryCitySlug?: string | null,
): boolean {
  if (!isLocationCityInStaffScope(role, location.cityId, scope.managedCityIds)) {
    return false;
  }
  if (location.isPrimary) {
    return canEditBusinessCore(
      role,
      scope.managedCitySlug,
      businessPrimaryCitySlug ?? undefined,
    );
  }
  return true;
}

/** @deprecated use canEditSpecificLocation */
export function canAdminEditBusinessLocation(
  role: string,
  location: { cityId: string; isPrimary: boolean },
  ctx: {
    managedCityId?: string | null;
    managedCitySlug?: string | null;
    businessPrimaryCitySlug?: string | null;
    managedCityIds?: string[];
  },
): boolean {
  const managedCityIds =
    ctx.managedCityIds ??
    (ctx.managedCityId ? [ctx.managedCityId] : []);
  return canEditSpecificLocation(role, location, { role, managedCityIds, managedCitySlug: ctx.managedCitySlug ?? undefined }, ctx.businessPrimaryCitySlug);
}

/** 13 — Set primary (anti-escalation). */
export function canSetSpecificLocationPrimary(
  role: string,
  targetLocationCityId: string,
  scope: AdminCatalogStaffScope,
  businessPrimaryCitySlug?: string | null,
): boolean {
  if (!staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_EDIT)) {
    return false;
  }
  if (
    !canEditBusinessCore(role, scope.managedCitySlug, businessPrimaryCitySlug ?? undefined)
  ) {
    return false;
  }
  return isLocationCityInStaffScope(role, targetLocationCityId, scope.managedCityIds);
}

/** @deprecated use canSetSpecificLocationPrimary */
export function canAdminSetPrimaryBusinessLocation(
  role: string,
  targetLocationCityId: string,
  ctx: {
    managedCityId?: string | null;
    managedCitySlug?: string | null;
    businessPrimaryCitySlug?: string | null;
    managedCityIds?: string[];
  },
): boolean {
  const managedCityIds =
    ctx.managedCityIds ??
    (ctx.managedCityId ? [ctx.managedCityId] : []);
  return canSetSpecificLocationPrimary(
    role,
    targetLocationCityId,
    { role, managedCityIds, managedCitySlug: ctx.managedCitySlug ?? undefined },
    ctx.businessPrimaryCitySlug,
  );
}

/** 11 — Delete specific location */
export function canDeleteSpecificLocation(
  role: string,
  locationCityId: string,
  managedCityIds: string[],
): boolean {
  return isLocationCityInStaffScope(role, locationCityId, managedCityIds);
}

/** @deprecated */
export function canAdminDeleteBusinessLocation(
  role: string,
  locationCityId: string,
  managedCityId: string | null | undefined,
  managedCityIds?: string[],
): boolean {
  const ids = managedCityIds ?? (managedCityId ? [managedCityId] : []);
  return canDeleteSpecificLocation(role, locationCityId, ids);
}

/** 12 — Add location (independent of brand core edit). */
export function canCreateLocation(role: string, managedCityIds: string[]): boolean {
  if (!staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_EDIT)) {
    return false;
  }
  if (isPlatformGlobalAdminRole(role)) {
    return true;
  }
  if (role === UserRole.CITY_ADMIN) {
    return managedCityIds.length > 0;
  }
  return true;
}

/** @deprecated */
export function canAdminAddBusinessLocation(role: string, managedCityIds: string[] = []): boolean {
  return canCreateLocation(role, managedCityIds);
}

/** City selector options for add/edit location forms. */
export function adminBusinessLocationCityOptions<T extends { id: string }>(
  role: string,
  cities: T[],
  managedCityIds: string[],
): T[] {
  if (!staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_EDIT)) {
    return [];
  }
  if (isPlatformGlobalAdminRole(role)) {
    return cities;
  }
  if (role === UserRole.CITY_ADMIN && managedCityIds.length > 0) {
    return cities.filter((c) => managedCityIds.includes(c.id));
  }
  return cities;
}

/** @deprecated */
export function canAdminMutateBusinessLocationInCity(
  role: string,
  locationCityId: string,
  managedCityId: string | null | undefined,
): boolean {
  const ids = managedCityId ? [managedCityId] : [];
  return isLocationCityInStaffScope(role, locationCityId, ids);
}

export function canEditAdminCatalogBusiness(role: string): boolean {
  return staffRoleHasPermission(role as UserRole, StaffPermission.BUSINESS_EDIT);
}
