import { describe, expect, it } from 'vitest';
import { businessWebMockPlanCheckoutEnabled } from './auth-config';

describe('plan checkout production guard', () => {
  it('mock checkout is unavailable in default production-like build', () => {
    expect(businessWebMockPlanCheckoutEnabled).toBe(false);
  });
});
