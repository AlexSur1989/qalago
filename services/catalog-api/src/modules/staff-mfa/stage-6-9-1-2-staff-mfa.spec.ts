import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { authenticator } from 'otplib';
import { StaffMfaPolicyService } from './staff-mfa-policy.service';
import {
  decryptStaffMfaSecret,
  encryptStaffMfaSecret,
  parseStaffMfaEncryptionKey,
} from '../../common/utils/staff-mfa-crypto.util';

describe('Stage 6.9.1.2 Staff MFA', () => {
  const key = parseStaffMfaEncryptionKey('b'.repeat(64));

  describe('policy', () => {
    it('SUPER_ADMIN requires MFA in production env', () => {
      const config = {
        get: (k: string) => {
          if (k === 'app.qalagoEnv') return 'PRODUCTION';
          if (k === 'NODE_ENV') return 'production';
          return undefined;
        },
      } as ConfigService;
      const policy = new StaffMfaPolicyService(config);
      expect(policy.isStaffMfaRequiredForRole(UserRole.SUPER_ADMIN)).toBe(true);
      expect(policy.loginDecision({ role: UserRole.SUPER_ADMIN, mfaEnabled: false }).kind).toBe(
        'enroll_required',
      );
    });

    it('optional MFA in local when not configured', () => {
      const config = {
        get: (k: string) => {
          if (k === 'app.qalagoEnv') return 'LOCAL';
          if (k === 'app.staffMfaRequired') return false;
          return 'development';
        },
      } as ConfigService;
      const policy = new StaffMfaPolicyService(config);
      expect(policy.loginDecision({ role: UserRole.ADMIN, mfaEnabled: false }).kind).toBe('full');
    });

    it('SUPER_ADMIN cannot disable MFA in production', () => {
      const config = {
        get: (k: string) => (k === 'app.qalagoEnv' ? 'PRODUCTION' : 'production'),
      } as ConfigService;
      const policy = new StaffMfaPolicyService(config);
      expect(policy.canDisableMfa(UserRole.SUPER_ADMIN)).toBe(false);
    });
  });

  describe('TOTP + storage', () => {
    it('stores encrypted secret not plaintext', () => {
      const secret = authenticator.generateSecret();
      const enc = encryptStaffMfaSecret(secret, key);
      expect(enc).not.toContain(secret);
      expect(decryptStaffMfaSecret(enc, key)).toBe(secret);
    });

    it('valid TOTP verifies with window 1', () => {
      const secret = authenticator.generateSecret();
      const token = authenticator.generate(secret);
      expect(authenticator.check(token, secret)).toBe(true);
      expect(authenticator.check('000000', secret)).toBe(false);
    });
  });
});
