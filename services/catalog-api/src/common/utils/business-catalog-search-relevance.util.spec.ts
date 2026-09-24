import {
  BusinessCatalogSearchRelevanceTier,
  compareBusinessBySearchRelevance,
  computeBusinessSearchRelevanceTier,
} from './business-catalog-search-relevance.util';

describe('business-catalog-search-relevance.util (6.11B.5)', () => {
  it('exact title ranks above service title match', () => {
    const exact = {
      id: 'a',
      title: 'Маникюр',
    };
    const serviceOnly = {
      id: 'b',
      title: 'Beauty Studio',
      serviceMatchKind: 'service_title' as const,
    };
    expect(computeBusinessSearchRelevanceTier(exact, 'маникюр')).toBe(
      BusinessCatalogSearchRelevanceTier.EXACT_TITLE,
    );
    expect(computeBusinessSearchRelevanceTier(serviceOnly, 'маникюр')).toBe(
      BusinessCatalogSearchRelevanceTier.SERVICE_TITLE,
    );
    expect(compareBusinessBySearchRelevance(exact, serviceOnly, 'маникюр')).toBeLessThan(0);
  });

  it('prefix title ranks above contains-only title', () => {
    const prefix = { id: 'a', title: 'Маникюр Studio' };
    const contains = { id: 'b', title: 'Beauty — профессиональный маникюр' };
    expect(computeBusinessSearchRelevanceTier(prefix, 'маникюр')).toBe(
      BusinessCatalogSearchRelevanceTier.TITLE_PREFIX,
    );
    expect(computeBusinessSearchRelevanceTier(contains, 'маникюр')).toBe(
      BusinessCatalogSearchRelevanceTier.TITLE_CONTAINS,
    );
    expect(compareBusinessBySearchRelevance(prefix, contains, 'маникюр')).toBeLessThan(0);
  });

  it('service title ranks above description-only business fields', () => {
    const service = {
      id: 'a',
      title: 'Salon',
      serviceMatchKind: 'service_title' as const,
    };
    const desc = {
      id: 'b',
      title: 'Salon B',
      shortDesc: 'лучший маникюр в городе',
    };
    expect(compareBusinessBySearchRelevance(service, desc, 'маникюр')).toBeLessThan(0);
  });

  it('stale business.address does not rank as address match without branchAddressMatch', () => {
    expect(
      computeBusinessSearchRelevanceTier(
        {
          id: 'a',
          title: 'Cafe',
          address: 'OLD LEGACY STREET',
          branchAddressMatch: false,
        },
        'OLD LEGACY STREET',
      ),
    ).toBe(BusinessCatalogSearchRelevanceTier.DESCRIPTION);
  });

  it('taxonomy match ranks above description-only', () => {
    const taxonomy = {
      id: 'a',
      title: 'Astana Food',
      category: { title: 'Retail', nameRu: 'Рестораны', nameKk: 'Мейрамхана' },
    };
    const desc = {
      id: 'b',
      title: 'Cafe',
      shortDesc: 'у нас отличный ресторанный зал',
    };
    expect(computeBusinessSearchRelevanceTier(taxonomy, 'ресторан')).toBe(
      BusinessCatalogSearchRelevanceTier.TAXONOMY,
    );
    expect(compareBusinessBySearchRelevance(taxonomy, desc, 'ресторан')).toBeLessThan(0);
  });
});
