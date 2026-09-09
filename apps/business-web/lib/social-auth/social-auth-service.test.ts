import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAppleAuthSession,
  persistAppleAuthSession,
  sha256Hex,
} from './apple-crypto';
import {
  exchangeAppleAuthorization,
  exchangeGoogleIdToken,
  validateAppleAuthorization,
} from './social-auth-service';
import {
  SocialSignInCancelled,
  SocialSignInNonceMismatch,
  SocialSignInNoToken,
  SocialSignInStateMismatch,
} from './social-auth-errors';

vi.mock('@/lib/api', () => ({
  ownerApi: {
    signInWithGoogle: vi.fn(),
    signInWithApple: vi.fn(),
  },
}));

import { ownerApi } from '@/lib/api';

const sessionStore = new Map<string, string>();

describe('social-auth-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStore.clear();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => sessionStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        sessionStore.set(key, value);
      },
      removeItem: (key: string) => {
        sessionStore.delete(key);
      },
    });
    clearAppleAuthSession();
  });

  it('exchangeGoogleIdToken posts idToken only', async () => {
    vi.mocked(ownerApi.signInWithGoogle).mockResolvedValue({
      accessToken: 'jwt',
      user: { id: 'u1', role: 'USER', name: null, phone: null },
    });

    const result = await exchangeGoogleIdToken('google-id-token');
    expect(result.accessToken).toBe('jwt');
    expect(ownerApi.signInWithGoogle).toHaveBeenCalledWith('google-id-token');
  });

  it('rejects empty Google credential', async () => {
    await expect(exchangeGoogleIdToken('  ')).rejects.toBeInstanceOf(SocialSignInNoToken);
    expect(ownerApi.signInWithGoogle).not.toHaveBeenCalled();
  });

  it('validates Apple state and nonce before exchange', async () => {
    const nonceHash = await sha256Hex('raw-nonce');
    persistAppleAuthSession('state-1', nonceHash);
    const payload = Buffer.from(JSON.stringify({ nonce: nonceHash }), 'utf8').toString(
      'base64url',
    );
    const identityToken = `h.${payload}.s`;

    vi.mocked(ownerApi.signInWithApple).mockResolvedValue({
      accessToken: 'jwt',
      user: { id: 'u2', role: 'USER', name: null, phone: null },
    });

    const result = await exchangeAppleAuthorization({
      authorization: { id_token: identityToken, state: 'state-1' },
    });
    expect(result.user.phone).toBeNull();
    expect(ownerApi.signInWithApple).toHaveBeenCalledWith(identityToken);
  });

  it('rejects Apple state mismatch', async () => {
    persistAppleAuthSession('expected-state', 'nonce-hash');
    expect(() =>
      validateAppleAuthorization({
        authorization: { id_token: 'token', state: 'wrong-state' },
      }),
    ).toThrow(SocialSignInStateMismatch);
  });

  it('rejects Apple nonce mismatch', async () => {
    persistAppleAuthSession('state-1', 'expected-hash');
    const payload = Buffer.from(JSON.stringify({ nonce: 'other-hash' }), 'utf8').toString(
      'base64url',
    );
    expect(() =>
      validateAppleAuthorization({
        authorization: { id_token: `h.${payload}.s`, state: 'state-1' },
      }),
    ).toThrow(SocialSignInNonceMismatch);
  });

  it('treats Apple popup close as cancellation', () => {
    expect(() => validateAppleAuthorization({ error: 'popup_closed_by_user' })).toThrow(
      SocialSignInCancelled,
    );
  });
});
