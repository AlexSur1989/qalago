import { Prisma } from '@prisma/client';
import {
  businessCompatibilityUpdateFromPrimaryLocation,
  primaryLocationContactUpdateDataFromBusiness,
} from './business-primary-location.util';

describe('business-primary-location.util (A.9.4.4C1/C4/5D1)', () => {
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

  it('compatibility update syncs contacts only (no geo or parent city mirror)', () => {
    const data = businessCompatibilityUpdateFromPrimaryLocation(snapshot);
    expect(data).toEqual(
      expect.objectContaining({
        phone: '+7000',
        whatsapp: '+7111',
        instagram: '@x',
        website: 'https://x.kz',
      }),
    );
    expect(data).not.toHaveProperty('city');
    expect(data).not.toHaveProperty('address');
    expect(data).not.toHaveProperty('latitude');
    expect(data).not.toHaveProperty('longitude');
    expect(data).not.toHaveProperty('locationSource');
  });

  it('contact sync from Business to BL excludes geo fields', () => {
    const data = primaryLocationContactUpdateDataFromBusiness({
      phone: '+7999',
      whatsapp: null,
      instagram: null,
      website: null,
      workHours: null,
    });
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
