import { describe, expect, it } from 'vitest';
import { UserRole } from '@qalago/shared-types';
import {
  canCreateAdminCatalogBusiness,
  canEditAdminCatalogBusiness,
  canViewAdminCatalog,
} from './admin-catalog-rbac';

describe('admin catalog RBAC (AOP.2)', () => {
  it('ANALYST cannot create or edit catalog businesses', () => {
    expect(canCreateAdminCatalogBusiness(UserRole.ANALYST)).toBe(false);
    expect(canEditAdminCatalogBusiness(UserRole.ANALYST)).toBe(false);
  });

  it('CONTENT_MANAGER can create and edit', () => {
    expect(canCreateAdminCatalogBusiness(UserRole.CONTENT_MANAGER)).toBe(true);
    expect(canEditAdminCatalogBusiness(UserRole.CONTENT_MANAGER)).toBe(true);
  });
});
