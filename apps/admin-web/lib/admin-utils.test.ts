import { describe, expect, it } from 'vitest';
import { formatUserAuthMethods } from './admin-utils';

describe('formatUserAuthMethods', () => {
  it('formats known methods in Russian', () => {
    expect(formatUserAuthMethods(['GOOGLE', 'APPLE'])).toBe('Google + Apple');
  });

  it('returns dash when empty', () => {
    expect(formatUserAuthMethods([])).toBe('—');
    expect(formatUserAuthMethods(undefined)).toBe('—');
  });
});
