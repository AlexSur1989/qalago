import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  mergeWhereWithAnd,
  validStoredBusinessCoordinateWhere,
} from '../../common/utils/catalog-geo-query.util';
import { ListBusinessesQueryDto } from './dto/business.dto';

export type NormalizedMapBbox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

/** Validates optional map bbox query (all four corners required together). */
export function parseMapBboxQuery(query: ListBusinessesQueryDto): NormalizedMapBbox | null {
  const { minLat, maxLat, minLng, maxLng } = query;
  const values = [minLat, maxLat, minLng, maxLng];
  const defined = values.filter((v) => v != null);
  if (defined.length === 0) return null;
  if (defined.length !== 4) {
    throw new BadRequestException(
      'Map bbox requires minLat, maxLat, minLng, and maxLng together',
    );
  }

  const south = Math.min(minLat!, maxLat!);
  const north = Math.max(minLat!, maxLat!);
  const west = Math.min(minLng!, maxLng!);
  const east = Math.max(minLng!, maxLng!);

  return { minLat: south, maxLat: north, minLng: west, maxLng: east };
}

export function appendMapCatalogFilters(
  where: Prisma.BusinessWhereInput,
  query: ListBusinessesQueryDto,
  normalizedBbox: NormalizedMapBbox | null = null,
): void {
  const bbox = normalizedBbox ?? parseMapBboxQuery(query);

  if (query.forMap || bbox != null) {
    mergeWhereWithAnd(where, validStoredBusinessCoordinateWhere());
  }

  if (bbox == null) return;

  const latFilter =
    where.latitude && typeof where.latitude === 'object'
      ? where.latitude
      : {};
  where.latitude = {
    ...latFilter,
    gte: bbox.minLat,
    lte: bbox.maxLat,
  };

  where.longitude = {
    gte: bbox.minLng,
    lte: bbox.maxLng,
  };
}
