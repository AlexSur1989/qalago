import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertCoordinateWithinCityGeocodingBounds,
  parseCityGeocodingBounds,
} from './city-geocoding-bounds.util';

export async function assertBusinessCoordinatesWithinCity(
  prisma: PrismaService,
  cityId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  const city = await prisma.city.findUnique({
    where: { id: cityId },
    select: {
      geocodingMinLat: true,
      geocodingMaxLat: true,
      geocodingMinLng: true,
      geocodingMaxLng: true,
    },
  });
  const bounds = parseCityGeocodingBounds(city);
  if (!bounds) {
    throw new BadRequestException('City geocoding bounds are not configured');
  }
  assertCoordinateWithinCityGeocodingBounds(bounds, latitude, longitude);
}
