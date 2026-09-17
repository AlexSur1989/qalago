const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api/v1';

export type GeocodingSuggestion = {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  placeType?: string;
};

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
  query: { lat: number; lng: number; language: 'ru' | 'kk' },
) {
  return geocodingFetch<GeocodingSuggestion | null>(token, '/geocoding/reverse', {
    lat: String(query.lat),
    lng: String(query.lng),
    language: query.language,
  });
}
