import { BusinessPlanTier } from '@prisma/client';
import { selectPublishedCatalogServiceItemsForEffectiveTier } from '../../common/utils/public-catalog-service-items.util';
import { isCatalogEntityEligibleAtLocation } from './business-effective-catalog.util';

describe('business-effective-catalog.util', () => {
  it('zero assignments = eligible at any location', () => {
    expect(isCatalogEntityEligibleAtLocation([], 'loc-l2')).toBe(true);
  });

  it('selected location must match', () => {
    expect(
      isCatalogEntityEligibleAtLocation([{ locationId: 'loc-l1' }], 'loc-l2'),
    ).toBe(false);
    expect(
      isCatalogEntityEligibleAtLocation([{ locationId: 'loc-l2' }], 'loc-l2'),
    ).toBe(true);
  });

  it('branch filter before plan cap (L2 receives eligible items, not global top-N)', () => {
    const items = [
      { id: 'l1-only', sortOrder: 0, title: 'A', groupId: null, createdAt: new Date() },
      { id: 'l1-l3', sortOrder: 1, title: 'B', groupId: null, createdAt: new Date() },
      { id: 'shared', sortOrder: 2, title: 'C', groupId: null, createdAt: new Date() },
      { id: 'l2-only', sortOrder: 3, title: 'D', groupId: null, createdAt: new Date() },
    ];
    const assignments = new Map<string, string[]>([
      ['l1-only', ['loc-l1']],
      ['l1-l3', ['loc-l1', 'loc-l3']],
      ['shared', []],
      ['l2-only', ['loc-l2']],
    ]);

    const branchEligible = items.filter((item) =>
      isCatalogEntityEligibleAtLocation(
        (assignments.get(item.id) ?? []).map((locationId) => ({ locationId })),
        'loc-l2',
      ),
    );
    expect(branchEligible.map((i) => i.id)).toEqual(['shared', 'l2-only']);

    const cappedWrongOrder = selectPublishedCatalogServiceItemsForEffectiveTier(
      items,
      BusinessPlanTier.FREE,
    ).slice(0, 2);
    const cappedWrongAtL2 = cappedWrongOrder.filter((item) =>
      isCatalogEntityEligibleAtLocation(
        (assignments.get(item.id) ?? []).map((locationId) => ({ locationId })),
        'loc-l2',
      ),
    );
    expect(cappedWrongAtL2).toHaveLength(0);

    const cappedCorrect = selectPublishedCatalogServiceItemsForEffectiveTier(
      branchEligible,
      BusinessPlanTier.FREE,
    ).slice(0, 2);
    expect(cappedCorrect.map((i) => i.id)).toEqual(['shared', 'l2-only']);
  });
});
