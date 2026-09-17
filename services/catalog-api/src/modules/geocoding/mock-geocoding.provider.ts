import { Injectable } from '@nestjs/common';
import {
  GeocodingAutocompleteParams,
  GeocodingProvider,
  GeocodingReverseParams,
  GeocodingSuggestion,
} from './geocoding.types';

@Injectable()
export class MockGeocodingProvider implements GeocodingProvider {
  async autocomplete(params: GeocodingAutocompleteParams): Promise<GeocodingSuggestion[]> {
    const q = params.query.trim().toLowerCase();
    if (q.length < 2) {
      return [];
    }

    const baseLat = params.proximityLat ?? 51.2278;
    const baseLng = params.proximityLng ?? 51.3865;

    return [
      {
        id: 'mock:1',
        label: `${params.query}, mock street`,
        address: `${params.query}, mock street`,
        latitude: baseLat + 0.001,
        longitude: baseLng + 0.001,
        placeType: 'address',
      },
    ];
  }

  async reverse(params: GeocodingReverseParams): Promise<GeocodingSuggestion | null> {
    return {
      id: `mock:reverse:${params.latitude},${params.longitude}`,
      label: `Mock address (${params.latitude.toFixed(4)}, ${params.longitude.toFixed(4)})`,
      address: `Mock address (${params.latitude.toFixed(4)}, ${params.longitude.toFixed(4)})`,
      latitude: params.latitude,
      longitude: params.longitude,
      placeType: 'address',
    };
  }
}
