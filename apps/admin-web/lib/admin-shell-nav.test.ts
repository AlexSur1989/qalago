import { describe, expect, it } from 'vitest';
import { UserRole } from './rbac';
import {
  showAdminAuditNav,
  showAdminHomeSectionsNav,
  showAdminPlatformSettingsNav,
  showAdminSettingsNav,
  showAdminStaffNav,
} from './admin-shell-nav';

describe('admin shell nav visibility (UXA.2)', () => {
  it('staff nav is SUPER_ADMIN only', () => {
    expect(showAdminStaffNav(UserRole.SUPER_ADMIN)).toBe(true);
    expect(showAdminStaffNav(UserRole.ADMIN)).toBe(false);
    expect(showAdminStaffNav(UserRole.CITY_ADMIN)).toBe(false);
  });

  it('settings nav follows admin-web access', () => {
    expect(showAdminSettingsNav(UserRole.SUPER_ADMIN)).toBe(true);
    expect(showAdminSettingsNav(UserRole.ADMIN)).toBe(true);
    expect(showAdminSettingsNav(UserRole.CITY_ADMIN)).toBe(true);
  });

  it('platform settings subnav is SUPER_ADMIN only', () => {
    expect(showAdminPlatformSettingsNav(UserRole.SUPER_ADMIN)).toBe(true);
    expect(showAdminPlatformSettingsNav(UserRole.ADMIN)).toBe(false);
  });

  it('home sections nav for global admin and city admin', () => {
    expect(showAdminHomeSectionsNav(UserRole.ADMIN)).toBe(true);
    expect(showAdminHomeSectionsNav(UserRole.CITY_ADMIN)).toBe(true);
    expect(showAdminHomeSectionsNav(UserRole.MODERATOR)).toBe(false);
  });

  it('audit nav uses canViewAdminAuditLogs matrix', () => {
    expect(showAdminAuditNav(UserRole.SUPER_ADMIN)).toBe(true);
    expect(showAdminAuditNav(UserRole.ANALYST)).toBe(false);
  });
});
