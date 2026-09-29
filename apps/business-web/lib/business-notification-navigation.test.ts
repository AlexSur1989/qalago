import { describe, expect, it } from 'vitest';
import { resolveBusinessNotificationHref } from '@/lib/business-notification-navigation';

describe('business notification navigation (BIZ.6)', () => {
  it('NEW_REVIEW routes to producer business reviews', () => {
    expect(
      resolveBusinessNotificationHref({
        type: 'NEW_REVIEW',
        payload: { businessId: 'biz-a', reviewId: 'r1' },
      }),
    ).toBe('/business/biz-a/reviews');
  });

  it('does not use wrong business when payload names another business', () => {
    const href = resolveBusinessNotificationHref({
      type: 'NEW_REVIEW',
      payload: { businessId: 'biz-a', reviewId: 'r1' },
    });
    expect(href).not.toContain('biz-b');
    expect(href).toBe('/business/biz-a/reviews');
  });

  it('legacy NEW_REVIEW without payload returns null (safe fallback)', () => {
    expect(
      resolveBusinessNotificationHref({ type: 'NEW_REVIEW', payload: null }),
    ).toBeNull();
  });

  it('GENERAL without businessId returns null', () => {
    expect(
      resolveBusinessNotificationHref({ type: 'GENERAL', payload: { note: 'x' } }),
    ).toBeNull();
  });

  it('PLAN_ACTIVATED uses business dashboard when businessId present', () => {
    expect(
      resolveBusinessNotificationHref({
        type: 'PLAN_ACTIVATED',
        payload: { businessId: 'b1', planTier: 'BASIC' },
      }),
    ).toBe('/business/b1');
  });
});
