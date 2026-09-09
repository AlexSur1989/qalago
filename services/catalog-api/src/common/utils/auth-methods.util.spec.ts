import { AuthProvider } from '@prisma/client';
import { deriveUserAuthMethods } from './auth-methods.util';

describe('deriveUserAuthMethods', () => {
  it('returns GOOGLE for Google identity', () => {
    expect(
      deriveUserAuthMethods(null, [{ provider: AuthProvider.GOOGLE }]),
    ).toEqual(['GOOGLE']);
  });

  it('returns PHONE for legacy phone-only user', () => {
    expect(deriveUserAuthMethods('+77001234567', [])).toEqual(['PHONE']);
  });

  it('does not infer PHONE when social identity exists', () => {
    expect(
      deriveUserAuthMethods('+77001234567', [{ provider: AuthProvider.GOOGLE }]),
    ).toEqual(['GOOGLE']);
  });

  it('returns both Google and Apple when linked', () => {
    expect(
      deriveUserAuthMethods(null, [
        { provider: AuthProvider.GOOGLE },
        { provider: AuthProvider.APPLE },
      ]),
    ).toEqual(['APPLE', 'GOOGLE']);
  });

  it('ignores deleted phone marker', () => {
    expect(deriveUserAuthMethods('deleted:u1:123', [])).toEqual([]);
  });
});
