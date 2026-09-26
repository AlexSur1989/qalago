import { Prisma } from '@prisma/client';
import {
  businessCompatibilityUpdateFromPrimaryLocation,
  businessLegacyFullMirrorUpdateFromPrimaryLocation,
  primaryLocationContactUpdateDataFromBusiness,
} from './business-primary-location.util';

describe('business-primary-location.util (A.9.4.4C1)', () => {
  const snapshot = {
    id: 'biz-1',
    cityId: 'city-1',
    address: 'BL addr',
    latitude: 51.1 as never,
    longitude: 51.2 as never,
    locationSource: 'GEOCODED' as never,
    workHours: null,
    phone: '+7000',
    whatsapp: '+7111',
    instagram: '@x',
    website: 'https://x.kz',
  };

  it('compatibility update excludes geo mirror fields', () => {
    const data = businessCompatibilityUpdateFromPrimaryLocation(snapshot);
    expect(data).toEqual(
      expect.objectContaining({
        city: { connect: { id: 'city-1' } },
        phone: '+7000',
        whatsapp: '+7111',
      }),
    );
    expect(data).not.toHaveProperty('address');
    expect(data).not.toHaveProperty('latitude');
    expect(data).not.toHaveProperty('longitude');
    expect(data).not.toHaveProperty('locationSource');
  });

  it('legacy full mirror retains geo for repair tooling', () => {
    const data = businessLegacyFullMirrorUpdateFromPrimaryLocation(snapshot);
    expect(data.address).toBe('BL addr');
    expect(data.latitude).toBe(51.1);
    expect(data.longitude).toBe(51.2);
    expect(data.locationSource).toBe('GEOCODED');
  });

  it('contact sync from Business to BL excludes geo fields', () => {
    const staleBusiness = {
      address: 'STALE mirror',
      latitude: 99 as never,
      longitude: 88 as never,
      locationSource: 'GEOCODED' as never,
      phone: '+7999',
      whatsapp: null,
      instagram: null,
      website: null,
      workHours: null,
    };
    const data = primaryLocationContactUpdateDataFromBusiness(staleBusiness);
    expect(data).toEqual({
      phone: '+7999',
      whatsapp: null,
      instagram: null,
      website: null,
      workHours: Prisma.JsonNull,
    });
    expect(data).not.toHaveProperty('address');
    expect(data).not.toHaveProperty('latitude');
  });
});
