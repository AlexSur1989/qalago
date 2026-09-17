export type GeocodingSuggestion = {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  placeType?: string;
};

export interface GeocodingProvider {
  autocomplete(params: GeocodingAutocompleteParams): Promise<GeocodingSuggestion[]>;
  reverse(params: GeocodingReverseParams): Promise<GeocodingSuggestion | null>;
}

export type GeocodingAutocompleteParams = {
  query: string;
  language: 'ru' | 'kk';
  countryCode: string;
  proximityLat?: number;
  proximityLng?: number;
  limit?: number;
};

export type GeocodingReverseParams = {
  latitude: number;
  longitude: number;
  language: 'ru' | 'kk';
};

export const GEOCODING_PROVIDER = Symbol('GEOCODING_PROVIDER');
