export type PublicBusinessLocationCity = {
  slug: string;
  nameRu: string;
  nameKk?: string | null;
};

export type PublicBusinessLocation = {
  id: string;
  businessId: string;
  cityId: string;
  city: PublicBusinessLocationCity;
  address: string;
  latitude: number | null;
  longitude: number | null;
  workHours: Record<string, string> | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  isPrimary: boolean;
};

export type PublicBusinessLocationsResponse = {
  items: PublicBusinessLocation[];
};

export function parsePublicBusinessLocationsResponse(
  raw: unknown,
): PublicBusinessLocation[] {
  const data = raw as PublicBusinessLocationsResponse;
  return Array.isArray(data?.items) ? data.items : [];
}

export function cityNameForLocale(
  locale: 'ru' | 'kk',
  city: PublicBusinessLocationCity,
): string {
  if (locale === 'kk') {
    const kk = city.nameKk?.trim();
    if (kk) return kk;
  }
  return city.nameRu;
}
