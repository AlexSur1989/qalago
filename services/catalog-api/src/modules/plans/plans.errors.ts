import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

export const PlanErrorCode = {
  PLAN_FREE_NOT_PURCHASABLE: 'PLAN_FREE_NOT_PURCHASABLE',
  PLAN_DOWNGRADE_NOT_ALLOWED: 'PLAN_DOWNGRADE_NOT_ALLOWED',
  PLAN_PAYMENT_NOT_FOUND: 'PLAN_PAYMENT_NOT_FOUND',
  PLAN_PAYMENT_INVALID_STATUS: 'PLAN_PAYMENT_INVALID_STATUS',
  PLAN_UNSUPPORTED_TIER: 'PLAN_UNSUPPORTED_TIER',
  PLAN_IDEMPOTENCY_CONFLICT: 'PLAN_IDEMPOTENCY_CONFLICT',
} as const;

export function planBadRequest(code: string, message: string): never {
  throw new BadRequestException({ message, code });
}

export function planNotFound(code: string, message: string): never {
  throw new NotFoundException({ message, code });
}

export function planConflict(code: string, message: string): never {
  throw new ConflictException({ message, code });
}
