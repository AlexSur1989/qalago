import { UserRole } from '@prisma/client';
import {
  isGlobalAdmin,
  isSuperAdmin,
  satisfiesRequiredRoles,
} from './system-access.util';

describe('system-access.util (Stage 5M.4)', () => {
  it('isSuperAdmin', () => {
    expect(isSuperAdmin({ role: UserRole.SUPER_ADMIN })).toBe(true);
    expect(isSuperAdmin({ role: UserRole.ADMIN })).toBe(false);
  });

  it('isGlobalAdmin', () => {
    expect(isGlobalAdmin({ role: UserRole.SUPER_ADMIN })).toBe(true);
    expect(isGlobalAdmin({ role: UserRole.ADMIN })).toBe(true);
    expect(isGlobalAdmin({ role: UserRole.CITY_ADMIN })).toBe(false);
  });

  describe('satisfiesRequiredRoles', () => {
    it('SUPER_ADMIN passes ADMIN operational routes', () => {
      expect(satisfiesRequiredRoles(UserRole.SUPER_ADMIN, [UserRole.ADMIN])).toBe(true);
    });

    it('SUPER_ADMIN passes explicit SUPER_ADMIN routes', () => {
      expect(
        satisfiesRequiredRoles(UserRole.SUPER_ADMIN, [UserRole.SUPER_ADMIN]),
      ).toBe(true);
    });

    it('ADMIN does not pass SUPER_ADMIN-only routes', () => {
      expect(satisfiesRequiredRoles(UserRole.ADMIN, [UserRole.SUPER_ADMIN])).toBe(
        false,
      );
    });

    it('USER passes BUSINESS routes for membership bypass', () => {
      expect(satisfiesRequiredRoles(UserRole.USER, [UserRole.BUSINESS])).toBe(true);
    });

    it('CITY_ADMIN passes CITY_ADMIN routes', () => {
      expect(
        satisfiesRequiredRoles(UserRole.CITY_ADMIN, [UserRole.CITY_ADMIN]),
      ).toBe(true);
    });
  });
});
