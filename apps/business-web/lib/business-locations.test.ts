import { describe, expect, it } from 'vitest';
import { buildCreateBusinessLocationPayload } from './presentation';

describe('buildCreateBusinessLocationPayload', () => {
  it('omits businessId and isPrimary', () => {
    const body = buildCreateBusinessLocationPayload({
      cityId: 'city-aktobe',
      address: ' Branch addr ',
      phone: '+77001234567',
    });
    expect(body).toEqual({
      cityId: 'city-aktobe',
      address: 'Branch addr',
      phone: '+77001234567',
    });
    expect(body).not.toHaveProperty('businessId');
    expect(body).not.toHaveProperty('isPrimary');
    expect(body).not.toHaveProperty('location');
  });

  it('includes coordinates and locationSource when both coords set', () => {
    const body = buildCreateBusinessLocationPayload({
      cityId: 'city-1',
      address: 'A',
      latitude: 51.2,
      longitude: 51.3,
      locationSource: 'GEOCODED',
    });
    expect(body.latitude).toBe(51.2);
    expect(body.longitude).toBe(51.3);
    expect(body.locationSource).toBe('GEOCODED');
  });
});
