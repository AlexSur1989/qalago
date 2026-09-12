import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

export enum StaffAuthErrorCode {
  STAFF_ACCESS_REQUIRED = 'STAFF_ACCESS_REQUIRED',
  STAFF_ACCESS_DISABLED = 'STAFF_ACCESS_DISABLED',
  STAFF_PERMISSION_DENIED = 'STAFF_PERMISSION_DENIED',
  STAFF_CITY_SCOPE_DENIED = 'STAFF_CITY_SCOPE_DENIED',
  STAFF_SELF_ROLE_CHANGE_FORBIDDEN = 'STAFF_SELF_ROLE_CHANGE_FORBIDDEN',
  STEP_UP_REQUIRED = 'STEP_UP_REQUIRED',
  MFA_REQUIRED = 'MFA_REQUIRED',
  MFA_INVALID = 'MFA_INVALID',
  STAFF_SESSION_REVOKED = 'STAFF_SESSION_REVOKED',
}

export function staffUnauthorized(
  code: StaffAuthErrorCode,
  message: string,
): UnauthorizedException {
  return new UnauthorizedException({ code, message });
}

export function staffForbidden(code: StaffAuthErrorCode, message: string): ForbiddenException {
  return new ForbiddenException({ code, message });
}
