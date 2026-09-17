import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GeocodingAutocompleteParams,
  GeocodingProvider,
  GeocodingReverseParams,
  GeocodingSuggestion,
} from './geocoding.types';

type MapTilerFeature = {
  id?: string;
  text?: string;
  place_name?: string;
  place_type?: string[];
  center?: [number, number];
  geometry?: { type?: string; coordinates?: [number, number] };
};

type MapTilerResponse = {
  features?: MapTilerFeature[];
};

@Injectable()
export class MapTilerGeocodingProvider implements GeocodingProvider {
  constructor(private readonly config: ConfigService) {}

  async autocomplete(params: GeocodingAutocompleteParams): Promise<GeocodingSuggestion[]> {
    const key = this.requireApiKey();
    const encodedQuery = encodeURIComponent(params.query.trim());
    const search = new URLSearchParams({
      key,
      language: params.language,
      country: params.countryCode.toLowerCase(),
      limit: String(params.limit ?? 8),
    });
    if (params.proximityLat != null && params.proximityLng != null) {
      search.set('proximity', `${params.proximityLng},${params.proximityLat}`);
    }

    const url = `https://api.maptiler.com/geocoding/${encodedQuery}.json?${search}`;
    const data = await this.fetchJson(url);
    return (data.features ?? []).map((feature) => this.toSuggestion(feature)).filter(Boolean) as GeocodingSuggestion[];
  }

  async reverse(params: GeocodingReverseParams): Promise<GeocodingSuggestion | null> {
    const key = this.requireApiKey();
    const search = new URLSearchParams({
      key,
      language: params.language,
    });
    const url = `https://api.maptiler.com/geocoding/${params.longitude},${params.latitude}.json?${search}`;
    const data = await this.fetchJson(url);
    const feature = data.features?.[0];
    if (!feature) {
      return null;
    }
    return this.toSuggestion(feature);
  }

  private requireApiKey(): string {
    const key = this.config.get<string>('app.maptilerApiKey')?.trim();
    if (!key) {
      throw new ServiceUnavailableException('Geocoding provider is not configured');
    }
    return key;
  }

  private async fetchJson(url: string): Promise<MapTilerResponse> {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new ServiceUnavailableException('Geocoding provider request failed');
    }
    return (await response.json()) as MapTilerResponse;
  }

  private toSuggestion(feature: MapTilerFeature): GeocodingSuggestion | null {
    const coords = feature.center ?? feature.geometry?.coordinates;
    if (!coords || coords.length < 2) {
      return null;
    }
    const [lng, lat] = coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    const label = feature.place_name ?? feature.text ?? `${lat}, ${lng}`;
    return {
      id: feature.id ?? label,
      label,
      address: label,
      latitude: lat,
      longitude: lng,
      placeType: feature.place_type?.[0],
    };
  }
}
