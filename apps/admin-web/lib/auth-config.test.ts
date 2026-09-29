import { describe, expect, it } from 'vitest';
import {
  devSeedAccounts,
  devSuperAdminManualHintRu,
} from './auth-config';

describe('auth-config (AOP.7H dev login)', () => {
  it('dev seed accounts exclude SUPER_ADMIN and stale seed super phone', () => {
    const phones = devSeedAccounts.map((a) => a.phone);
    expect(phones).toEqual(['+77000000005', '+79990094502', '+77000000004']);
    expect(devSeedAccounts.some((a) => /super/i.test(a.label))).toBe(false);
  });

  it('dev seed exposes Platform Admin and both CITY_ADMIN helpers', () => {
    expect(devSeedAccounts.map((a) => a.label)).toEqual([
      'Platform Admin',
      'CITY_ADMIN Uralsk',
      'CITY_ADMIN Aktobe',
    ]);
  });

  it('super manual hint does not embed a phone number', () => {
    expect(devSuperAdminManualHintRu).toContain('суперадминистратора');
    expect(devSuperAdminManualHintRu).not.toMatch(/\+7\d{10}/);
  });
});
