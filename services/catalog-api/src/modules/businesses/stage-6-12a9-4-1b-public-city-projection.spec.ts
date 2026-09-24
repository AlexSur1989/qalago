import type { BusinessLocation } from '@prisma/client';
import { projectPublicPhysicalReadFields } from './business-physical-read-normalization.util';

describe('Stage 6.12A.9.4.1B public cityId projection', () => {
  const cityA = 'city-a';
  const cityB = 'city-b';
  const business = {
    cityId: cityA,
    address: 'Home A',
    latitude: 1,
    longitude: 2,
    phone: '+1',
    whatsapp: null,
    instagram: null,
    website: null,
    workHours: null,
  };
  const locations = [
    {
      id: 'l1',
      businessId: 'b1',
      cityId: cityA,
      address: 'Primary A',
      latitude: 1,
      longitude: 2,
      phone: '+1',
      whatsapp: null,
      instagram: null,
      website: null,
      workHours: null,
      isPrimary: true,
      createdAt: new Date('2020-01-01'),
    },
    {
      id: 'l2',
      businessId: 'b1',
      cityId: cityB,
      address: 'Secondary B',
      latitude: 3,
      longitude: 4,
      phone: '+2',
      whatsapp: null,
      instagram: null,
      website: null,
      workHours: null,
      isPrimary: false,
      createdAt: new Date('2020-02-01'),
    },
  ] as unknown as BusinessLocation[];

  it('contextLocationId L2 → cityId B and matching address', () => {
    const projection = projectPublicPhysicalReadFields(business, locations, 'l2');
    expect(projection.cityId).toBe(cityB);
    expect(projection.address).toBe('Secondary B');
  });

  it('no context → primary cityId A', () => {
    const projection = projectPublicPhysicalReadFields(business, locations, undefined);
    expect(projection.cityId).toBe(cityA);
    expect(projection.address).toBe('Primary A');
  });
});
