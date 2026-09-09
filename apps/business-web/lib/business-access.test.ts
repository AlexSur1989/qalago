import { describe, expect, it } from 'vitest';
import {
  BusinessPermission,
  PERMISSION_PRESETS,
  buildFooterNavItems,
  buildMainNavItems,
  canAccessNavItem,
  canViewPayments,
  filterNavByAccess,
  hasPermission,
  isOwner,
  normalizeSelectedPermissions,
} from './business-access';

describe('business-access', () => {
  const ownerAccess = { role: 'OWNER' as const, permissions: [] };
  const managerCatalog = {
    role: 'MANAGER' as const,
    permissions: [BusinessPermission.CATALOG_EDIT],
  };
  const managerAnalytics = {
    role: 'MANAGER' as const,
    permissions: [BusinessPermission.ANALYTICS_VIEW],
  };

  it('isOwner detects owner role', () => {
    expect(isOwner(ownerAccess)).toBe(true);
    expect(isOwner(managerCatalog)).toBe(false);
  });

  it('hasPermission grants all to owner', () => {
    expect(hasPermission(ownerAccess, BusinessPermission.ADS_MANAGE)).toBe(true);
    expect(hasPermission(managerCatalog, BusinessPermission.CATALOG_EDIT)).toBe(true);
    expect(hasPermission(managerCatalog, BusinessPermission.ADS_MANAGE)).toBe(false);
  });

  it('canViewPayments requires owner or PAYMENTS_VIEW', () => {
    expect(canViewPayments(ownerAccess)).toBe(true);
    expect(canViewPayments(managerCatalog)).toBe(false);
    expect(
      canViewPayments({
        role: 'MANAGER',
        permissions: [BusinessPermission.PAYMENTS_VIEW],
      }),
    ).toBe(true);
  });

  it('filterNavByAccess hides owner-only and permission-gated items for managers', () => {
    const nav = buildMainNavItems();
    const filtered = filterNavByAccess(nav, managerCatalog);

    expect(filtered.some((item) => item.id === 'team')).toBe(false);
    expect(filtered.some((item) => item.id === 'menu')).toBe(true);
    expect(filtered.some((item) => item.id === 'monetization')).toBe(false);
    expect(filtered.some((item) => item.id === 'home')).toBe(true);
  });

  it('filterNavByAccess shows all main nav for owner', () => {
    const nav = buildMainNavItems();
    const filtered = filterNavByAccess(nav, ownerAccess);
    expect(filtered.some((item) => item.id === 'team')).toBe(true);
    expect(filtered.some((item) => item.id === 'monetization')).toBe(true);
  });

  it('footer plan nav requires owner or PAYMENTS_VIEW', () => {
    const planItem = buildFooterNavItems().find((item) => item.id === 'plan');
    expect(planItem).toBeDefined();
    expect(canAccessNavItem(planItem!, ownerAccess)).toBe(true);
    expect(canAccessNavItem(planItem!, managerCatalog)).toBe(false);
    expect(
      canAccessNavItem(planItem!, {
        role: 'MANAGER',
        permissions: [BusinessPermission.PAYMENTS_VIEW],
      }),
    ).toBe(true);
  });

  it('stats nav visible with ANALYTICS_VIEW', () => {
    const statsItem = buildMainNavItems().find((item) => item.id === 'stats');
    expect(canAccessNavItem(statsItem!, managerAnalytics)).toBe(true);
    expect(canAccessNavItem(statsItem!, managerCatalog)).toBe(false);
  });

  it('normalizeSelectedPermissions adds ANALYTICS_VIEW when export selected', () => {
    const normalized = normalizeSelectedPermissions([BusinessPermission.ANALYTICS_EXPORT]);
    expect(normalized).toContain(BusinessPermission.ANALYTICS_VIEW);
    expect(normalized).toContain(BusinessPermission.ANALYTICS_EXPORT);
  });

  it('permission presets include manager and content presets', () => {
    expect(PERMISSION_PRESETS.find((p) => p.id === 'manager')?.labelRu).toBe('Управляющий');
    expect(PERMISSION_PRESETS.find((p) => p.id === 'content')?.labelRu).toBe('Контент-менеджер');
    expect(PERMISSION_PRESETS.find((p) => p.id === 'manager')?.permissions).toContain(
      BusinessPermission.CATALOG_EDIT,
    );
  });
});
