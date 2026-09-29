import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  businessWebAnyLoginMethodConfigured,
  businessWebAppleAuthConfigured,
  businessWebAppleAuthEnabled,
  businessWebGoogleAuthConfigured,
  businessWebGoogleAuthEnabled,
  businessWebMockPlanCheckoutEnabled,
  businessWebOtpAuthEnabled,
  businessWebSocialAuthConfigured,
} from './auth-config';

describe('auth-config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('businessWebDevLoginEnabled defaults to false', async () => {
    vi.stubEnv('NEXT_PUBLIC_QALAGO_DEV_LOGIN', '');
    vi.resetModules();
    const { businessWebDevLoginEnabled } = await import('./auth-config');
    expect(businessWebDevLoginEnabled).toBe(false);
  });

  it('businessWebMockPlanCheckoutEnabled defaults to false', () => {
    expect(businessWebMockPlanCheckoutEnabled).toBe(false);
  });

  it('social auth flags default disabled without credentials', () => {
    expect(businessWebGoogleAuthEnabled).toBe(false);
    expect(businessWebAppleAuthEnabled).toBe(false);
    expect(businessWebGoogleAuthConfigured).toBe(false);
    expect(businessWebAppleAuthConfigured).toBe(false);
    expect(businessWebSocialAuthConfigured).toBe(false);
  });

  it('OTP auth enabled by default on client', () => {
    expect(businessWebOtpAuthEnabled).toBe(true);
  });

  it('OTP-only remains a configured login path when social is off', () => {
    expect(businessWebAnyLoginMethodConfigured).toBe(true);
  });
});
