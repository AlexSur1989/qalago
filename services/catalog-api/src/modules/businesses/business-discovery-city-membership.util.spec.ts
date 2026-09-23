import {
  businessCatalogDiscoveryCityScope,
  businessPhysicalPresenceInCityScope,
  legacyBusinessCatalogCityScope,
} from './business-discovery-city-membership.util';

describe('business-discovery-city-membership.util (Stage 6.12A.7.9.3A)', () => {
  it('legacy scope uses Business.cityId only', () => {
    expect(legacyBusinessCatalogCityScope('city-oral')).toEqual({ cityId: 'city-oral' });
  });

  it('physical presence scope uses BusinessLocation.cityId exists', () => {
    expect(businessPhysicalPresenceInCityScope('city-oral')).toEqual({
      locations: { some: { cityId: 'city-oral' } },
    });
  });

  it('scopes are distinct — not OR-combined in this helper', () => {
    const legacy = legacyBusinessCatalogCityScope('c1');
    const physical = businessPhysicalPresenceInCityScope('c1');
    expect(legacy).not.toEqual(physical);
  });

  it('catalog discovery scope equals physical presence', () => {
    expect(businessCatalogDiscoveryCityScope('city-aktobe')).toEqual(
      businessPhysicalPresenceInCityScope('city-aktobe'),
    );
  });
});
