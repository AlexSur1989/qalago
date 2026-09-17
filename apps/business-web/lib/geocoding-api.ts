const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export type GeocodingSuggestion = {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  placeType?: string;
};

export class GeocodingOutOfCityError extends Error {
  constructor() {
    super('Geocoding out of city bounds');
    this.name = 'GeocodingOutOfCityError';
  }
}

async function geocodingFetch<T>(
  token: string,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${API_BASE}${path}?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 400) {
      const body = (await res.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;
      const message = body?.message;
      const text = Array.isArray(message) ? message.join(' ') : message ?? '';
      if (text.includes('outside the selected city geocoding area')) {
        throw new GeocodingOutOfCityError();
      }
    }
    throw new Error(`Geocoding failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function geocodingAutocomplete(
  token: string,
  query: {
    q: string;
    citySlug: string;
    language: 'ru' | 'kk';
  },
) {
  return geocodingFetch<GeocodingSuggestion[]>(token, '/geocoding/autocomplete', {
    q: query.q,
    citySlug: query.citySlug,
    language: query.language,
  });
}

export function geocodingReverse(
  token: string,
  query: { lat: number; lng: number; citySlug: string; language: 'ru' | 'kk' },
) {
  return geocodingFetch<GeocodingSuggestion | null>(token, '/geocoding/reverse', {
    lat: String(query.lat),
    lng: String(query.lng),
    citySlug: query.citySlug,
    language: query.language,
  });
}
