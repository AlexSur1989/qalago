import { BadRequestException } from '@nestjs/common';
import {
  appendMapCatalogFilters,
  parseMapBboxQuery,
} from './business-map-query.util';
import { ListBusinessesQueryDto } from './dto/business.dto';

describe('business-map-query.util', () => {
  it('parseMapBboxQuery normalizes corners', () => {
    const bbox = parseMapBboxQuery({
      minLat: 51.3,
      maxLat: 51.1,
      minLng: 51.5,
      maxLng: 51.2,
    } as ListBusinessesQueryDto);
    expect(bbox).toEqual({
      minLat: 51.1,
      maxLat: 51.3,
      minLng: 51.2,
      maxLng: 51.5,
    });
  });

  it('parseMapBboxQuery rejects partial bbox', () => {
    expect(() =>
      parseMapBboxQuery({ minLat: 1 } as ListBusinessesQueryDto),
    ).toThrow(BadRequestException);
  });

  it('appendMapCatalogFilters adds valid stored coordinate clause for forMap', () => {
    const where: Record<string, unknown> = {};
    appendMapCatalogFilters(where, { forMap: true } as ListBusinessesQueryDto);
    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          latitude: expect.objectContaining({ not: null }),
          NOT: { AND: [{ latitude: 0 }, { longitude: 0 }] },
        }),
      ]),
    );
  });
});
