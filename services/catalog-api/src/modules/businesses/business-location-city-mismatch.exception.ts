import { HttpException, HttpStatus } from '@nestjs/common';

export const BUSINESS_LOCATION_CITY_MISMATCH_CODE = 'BUSINESS_LOCATION_CITY_MISMATCH';

/** F.4 Phase 0.1 Rule 6 — public-safe normalization payload for Consumer Web redirect. */
export class BusinessLocationCityMismatchException extends HttpException {
  constructor(params: { businessSlug: string; locationId: string; citySlug: string }) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        code: BUSINESS_LOCATION_CITY_MISMATCH_CODE,
        message: 'Business location belongs to another city',
        businessSlug: params.businessSlug,
        locationId: params.locationId,
        citySlug: params.citySlug,
      },
      HttpStatus.CONFLICT,
    );
  }
}
