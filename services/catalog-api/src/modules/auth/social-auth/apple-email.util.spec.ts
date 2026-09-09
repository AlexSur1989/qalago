import {
  isApplePrivateRelayEmail,
  normalizeAppleEmailVerified,
} from './apple-email.util';

describe('apple-email.util', () => {
  describe('normalizeAppleEmailVerified', () => {
    it('normalizes boolean true', () => {
      expect(normalizeAppleEmailVerified(true)).toBe(true);
    });

    it('normalizes string true', () => {
      expect(normalizeAppleEmailVerified('true')).toBe(true);
    });

    it('normalizes boolean false', () => {
      expect(normalizeAppleEmailVerified(false)).toBe(false);
    });

    it('returns undefined for unknown values', () => {
      expect(normalizeAppleEmailVerified(undefined)).toBeUndefined();
      expect(normalizeAppleEmailVerified('maybe')).toBeUndefined();
    });
  });

  describe('isApplePrivateRelayEmail', () => {
    it('detects relay addresses', () => {
      expect(isApplePrivateRelayEmail('abc@privaterelay.appleid.com')).toBe(true);
    });

    it('returns false for regular email', () => {
      expect(isApplePrivateRelayEmail('user@gmail.com')).toBe(false);
    });
  });
});
