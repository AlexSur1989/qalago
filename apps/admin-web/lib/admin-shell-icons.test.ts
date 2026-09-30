import { describe, expect, it } from 'vitest';
import { isQalaBackofficeIconName, QALA_BACKOFFICE_ICON_NAMES } from '@qalago/brand/icons';
import type { AdminTabId } from '@/lib/admin-utils';
import { ADMIN_SHELL_ROUTE_ICONS, ADMIN_TAB_ICONS } from './admin-shell-icons';

const ADMIN_TAB_IDS: AdminTabId[] = [
  'moderation',
  'featured',
  'reviews',
  'monetization',
  'categories',
  'content',
  'users',
  'cities',
];

describe('admin shell icons (UXA.3)', () => {
  it('maps every dashboard tab to a registered icon', () => {
    for (const id of ADMIN_TAB_IDS) {
      const name = ADMIN_TAB_ICONS[id];
      expect(isQalaBackofficeIconName(name)).toBe(true);
    }
  });

  it('maps every shell route link to a registered icon', () => {
    for (const name of Object.values(ADMIN_SHELL_ROUTE_ICONS)) {
      expect(QALA_BACKOFFICE_ICON_NAMES).toContain(name);
    }
  });
});
