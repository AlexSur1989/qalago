import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

/** Machine-readable purchase conflict reasons (Stage 6.7B). */
export const PurchaseConflictReason = {
  PENDING_ORDER_EXISTS: 'PENDING_ORDER_EXISTS',
  ALREADY_ACTIVE: 'ALREADY_ACTIVE',
  ALREADY_SCHEDULED: 'ALREADY_SCHEDULED',
  TARGET_ALREADY_PROMOTED: 'TARGET_ALREADY_PROMOTED',
  CATEGORY_NOT_ELIGIBLE: 'CATEGORY_NOT_ELIGIBLE',
} as const;

export type PurchaseConflictReasonType =
  (typeof PurchaseConflictReason)[keyof typeof PurchaseConflictReason];

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
  CREATIVE_NOT_SUBMITTED: 'CREATIVE_NOT_SUBMITTED',
  CREATIVE_INCOMPLETE: 'CREATIVE_INCOMPLETE',
  CREATIVE_REQUIRED: 'CREATIVE_REQUIRED',
  PLACEMENT_NOT_FOUND: 'PLACEMENT_NOT_FOUND',
  PLACEMENT_NOT_ACTIVE: 'PLACEMENT_NOT_ACTIVE',
  INVALID_PLACEMENT: 'INVALID_PLACEMENT',
  INVALID_SESSION_ID: 'INVALID_SESSION_ID',
  INVALID_EVENT_TYPE: 'INVALID_EVENT_TYPE',
  CAMPAIGN_PLACEMENT_MISMATCH: 'CAMPAIGN_PLACEMENT_MISMATCH',
  CATEGORY_REQUIRED: 'CATEGORY_REQUIRED',
  PURCHASE_CONFLICT: 'PURCHASE_CONFLICT',
  PENDING_ORDER_EXISTS: 'PENDING_ORDER_EXISTS',
  CATEGORY_NOT_ELIGIBLE: 'CATEGORY_NOT_ELIGIBLE',
  PROMOTION_NOT_ELIGIBLE: 'PROMOTION_NOT_ELIGIBLE',
} as const;

export type MonetizationErrorCodeType =
  (typeof MonetizationErrorCode)[keyof typeof MonetizationErrorCode];

type ErrorBody = {
  message: string;
  code: MonetizationErrorCodeType;
  reasonCode?: PurchaseConflictReasonType;
  existingCampaignId?: string;
  existingOrderId?: string;
  activeUntil?: string;
  nextAvailableAt?: string;
  canRenew?: boolean;
};

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

export function monetizationConflict(
  code: MonetizationErrorCodeType,
  reasonCode: PurchaseConflictReasonType,
  message: string,
  extras?: Omit<ErrorBody, 'message' | 'code' | 'reasonCode'>,
): never {
  throw new ConflictException({
    message,
    code,
    reasonCode,
    ...extras,
  } satisfies ErrorBody);
}
