import { BusinessStatus, Prisma, PrismaClient } from '@prisma/client';
import type { NormalizedMapBbox } from './business-map-query.util';

/** Default nearest radius when client omits radiusKm (matches legacy Node path). */
export const DEFAULT_NEAREST_RADIUS_KM = 15;

export type CatalogPostgisGeoFilterParams = {
  cityId: string;
  status: BusinessStatus;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  categoryId?: string;
  subcategoryId?: string;
  /** Normalized catalog search needle (parameterized ILIKE). */
  searchPattern?: string | null;
  /** Businesses matched via visible service-item search (same as Prisma OR branch). */
  serviceSearchBusinessIds?: string[];
  mapBbox?: NormalizedMapBbox | null;
};

export type CatalogPostgisNearestParams = CatalogPostgisGeoFilterParams & {
  skip: number;
  limit: number;
};

export function resolveNearestRadiusMeters(radiusKm: number | undefined): number {
  return (radiusKm ?? DEFAULT_NEAREST_RADIUS_KM) * 1000;
}

export function resolveExplicitRadiusMeters(radiusKm: number): number {
  return radiusKm * 1000;
}

function queryGeographyPoint(latitude: number, longitude: number): Prisma.Sql {
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;
}

/** WGS84 map viewport as geography (ST_MakeEnvelope: xmin/west, ymin/south, xmax/east, ymax/north). */
export function mapViewportEnvelopeGeography(bbox: NormalizedMapBbox): Prisma.Sql {
  return Prisma.sql`ST_MakeEnvelope(
    ${bbox.minLng},
    ${bbox.minLat},
    ${bbox.maxLng},
    ${bbox.maxLat},
    4326
  )::geography`;
}

/** Business-grain filters (nearest/radius + legacy business viewport): primary city + Business.location. */
function buildCatalogBusinessCatalogFilterSql(
  params: Pick<
    CatalogPostgisGeoFilterParams,
    'cityId' | 'status' | 'categoryId' | 'subcategoryId' | 'searchPattern' | 'serviceSearchBusinessIds'
  >,
): Prisma.Sql[] {
  const parts: Prisma.Sql[] = [
    Prisma.sql`b."cityId" = ${params.cityId}`,
    Prisma.sql`b.status = ${params.status}::"BusinessStatus"`,
    Prisma.sql`b.location IS NOT NULL`,
  ];

  if (params.categoryId) {
    parts.push(Prisma.sql`b."categoryId" = ${params.categoryId}`);
  }

  if (params.subcategoryId) {
    parts.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "BusinessSubcategory" bs
      WHERE bs."businessId" = b.id AND bs."subcategoryId" = ${params.subcategoryId}
    )`);
  }

  if (params.searchPattern) {
    const pattern = `%${params.searchPattern}%`;
    const searchOr: Prisma.Sql[] = [
      Prisma.sql`b.title ILIKE ${pattern}`,
      Prisma.sql`b."shortDesc" ILIKE ${pattern}`,
      Prisma.sql`b.address ILIKE ${pattern}`,
      Prisma.sql`EXISTS (
        SELECT 1 FROM "Category" c
        WHERE c.id = b."categoryId"
          AND (
            c.title ILIKE ${pattern}
            OR c."nameRu" ILIKE ${pattern}
            OR c."nameKk" ILIKE ${pattern}
          )
      )`,
      Prisma.sql`EXISTS (
        SELECT 1 FROM "BusinessSubcategory" bs
        INNER JOIN "Subcategory" s ON s.id = bs."subcategoryId"
        WHERE bs."businessId" = b.id
          AND (s."nameRu" ILIKE ${pattern} OR s."nameKk" ILIKE ${pattern})
      )`,
    ];
    const serviceIds = params.serviceSearchBusinessIds ?? [];
    if (serviceIds.length > 0) {
      searchOr.push(
        Prisma.sql`b.id IN (${Prisma.join(serviceIds.map((id) => Prisma.sql`${id}`))})`,
      );
    }
    parts.push(Prisma.sql`(${Prisma.join(searchOr, ' OR ')})`);
  }

  return parts;
}

type CatalogMapLocationCatalogFilterParams = Pick<
  CatalogPostgisGeoFilterParams,
  'cityId' | 'status' | 'categoryId' | 'subcategoryId' | 'searchPattern' | 'serviceSearchBusinessIds'
>;

/** Location-grain map filters: branch city + BusinessLocation.location; parent Business status/taxonomy. */
function buildCatalogMapLocationJoinFilterSql(
  params: CatalogMapLocationCatalogFilterParams,
): Prisma.Sql[] {
  const parts: Prisma.Sql[] = [
    Prisma.sql`bl."cityId" = ${params.cityId}`,
    Prisma.sql`b.status = ${params.status}::"BusinessStatus"`,
    Prisma.sql`bl.location IS NOT NULL`,
  ];

  if (params.categoryId) {
    parts.push(Prisma.sql`b."categoryId" = ${params.categoryId}`);
  }

  if (params.subcategoryId) {
    parts.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "BusinessSubcategory" bs
      WHERE bs."businessId" = b.id AND bs."subcategoryId" = ${params.subcategoryId}
    )`);
  }

  if (params.searchPattern) {
    const pattern = `%${params.searchPattern}%`;
    const searchOr: Prisma.Sql[] = [
      Prisma.sql`b.title ILIKE ${pattern}`,
      Prisma.sql`b."shortDesc" ILIKE ${pattern}`,
      Prisma.sql`b.address ILIKE ${pattern}`,
      Prisma.sql`bl.address ILIKE ${pattern}`,
      Prisma.sql`EXISTS (
        SELECT 1 FROM "Category" c
        WHERE c.id = b."categoryId"
          AND (
            c.title ILIKE ${pattern}
            OR c."nameRu" ILIKE ${pattern}
            OR c."nameKk" ILIKE ${pattern}
          )
      )`,
      Prisma.sql`EXISTS (
        SELECT 1 FROM "BusinessSubcategory" bs
        INNER JOIN "Subcategory" s ON s.id = bs."subcategoryId"
        WHERE bs."businessId" = b.id
          AND (s."nameRu" ILIKE ${pattern} OR s."nameKk" ILIKE ${pattern})
      )`,
    ];
    const serviceIds = params.serviceSearchBusinessIds ?? [];
    if (serviceIds.length > 0) {
      searchOr.push(
        Prisma.sql`b.id IN (${Prisma.join(serviceIds.map((id) => Prisma.sql`${id}`))})`,
      );
    }
    parts.push(Prisma.sql`(${Prisma.join(searchOr, ' OR ')})`);
  }

  return parts;
}

