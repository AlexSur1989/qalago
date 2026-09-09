import { describe, expect, it } from 'vitest';
import { sanitizeInternalRedirect } from './redirect-utils';

describe('sanitizeInternalRedirect', () => {
  it('allows internal invite path', () => {
    expect(sanitizeInternalRedirect('/invite/abc123')).toBe('/invite/abc123');
  });

  it('rejects external URLs', () => {
    expect(sanitizeInternalRedirect('https://evil.example')).toBeNull();
    expect(sanitizeInternalRedirect('//evil.example')).toBeNull();
  });

  it('rejects javascript URLs', () => {
    expect(sanitizeInternalRedirect('javascript:alert(1)')).toBeNull();
  });
});
