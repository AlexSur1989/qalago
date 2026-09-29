import { describe, expect, it } from 'vitest';
import {
  BusinessPermission,
  buildMainNavItems,
  filterNavByAccess,
} from './business-access';

/** BIZ.3 — permissions are per selected business access, not global user. */
describe('manager nav per business (BIZ.3)', () => {
  const nav = buildMainNavItems('ru');

  it('different businesses yield different filtered nav', () => {
    const accessA = {
      role: 'MANAGER' as const,
      permissions: [BusinessPermission.CATALOG_EDIT],
    };
    const accessB = {
      role: 'MANAGER' as const,
      permissions: [BusinessPermission.ANALYTICS_VIEW],
    };

    const navA = filterNavByAccess(nav, accessA);
    const navB = filterNavByAccess(nav, accessB);

    expect(navA.some((i) => i.id === 'menu')).toBe(true);
    expect(navA.some((i) => i.id === 'stats')).toBe(false);
    expect(navB.some((i) => i.id === 'stats')).toBe(true);
    expect(navB.some((i) => i.id === 'menu')).toBe(false);
  });

  it('owner nav includes team; manager never does', () => {
    const ownerNav = filterNavByAccess(nav, { role: 'OWNER', permissions: [] });
    const managerNav = filterNavByAccess(nav, {
      role: 'MANAGER',
      permissions: Object.values(BusinessPermission),
    });
    expect(ownerNav.some((i) => i.id === 'team')).toBe(true);
    expect(managerNav.some((i) => i.id === 'team')).toBe(false);
  });

  it('F5-stable: same access reproduces same nav ids', () => {
    const access = {
      role: 'MANAGER' as const,
      permissions: [BusinessPermission.PROMOTIONS_EDIT, BusinessPermission.REVIEWS_REPLY],
    };
    const first = filterNavByAccess(nav, access).map((i) => i.id);
    const second = filterNavByAccess(nav, access).map((i) => i.id);
    expect(second).toEqual(first);
  });
});