export type CatalogPostgisMapViewportParams = {
  cityId: string;
  status: BusinessStatus;
  mapBbox: NormalizedMapBbox;
  categoryId?: string;
  subcategoryId?: string;
  skip: number;
  limit: number;
};

export function buildCatalogMapViewportWhereSql(
  params: CatalogPostgisMapViewportParams,
): Prisma.Sql {
  const viewport = mapViewportEnvelopeGeography(params.mapBbox);
  const parts = buildCatalogBusinessCatalogFilterSql(params);
  parts.push(Prisma.sql`ST_Intersects(b.location, ${viewport})`);
  return Prisma.join(parts, ' AND ');
}

export type CatalogPostgisMapLocationViewportParams = {
  cityId: string;
  status: BusinessStatus;
  mapBbox: NormalizedMapBbox;
  categoryId?: string;
  subcategoryId?: string;
  searchPattern?: string | null;
  serviceSearchBusinessIds?: string[];
  skip: number;
  limit: number;
};

export type CatalogMapLocationViewportRow = {
  businessId: string;
  locationId: string;
};

export function buildCatalogMapLocationViewportWhereSql(
  params: Omit<CatalogPostgisMapLocationViewportParams, 'skip' | 'limit'>,
): Prisma.Sql {
  const viewport = mapViewportEnvelopeGeography(params.mapBbox);
  const parts = buildCatalogMapLocationJoinFilterSql(params);
  parts.push(Prisma.sql`ST_Intersects(bl.location, ${viewport})`);
  return Prisma.join(parts, ' AND ');
}

