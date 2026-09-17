import {
  filterGeocodingSuggestionsByBounds,
  isCoordinateWithinCityGeocodingBounds,
  parseCityGeocodingBounds,
} from './city-geocoding-bounds.util';

const uralskBounds = {
  geocodingMinLat: 51.05,
  geocodingMaxLat: 51.35,
  geocodingMinLng: 51.05,
  geocodingMaxLng: 51.65,
};

describe('city-geocoding-bounds.util', () => {
  it('parses city bounds from decimal fields', () => {
    const bounds = parseCityGeocodingBounds(uralskBounds);
    expect(bounds).toEqual({
      minLat: 51.05,
      maxLat: 51.35,
      minLng: 51.05,
      maxLng: 51.65,
    });
  });

  it('filters mixed provider results to in-city only', () => {
    const bounds = parseCityGeocodingBounds(uralskBounds)!;
    const filtered = filterGeocodingSuggestionsByBounds(
      [
        {
          id: 'u1',
          label: 'Uralsk',
          address: 'Uralsk',
          latitude: 51.220417,
          longitude: 51.390364,
        },
        {
          id: 's1',
          label: 'Shymkent region',
          address: 'Lenger',
          latitude: 42.18,
          longitude: 69.88,
        },
        {
          id: 'a1',
          label: 'Aktobe region',
          address: 'Aktobe',
          latitude: 50.28,
          longitude: 57.17,
        },
      ],
      bounds,
    );
    expect(filtered.map((s) => s.id)).toEqual(['u1']);
  });

  it('returns empty when all suggestions are outside city', () => {
    const bounds = parseCityGeocodingBounds(uralskBounds)!;
    const filtered = filterGeocodingSuggestionsByBounds(
      [
        {
          id: 's1',
          label: 'Lenger',
          address: 'Lenger',
          latitude: 42.18,
          longitude: 69.88,
        },
      ],
      bounds,
    );
    expect(filtered).toEqual([]);
  });

  it('detects coordinate inside/outside bounds', () => {
    const bounds = parseCityGeocodingBounds(uralskBounds)!;
    expect(isCoordinateWithinCityGeocodingBounds(bounds, 51.22, 51.39)).toBe(true);
    expect(isCoordinateWithinCityGeocodingBounds(bounds, 42.34, 69.59)).toBe(false);
  });
});
