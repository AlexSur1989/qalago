import { AuditAction } from '@prisma/client';

/** Canonical ad placement codes (Stage 6.7 monetization). */
export const CANONICAL_AD_PLACEMENT_CODES = [
  'HOME_VIP_BANNER',
  'CATEGORY_TOP',
  'CATEGORY_BOOST',
  'HOME_FEATURED',
  'HOME_PROMOTIONS',
] as const;

export const MAX_REPORT_RANGE_DAYS = 366;

export const DEFAULT_REPORT_PAGE_LIMIT = 25;
export const MAX_REPORT_PAGE_LIMIT = 100;

export const CRITICAL_STAFF_AUDIT_ACTIONS: readonly AuditAction[] = [
  AuditAction.STAFF_CREATED,
  AuditAction.STAFF_DISABLED,
  AuditAction.STAFF_RESTORED,
  AuditAction.STAFF_ROLE_CHANGED,
  AuditAction.STAFF_CITY_SCOPE_CHANGED,
  AuditAction.STAFF_SESSION_REVOKED,
  AuditAction.SUPER_ADMIN_ASSIGNED,
  AuditAction.ADMIN_ASSIGNED,
  AuditAction.STAFF_STEP_UP_VERIFIED,
  AuditAction.PAYMENT_CONFIRM,
  AuditAction.RELEASE_CONFIG_UPDATE,
  AuditAction.LEGAL_DOCUMENT_PUBLISH,
  AuditAction.GOVERNMENT_REQUEST_UPDATE,
  AuditAction.SECURITY_INCIDENT_UPDATE,
];

export const SECURITY_AUDIT_ACTIONS: readonly AuditAction[] = [
  AuditAction.STAFF_DISABLED,
  AuditAction.STAFF_ROLE_CHANGED,
  AuditAction.STAFF_SESSION_REVOKED,
  AuditAction.STAFF_STEP_UP_VERIFIED,
  AuditAction.SECURITY_INCIDENT_UPDATE,
  AuditAction.GOVERNMENT_REQUEST_UPDATE,
  AuditAction.SUPER_ADMIN_ASSIGNED,
  AuditAction.ADMIN_ASSIGNED,
  AuditAction.RELEASE_CONFIG_UPDATE,
];

export const STAFF_ANOMALY_WINDOW_HOURS = 24;
export const STAFF_ANOMALY_ACTION_THRESHOLD = 25;
