import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('CatalogLocationsManager (AOP.7H.1 wiring)', () => {
  const src = readFileSync(
    join(__dirname, '../components/catalog/catalog-locations-manager.tsx'),
    'utf8',
  );

  it('uses per-location RBAC helpers instead of global canEdit', () => {
    expect(src).toContain('canAdminEditBusinessLocation');
    expect(src).toContain('canAdminSetPrimaryBusinessLocation');
    expect(src).toContain('canAdminDeleteBusinessLocation');
    expect(src).toContain('adminBusinessLocationCityOptions');
    expect(src).not.toMatch(/canEdit:\s*boolean/);
  });

  it('surfaces mutation errors in alert-error', () => {
    expect(src).toContain('alert alert-error');
    expect(src).toContain('parseAdminCatalogApiError');
  });
});
