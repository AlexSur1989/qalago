import { describe, expect, it } from 'vitest';
import {
  buildAdminCatalogStaffScope,
} from './admin-catalog-staff-scope';
import {
  adminBusinessLocationCityOptions,
  canChangeBusinessLifecycle,
  canCreateLocation,
  canDeleteSpecificLocation,
  canEditBusinessCore,
  canEditCatalogTaxonomy,
  canEditSpecificLocation,
  canSetSpecificLocationPrimary,
} from './admin-catalog-rbac';

const CITY_URALSK = 'city-uralsk';
const CITY_AKTOBE = 'city-aktobe';
const cities = [
  { id: CITY_URALSK, slug: 'uralsk', nameRu: 'Uralsk' },
  { id: CITY_AKTOBE, slug: 'aktobe', nameRu: 'Aktobe' },
];

const primaryAktobe = { cityId: CITY_AKTOBE, isPrimary: true };
const secondaryUralsk = { cityId: CITY_URALSK, isPrimary: false };

function uralskSessionSlugOnly() {
  return buildAdminCatalogStaffScope(
    { role: 'CITY_ADMIN', managedCity: { slug: 'uralsk' } },
    cities,
  );
}

function aktobeSessionSlugOnly() {
  return buildAdminCatalogStaffScope(
    { role: 'CITY_ADMIN', managedCity: { slug: 'aktobe' } },
    cities,
  );
}

describe('AOP.7H.2 capability matrix — PRIMARY Aktobe / secondary Uralsk', () => {
  describe('CITY_ADMIN Uralsk (managedCity.id absent — slug only)', () => {
    const scope = uralskSessionSlugOnly();

    it('brand core and lifecycle read-only', () => {
      expect(canEditBusinessCore('CITY_ADMIN', 'uralsk', 'aktobe')).toBe(false);
      expect(canChangeBusinessLifecycle('CITY_ADMIN', 'uralsk', 'aktobe')).toBe(false);
      expect(canEditCatalogTaxonomy('CITY_ADMIN')).toBe(false);
    });

    it('Aktobe primary view-only; Uralsk secondary editable + deletable', () => {
      expect(
        canEditSpecificLocation('CITY_ADMIN', primaryAktobe, scope, 'aktobe'),
      ).toBe(false);
      expect(
        canEditSpecificLocation('CITY_ADMIN', secondaryUralsk, scope, 'aktobe'),
      ).toBe(true);
      expect(canDeleteSpecificLocation('CITY_ADMIN', CITY_AKTOBE, scope.managedCityIds)).toBe(
        false,
      );
      expect(canDeleteSpecificLocation('CITY_ADMIN', CITY_URALSK, scope.managedCityIds)).toBe(
        true,
      );
    });

    it('no cross-city set-primary; add Uralsk only', () => {
      expect(
        canSetSpecificLocationPrimary('CITY_ADMIN', CITY_URALSK, scope, 'aktobe'),
      ).toBe(false);
      expect(canCreateLocation('CITY_ADMIN', scope.managedCityIds)).toBe(true);
      expect(adminBusinessLocationCityOptions('CITY_ADMIN', cities, scope.managedCityIds)).toEqual(
        [cities[0]],
      );
    });
  });

  describe('CITY_ADMIN Aktobe', () => {
    const scope = aktobeSessionSlugOnly();

    it('brand core and lifecycle editable', () => {
      expect(canEditBusinessCore('CITY_ADMIN', 'aktobe', 'aktobe')).toBe(true);
      expect(canChangeBusinessLifecycle('CITY_ADMIN', 'aktobe', 'aktobe')).toBe(true);
    });

    it('Aktobe primary editable; Uralsk secondary view-only', () => {
      expect(
        canEditSpecificLocation('CITY_ADMIN', primaryAktobe, scope, 'aktobe'),
      ).toBe(true);
      expect(
        canEditSpecificLocation('CITY_ADMIN', secondaryUralsk, scope, 'aktobe'),
      ).toBe(false);
      expect(canDeleteSpecificLocation('CITY_ADMIN', CITY_URALSK, scope.managedCityIds)).toBe(
        false,
      );
      expect(
        canSetSpecificLocationPrimary('CITY_ADMIN', CITY_URALSK, scope, 'aktobe'),
      ).toBe(false);
    });
  });

  describe('ADMIN operational catalog', () => {
    const scope = buildAdminCatalogStaffScope({ role: 'ADMIN' }, cities);

    it('core, taxonomy, both location edits', () => {
      expect(canEditBusinessCore('ADMIN', undefined, 'aktobe')).toBe(true);
      expect(canEditCatalogTaxonomy('ADMIN')).toBe(true);
      expect(canEditSpecificLocation('ADMIN', primaryAktobe, scope, 'aktobe')).toBe(true);
      expect(canEditSpecificLocation('ADMIN', secondaryUralsk, scope, 'aktobe')).toBe(true);
      expect(canCreateLocation('ADMIN', scope.managedCityIds)).toBe(true);
    });
  });
});

describe('AOP.7H.2 — same-city Uralsk multi-branch', () => {
  const scope = uralskSessionSlugOnly();
  const primaryUralsk = { cityId: CITY_URALSK, isPrimary: true };
  const secondaryUralsk2 = { cityId: CITY_URALSK, isPrimary: false };

  it('CITY_ADMIN Uralsk edits both and may set-primary within city', () => {
    expect(canEditBusinessCore('CITY_ADMIN', 'uralsk', 'uralsk')).toBe(true);
    expect(canEditSpecificLocation('CITY_ADMIN', primaryUralsk, scope, 'uralsk')).toBe(true);
    expect(canEditSpecificLocation('CITY_ADMIN', secondaryUralsk2, scope, 'uralsk')).toBe(true);
    expect(
      canSetSpecificLocationPrimary('CITY_ADMIN', CITY_URALSK, scope, 'uralsk'),
    ).toBe(true);
    expect(canDeleteSpecificLocation('CITY_ADMIN', CITY_URALSK, scope.managedCityIds)).toBe(true);
  });
});
