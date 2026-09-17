import { BadRequestException } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { GeocodingProvider } from './geocoding.types';

describe('GeocodingService city bounds', () => {
  const uralskCity = {
    centerLat: 51.2278,
    centerLng: 51.3865,
    geocodingMinLat: 51.05,
    geocodingMaxLat: 51.35,
    geocodingMinLng: 51.05,
    geocodingMaxLng: 51.65,
  };

  const provider: GeocodingProvider = {
    autocomplete: jest.fn(),
    reverse: jest.fn(),
  };

  const cityScope = {
    resolveCityId: jest.fn().mockResolvedValue('city-uralsk'),
  };

  const prisma = {
    city: {
      findUnique: jest.fn().mockResolvedValue(uralskCity),
    },
  };

  let service: GeocodingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GeocodingService(
      provider,
      cityScope as never,
      prisma as never,
    );
  });

  it('filters autocomplete to in-city results only (regression KK Abay case)', async () => {
    (provider.autocomplete as jest.Mock).mockResolvedValue([
      {
        id: 'u1',
        label: 'Uralsk Eurasia',
        address: 'Uralsk',
        latitude: 51.220417,
        longitude: 51.390364,
      },
      {
        id: 'lenger',
        label: 'Lenger',
        address: 'Lenger',
        latitude: 42.18,
        longitude: 69.88,
      },
    ]);

    const results = await service.autocomplete({
      q: 'Абай 1',
      citySlug: 'uralsk',
      language: 'kk',
    });

    expect(provider.autocomplete).toHaveBeenCalledWith(
      expect.objectContaining({
        countryCode: 'kz',
        language: 'kk',
        bboxMinLng: 51.05,
        bboxMinLat: 51.05,
        bboxMaxLng: 51.65,
        bboxMaxLat: 51.35,
      }),
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('u1');
  });

  it('returns empty list when provider only returns out-of-city results', async () => {
    (provider.autocomplete as jest.Mock).mockResolvedValue([
      {
        id: 'lenger',
        label: 'Lenger',
        address: 'Lenger',
        latitude: 42.18,
        longitude: 69.88,
      },
    ]);

    const results = await service.autocomplete({
      q: 'Абай 1',
      citySlug: 'uralsk',
      language: 'kk',
    });
    expect(results).toEqual([]);
  });

  it('rejects reverse geocoding outside city bounds', async () => {
    await expect(
      service.reverse({
        lat: 42.34,
        lng: 69.59,
        citySlug: 'uralsk',
        language: 'ru',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(provider.reverse).not.toHaveBeenCalled();
  });
});
