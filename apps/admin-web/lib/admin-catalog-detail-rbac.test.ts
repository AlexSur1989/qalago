import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('catalog business detail page (AOP.7H)', () => {
  const src = readFileSync(
    join(__dirname, '../app/catalog/businesses/[id]/page.tsx'),
    'utf8',
  );

  it('uses primary-city gate for brand core and lifecycle', () => {
    expect(src).toContain('canEditAdminCatalogBusinessPrimaryCity');
    expect(src).toContain('canEditBrand');
    expect(src).toMatch(/canEditBrand[\s\S]*status/);
  });

  it('keeps location edits on generic BUSINESS_EDIT (ANY-BL visibility)', () => {
    expect(src).toContain('canEditLocations');
    expect(src).toContain('canEditAdminCatalogBusiness');
  });

  it('taxonomy remains CATEGORY_EDIT only', () => {
    expect(src).toContain('canEditCatalogTaxonomy');
  });
});
