import { describe, expect, it } from 'vitest';
import {
  buildAdminCatalogPatchPayload,
  buildAdminCreateBusinessPayload,
  filterSubcategoryIdsForCategory,
} from './admin-catalog-form';

describe('admin catalog form payloads (AOP.2)', () => {
  it('create payload matches AOP.1 shape without owner/status', () => {
    const payload = buildAdminCreateBusinessPayload({
      title: ' Cafe ',
      slug: 'My-Slug',
      categoryId: 'cat-1',
      subcategoryIds: ['sub-1'],
      initialLocation: { cityId: 'city-1', address: '  Main st 1 ' },
    });
    expect(payload).toEqual({
      title: 'Cafe',
      slug: 'my-slug',
      categoryId: 'cat-1',
      subcategoryIds: ['sub-1'],
      initialLocation: { cityId: 'city-1', address: 'Main st 1' },
    });
    expect(payload).not.toHaveProperty('ownerId');
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('memberships');
  });

  it('patch payload is allowlisted only', () => {
    const payload = buildAdminCatalogPatchPayload({
      title: ' New ',
      phone: '+7700',
    });
    expect(payload).toEqual({ title: 'New', phone: '+7700' });
    expect(payload).not.toHaveProperty('slug');
    expect(payload).not.toHaveProperty('ownerId');
  });

  it('filters subcategories when category changes', () => {
    const subs = [
      { id: 'a', categoryId: 'c1' },
      { id: 'b', categoryId: 'c2' },
    ];
    expect(filterSubcategoryIdsForCategory(['a', 'b'], 'c1', subs)).toEqual(['a']);
  });
});
