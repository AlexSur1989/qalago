import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ListBusinessesQueryDto } from '../../modules/businesses/dto/business.dto';
import {
  MAX_MAP_BBOX_LAT_SPAN_DEGREES,
  MAX_MAP_BBOX_LNG_SPAN_DEGREES,
} from './catalog-geo-query.constants';
import { isFiniteCoordinate } from './business-coordinates.util';
import type { NormalizedMapBbox } from '../../modules/businesses/business-map-query.util';
import { parseMapBboxQuery } from '../../modules/businesses/business-map-query.util';

const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

/** Consumer catalog geo pair (allows 0,0 — valid WGS84; unlike stored business coords). */
export function isOptionalUserGeoCoordinatePairValid(
  latitude: unknown,
  longitude: unknown,
): boolean {
  const hasLat = latitude !== undefined && latitude !== null;
  const hasLng = longitude !== undefined && longitude !== null;
  if (!hasLat && !hasLng) {
    return true;
  }
  if (hasLat !== hasLng) {
    return false;
  }
  if (!isFiniteCoordinate(latitude) || !isFiniteCoordinate(longitude)) {
    return false;
  }
  return (
    latitude >= LAT_MIN &&
    latitude <= LAT_MAX &&
    longitude >= LNG_MIN &&
    longitude <= LNG_MAX
  );
}

export function assertCatalogGeoQuery(query: ListBusinessesQueryDto): NormalizedMapBbox | null {
  if (!isOptionalUserGeoCoordinatePairValid(query.latitude, query.longitude)) {
    throw new BadRequestException(
      'latitude and longitude must be provided together and be finite numbers within valid ranges',
    );
  }

  const hasGeo = query.latitude != null && query.longitude != null;
  if (query.radiusKm != null && !hasGeo) {
    throw new BadRequestException(
      'radiusKm requires latitude and longitude together',
    );
  }

  const bbox = parseMapBboxQuery(query);
  if (bbox != null) {
    assertMapBboxSpanWithinLimits(bbox);
  }

  return bbox;
}

export function assertMapBboxSpanWithinLimits(bbox: NormalizedMapBbox): void {
  const latSpan = bbox.maxLat - bbox.minLat;
  const lngSpan = bbox.maxLng - bbox.minLng;
  if (latSpan > MAX_MAP_BBOX_LAT_SPAN_DEGREES) {
    throw new BadRequestException(
      `Map viewport latitude span exceeds maximum of ${MAX_MAP_BBOX_LAT_SPAN_DEGREES} degrees`,
    );
  }
  if (lngSpan > MAX_MAP_BBOX_LNG_SPAN_DEGREES) {
    throw new BadRequestException(
      `Map viewport longitude span exceeds maximum of ${MAX_MAP_BBOX_LNG_SPAN_DEGREES} degrees`,
    );
  }
}

/**
 * Prisma filter on authoritative BusinessLocation coordinates (post A.9.4.4C4 Business geo retirement).
 */
export function validStoredBusinessLocationCoordinateWhere(): Prisma.BusinessLocationWhereInput {
  return {
    latitude: { not: null, gte: LAT_MIN, lte: LAT_MAX },
    longitude: { not: null, gte: LNG_MIN, lte: LNG_MAX },
    NOT: {
      AND: [{ latitude: 0 }, { longitude: 0 }],
    },
  };
}

/** @deprecated A.9.4.4C4 — Business mirror lat/lng columns removed; use validStoredBusinessLocationCoordinateWhere. */
export function validStoredBusinessCoordinateWhere(): never {
  throw new Error(
    'validStoredBusinessCoordinateWhere retired in A.9.4.4C4; use validStoredBusinessLocationCoordinateWhere',
  );
}

export function mergeWhereWithAnd(
  where: Prisma.BusinessWhereInput,
  clause: Prisma.BusinessWhereInput,
): void {
  if (where.AND) {
    const existing = Array.isArray(where.AND) ? where.AND : [where.AND];
    where.AND = [...existing, clause];
    return;
  }
  where.AND = [clause];
}
