import { Prisma } from '@prisma/client';
import { BusinessStatus } from '@prisma/client';
import {
  buildCatalogNearestWhereSql,
  resolveNearestRadiusMeters,
} from './business-catalog-postgis-geo.query';

describe('business-catalog-postgis-geo.query', () => {
  it('resolveNearestRadiusMeters defaults to 15 km', () => {
    expect(resolveNearestRadiusMeters(undefined)).toBe(15_000);
    expect(resolveNearestRadiusMeters(3)).toBe(3_000);
  });

  it('buildCatalogNearestWhereSql uses parameterized search (no raw concat in SQL text)', () => {
    const point = Prisma.sql`ST_SetSRID(ST_MakePoint(${51.38}, ${51.23}), 4326)::geography`;
    const where = buildCatalogNearestWhereSql(
      {
        cityId: 'city-1',
        status: BusinessStatus.ACTIVE,
        latitude: 51.23,
        longitude: 51.38,
        radiusMeters: 3000,
        searchPattern: "'; DROP TABLE \"Business\"; --",
        serviceSearchBusinessIds: ['biz-a'],
        skip: 0,
        limit: 20,
      },
      point,
    );
    const sql = where.sql;
    const values = where.values;
    expect(sql).toContain('ILIKE');
    expect(sql).not.toContain('DROP TABLE');
    expect(values.some((v) => String(v).includes('DROP TABLE'))).toBe(true);
  });
});
