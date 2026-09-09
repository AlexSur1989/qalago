import { describe, expect, it } from 'vitest';
import {
  businessWebAppleAuthConfigured,
  businessWebAppleAuthEnabled,
  businessWebDevLoginEnabled,
  businessWebGoogleAuthConfigured,
  businessWebGoogleAuthEnabled,
  businessWebMockPlanCheckoutEnabled,
  businessWebSocialAuthConfigured,
} from './auth-config';

describe('auth-config', () => {
  it('businessWebDevLoginEnabled defaults to false', () => {
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
});
