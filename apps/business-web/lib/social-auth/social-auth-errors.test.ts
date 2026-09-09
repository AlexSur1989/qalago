import { describe, expect, it } from 'vitest';
import {
  mapSocialAuthError,
  SocialSignInCancelled,
  SocialSignInNonceMismatch,
  SocialSignInNoToken,
} from './social-auth-errors';

describe('mapSocialAuthError', () => {
  it('returns empty for cancellation', () => {
    expect(mapSocialAuthError(new SocialSignInCancelled(), 'Google')).toBe('');
  });

  it('maps backend 404', () => {
    expect(mapSocialAuthError(new Error('404 Not Found'), 'Apple')).toContain(
      'временно недоступен',
    );
  });

  it('maps rate limit', () => {
    expect(mapSocialAuthError(new Error('429 Too Many Requests'), 'Google')).toContain(
      'Слишком много попыток',
    );
  });

  it('maps missing token', () => {
    expect(mapSocialAuthError(new SocialSignInNoToken(), 'Apple')).toContain('Apple');
  });

  it('maps nonce mismatch', () => {
    expect(mapSocialAuthError(new SocialSignInNonceMismatch(), 'Apple')).toContain('Apple');
  });
});
