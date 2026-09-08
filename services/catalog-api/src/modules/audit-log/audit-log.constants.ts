import { AuditAction } from '@prisma/client';

/** Team-related actions exposed on business team history endpoint. */
export const TEAM_AUDIT_ACTIONS: AuditAction[] = [
  AuditAction.TEAM_INVITE,
  AuditAction.TEAM_INVITATION_ACCEPT,
  AuditAction.TEAM_PERMISSION_UPDATE,
  AuditAction.TEAM_SUSPEND,
  AuditAction.TEAM_RESTORE,
  AuditAction.TEAM_REVOKE,
];

export const AUDIT_METADATA_BLOCKED_KEYS = new Set([
  'password',
  'code',
  'otp',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'secret',
  'cardNumber',
  'cvv',
  'pan',
]);

export const DEFAULT_AUDIT_PAGE_LIMIT = 50;
export const MAX_AUDIT_PAGE_LIMIT = 100;
