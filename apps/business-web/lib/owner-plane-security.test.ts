import { describe, expect, it } from 'vitest';
import {
  BusinessPermission,
  buildMainNavItems,
  filterNavByAccess,
} from './business-access';
import { resolveSelectedBusinessId } from './business-selection';
import { resolveBusinessNotificationHref } from './business-notification-navigation';
import type { MyBusinessItem } from './api';

describe('owner-plane security (BIZ.8)', () => {
  const nav = buildMainNavItems('ru');

  const ownerA: MyBusinessItem = {
    business: { id: 'biz-a', title: 'A', status: 'ACTIVE', address: '1' },
    access: { role: 'OWNER', permissions: [] },
  };
  const managerB: MyBusinessItem = {
    business: { id: 'biz-b', title: 'B', status: 'ACTIVE', address: '2' },
    access: {
      role: 'MANAGER',
      permissions: [BusinessPermission.PHOTOS_EDIT],
    },
  };
  const managerC: MyBusinessItem = {
    business: { id: 'biz-c', title: 'C', status: 'ACTIVE', address: '3' },
    access: {
      role: 'MANAGER',
      permissions: [BusinessPermission.REVIEWS_REPLY],
    },
  };

  it('multi-business permission matrix — nav isolated per access object', () => {
    const bNav = filterNavByAccess(nav, managerB.access);
    const cNav = filterNavByAccess(nav, managerC.access);
    expect(bNav.some((i) => i.id === 'media')).toBe(true);
    expect(bNav.some((i) => i.id === 'menu')).toBe(false);
    expect(cNav.some((i) => i.id === 'reviews')).toBe(true);
    expect(cNav.some((i) => i.id === 'media')).toBe(false);
  });

  it('stale selected business id falls back after membership list shrinks', () => {
    const afterRevoke = [ownerA];
    expect(resolveSelectedBusinessId(afterRevoke, 'biz-b')).toBe('biz-a');
  });

  it('notification href targets payload business (not shell selection)', () => {
    const href = resolveBusinessNotificationHref({
      type: 'NEW_REVIEW',
      payload: { businessId: 'biz-c', reviewId: 'r1' },
    });
    expect(href).toBe('/business/biz-c/reviews');
  });

  it('direct URL business id absent from /my yields null access (backend authority)', () => {
    const items = [ownerA, managerB];
    const access = items.find((i) => i.business.id === 'biz-unknown')?.access ?? null;
    expect(access).toBeNull();
  });
});
