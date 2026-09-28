import { describe, expect, it } from 'vitest';
import { buildAdminLocationPayload } from './admin-catalog-location-form';

describe('buildAdminLocationPayload (AOP.3)', () => {
  it('includes only allowlisted BusinessLocation fields', () => {
    const payload = buildAdminLocationPayload({
      cityId: 'city-1',
      address: '  Street 1  ',
      latitude: 51.1,
      longitude: 51.2,
      phone: '+77001234567',
    });
    expect(payload).toEqual({
      cityId: 'city-1',
      address: 'Street 1',
      latitude: 51.1,
      longitude: 51.2,
      phone: '+77001234567',
    });
    expect(payload).not.toHaveProperty('businessId');
    expect(payload).not.toHaveProperty('isPrimary');
    expect(payload).not.toHaveProperty('ownerId');
  });

  it('omits isPrimary and businessId from output', () => {
    const payload = buildAdminLocationPayload({
      cityId: 'c',
      address: 'a',
    });
    expect(Object.keys(payload).sort()).toEqual(['address', 'cityId']);
  });
});
