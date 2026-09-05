import { PromotionStatus } from '@prisma/client';
import {
  applyPublicServiceMenuLimit,
  buildEntitlementSummary,
  isPromotionLiveNow,
  selectPublicPromotions,
  sliceToPublicLimit,
} from './plan-entitlements.util';

describe('plan-entitlements.util', () => {
  const now = new Date('2026-09-06T12:00:00Z');

  it('sliceToPublicLimit preserves order', () => {
    expect(sliceToPublicLimit([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
  });

  it('isPromotionLiveNow respects dates', () => {
    expect(
      isPromotionLiveNow(
        {
          status: PromotionStatus.ACTIVE,
          startDate: new Date('2026-09-01'),
          endDate: new Date('2026-09-10'),
        },
        now,
      ),
    ).toBe(true);
    expect(
      isPromotionLiveNow(
        {
          status: PromotionStatus.ACTIVE,
          startDate: new Date('2026-09-01'),
          endDate: new Date('2026-09-05'),
        },
        now,
      ),
    ).toBe(false);
  });

  it('selectPublicPromotions caps live promotions without changing status', () => {
    const promos = [
      {
        id: '1',
        status: PromotionStatus.ACTIVE,
        createdAt: new Date('2026-09-01'),
        startDate: null,
        endDate: new Date('2026-09-20'),
      },
      {
        id: '2',
        status: PromotionStatus.ACTIVE,
        createdAt: new Date('2026-09-02'),
        startDate: null,
        endDate: new Date('2026-09-20'),
      },
      {
        id: '3',
        status: PromotionStatus.ACTIVE,
        createdAt: new Date('2026-09-03'),
        startDate: null,
        endDate: new Date('2026-09-04'),
      },
      {
        id: '4',
        status: PromotionStatus.ACTIVE,
        createdAt: new Date('2026-09-04'),
        startDate: null,
        endDate: new Date('2026-09-20'),
      },
    ];

    const selected = selectPublicPromotions(promos, 3, now);
    expect(selected.map((p) => p.id)).toEqual(['4', '2', '1']);
    expect(promos).toHaveLength(4);
  });

  it('applyPublicServiceMenuLimit uses existing item order', () => {
    const menu = {
      groups: [
        {
          id: 'g1',
          title: 'Group',
          items: [
            { id: 'a', sortOrder: 1, title: 'A' },
            { id: 'b', sortOrder: 2, title: 'B' },
          ],
        },
      ],
      ungrouped: [{ id: 'c', sortOrder: 0, title: 'C' }],
    };

    const limited = applyPublicServiceMenuLimit(menu, 2);
    expect(limited.ungrouped.map((i) => i.id)).toEqual(['c']);
    expect(limited.groups[0]?.items.map((i) => i.id)).toEqual(['a']);
  });

  it('buildEntitlementSummary flags over-limit state', () => {
    const summary = buildEntitlementSummary(
      { photos: 40, serviceItems: 80, activePromotions: 7 },
      { maxPhotos: 15, maxServiceItems: 30, maxActivePromotions: 3 },
      { photos: 15, serviceItems: 30, activePromotions: 3 },
    );
    expect(summary.photos.overLimit).toBe(true);
    expect(summary.photos.total).toBe(40);
    expect(summary.photos.published).toBe(15);
    expect(summary.overLimitNotice).toContain('15 фото');
  });
});
