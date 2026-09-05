import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export const MonetizationErrorCode = {
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_NOT_AVAILABLE: 'PRODUCT_NOT_AVAILABLE',
  PRICE_NOT_FOUND: 'PRICE_NOT_FOUND',
  INVALID_DURATION: 'INVALID_DURATION',
  PLACEMENT_UNAVAILABLE: 'PLACEMENT_UNAVAILABLE',
  BUSINESS_NOT_OWNED: 'BUSINESS_NOT_OWNED',
  PROMOTION_NOT_OWNED: 'PROMOTION_NOT_OWNED',
  CREATIVE_NOT_OWNED: 'CREATIVE_NOT_OWNED',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_AMOUNT_MISMATCH: 'PAYMENT_AMOUNT_MISMATCH',
  PAYMENT_ALREADY_PROCESSED: 'PAYMENT_ALREADY_PROCESSED',
  CREATIVE_NOT_APPROVED: 'CREATIVE_NOT_APPROVED',
  PACKAGE_NOT_FOUND: 'PACKAGE_NOT_FOUND',
  CAMPAIGN_NOT_FOUND: 'CAMPAIGN_NOT_FOUND',
  CREATIVE_NOT_FOUND: 'CREATIVE_NOT_FOUND',
  INVALID_ORDER_STATUS: 'INVALID_ORDER_STATUS',
  INVALID_PAYMENT_STATUS: 'INVALID_PAYMENT_STATUS',
  CREATIVE_NOT_EDITABLE: 'CREATIVE_NOT_EDITABLE',
} as const;

export type MonetizationErrorCodeType =
  (typeof MonetizationErrorCode)[keyof typeof MonetizationErrorCode];

type ErrorBody = { message: string; code: MonetizationErrorCodeType };

export function monetizationBadRequest(
  code: MonetizationErrorCodeType,
  message: string,
): never {
  throw new BadRequestException({ message, code } satisfies ErrorBody);
}

export function monetizationNotFound(
  code: MonetizationErrorCodeType,
  message: string,
): never {
  throw new NotFoundException({ message, code } satisfies ErrorBody);
}

export function monetizationForbidden(
  code: MonetizationErrorCodeType,
  message: string,
): never {
  throw new ForbiddenException({ message, code } satisfies ErrorBody);
}
