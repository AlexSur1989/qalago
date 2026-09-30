import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetAdminAuthBootstrapState,
  resolveAdminAccessToken,
  runAdminAuthBootstrap,
} from './admin-auth-bootstrap';
import * as adminAuthSession from './admin-auth-session';
import * as webAuthToken from './web-auth-token';

describe('admin-auth-bootstrap (BIZ.9 HOTFIX 6)', () => {
  beforeEach(() => {
    resetAdminAuthBootstrapState();
    webAuthToken.clearWebAccessToken();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetAdminAuthBootstrapState();
    webAuthToken.clearWebAccessToken();
  });

  it('resolveAdminAccessToken performs a single refresh for concurrent callers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        accessToken: 'access-1',
        user: { id: 'u1', role: 'SUPER_ADMIN' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const [a, b] = await Promise.all([resolveAdminAccessToken(), resolveAdminAccessToken()]);
    expect(a).toBe('access-1');
    expect(b).toBe('access-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('runAdminAuthBootstrap does not redirect; returns unauthenticated when refresh fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );
    const result = await runAdminAuthBootstrap();
    expect(result).toEqual({ status: 'unauthenticated' });
  });

  it('runAdminAuthBootstrap restores canonical user after refresh', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: 'access-2',
          user: { id: 'u2', role: 'ADMIN' },
        }),
      }),
    );
    const loadMe = vi.spyOn(adminAuthSession, 'loadCanonicalAdminUser').mockResolvedValue({
      ok: true,
      user: { id: 'u2', role: 'ADMIN', name: 'Admin' },
    });

    const result = await runAdminAuthBootstrap();
    expect(result.status).toBe('authenticated');
    if (result.status === 'authenticated') {
      expect(result.user.role).toBe('ADMIN');
      expect(result.accessToken).toBe('access-2');
    }
    expect(loadMe).toHaveBeenCalledWith('access-2');
  });

  it('reuses cached authenticated bootstrap for subsequent callers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          accessToken: 'access-3',
          user: { id: 'u3', role: 'CITY_ADMIN' },
        }),
      }),
    );
    vi.spyOn(adminAuthSession, 'loadCanonicalAdminUser').mockResolvedValue({
      ok: true,
      user: {
        id: 'u3',
        role: 'CITY_ADMIN',
        managedCityId: 'city-1',
        managedCity: { id: 'city-1', slug: 'uralsk', nameRu: 'Uralsk' },
      },
    });

    await runAdminAuthBootstrap();
    const fetchMock = vi.mocked(fetch);
    const callsAfterFirst = fetchMock.mock.calls.length;

    const second = await runAdminAuthBootstrap();
    expect(second.status).toBe('authenticated');
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });
});
