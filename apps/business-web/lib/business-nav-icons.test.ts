import { describe, expect, it } from 'vitest';
import { isQalaBackofficeIconName } from '@qalago/brand/icons';
import {
  BUSINESS_NAV_ICONS,
  buildFooterNavItems,
  buildMainNavItems,
  canAccessNavItem,
  filterNavByAccess,
  type NavId,
} from './business-access';

const ALL_NAV_IDS: NavId[] = [
  'home',
  'profile',
  'locations',
  'menu',
  'promotions',
  'stats',
  'messages',
  'settings',
  'plan',
  'monetization',
  'help',
  'media',
  'reviews',
  'team',
];

describe('business nav icons (UXA.3)', () => {
  it('defines a valid icon for every NavId', () => {
    for (const id of ALL_NAV_IDS) {
      expect(isQalaBackofficeIconName(BUSINESS_NAV_ICONS[id])).toBe(true);
    }
  });

  it('buildMainNavItems and buildFooterNavItems resolve valid icons', () => {
    for (const item of [...buildMainNavItems('ru'), ...buildFooterNavItems('ru')]) {
      expect(isQalaBackofficeIconName(item.icon)).toBe(true);
    }
  });

  it('team nav still gated by businessTeamEnabled', () => {
    const teamItem = buildMainNavItems('ru').find((item) => item.id === 'team')!;
    const owner = { role: 'OWNER' as const, permissions: [] as string[] };
    expect(canAccessNavItem(teamItem, owner, { businessTeamEnabled: true })).toBe(true);
    expect(canAccessNavItem(teamItem, owner, { businessTeamEnabled: false })).toBe(false);
  });

  it('permission-scoped nav unchanged aside from icon type', () => {
    const manager = {
      role: 'MANAGER' as const,
      permissions: ['CATALOG_EDIT'],
    };
    const filtered = filterNavByAccess(buildMainNavItems('ru'), manager);
    expect(filtered.some((item) => item.id === 'team')).toBe(false);
    expect(filtered.some((item) => item.id === 'menu')).toBe(true);
  });
});
