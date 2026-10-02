import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolvePostLoginDestination } from './login-session';

vi.mock('@/lib/api', () => ({
  ownerApi: {
    listMyBusinesses: vi.fn(),
  },
  legalApi: {
    fetchCurrent: vi.fn(),
  },
  userRequiresPlatformLegalAcceptance: (role: string) =>
    role === 'USER' || role === 'BUSINESS',
}));

import { legalApi, ownerApi } from '@/lib/api';

describe('resolvePostLoginDestination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(legalApi.fetchCurrent).mockResolvedValue({
      acceptanceRequired: false,
      pendingAcceptance: [],
    });
  });

  it('redirects ADMIN without membership to onboarding (BIZ.2)', async () => {
    vi.mocked(ownerApi.listMyBusinesses).mockResolvedValue({ items: [] });
    const result = await resolvePostLoginDestination(
      'jwt',
      { id: 'a1', role: 'ADMIN', name: null, phone: null },
      null,
    );
    expect(result.path).toBe('/onboarding');
  });

  it('redirects unaccepted USER to legal accept gate (KZ-C.2)', async () => {
    vi.mocked(legalApi.fetchCurrent).mockResolvedValue({
      acceptanceRequired: true,
      pendingAcceptance: [
        {
          documentId: 'd1',
          type: 'TERMS_OF_SERVICE',
          version: '2026-09-10',
        },
      ],
    });
    const result = await resolvePostLoginDestination(
      'jwt',
      { id: 'u1', role: 'USER', name: null, phone: null },
      null,
    );
    expect(result.path).toBe('/legal/accept');
    expect(ownerApi.listMyBusinesses).not.toHaveBeenCalled();
  });

  it('redirects social USER without membership to onboarding when legal satisfied', async () => {
    vi.mocked(legalApi.fetchCurrent).mockResolvedValue({
      acceptanceRequired: false,
      pendingAcceptance: [],
    });
    vi.mocked(ownerApi.listMyBusinesses).mockResolvedValue({ items: [] });
    const result = await resolvePostLoginDestination('jwt', {
      id: 'u1',
      role: 'USER',
      name: null,
      phone: null,
    }, null);
    expect(result.path).toBe('/onboarding');
  });

  it('accepts phone=null user', async () => {
    vi.mocked(ownerApi.listMyBusinesses).mockResolvedValue({
      items: [
        {
          business: {
            id: 'b1',
            title: 'Cafe',
            status: 'ACTIVE',
            address: 'A',
          },
          access: { role: 'OWNER', permissions: [] },
        },
      ],
    });
    const result = await resolvePostLoginDestination('jwt', {
      id: 'u1',
      role: 'USER',
      name: null,
      phone: null,
    }, null);
    expect(result.path).toBe('/dashboard');
  });

  it('honors redirect param', async () => {
    vi.mocked(ownerApi.listMyBusinesses).mockResolvedValue({ items: [] });
    const result = await resolvePostLoginDestination(
      'jwt',
      { id: 'u1', role: 'USER', name: null, phone: null },
      '/settings',
    );
    expect(result.path).toBe('/settings');
  });

  it('preserves invite path after login', async () => {
    vi.mocked(ownerApi.listMyBusinesses).mockResolvedValue({ items: [] });
    const invitePath = '/invite/abc123token';
    const result = await resolvePostLoginDestination(
      'jwt',
      { id: 'u1', role: 'USER', name: null, phone: null },
      invitePath,
    );
    expect(result.path).toBe(invitePath);
  });

  it('rejects external redirect', async () => {
    vi.mocked(ownerApi.listMyBusinesses).mockResolvedValue({ items: [] });
    const result = await resolvePostLoginDestination(
      'jwt',
      { id: 'u1', role: 'USER', name: null, phone: null },
      'https://evil.example',
    );
    expect(result.path).toBe('/onboarding');
  });
});
