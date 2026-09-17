import {
  assertValidBusinessCoordinatePair,
  isOptionalBusinessCoordinatePairValid,
  isValidBusinessCoordinatePair,
} from './business-coordinates.util';

describe('business-coordinates.util', () => {
  it('accepts valid Kazakhstan coordinates', () => {
    expect(isValidBusinessCoordinatePair(51.2278, 51.3865)).toBe(true);
  });

  it('rejects null island', () => {
    expect(isValidBusinessCoordinatePair(0, 0)).toBe(false);
  });

  it('rejects out-of-range latitude', () => {
    expect(isValidBusinessCoordinatePair(91, 51)).toBe(false);
    expect(isValidBusinessCoordinatePair(-91, 51)).toBe(false);
  });

  it('rejects out-of-range longitude', () => {
    expect(isValidBusinessCoordinatePair(51, 181)).toBe(false);
    expect(isValidBusinessCoordinatePair(51, -181)).toBe(false);
  });

  it('rejects non-finite values', () => {
    expect(isValidBusinessCoordinatePair(Number.NaN, 51)).toBe(false);
    expect(isValidBusinessCoordinatePair(51, Number.POSITIVE_INFINITY)).toBe(false);
  });

  describe('optional pair', () => {
    it('allows both absent', () => {
      expect(isOptionalBusinessCoordinatePairValid(undefined, undefined)).toBe(true);
      expect(isOptionalBusinessCoordinatePairValid(null, null)).toBe(true);
    });

    it('rejects partial pair', () => {
      expect(isOptionalBusinessCoordinatePairValid(51.2, undefined)).toBe(false);
      expect(isOptionalBusinessCoordinatePairValid(undefined, 51.2)).toBe(false);
    });
  });

  it('assert throws BadRequestException on invalid pair', () => {
    expect(() => assertValidBusinessCoordinatePair(0, 0)).toThrow('Valid latitude and longitude');
  });
});
