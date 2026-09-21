import type { BusinessLocation, City } from '@prisma/client';
import {
  BusinessLocationResponseDto,
  PublicBusinessLocationResponseDto,
} from './dto/business-location.dto';

type LocationWithCity = BusinessLocation & {
  city: Pick<City, 'slug' | 'nameRu' | 'nameKk'>;
};

export function toBusinessLocationResponse(
  location: BusinessLocation,
): BusinessLocationResponseDto {
  return {
    id: location.id,
    businessId: location.businessId,
    cityId: location.cityId,
    address: location.address,
    latitude: location.latitude != null ? Number(location.latitude) : null,
    longitude: location.longitude != null ? Number(location.longitude) : null,
    locationSource: location.locationSource,
    workHours: (location.workHours as Record<string, string> | null) ?? null,
    phone: location.phone,
    whatsapp: location.whatsapp,
    instagram: location.instagram,
    website: location.website,
    isPrimary: location.isPrimary,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}

export function toPublicBusinessLocationResponse(
  location: LocationWithCity,
): PublicBusinessLocationResponseDto {
  return {
    id: location.id,
    businessId: location.businessId,
    cityId: location.cityId,
    city: {
      slug: location.city.slug,
      nameRu: location.city.nameRu,
      nameKk: location.city.nameKk,
    },
    address: location.address,
    latitude: location.latitude != null ? Number(location.latitude) : null,
    longitude: location.longitude != null ? Number(location.longitude) : null,
    workHours: (location.workHours as Record<string, string> | null) ?? null,
    phone: location.phone,
    whatsapp: location.whatsapp,
    instagram: location.instagram,
    website: location.website,
    isPrimary: location.isPrimary,
  };
}
