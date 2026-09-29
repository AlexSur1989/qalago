import { describe, expect, it } from 'vitest';
import {
  buildPrimaryLocationPhysicalPatch,
  businessLocationStateFromRow,
  findPrimaryBusinessLocation,
} from './owner-primary-location';
import type { BusinessLocationRow } from './api';

const baseRow = (overrides: Partial<BusinessLocationRow>): BusinessLocationRow => ({
  id: 'bl-1',
  businessId: 'b1',
  cityId: 'city-1',
  address: 'Street 1',
  latitude: 51.2,
  longitude: 51.3,
  locationSource: 'GEOCODED',
  workHours: null,
  phone: null,
  whatsapp: null,
  instagram: null,
  website: null,
  isPrimary: false,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('owner-primary-location (BIZ.4)', () => {
  it('findPrimaryBusinessLocation prefers isPrimary', () => {
    const primary = findPrimaryBusinessLocation([
      baseRow({ id: 'bl-2', isPrimary: false }),
      baseRow({ id: 'bl-primary', isPrimary: true }),
    ]);
    expect(primary?.id).toBe('bl-primary');
  });

  it('buildPrimaryLocationPhysicalPatch writes BL-only fields', () => {
    const patch = buildPrimaryLocationPhysicalPatch({
      address: ' Addr ',
      latitude: 51.2,
      longitude: 51.3,
      locationSource: 'MANUALLY_ADJUSTED',
    });
    expect(patch).toEqual({
      address: 'Addr',
      latitude: 51.2,
      longitude: 51.3,
      locationSource: 'MANUALLY_ADJUSTED',
    });
    expect(patch).not.toHaveProperty('title');
    expect(patch).not.toHaveProperty('cityId');
  });

  it('businessLocationStateFromRow maps primary presentation', () => {
    const state = businessLocationStateFromRow(
      baseRow({ address: 'A', locationSource: 'MANUALLY_ADJUSTED' }),
    );
    expect(state.address).toBe('A');
    expect(state.locationSource).toBe('MANUALLY_ADJUSTED');
  });
});
