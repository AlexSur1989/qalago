import { describe, expect, it } from 'vitest';
import { businessWebDevLoginEnabled } from './auth-config';

describe('auth-config', () => {
  it('businessWebDevLoginEnabled defaults to false', () => {
    expect(businessWebDevLoginEnabled).toBe(false);
  });
});
