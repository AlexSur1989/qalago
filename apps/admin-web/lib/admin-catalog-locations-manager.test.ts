import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('CatalogLocationsManager (AOP.7H.1 wiring)', () => {
  const src = readFileSync(
    join(__dirname, '../components/catalog/catalog-locations-manager.tsx'),
    'utf8',
  );

  it('uses per-location RBAC helpers instead of global canEdit', () => {
    expect(src).toContain('canEditSpecificLocation');
    expect(src).toContain('canSetSpecificLocationPrimary');
    expect(src).toContain('canDeleteSpecificLocation');
    expect(src).toContain('buildAdminCatalogStaffScope');
    expect(src).toContain('staffSession');
  });

  it('surfaces mutation errors via UXA.9 error state', () => {
    expect(src).toContain('BackofficeErrorState');
    expect(src).toContain('parseAdminCatalogApiError');
  });

  it('uses shared branch card and set-primary confirm', () => {
    expect(src).toContain('BackofficeBranchCard');
    expect(src).toContain('backofficeConfirm');
    expect(src).toContain('confirmSetPrimaryTitle');
  });
});
