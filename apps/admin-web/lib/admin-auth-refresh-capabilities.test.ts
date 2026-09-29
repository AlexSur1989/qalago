import { describe, expect, it } from 'vitest';
import { normalizeAdminAuthUser } from './admin-auth-session';
import { buildAdminCatalogStaffScope } from './admin-catalog-staff-scope';
import {
  canCreateLocation,
  canEditSpecificLocation,
} from './admin-catalog-rbac';

const CITY_URALSK = 'cmpn1wnp90000ult89ngnv1ym';
const CITY_AKTOBE = 'cmpn2omf90001ulaomysdx7wc';
const cities = [
  { id: CITY_URALSK, slug: 'uralsk', nameRu: 'Uralsk' },
  { id: CITY_AKTOBE, slug: 'aktobe', nameRu: 'Aktobe' },
];

const secondaryUralsk = { cityId: CITY_URALSK, isPrimary: false };
const primaryAktobe = { cityId: CITY_AKTOBE, isPrimary: true };

/** Simulates GET /users/me after refresh bootstrap (AOP.7H.3). */
function meAfterRefresh(role: 'CITY_ADMIN', slug: 'uralsk' | 'aktobe', cityId: string) {
  return normalizeAdminAuthUser({
    id: 'ca',
    name: 'CA',
    role,
    managedCity: { id: cityId, slug, nameRu: slug },
  });
}

describe('capabilities after refresh-shaped canonical user (AOP.7H.3)', () => {
  it('Uralsk CITY_ADMIN: edit/add Uralsk secondary, not Aktobe primary', () => {
    const user = meAfterRefresh('CITY_ADMIN', 'uralsk', CITY_URALSK);
    const scope = buildAdminCatalogStaffScope(
      { role: user.role, managedCityId: user.managedCityId, managedCity: user.managedCity },
      cities,
    );
    expect(canEditSpecificLocation('CITY_ADMIN', secondaryUralsk, scope, 'aktobe')).toBe(true);
    expect(canEditSpecificLocation('CITY_ADMIN', primaryAktobe, scope, 'aktobe')).toBe(false);
    expect(canCreateLocation('CITY_ADMIN', scope.managedCityIds)).toBe(true);
  });

  it('Aktobe CITY_ADMIN: edit Aktobe primary, not Uralsk secondary', () => {
    const user = meAfterRefresh('CITY_ADMIN', 'aktobe', CITY_AKTOBE);
    const scope = buildAdminCatalogStaffScope(
      { role: user.role, managedCityId: user.managedCityId, managedCity: user.managedCity },
      cities,
    );
    expect(canEditSpecificLocation('CITY_ADMIN', primaryAktobe, scope, 'aktobe')).toBe(true);
    expect(canEditSpecificLocation('CITY_ADMIN', secondaryUralsk, scope, 'aktobe')).toBe(false);
    expect(canCreateLocation('CITY_ADMIN', scope.managedCityIds)).toBe(true);
  });

  it('slim refresh user without getMe yields no location capabilities', () => {
    const scope = buildAdminCatalogStaffScope(
      { role: 'CITY_ADMIN', managedCityId: null, managedCity: null },
      cities,
    );
    expect(canEditSpecificLocation('CITY_ADMIN', secondaryUralsk, scope, 'aktobe')).toBe(false);
    expect(canCreateLocation('CITY_ADMIN', scope.managedCityIds)).toBe(false);
  });
});
