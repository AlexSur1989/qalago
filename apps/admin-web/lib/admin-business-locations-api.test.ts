import { describe, expect, it, vi } from 'vitest';
import { adminBusinessLocationsApi } from './admin-business-locations-api';

describe('adminBusinessLocationsApi', () => {
  it('exposes listBusinessLocations for staff token calls', () => {
    expect(typeof adminBusinessLocationsApi.listBusinessLocations).toBe('function');
  });

  it('uses admin-scoped locations route (AOP.1)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
      json: async () => ({ items: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await adminBusinessLocationsApi.listBusinessLocations('tok', 'biz-1');
    expect(fetchMock.mock.calls[0][0]).toContain('/admin/businesses/biz-1/locations');
    vi.unstubAllGlobals();
  });
});
