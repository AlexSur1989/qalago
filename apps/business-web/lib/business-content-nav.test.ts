import { describe, expect, it } from 'vitest';
import {
  BusinessPermission,
  buildMainNavItems,
  filterNavByAccess,
} from './business-access';

/** BIZ.5 — operational content nav is per-business permission scoped. */
describe('business content nav (BIZ.5)', () => {
  const nav = buildMainNavItems('ru');

  it('catalog-only manager sees menu not media/promotions', () => {
    const filtered = filterNavByAccess(nav, {
      role: 'MANAGER',
      permissions: [BusinessPermission.CATALOG_EDIT],
    });
    expect(filtered.some((i) => i.id === 'menu')).toBe(true);
    expect(filtered.some((i) => i.id === 'media')).toBe(false);
    expect(filtered.some((i) => i.id === 'promotions')).toBe(false);
  });

  it('photos-only manager sees media not menu', () => {
    const filtered = filterNavByAccess(nav, {
      role: 'MANAGER',
      permissions: [BusinessPermission.PHOTOS_EDIT],
    });
    expect(filtered.some((i) => i.id === 'media')).toBe(true);
    expect(filtered.some((i) => i.id === 'menu')).toBe(false);
  });

  it('promotions-only manager sees promotions not menu', () => {
    const filtered = filterNavByAccess(nav, {
      role: 'MANAGER',
      permissions: [BusinessPermission.PROMOTIONS_EDIT],
    });
    expect(filtered.some((i) => i.id === 'promotions')).toBe(true);
    expect(filtered.some((i) => i.id === 'menu')).toBe(false);
  });

  it('owner sees all content sections', () => {
    const filtered = filterNavByAccess(nav, { role: 'OWNER', permissions: [] });
    expect(filtered.some((i) => i.id === 'menu')).toBe(true);
    expect(filtered.some((i) => i.id === 'media')).toBe(true);
    expect(filtered.some((i) => i.id === 'promotions')).toBe(true);
  });
});
