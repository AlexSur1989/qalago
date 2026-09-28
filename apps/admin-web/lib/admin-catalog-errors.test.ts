import { describe, expect, it } from 'vitest';
import { parseAdminCatalogApiError } from './admin-catalog-errors';

describe('admin catalog API errors (AOP.2)', () => {
  it('maps duplicate slug', () => {
    expect(parseAdminCatalogApiError(new Error('409 Business slug already exists')).kind).toBe(
      'duplicate_slug',
    );
  });

  it('maps forbidden', () => {
    expect(parseAdminCatalogApiError(new Error('403 Forbidden')).kind).toBe('forbidden');
  });
});
