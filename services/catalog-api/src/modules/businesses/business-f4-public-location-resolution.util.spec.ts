import type { BusinessLocation } from '@prisma/client';
import {
  assertF4CityMembership,
  F4NoCityMembershipError,
  pickCityDefaultLocationId,
  resolveF4PublicActiveLocation,
} from './business-f4-public-location-resolution.util';

function bl(partial: Partial<BusinessLocation> & Pick<BusinessLocation, 'id' | 'cityId'>): BusinessLocation {
  return {
    businessId: 'biz-1',
    address: 'addr',
    latitude: null,
    longitude: null,
    locationSource: null,
    workHours: null,
    phone: null,
    whatsapp: null,
    instagram: null,
    website: null,
    isPrimary: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...partial,
  } as BusinessLocation;
}

describe('business-f4-public-location-resolution.util', () => {
  const cityU = 'city-uralsk';
  const cityA = 'city-aktobe';

  it('primary in city when no locationId', () => {
    const locations = [
      bl({ id: 'l1', cityId: cityU, isPrimary: true }),
      bl({ id: 'l2', cityId: cityA, isPrimary: false, createdAt: new Date('2024-02-01') }),
    ];
    const result = resolveF4PublicActiveLocation(locations, cityU, undefined);
    expect(result).toEqual({ kind: 'resolved', locationId: 'l1' });
  });

  it('city-default when global primary elsewhere', () => {
    const locations = [
      bl({ id: 'l-primary-a', cityId: cityA, isPrimary: true }),
      bl({ id: 'l-u1', cityId: cityU, isPrimary: false, createdAt: new Date('2024-01-02') }),
      bl({ id: 'l-u2', cityId: cityU, isPrimary: false, createdAt: new Date('2024-01-03') }),
    ];
    const result = resolveF4PublicActiveLocation(locations, cityU, undefined);
    expect(result).toEqual({ kind: 'resolved', locationId: 'l-u1' });
  });

  it('same-city owned locationId', () => {
    const locations = [
      bl({ id: 'l1', cityId: cityU, isPrimary: true }),
      bl({ id: 'l2', cityId: cityU, isPrimary: false }),
    ];
    expect(resolveF4PublicActiveLocation(locations, cityU, 'l2')).toEqual({
      kind: 'resolved',
      locationId: 'l2',
    });
  });

  it('wrong-city owned locationId', () => {
    const locations = [
      bl({ id: 'l1', cityId: cityU, isPrimary: true }),
      bl({ id: 'l2', cityId: cityA, isPrimary: false }),
    ];
    expect(resolveF4PublicActiveLocation(locations, cityU, 'l2')).toEqual({
      kind: 'wrong_city',
      locationId: 'l2',
      actualCityId: cityA,
    });
  });

  it('foreign locationId falls back to city default', () => {
    const locations = [bl({ id: 'l1', cityId: cityU, isPrimary: true })];
    expect(resolveF4PublicActiveLocation(locations, cityU, 'foreign-other-biz')).toEqual({
      kind: 'resolved',
      locationId: 'l1',
    });
  });

  it('invalid locationId falls back to city default', () => {
    const locations = [
      bl({ id: 'l1', cityId: cityU, isPrimary: true }),
      bl({ id: 'l2', cityId: cityU, isPrimary: false }),
    ];
    expect(resolveF4PublicActiveLocation(locations, cityU, '   ')).toEqual({
      kind: 'resolved',
      locationId: 'l1',
    });
  });

  it('no branch in city throws membership error', () => {
    const locations = [bl({ id: 'l-a', cityId: cityA, isPrimary: true })];
    expect(() => resolveF4PublicActiveLocation(locations, cityU, undefined)).toThrow(
      F4NoCityMembershipError,
    );
    expect(() => assertF4CityMembership(locations, cityU)).toThrow(F4NoCityMembershipError);
  });

  it('deterministic pick with multiple same-city locations', () => {
    const locations = [
      bl({ id: 'l-b', cityId: cityU, isPrimary: false, createdAt: new Date('2024-01-10') }),
      bl({ id: 'l-a', cityId: cityU, isPrimary: false, createdAt: new Date('2024-01-05') }),
    ];
    expect(pickCityDefaultLocationId(locations)).toBe('l-a');
  });
});
