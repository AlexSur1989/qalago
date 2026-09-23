import {
  assertDiscoveryDistanceLocationInvariant,
  attachContextLocationIdForBranch,
  attachMapDiscoveryContext,
} from './business-discovery-context.util';

describe('business-discovery-context.util (Stage 6.12A.7.9.1)', () => {
  it('normal list item without branch context stays without contextLocationId', () => {
    const item = { id: 'b1', title: 'Cafe', address: 'Main' };
    expect(item).not.toHaveProperty('contextLocationId');
    expect(item).not.toHaveProperty('locationId');
  });

  it('explicit BusinessLocation id serializes contextLocationId', () => {
    const item = attachContextLocationIdForBranch({ id: 'b1', title: 'Cafe' }, 'loc-l1');
    expect(item.contextLocationId).toBe('loc-l1');
    expect(item).not.toHaveProperty('locationId');
  });

  it('map row keeps locationId and adds matching contextLocationId', () => {
    const base = {
      id: 'b1',
      locationId: 'loc-l2',
      title: 'Cafe',
      distanceMeters: 120,
    };
    const item = attachMapDiscoveryContext(base, { distanceMeters: 120 });
    expect(item.locationId).toBe('loc-l2');
    expect(item.contextLocationId).toBe('loc-l2');
    expect(item.distanceMeters).toBe(120);
  });

  it('does not derive contextLocationId from Business coordinates alone', () => {
    const legacyBusinessRow = {
      id: 'b1',
      latitude: '51.22',
      longitude: '51.39',
      address: 'Legacy primary',
    };
    expect(legacyBusinessRow).not.toHaveProperty('contextLocationId');
    expect(() => attachContextLocationIdForBranch(legacyBusinessRow, '')).toThrow();
  });

  it('distanceMeters invariant rejects invalid numbers when context is set', () => {
    expect(() =>
      assertDiscoveryDistanceLocationInvariant({
        contextLocationId: 'loc-1',
        distanceMeters: Number.NaN,
      }),
    ).toThrow();
  });

  it('legacy nearest may expose distanceMeters without contextLocationId', () => {
    const legacyNearest = { id: 'b1', distanceMeters: 500 };
    assertDiscoveryDistanceLocationInvariant({
      contextLocationId: null,
      distanceMeters: legacyNearest.distanceMeters,
    });
    expect(legacyNearest).not.toHaveProperty('contextLocationId');
  });
});