export async function queryCatalogMapLocationViewportPage(
  prisma: Pick<PrismaClient, '$queryRaw'>,
  params: CatalogPostgisMapLocationViewportParams,
): Promise<{ rows: CatalogMapLocationViewportRow[]; total: number }> {
  const whereSql = buildCatalogMapLocationViewportWhereSql(params);

  const rows = await prisma.$queryRaw<
    Array<{ business_id: string; location_id: string }>
  >`
    SELECT b.id AS business_id, bl.id AS location_id
    FROM "BusinessLocation" bl
    INNER JOIN "Business" b ON b.id = bl."businessId"
    WHERE ${whereSql}
    ORDER BY b.title ASC, b.id ASC, bl.id ASC
    LIMIT ${params.limit} OFFSET ${params.skip}
  `;

  const countRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "BusinessLocation" bl
    INNER JOIN "Business" b ON b.id = bl."businessId"
    WHERE ${whereSql}
  `;

  return {
    rows: rows.map((row) => ({
      businessId: row.business_id,
      locationId: row.location_id,
    })),
    total: Number(countRows[0]?.count ?? 0n),
  };
}

/** All location rows inside viewport (for map search / sort expansion in Node). */
export async function queryCatalogMapLocationViewportMemberRows(
  prisma: Pick<PrismaClient, '$queryRaw'>,
  params: Omit<CatalogPostgisMapLocationViewportParams, 'skip' | 'limit'>,
): Promise<CatalogMapLocationViewportRow[]> {
  const whereSql = buildCatalogMapLocationViewportWhereSql(params);
  const rows = await prisma.$queryRaw<
    Array<{ business_id: string; location_id: string }>
  >`
    SELECT b.id AS business_id, bl.id AS location_id
    FROM "BusinessLocation" bl
    INNER JOIN "Business" b ON b.id = bl."businessId"
    WHERE ${whereSql}
    ORDER BY b.title ASC, b.id ASC, bl.id ASC
  `;
  return rows.map((row) => ({
    businessId: row.business_id,
    locationId: row.location_id,
  }));
}

export async function queryCatalogMapViewportPage(
  prisma: Pick<PrismaClient, '$queryRaw'>,
  params: CatalogPostgisMapViewportParams,
): Promise<{ ids: string[]; total: number }> {
  const whereSql = buildCatalogMapViewportWhereSql(params);

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT b.id
    FROM "Business" b
    WHERE ${whereSql}
    ORDER BY b.title ASC, b.id ASC
    LIMIT ${params.limit} OFFSET ${params.skip}
  `;

  const countRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Business" b
    WHERE ${whereSql}
  `;

  return {
    ids: rows.map((row) => row.id),
    total: Number(countRows[0]?.count ?? 0n),
  };
}

/** All business ids inside viewport (for search+map intersection in Node). */
export async function queryCatalogMapViewportMemberIds(
  prisma: Pick<PrismaClient, '$queryRaw'>,
  params: Omit<CatalogPostgisMapViewportParams, 'skip' | 'limit'>,
): Promise<string[]> {
  const whereSql = buildCatalogMapViewportWhereSql({ ...params, skip: 0, limit: 0 });
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT b.id FROM "Business" b WHERE ${whereSql} ORDER BY b.id ASC
  `;
  return rows.map((row) => row.id);
}

export function buildCatalogNearestWhereSql(
  params: CatalogPostgisGeoFilterParams,
  queryPoint: Prisma.Sql,
): Prisma.Sql {
  const parts = buildCatalogBusinessCatalogFilterSql(params);
  parts.push(Prisma.sql`ST_DWithin(b.location, ${queryPoint}, ${params.radiusMeters})`);

  const bbox = params.mapBbox;
  if (bbox != null) {
    const viewport = mapViewportEnvelopeGeography(bbox);
    parts.push(Prisma.sql`ST_Intersects(b.location, ${viewport})`);
  }

  return Prisma.join(parts, ' AND ');
}

export type CatalogPostgisNearestRow = {
  id: string;
  distanceMeters: number;
};

export type CatalogPostgisRadiusFilterParams = CatalogPostgisGeoFilterParams;

/** All businesses within explicit radius (ST_DWithin), with distances — for non-nearest sorts. */
export async function queryCatalogRadiusMembers(
  prisma: Pick<PrismaClient, '$queryRaw'>,
  params: CatalogPostgisRadiusFilterParams,
): Promise<{ rows: CatalogPostgisNearestRow[]; total: number }> {
  const queryPoint = queryGeographyPoint(params.latitude, params.longitude);
  const whereSql = buildCatalogNearestWhereSql(params, queryPoint);

  const rows = await prisma.$queryRaw<
    Array<{ id: string; distance_meters: number }>
  >`
    SELECT
      b.id,
      ROUND(ST_Distance(b.location, ${queryPoint}))::int AS distance_meters
    FROM "Business" b
    WHERE ${whereSql}
    ORDER BY b.id ASC
  `;

  return {
    rows: rows.map((row) => ({
      id: row.id,
      distanceMeters: row.distance_meters,
    })),
    total: rows.length,
  };
}

export async function queryCatalogNearestPage(
  prisma: Pick<PrismaClient, '$queryRaw'>,
  params: CatalogPostgisNearestParams,
): Promise<{ rows: CatalogPostgisNearestRow[]; total: number }> {
  const queryPoint = queryGeographyPoint(params.latitude, params.longitude);
  const whereSql = buildCatalogNearestWhereSql(params, queryPoint);

  const rows = await prisma.$queryRaw<
    Array<{ id: string; distance_meters: number }>
  >`
    SELECT
      b.id,
      ROUND(ST_Distance(b.location, ${queryPoint}))::int AS distance_meters
    FROM "Business" b
    WHERE ${whereSql}
    ORDER BY distance_meters ASC, b.title ASC, b.id ASC
    LIMIT ${params.limit} OFFSET ${params.skip}
  `;

  const countRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Business" b
    WHERE ${whereSql}
  `;

  return {
    rows: rows.map((row) => ({
      id: row.id,
      distanceMeters: row.distance_meters,
    })),
    total: Number(countRows[0]?.count ?? 0n),
  };
}
