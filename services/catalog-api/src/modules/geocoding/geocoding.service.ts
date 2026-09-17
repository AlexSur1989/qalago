import { Inject, Injectable } from '@nestjs/common';
import { CityScopeService } from '../../common/services/city-scope.service';
import { assertValidBusinessCoordinatePair } from '../../common/utils/business-coordinates.util';
import { PrismaService } from '../../prisma/prisma.service';
import { GeocodingAutocompleteQueryDto, GeocodingReverseQueryDto } from './dto/geocoding.dto';
import { GEOCODING_PROVIDER, GeocodingProvider, GeocodingSuggestion } from './geocoding.types';

@Injectable()
export class GeocodingService {
  constructor(
    @Inject(GEOCODING_PROVIDER) private readonly provider: GeocodingProvider,
    private readonly cityScope: CityScopeService,
    private readonly prisma: PrismaService,
  ) {}

  async autocomplete(query: GeocodingAutocompleteQueryDto): Promise<GeocodingSuggestion[]> {
    const language = query.language ?? 'ru';
    let proximityLat: number | undefined;
    let proximityLng: number | undefined;

    if (query.cityId || query.citySlug) {
      const cityId = await this.cityScope.resolveCityId({
        cityId: query.cityId,
        citySlug: query.citySlug,
      });
      const city = await this.prisma.city.findUnique({
        where: { id: cityId },
        select: { centerLat: true, centerLng: true },
      });
      if (city?.centerLat != null && city.centerLng != null) {
        proximityLat = Number(city.centerLat);
        proximityLng = Number(city.centerLng);
      }
    }

    return this.provider.autocomplete({
      query: query.q,
      language,
      countryCode: 'kz',
      proximityLat,
      proximityLng,
      limit: 8,
    });
  }

  async reverse(query: GeocodingReverseQueryDto): Promise<GeocodingSuggestion | null> {
    assertValidBusinessCoordinatePair(query.lat, query.lng, 'Invalid coordinates for reverse geocoding');
    return this.provider.reverse({
      latitude: query.lat,
      longitude: query.lng,
      language: query.language ?? 'ru',
    });
  }

}
