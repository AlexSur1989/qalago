import { describe, expect, it } from 'vitest';
import { UserRole } from '@qalago/shared-types';
import { canExportReports, canViewReport, visibleReportNav } from './report-rbac';

describe('report-rbac', () => {
  it('SUPER_ADMIN sees finance and staff nav', () => {
    const nav = visibleReportNav(UserRole.SUPER_ADMIN);
    expect(nav.some((n) => n.id === 'finance')).toBe(true);
    expect(nav.some((n) => n.id === 'staff')).toBe(true);
    expect(nav.some((n) => n.id === 'security')).toBe(true);
  });

  it('ADMIN does not see finance/staff/security', () => {
    expect(canViewReport(UserRole.ADMIN, 'finance')).toBe(false);
    expect(canViewReport(UserRole.ADMIN, 'staff')).toBe(false);
    expect(canViewReport(UserRole.ADMIN, 'security')).toBe(false);
    expect(canViewReport(UserRole.ADMIN, 'overview')).toBe(true);
  });

  it('MODERATOR sees moderation only among core ops', () => {
    expect(canViewReport(UserRole.MODERATOR, 'moderation')).toBe(true);
    expect(canViewReport(UserRole.MODERATOR, 'finance')).toBe(false);
    expect(canViewReport(UserRole.MODERATOR, 'overview')).toBe(false);
  });

  it('FINANCE sees finance not staff', () => {
    expect(canViewReport(UserRole.FINANCE, 'finance')).toBe(true);
    expect(canViewReport(UserRole.FINANCE, 'staff')).toBe(false);
    expect(canExportReports(UserRole.FINANCE)).toBe(true);
  });

  it('TECH_ADMIN sees system not finance', () => {
    expect(canViewReport(UserRole.TECH_ADMIN, 'system')).toBe(true);
    expect(canViewReport(UserRole.TECH_ADMIN, 'finance')).toBe(false);
  });

  it('ANALYST no staff/security/finance', () => {
    expect(canViewReport(UserRole.ANALYST, 'users')).toBe(true);
    expect(canViewReport(UserRole.ANALYST, 'staff')).toBe(false);
    expect(canViewReport(UserRole.ANALYST, 'finance')).toBe(false);
  });

  it('CITY_ADMIN sees scoped reports not finance', () => {
    expect(canViewReport(UserRole.CITY_ADMIN, 'cities')).toBe(true);
    expect(canViewReport(UserRole.CITY_ADMIN, 'finance')).toBe(false);
    expect(canExportReports(UserRole.CITY_ADMIN)).toBe(false);
  });

  it('CSV export permission is role-gated', () => {
    expect(canExportReports(UserRole.ADMIN)).toBe(true);
    expect(canExportReports(UserRole.MODERATOR)).toBe(false);
    expect(canExportReports(UserRole.TECH_ADMIN)).toBe(false);
  });

  it('staff detail route permission is SUPER_ADMIN only via staff report', () => {
    expect(canViewReport(UserRole.SUPER_ADMIN, 'staff')).toBe(true);
    expect(canViewReport(UserRole.ADMIN, 'staff')).toBe(false);
    expect(canViewReport(UserRole.SUPER_ADMIN, 'audit')).toBe(true);
    expect(canViewReport(UserRole.ADMIN, 'audit')).toBe(false);
  });
});
