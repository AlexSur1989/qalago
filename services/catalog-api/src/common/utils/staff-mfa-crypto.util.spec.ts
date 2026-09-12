import { describe, expect, it } from '@jest/globals';
import {
  decryptStaffMfaSecret,
  encryptStaffMfaSecret,
  hashRecoveryCode,
  normalizeRecoveryCodeInput,
  parseStaffMfaEncryptionKey,
} from './staff-mfa-crypto.util';

describe('staff-mfa-crypto', () => {
  const keyHex = 'a'.repeat(64);

  it('encrypts and decrypts TOTP secret', () => {
    const key = parseStaffMfaEncryptionKey(keyHex);
    const blob = encryptStaffMfaSecret('JBSWY3DPEHPK3PXP', key);
    expect(blob).not.toContain('JBSWY3DPEHPK3PXP');
    expect(decryptStaffMfaSecret(blob, key)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('hashes recovery codes', () => {
    const norm = normalizeRecoveryCodeInput('abcd-efgh-ijkl');
    expect(hashRecoveryCode(norm)).toHaveLength(64);
  });
});
