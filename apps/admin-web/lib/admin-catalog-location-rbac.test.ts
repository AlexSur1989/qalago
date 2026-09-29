import { describe, expect, it } from 'vitest';
import { buildAdminCatalogStaffScope } from './admin-catalog-staff-scope';
import {
  adminBusinessLocationCityOptions,
  canDeleteSpecificLocation,
  canEditSpecificLocation,
  canSetSpecificLocationPrimary,
} from './admin-catalog-rbac';

const CITY_URALSK = 'city-uralsk';
const CITY_AKTOBE = 'city-aktobe';
const cities = [
  { id: CITY_URALSK, slug: 'uralsk', nameRu: 'Uralsk' },
  { id: CITY_AKTOBE, slug: 'aktobe', nameRu: 'Aktobe' },
];

describe('Admin BusinessLocation UI RBAC (AOP.7H.1/7H.2 cross-city)', () => {
  const primaryAktobe = { cityId: CITY_AKTOBE, isPrimary: true };
  const secondaryUralsk = { cityId: CITY_URALSK, isPrimary: false };

  const uralskScope = buildAdminCatalogStaffScope(
    { role: 'CITY_ADMIN', managedCityId: CITY_URALSK, managedCity: { slug: 'uralsk' } },
    cities,
  );

  const aktobeScope = buildAdminCatalogStaffScope(
    { role: 'CITY_ADMIN', managedCityId: CITY_AKTOBE, managedCity: { slug: 'aktobe' } },
    cities,
  );

  it('Uralsk CA: edit secondary only', () => {
    expect(canEditSpecificLocation('CITY_ADMIN', secondaryUralsk, uralskScope, 'aktobe')).toBe(
      true,
    );
    expect(canEditSpecificLocation('CITY_ADMIN', primaryAktobe, uralskScope, 'aktobe')).toBe(
      false,
    );
  });

  it('Aktobe CA: edit primary only', () => {
    expect(canEditSpecificLocation('CITY_ADMIN', primaryAktobe, aktobeScope, 'aktobe')).toBe(true);
    expect(canEditSpecificLocation('CITY_ADMIN', secondaryUralsk, aktobeScope, 'aktobe')).toBe(
      false,
    );
  });

  it('set-primary anti-escalation cross-city', () => {
    expect(
      canSetSpecificLocationPrimary('CITY_ADMIN', CITY_URALSK, uralskScope, 'aktobe'),
    ).toBe(false);
    expect(
      canSetSpecificLocationPrimary('CITY_ADMIN', CITY_URALSK, aktobeScope, 'aktobe'),
    ).toBe(false);
  });

  it('delete scoped by city', () => {
    expect(canDeleteSpecificLocation('CITY_ADMIN', CITY_URALSK, uralskScope.managedCityIds)).toBe(
      true,
    );
    expect(canDeleteSpecificLocation('CITY_ADMIN', CITY_AKTOBE, uralskScope.managedCityIds)).toBe(
      false,
    );
  });

  it('city options for add form', () => {
    expect(adminBusinessLocationCityOptions('CITY_ADMIN', cities, uralskScope.managedCityIds)).toEqual(
      [cities[0]],
    );
  });
});
