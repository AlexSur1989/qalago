import { UserRole } from '@prisma/client';
import { resolveAccountRole } from './auth-role.util';

describe('resolveAccountRole', () => {
  it('creates USER when accountType is user or omitted', () => {
    expect(resolveAccountRole(null, 'user')).toBe(UserRole.USER);
    expect(resolveAccountRole(null)).toBe(UserRole.USER);
  });

  it('creates BUSINESS when accountType is business', () => {
    expect(resolveAccountRole(null, 'business')).toBe(UserRole.BUSINESS);
  });

  it('upgrades USER to BUSINESS', () => {
    expect(resolveAccountRole(UserRole.USER, 'business')).toBe(UserRole.BUSINESS);
  });

  it('keeps privileged roles unchanged', () => {
    expect(resolveAccountRole(UserRole.ADMIN, 'user')).toBe(UserRole.ADMIN);
    expect(resolveAccountRole(UserRole.CITY_ADMIN, 'user')).toBe(UserRole.CITY_ADMIN);
    expect(resolveAccountRole(UserRole.BUSINESS, 'user')).toBe(UserRole.BUSINESS);
  });

  it('keeps USER when logging in as user', () => {
    expect(resolveAccountRole(UserRole.USER, 'user')).toBe(UserRole.USER);
  });
});
