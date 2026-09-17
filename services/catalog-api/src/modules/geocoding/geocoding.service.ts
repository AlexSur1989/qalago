import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CityScopeService } from '../../common/services/city-scope.service';
import {
  assertCoordinateWithinCityGeocodingBounds,
  filterGeocodingSuggestionsByBounds,
  parseCityGeocodingBounds,
} from '../../common/utils/city-geocoding-bounds.util';
import { assertValidBusinessCoordinatePair } from '../../common/utils/business-coordinates.util';
import { PrismaService } from '../../prisma/prisma.service';
import { GeocodingAutocompleteQueryDto, GeocodingReverseQueryDto } from './dto/geocoding.dto';
import { GEOCODING_PROVIDER, GeocodingProvider, GeocodingSuggestion } from './geocoding.types';

const cityBoundsSelect = {
  centerLat: true,
  centerLng: true,
  geocodingMinLat: true,
  geocodingMaxLat: true,
  geocodingMinLng: true,
  geocodingMaxLng: true,
} as const;

@Injectable()
export class GeocodingService {
  constructor(
    @Inject(GEOCODING_PROVIDER) private readonly provider: GeocodingProvider,
    private readonly cityScope: CityScopeService,
    private readonly prisma: PrismaService,
  ) {}

  async autocomplete(query: GeocodingAutocompleteQueryDto): Promise<GeocodingSuggestion[]> {
    const language = query.language ?? 'ru';
    const { bounds, proximityLat, proximityLng } = await this.resolveCityGeocodingContext(query);

    const raw = await this.provider.autocomplete({
      query: query.q,
      language,
      countryCode: 'kz',
      proximityLat,
      proximityLng,
      bboxMinLng: bounds?.minLng,
      bboxMinLat: bounds?.minLat,
      bboxMaxLng: bounds?.maxLng,
      bboxMaxLat: bounds?.maxLat,
      limit: 8,
    });

    if (!bounds) {
      return raw;
    }
    return filterGeocodingSuggestionsByBounds(raw, bounds);
  }

  async reverse(query: GeocodingReverseQueryDto): Promise<GeocodingSuggestion | null> {
    assertValidBusinessCoordinatePair(query.lat, query.lng, 'Invalid coordinates for reverse geocoding');
    const { bounds } = await this.resolveCityGeocodingContext(query);
    assertCoordinateWithinCityGeocodingBounds(bounds, query.lat, query.lng);

    return this.provider.reverse({
      latitude: query.lat,
      longitude: query.lng,
      language: query.language ?? 'ru',
    });
  }

  private async resolveCityGeocodingContext(query: {
    cityId?: string;
    citySlug?: string;
  }) {
    if (!query.cityId && !query.citySlug) {
      throw new BadRequestException('citySlug or cityId is required for geocoding');
    }

    const cityId = await this.cityScope.resolveCityId({
      cityId: query.cityId,
      citySlug: query.citySlug,
    });
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      select: cityBoundsSelect,
    });
    if (!city) {
      throw new BadRequestException('City not found');
    }

    const bounds = parseCityGeocodingBounds(city);
    if (!bounds) {
      throw new BadRequestException('City geocoding bounds are not configured');
    }

    let proximityLat: number | undefined;
    let proximityLng: number | undefined;
    if (city.centerLat != null && city.centerLng != null) {
      proximityLat = Number(city.centerLat);
      proximityLng = Number(city.centerLng);
    }

    return { bounds, proximityLat, proximityLng, cityId };
  }
}
