import { BadRequestException } from '@nestjs/common';
import {
  assertCatalogGeoQuery,
  assertMapBboxSpanWithinLimits,
  isOptionalUserGeoCoordinatePairValid,
  validStoredBusinessLocationCoordinateWhere,
} from './catalog-geo-query.util';
import {
  MAX_MAP_BBOX_LAT_SPAN_DEGREES,
  MAX_MAP_BBOX_LNG_SPAN_DEGREES,
  URALSK_GEOCODING_BOUNDS,
} from './catalog-geo-query.constants';
import { ListBusinessesQueryDto } from '../../modules/businesses/dto/business.dto';

describe('catalog-geo-query.util', () => {
  describe('isOptionalUserGeoCoordinatePairValid', () => {
    it('allows absent pair', () => {
      expect(isOptionalUserGeoCoordinatePairValid(undefined, undefined)).toBe(true);
    });

    it('rejects partial pair', () => {
      expect(isOptionalUserGeoCoordinatePairValid(51.2, undefined)).toBe(false);
    });

    it('allows user 0,0 (WGS84)', () => {
      expect(isOptionalUserGeoCoordinatePairValid(0, 0)).toBe(true);
    });

    it('rejects NaN', () => {
      expect(isOptionalUserGeoCoordinatePairValid(Number.NaN, 51.2)).toBe(false);
    });
  });

  describe('assertCatalogGeoQuery', () => {
    it('rejects radiusKm without coordinates', () => {
      expect(() =>
        assertCatalogGeoQuery({ radiusKm: 5 } as ListBusinessesQueryDto),
      ).toThrow(BadRequestException);
    });

    it('accepts valid geo nearest params', () => {
      expect(
        assertCatalogGeoQuery({
          latitude: 51.22,
          longitude: 51.39,
          radiusKm: 3,
        } as ListBusinessesQueryDto),
      ).toBeNull();
    });

    it('accepts user 0,0 with radius', () => {
      expect(
        assertCatalogGeoQuery({
          latitude: 0,
          longitude: 0,
          radiusKm: 1,
        } as ListBusinessesQueryDto),
      ).toBeNull();
    });

    it('rejects excessive map bbox span', () => {
      expect(() =>
        assertCatalogGeoQuery({
          forMap: true,
          minLat: 50,
          maxLat: 50 + MAX_MAP_BBOX_LAT_SPAN_DEGREES + 0.1,
          minLng: 51,
          maxLng: 51.5,
        } as ListBusinessesQueryDto),
      ).toThrow(/latitude span exceeds maximum/);
    });

    it('accepts normal Uralsk viewport', () => {
      const bbox = assertCatalogGeoQuery({
        forMap: true,
        minLat: URALSK_GEOCODING_BOUNDS.minLat,
        maxLat: URALSK_GEOCODING_BOUNDS.maxLat,
        minLng: URALSK_GEOCODING_BOUNDS.minLng,
        maxLng: URALSK_GEOCODING_BOUNDS.maxLng,
      } as ListBusinessesQueryDto);
      expect(bbox).toEqual({
        minLat: URALSK_GEOCODING_BOUNDS.minLat,
        maxLat: URALSK_GEOCODING_BOUNDS.maxLat,
        minLng: URALSK_GEOCODING_BOUNDS.minLng,
        maxLng: URALSK_GEOCODING_BOUNDS.maxLng,
      });
    });

    it('accepts C.3 padded Uralsk viewport', () => {
      const latSpan =
        URALSK_GEOCODING_BOUNDS.maxLat - URALSK_GEOCODING_BOUNDS.minLat;
      const lngSpan =
        URALSK_GEOCODING_BOUNDS.maxLng - URALSK_GEOCODING_BOUNDS.minLng;
      const pad = 0.12;
      const minLat = URALSK_GEOCODING_BOUNDS.minLat - latSpan * pad;
      const maxLat = URALSK_GEOCODING_BOUNDS.maxLat + latSpan * pad;
      const minLng = URALSK_GEOCODING_BOUNDS.minLng - lngSpan * pad;
      const maxLng = URALSK_GEOCODING_BOUNDS.maxLng + lngSpan * pad;
      expect(() =>
        assertCatalogGeoQuery({
          forMap: true,
          minLat,
          maxLat,
          minLng,
          maxLng,
        } as ListBusinessesQueryDto),
      ).not.toThrow();
    });
  });

  describe('assertMapBboxSpanWithinLimits', () => {
    it('allows max configured spans', () => {
      expect(() =>
        assertMapBboxSpanWithinLimits({
          minLat: 0,
          maxLat: MAX_MAP_BBOX_LAT_SPAN_DEGREES,
          minLng: 0,
          maxLng: MAX_MAP_BBOX_LNG_SPAN_DEGREES,
        }),
      ).not.toThrow();
    });
  });

  describe('validStoredBusinessLocationCoordinateWhere', () => {
    it('excludes null and 0,0 sentinel on BusinessLocation', () => {
      const where = validStoredBusinessLocationCoordinateWhere();
      expect(where.NOT).toEqual({
        AND: [{ latitude: 0 }, { longitude: 0 }],
      });
      expect(where.latitude).toMatchObject({ not: null });
    });
  });
});
