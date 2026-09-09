import { describe, expect, it } from 'vitest';
import { businessWebDevLoginEnabled, businessWebMockPlanCheckoutEnabled } from './auth-config';

describe('auth-config', () => {
  it('businessWebDevLoginEnabled defaults to false', () => {
    expect(businessWebDevLoginEnabled).toBe(false);
  });

  it('businessWebMockPlanCheckoutEnabled defaults to false', () => {
    expect(businessWebMockPlanCheckoutEnabled).toBe(false);
  });
});
