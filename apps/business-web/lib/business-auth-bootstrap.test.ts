import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetBusinessAuthBootstrapState,
  resolveBusinessAccessToken,
  runBusinessAuthBootstrap,
} from './business-auth-bootstrap';
import * as businessAuthSession from './business-auth-session';
import * as webAuthToken from './web-auth-token';
import * as api from './api';

describe('business-auth-bootstrap (BIZ.9 HOTFIX 7B)', () => {
  beforeEach(() => {
    resetBusinessAuthBootstrapState();
    webAuthToken.clearWebAccessToken();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetBusinessAuthBootstrapState();
    webAuthToken.clearWebAccessToken();
  });

  it('resolveBusinessAccessToken deduplicates concurrent refresh', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'access-b1' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const [a, b] = await Promise.all([
      resolveBusinessAccessToken(),
      resolveBusinessAccessToken(),
    ]);
    expect(a).toBe('access-b1');
    expect(b).toBe('access-b1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/business/refresh');
  });

  it('runBusinessAuthBootstrap loads /users/me and businesses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ accessToken: 'access-b2' }),
      }),
    );
    vi.spyOn(businessAuthSession, 'loadCanonicalBusinessUser').mockResolvedValue({
      ok: true,
      user: { id: 'o1', role: 'USER', name: 'Owner' },
    });
    vi.spyOn(api.ownerApi, 'listMyBusinesses').mockResolvedValue({
      items: [{ businessId: 'b1', title: 'Cafe', role: 'OWNER' }],
    } as never);

    const result = await runBusinessAuthBootstrap();
    expect(result.status).toBe('authenticated');
    if (result.status === 'authenticated') {
      expect(result.items).toHaveLength(1);
      expect(result.user.id).toBe('o1');
    }
  });
});
