import { describe, expect, it } from 'vitest';
import {
  BusinessPermission,
  PAYMENTS_ACCESS_DENIED_RU,
  buildFooterNavItems,
  canAccessNavItem,
  canViewPayments,
  filterNavByAccess,
  isOwner,
} from './business-access';

describe('plan RBAC (Stage 5N.5)', () => {
  const ownerAccess = { role: 'OWNER' as const, permissions: [] };
  const managerWithPayments = {
    role: 'MANAGER' as const,
    permissions: [BusinessPermission.PAYMENTS_VIEW],
  };
  const managerCatalogOnly = {
    role: 'MANAGER' as const,
    permissions: [BusinessPermission.CATALOG_EDIT],
  };

  it('OWNER sees plan nav and can view payments', () => {
    const planItem = buildFooterNavItems().find((item) => item.id === 'plan');
    expect(canAccessNavItem(planItem!, ownerAccess)).toBe(true);
    expect(canViewPayments(ownerAccess)).toBe(true);
    expect(isOwner(ownerAccess)).toBe(true);
  });

  it('MANAGER with PAYMENTS_VIEW sees plan nav (read-only permission)', () => {
    const planItem = buildFooterNavItems().find((item) => item.id === 'plan');
    expect(filterNavByAccess(buildFooterNavItems(), managerWithPayments).some((i) => i.id === 'plan')).toBe(true);
    expect(canViewPayments(managerWithPayments)).toBe(true);
    expect(isOwner(managerWithPayments)).toBe(false);
  });

  it('MANAGER without PAYMENTS_VIEW hides plan nav', () => {
    const footer = filterNavByAccess(buildFooterNavItems(), managerCatalogOnly);
    expect(footer.some((item) => item.id === 'plan')).toBe(false);
    expect(canViewPayments(managerCatalogOnly)).toBe(false);
  });

  it('catalog manager still sees menu nav without PAYMENTS_VIEW', () => {
    const menuItem = { id: 'menu' as const, anyOf: [BusinessPermission.CATALOG_EDIT] };
    expect(canAccessNavItem(menuItem, managerCatalogOnly)).toBe(true);
  });

  it('permissions are business-scoped — different managers evaluated independently', () => {
    const businessA = managerWithPayments;
    const businessB = managerCatalogOnly;
    expect(canViewPayments(businessA)).toBe(true);
    expect(canViewPayments(businessB)).toBe(false);
  });

  it('exposes stable access-denied copy for plan page', () => {
    expect(PAYMENTS_ACCESS_DENIED_RU).toContain('Нет доступа');
  });
});
