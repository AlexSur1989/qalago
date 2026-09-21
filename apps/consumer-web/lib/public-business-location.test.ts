import { describe, expect, it } from 'vitest';
import {
  cityNameForLocale,
  parsePublicBusinessLocationsResponse,
  type PublicBusinessLocation,
} from './public-business-location';

describe('public-business-location', () => {
  it('parses items array', () => {
    const items = parsePublicBusinessLocationsResponse({
      items: [
        {
          id: 'bl1',
          businessId: 'b1',
          cityId: 'c1',
          city: { slug: 'uralsk', nameRu: 'Уральск', nameKk: 'Орал' },
          address: 'A',
          latitude: null,
          longitude: null,
          workHours: null,
          phone: null,
          whatsapp: null,
          instagram: null,
          website: null,
          isPrimary: true,
        },
      ],
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.isPrimary).toBe(true);
  });

  it('cross-city secondary keeps isPrimary false', () => {
    const branch: PublicBusinessLocation = {
      id: 'bl2',
      businessId: 'b1',
      cityId: 'c2',
      city: { slug: 'aktobe', nameRu: 'Актобе', nameKk: 'Ақтөбе' },
      address: 'Branch',
      latitude: null,
      longitude: null,
      workHours: null,
      phone: null,
      whatsapp: null,
      instagram: null,
      website: null,
      isPrimary: false,
    };
    expect(cityNameForLocale('ru', branch.city)).toBe('Актобе');
    expect(branch.isPrimary).toBe(false);
  });
});
