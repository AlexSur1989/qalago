import { describe, expect, it } from 'vitest';
import {
  mapSocialAuthError,
  SocialSignInCancelled,
  SocialSignInNoToken,
  SocialSignInNonceMismatch,
} from './social-auth-errors';

describe('mapSocialAuthError', () => {
  it('returns empty for cancellation', () => {
    expect(mapSocialAuthError('ru', new SocialSignInCancelled(), 'Google')).toBe('');
  });

  it('maps 404', () => {
    expect(mapSocialAuthError('ru', new Error('404 Not Found'), 'Apple')).toContain('Apple');
  });

  it('maps 429', () => {
    expect(mapSocialAuthError('ru', new Error('429 Too Many Requests'), 'Google')).toContain(
      'попыток',
    );
  });

  it('maps missing token', () => {
    expect(mapSocialAuthError('ru', new SocialSignInNoToken(), 'Apple')).toContain('Apple');
  });

  it('maps nonce mismatch', () => {
    expect(mapSocialAuthError('ru', new SocialSignInNonceMismatch(), 'Apple')).toContain('Apple');
  });
});
