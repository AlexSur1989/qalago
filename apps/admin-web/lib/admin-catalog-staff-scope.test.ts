import { describe, expect, it } from 'vitest';
import { buildAdminCatalogStaffScope, resolveAdminCatalogManagedCityIds } from './admin-catalog-staff-scope';

const cities = [
  { id: 'city-uralsk', slug: 'uralsk' },
  { id: 'city-aktobe', slug: 'aktobe' },
];

describe('admin catalog staff scope (AOP.7H.2)', () => {
  it('resolves managed city id from managedCity.id when managedCityId absent', () => {
    expect(
      resolveAdminCatalogManagedCityIds(
        { role: 'CITY_ADMIN', managedCity: { id: 'city-uralsk', slug: 'uralsk' } },
        cities,
      ),
    ).toEqual(['city-uralsk']);
  });

  it('resolves managed city id from slug via city list', () => {
    expect(
      resolveAdminCatalogManagedCityIds(
        { role: 'CITY_ADMIN', managedCity: { slug: 'uralsk' } },
        cities,
      ),
    ).toEqual(['city-uralsk']);
  });

  it('buildAdminCatalogStaffScope returns empty ids when CITY_ADMIN scope unknown', () => {
    expect(
      buildAdminCatalogStaffScope({ role: 'CITY_ADMIN', managedCity: null }, cities).managedCityIds,
    ).toEqual([]);
  });
});
