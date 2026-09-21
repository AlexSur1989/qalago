import { describe, expect, it } from 'vitest';
import { adminBusinessLocationsApi } from './admin-business-locations-api';

describe('adminBusinessLocationsApi', () => {
  it('exposes listBusinessLocations for staff token calls', () => {
    expect(typeof adminBusinessLocationsApi.listBusinessLocations).toBe('function');
  });
});
