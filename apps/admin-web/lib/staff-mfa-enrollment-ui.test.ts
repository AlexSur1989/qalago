import { describe, expect, it } from 'vitest';
import {
  assertTotpUiNotSmsCopy,
  MFA_ENROLL_START_PATH,
  MFA_ENROLL_VERIFY_PATH,
  MFA_QR_HINT,
  MFA_RECOVERY_WARNING,
  MFA_TOTP_INPUT_LABEL,
  MFA_TOTP_INPUT_PLACEHOLDER,
  mfaSetupPhase,
  shouldRedirectMfaSetupAway,
} from './staff-mfa-enrollment-ui';
import type { StaffMfaStatus } from './staff-mfa-api';

const notConfigured: StaffMfaStatus = {
  enabled: false,
  method: null,
  enabledAt: null,
  recoveryCodesRemaining: 0,
  requiresMfa: false,
  enrollmentRequired: false,
};

describe('staff MFA enrollment UI', () => {
  it('NOT_CONFIGURED LOCAL staff stays on setup (no redirect away)', () => {
    expect(shouldRedirectMfaSetupAway(notConfigured)).toBe(false);
  });

  it('enabled staff redirects away from setup', () => {
    expect(
      shouldRedirectMfaSetupAway({
        ...notConfigured,
        enabled: true,
        method: 'TOTP',
        recoveryCodesRemaining: 8,
      }),
    ).toBe(true);
  });

  it('intro phase before QR', () => {
    expect(mfaSetupPhase(notConfigured, false, false)).toBe('intro');
  });

  it('qr phase after enroll start', () => {
    expect(mfaSetupPhase(notConfigured, true, false)).toBe('qr');
  });

  it('recovery phase after verify', () => {
    expect(mfaSetupPhase(notConfigured, true, true)).toBe('recovery');
  });

  it('uses canonical enroll API paths', () => {
    expect(MFA_ENROLL_START_PATH).toBe('/auth/staff/mfa/enroll/start');
    expect(MFA_ENROLL_VERIFY_PATH).toBe('/auth/staff/mfa/enroll/verify');
  });

  it('labels TOTP not SMS', () => {
    expect(assertTotpUiNotSmsCopy(MFA_TOTP_INPUT_LABEL)).toBe(true);
    expect(assertTotpUiNotSmsCopy(MFA_TOTP_INPUT_PLACEHOLDER)).toBe(true);
    expect(assertTotpUiNotSmsCopy(MFA_QR_HINT)).toBe(true);
    expect(assertTotpUiNotSmsCopy(MFA_RECOVERY_WARNING)).toBe(true);
  });

  it('enabled MFA shows enabled phase, not QR intro', () => {
    expect(
      mfaSetupPhase(
        { ...notConfigured, enabled: true, method: 'TOTP', recoveryCodesRemaining: 8 },
        false,
        false,
      ),
    ).toBe('enabled');
  });

  it('manual secret only implied in qr phase (not intro/recovery)', () => {
    expect(mfaSetupPhase(notConfigured, false, false)).toBe('intro');
    expect(mfaSetupPhase(notConfigured, true, false)).toBe('qr');
    expect(mfaSetupPhase(notConfigured, true, true)).toBe('recovery');
  });

  it('recovery codes phase is terminal client state (not reloadable from status)', () => {
    expect(mfaSetupPhase(notConfigured, false, true)).toBe('recovery');
    expect(mfaSetupPhase({ ...notConfigured, enabled: true, method: 'TOTP' }, false, false)).toBe(
      'enabled',
    );
  });

  it('LOCAL optional enrollment does not redirect away from setup', () => {
    expect(shouldRedirectMfaSetupAway({ ...notConfigured, enrollmentRequired: false })).toBe(false);
    expect(shouldRedirectMfaSetupAway({ ...notConfigured, requiresMfa: false })).toBe(false);
  });
});
