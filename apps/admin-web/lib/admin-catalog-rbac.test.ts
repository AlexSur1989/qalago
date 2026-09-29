import { describe, expect, it } from 'vitest';
import {
  canCreateAdminCatalogBusiness,
  canEditAdminCatalogBusiness,
  canEditBusinessCore,
  canEditCatalogTaxonomy,
  canStaffMutateBusinessFeatured,
  canStaffOverrideBusinessPlan,
  canViewAdminAuditLogs,
  canViewAdminCatalog,
} from './admin-catalog-rbac';

describe('admin catalog RBAC (AOP.2 / AOP.5)', () => {
  it('CONTENT_MANAGER can create and edit catalog', () => {
    expect(canViewAdminCatalog('CONTENT_MANAGER')).toBe(true);
    expect(canCreateAdminCatalogBusiness('CONTENT_MANAGER')).toBe(true);
    expect(canEditAdminCatalogBusiness('CONTENT_MANAGER')).toBe(true);
    expect(canEditCatalogTaxonomy('CONTENT_MANAGER')).toBe(true);
  });

  it('CITY_ADMIN can edit catalog but not taxonomy', () => {
    expect(canEditAdminCatalogBusiness('CITY_ADMIN')).toBe(true);
    expect(canEditCatalogTaxonomy('CITY_ADMIN')).toBe(false);
  });

  it('ANALYST cannot access catalog mutations', () => {
    expect(canViewAdminCatalog('ANALYST')).toBe(false);
    expect(canEditAdminCatalogBusiness('ANALYST')).toBe(false);
    expect(canEditCatalogTaxonomy('ANALYST')).toBe(false);
  });
});

describe('admin catalog RBAC (AOP.7H hierarchy)', () => {
  it('CITY_ADMIN secondary-city cannot edit brand core or lifecycle UX gate', () => {
    expect(
      canEditBusinessCore('CITY_ADMIN', 'aktobe', 'uralsk'),
    ).toBe(false);
    expect(
      canEditBusinessCore('CITY_ADMIN', 'uralsk', 'uralsk'),
    ).toBe(true);
  });

  it('ADMIN has global primary-city edit and operational merchandising', () => {
    expect(
      canEditBusinessCore('ADMIN', undefined, 'aktobe'),
    ).toBe(true);
    expect(canStaffMutateBusinessFeatured('ADMIN')).toBe(true);
    expect(canStaffOverrideBusinessPlan('ADMIN')).toBe(true);
  });

  it('CITY_ADMIN cannot featured/plan/audit', () => {
    expect(canStaffMutateBusinessFeatured('CITY_ADMIN')).toBe(false);
    expect(canStaffOverrideBusinessPlan('CITY_ADMIN')).toBe(false);
    expect(canViewAdminAuditLogs('CITY_ADMIN')).toBe(false);
  });

  it('SUPER_ADMIN retains global featured/plan and audit', () => {
    expect(canStaffMutateBusinessFeatured('SUPER_ADMIN')).toBe(true);
    expect(canStaffOverrideBusinessPlan('SUPER_ADMIN')).toBe(true);
    expect(canViewAdminAuditLogs('SUPER_ADMIN')).toBe(true);
  });
});
