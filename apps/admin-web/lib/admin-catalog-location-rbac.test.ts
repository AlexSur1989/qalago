import { describe, expect, it } from 'vitest';
import {
  adminBusinessLocationCityOptions,
  canAdminDeleteBusinessLocation,
  canAdminEditBusinessLocation,
  canAdminSetPrimaryBusinessLocation,
} from './admin-catalog-rbac';

const CITY_URALSK = 'city-uralsk';
const CITY_AKTOBE = 'city-aktobe';

describe('Admin BusinessLocation UI RBAC (AOP.7H.1 cross-city)', () => {
  const primaryAktobe = { cityId: CITY_AKTOBE, isPrimary: true };
  const secondaryUralsk = { cityId: CITY_URALSK, isPrimary: false };

  const uralskCtx = {
    managedCityId: CITY_URALSK,
    managedCitySlug: 'uralsk',
    businessPrimaryCitySlug: 'aktobe',
  };

  const aktobeCtx = {
    managedCityId: CITY_AKTOBE,
    managedCitySlug: 'aktobe',
    businessPrimaryCitySlug: 'aktobe',
  };

  describe('CITY_ADMIN Uralsk — PRIMARY Aktobe, secondary Uralsk', () => {
    it('may edit Uralsk branch only', () => {
      expect(canAdminEditBusinessLocation('CITY_ADMIN', secondaryUralsk, uralskCtx)).toBe(true);
      expect(canAdminEditBusinessLocation('CITY_ADMIN', primaryAktobe, uralskCtx)).toBe(false);
    });

    it('cannot delete Aktobe or set Uralsk primary', () => {
      expect(canAdminDeleteBusinessLocation('CITY_ADMIN', CITY_AKTOBE, CITY_URALSK)).toBe(false);
      expect(canAdminDeleteBusinessLocation('CITY_ADMIN', CITY_URALSK, CITY_URALSK)).toBe(true);
      expect(
        canAdminSetPrimaryBusinessLocation('CITY_ADMIN', CITY_URALSK, uralskCtx),
      ).toBe(false);
    });

    it('add-location city list is Uralsk only', () => {
      const cities = [
        { id: CITY_URALSK, nameRu: 'Uralsk' },
        { id: CITY_AKTOBE, nameRu: 'Aktobe' },
      ];
      expect(adminBusinessLocationCityOptions('CITY_ADMIN', cities, CITY_URALSK)).toEqual([
        { id: CITY_URALSK, nameRu: 'Uralsk' },
      ]);
    });
  });

  describe('CITY_ADMIN Aktobe — mirror', () => {
    it('may edit Aktobe branch only', () => {
      expect(canAdminEditBusinessLocation('CITY_ADMIN', primaryAktobe, aktobeCtx)).toBe(true);
      expect(canAdminEditBusinessLocation('CITY_ADMIN', secondaryUralsk, aktobeCtx)).toBe(false);
    });

    it('cannot delete Uralsk or cross-city set-primary on Uralsk', () => {
      expect(canAdminDeleteBusinessLocation('CITY_ADMIN', CITY_URALSK, CITY_AKTOBE)).toBe(false);
      expect(
        canAdminSetPrimaryBusinessLocation('CITY_ADMIN', CITY_URALSK, aktobeCtx),
      ).toBe(false);
    });
  });

  describe('ADMIN / SUPER_ADMIN', () => {
    const adminCtx = {
      managedCityId: null,
      managedCitySlug: undefined,
      businessPrimaryCitySlug: 'aktobe',
    };

    it('ADMIN may edit both branches', () => {
      expect(canAdminEditBusinessLocation('ADMIN', primaryAktobe, adminCtx)).toBe(true);
      expect(canAdminEditBusinessLocation('ADMIN', secondaryUralsk, adminCtx)).toBe(true);
    });

    it('SUPER_ADMIN may edit both branches', () => {
      expect(canAdminEditBusinessLocation('SUPER_ADMIN', primaryAktobe, adminCtx)).toBe(true);
      expect(canAdminEditBusinessLocation('SUPER_ADMIN', secondaryUralsk, adminCtx)).toBe(true);
    });
  });
});
