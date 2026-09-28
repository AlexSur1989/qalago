import { describe, expect, it, vi } from 'vitest';
import { adminCatalogApi } from './admin-catalog-api';

describe('adminCatalogApi lifecycle & taxonomy (AOP.5)', () => {
  it('PATCH status uses dedicated admin route', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: 'b1', status: 'ACTIVE' }),
      json: async () => ({ id: 'b1', status: 'ACTIVE' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await adminCatalogApi.updateStatus('tok', 'b1', 'ACTIVE');
    expect(fetchMock.mock.calls[0][0]).toContain('/admin/businesses/b1/status');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('PATCH');
    vi.unstubAllGlobals();
  });

  it('PATCH taxonomy', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify([]),
      json: async () => [],
    });
    vi.stubGlobal('fetch', fetchMock);
    await adminCatalogApi.updateTaxonomy('tok', 'b1', {
      categoryId: 'c1',
      subcategoryIds: ['s1'],
    });
    expect(fetchMock.mock.calls[0][0]).toContain('/admin/businesses/b1/taxonomy');
    vi.unstubAllGlobals();
  });
});
