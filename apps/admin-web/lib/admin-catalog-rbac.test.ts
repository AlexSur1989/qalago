import { describe, expect, it } from 'vitest';
import {
  canCreateAdminCatalogBusiness,
  canEditAdminCatalogBusiness,
  canEditCatalogTaxonomy,
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
