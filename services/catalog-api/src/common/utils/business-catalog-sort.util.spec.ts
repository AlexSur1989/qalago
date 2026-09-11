import {
  BusinessCatalogSort,
  compareBusinessBySort,
  type BusinessSortRow,
} from './business-catalog-sort.util';

function row(partial: Partial<BusinessSortRow> & Pick<BusinessSortRow, 'id' | 'title'>): BusinessSortRow {
  return {
    planTier: 'FREE',
    planExpiresAt: null,
    isFeatured: false,
    featuredSlot: null,
    reviewCount: 0,
    ...partial,
  };
}

describe('compareBusinessBySort', () => {
  it('RECOMMENDED sorts by Russian title (plan-neutral)', () => {
    const a = row({ id: 'b', title: 'Beta' });
    const b = row({ id: 'a', title: 'Alpha', planTier: 'VIP' as never });
    expect(compareBusinessBySort(a, b, BusinessCatalogSort.RECOMMENDED)).toBeGreaterThan(0);
  });

  it('NEAREST sorts by distance then title', () => {
    const near = row({ id: 'n', title: 'Zulu', distanceMeters: 100 });
    const far = row({ id: 'f', title: 'Alpha', distanceMeters: 900 });
    expect(compareBusinessBySort(near, far, BusinessCatalogSort.NEAREST)).toBeLessThan(0);
  });

  it('RATING puts unrated businesses after rated', () => {
    const rated = row({
      id: 'r',
      title: 'Zulu',
      averageRating: 4.2,
      reviewCount: 3,
    });
    const unrated = row({ id: 'u', title: 'Alpha', averageRating: null, reviewCount: 0 });
    expect(compareBusinessBySort(rated, unrated, BusinessCatalogSort.RATING)).toBeLessThan(0);
  });

  it('RATING tie-breaks by review count then title', () => {
    const more = row({
      id: 'm',
      title: 'Beta',
      averageRating: 5,
      reviewCount: 10,
    });
    const fewer = row({
      id: 'f',
      title: 'Alpha',
      averageRating: 5,
      reviewCount: 2,
    });
    expect(compareBusinessBySort(more, fewer, BusinessCatalogSort.RATING)).toBeLessThan(0);
  });

  it('POPULAR uses organic views aggregate', () => {
    const hot = row({ id: 'h', title: 'Zulu', organicViews30d: 100 });
    const cold = row({ id: 'c', title: 'Alpha', organicViews30d: 1 });
    expect(compareBusinessBySort(hot, cold, BusinessCatalogSort.POPULAR)).toBeLessThan(0);
  });
});
