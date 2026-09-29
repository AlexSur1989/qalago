import { afterEach, describe, expect, it } from 'vitest';
import { adminBusinessTeamEnabled } from './admin-feature-flags';

describe('admin feature flags (business team hotfix)', () => {
  const key = 'NEXT_PUBLIC_QALAGO_ADMIN_BUSINESS_TEAM';

  afterEach(() => {
    delete process.env[key];
  });

  it('adminBusinessTeamEnabled is false when unset', () => {
    delete process.env[key];
    expect(adminBusinessTeamEnabled()).toBe(false);
  });

  it('adminBusinessTeamEnabled is false when not "true"', () => {
    process.env[key] = 'false';
    expect(adminBusinessTeamEnabled()).toBe(false);
    process.env[key] = '1';
    expect(adminBusinessTeamEnabled()).toBe(false);
  });

  it('adminBusinessTeamEnabled is true only for literal true', () => {
    process.env[key] = 'true';
    expect(adminBusinessTeamEnabled()).toBe(true);
  });
});
