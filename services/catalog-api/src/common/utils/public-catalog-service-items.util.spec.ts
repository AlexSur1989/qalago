import { BusinessPlanTier } from '@prisma/client';
import {
  getPublishedServiceItemLimit,
  selectPublishedCatalogServiceItems,
} from './public-catalog-service-items.util';

describe('public-catalog-service-items.util (6.11B.2)', () => {
  it('FREE plan publishes first 10 items in catalog sort order', () => {
    const items = Array.from({ length: 12 }, (_, index) => ({
      id: `item-${index}`,
      sortOrder: index,
      title: `Item ${index}`,
      createdAt: new Date(Date.now() - index * 1000),
      group: null,
    }));

    const published = selectPublishedCatalogServiceItems(
      items,
      BusinessPlanTier.FREE,
      null,
    );
    expect(published).toHaveLength(getPublishedServiceItemLimit(BusinessPlanTier.FREE, null));
    expect(published[0]!.id).toBe('item-0');
    expect(published.at(-1)!.id).toBe('item-9');
  });

  it('expired PREMIUM resolves to FREE cap without deleting items', () => {
    const expired = new Date(Date.now() - 86400000);
    expect(getPublishedServiceItemLimit(BusinessPlanTier.PREMIUM, expired)).toBe(10);
  });
});
