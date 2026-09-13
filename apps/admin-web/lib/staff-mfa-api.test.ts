import { afterEach, describe, expect, it, vi } from 'vitest';
import { startStaffMfaEnroll, verifyStaffMfaEnroll } from './staff-mfa-api';

describe('staff MFA API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('enroll start POSTs to catalog enroll/start with bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          otpauthUri: 'otpauth://totp/QalaGo:test?secret=ABC&issuer=QalaGo',
          secret: 'ABC',
          pendingExpiresAt: new Date().toISOString(),
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await startStaffMfaEnroll('token-abc');
    expect(res.otpauthUri).toContain('otpauth://totp/');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/staff/mfa/enroll/start');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-abc');
  });

  it('enroll verify POSTs totp to enroll/verify', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({ enabled: true, recoveryCodes: ['aaaa-bbbb', 'cccc-dddd'] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await verifyStaffMfaEnroll('token-xyz', '123456');
    expect(res.recoveryCodes).toHaveLength(2);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/staff/mfa/enroll/verify');
    expect(init.body).toBe(JSON.stringify({ totp: '123456' }));
  });
});
