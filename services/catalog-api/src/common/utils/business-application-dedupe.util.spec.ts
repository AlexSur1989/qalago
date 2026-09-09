import {
  buildApplicationDedupeKey,
  businessMatchesApplicationDedupe,
  normalizeApplicationText,
} from './business-application-dedupe.util';

describe('business-application-dedupe.util', () => {
  it('normalizes whitespace and case', () => {
    expect(normalizeApplicationText('  Cafe   Sultan  ')).toBe('cafe sultan');
  });

  it('builds stable dedupe key', () => {
    const a = buildApplicationDedupeKey('city-1', 'Cafe Sultan', 'Street 1');
    const b = buildApplicationDedupeKey('city-1', '  cafe   sultan ', ' street 1 ');
    expect(a).toBe(b);
  });

  it('detects exact business duplicate in same city', () => {
    expect(
      businessMatchesApplicationDedupe(
        { cityId: 'c1', title: 'Cafe', address: 'Abay 1' },
        'c1',
        'cafe',
        'abay 1',
      ),
    ).toBe(true);
    expect(
      businessMatchesApplicationDedupe(
        { cityId: 'c1', title: 'Cafe', address: 'Abay 1' },
        'c2',
        'cafe',
        'abay 1',
      ),
    ).toBe(false);
  });
});
