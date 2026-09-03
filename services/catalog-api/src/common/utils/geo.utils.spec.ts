import { haversineMeters } from './geo.utils';

describe('haversineMeters', () => {
  it('returns ~0 for identical coordinates', () => {
    expect(haversineMeters(51.23, 51.38, 51.23, 51.38)).toBeCloseTo(0, 0);
  });

  it('computes a plausible city-scale distance', () => {
    const meters = haversineMeters(51.2278, 51.3865, 51.23, 51.38);
    expect(meters).toBeGreaterThan(100);
    expect(meters).toBeLessThan(5_000);
  });
});
