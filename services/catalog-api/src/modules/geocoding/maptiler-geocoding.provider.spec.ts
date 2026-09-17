import { ConfigService } from '@nestjs/config';
import { MapTilerGeocodingProvider } from './maptiler-geocoding.provider';

describe('MapTilerGeocodingProvider', () => {
  const config = {
    get: jest.fn((key: string) => (key === 'app.maptilerApiKey' ? 'test-key' : undefined)),
  } as unknown as ConfigService;

  let provider: MapTilerGeocodingProvider;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
    provider = new MapTilerGeocodingProvider(config);
  });

  it('maps autocomplete features to suggestions', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            id: 'place.1',
            place_name: 'Abay 10, Uralsk',
            center: [51.3865, 51.2278],
            place_type: ['address'],
          },
        ],
      }),
    });

    const results = await provider.autocomplete({
      query: 'Abay 10',
      language: 'ru',
      countryCode: 'kz',
      proximityLat: 51.22,
      proximityLng: 51.38,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('api.maptiler.com/geocoding/'),
      expect.any(Object),
    );
    expect(results).toEqual([
      expect.objectContaining({
        id: 'place.1',
        latitude: 51.2278,
        longitude: 51.3865,
        label: 'Abay 10, Uralsk',
      }),
    ]);
  });

  it('returns null when reverse geocoding has no features', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ features: [] }),
    });

    const result = await provider.reverse({
      latitude: 51.2278,
      longitude: 51.3865,
      language: 'ru',
    });

    expect(result).toBeNull();
  });
});
