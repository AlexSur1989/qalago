import { describe, expect, it, vi } from 'vitest';
import { adminCatalogApi } from './admin-catalog-api';

describe('adminCatalogApi location mutations (AOP.3)', () => {
  it('POST create location', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: 'loc-1' }),
      json: async () => ({ id: 'loc-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await adminCatalogApi.createLocation('tok', 'biz-1', { cityId: 'c', address: 'a' });
    expect(fetchMock.mock.calls[0][0]).toContain('/admin/businesses/biz-1/locations');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
    vi.unstubAllGlobals();
  });

  it('POST set-primary', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: 'loc-1', isPrimary: true }),
      json: async () => ({ id: 'loc-1', isPrimary: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await adminCatalogApi.setPrimaryLocation('tok', 'biz-1', 'loc-2');
    expect(fetchMock.mock.calls[0][0]).toContain('/admin/businesses/biz-1/locations/loc-2/set-primary');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
    vi.unstubAllGlobals();
  });

  it('DELETE location', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true }),
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await adminCatalogApi.deleteLocation('tok', 'biz-1', 'loc-3');
    expect(fetchMock.mock.calls[0][0]).toContain('/admin/businesses/biz-1/locations/loc-3');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('DELETE');
    vi.unstubAllGlobals();
  });
});
