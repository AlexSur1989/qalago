import {
  buildApplicationDedupeKey,
  businessLocationMatchesApplicationDedupe,
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

  it('detects duplicate via primary branch address in application city', () => {
    expect(
      businessLocationMatchesApplicationDedupe(
        { cityId: 'city-b', address: 'Branch B St 1' },
        'Cafe Brand',
        'city-b',
        'cafe brand',
        'branch b st 1',
      ),
    ).toBe(true);
  });

  it('detects duplicate via secondary branch in application city (not parent home city)', () => {
    expect(
      businessLocationMatchesApplicationDedupe(
        { cityId: 'city-b', address: 'Secondary 9' },
        'Cafe Brand',
        'city-b',
        'Cafe Brand',
        'Secondary 9',
      ),
    ).toBe(true);
  });

  it('does not match when only parent Business.cityId would align', () => {
    expect(
      businessLocationMatchesApplicationDedupe(
        { cityId: 'city-a', address: 'Home A' },
        'Cafe Brand',
        'city-b',
        'Cafe Brand',
        'Home A',
      ),
    ).toBe(false);
  });

  it('legacy businessMatchesApplicationDedupe unchanged for compatibility tests', () => {
    expect(
      businessMatchesApplicationDedupe(
        { cityId: 'c1', title: 'Cafe', address: 'Abay 1' },
        'c1',
        'cafe',
        'abay 1',
      ),
    ).toBe(true);
  });
});
