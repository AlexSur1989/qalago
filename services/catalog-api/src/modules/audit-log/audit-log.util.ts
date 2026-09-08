import { AUDIT_METADATA_BLOCKED_KEYS } from './audit-log.constants';
import { BusinessMembershipRole } from '@prisma/client';
import { BusinessAccessRole } from '../../common/services/business-access.service';

const SENSITIVE_FIELD_NAMES = new Set([
  'phone',
  'whatsapp',
  'address',
  'description',
  'shortDesc',
  'password',
  'codeHash',
  'imageUrl',
  'coverImageUrl',
]);

export function toMembershipRole(
  accessRole: BusinessAccessRole,
): BusinessMembershipRole | null {
  if (accessRole === 'OWNER') return BusinessMembershipRole.OWNER;
  if (accessRole === 'MANAGER') return BusinessMembershipRole.MANAGER;
  return null;
}

export function maskPhoneForAudit(phone: string): string {
  if (phone.length < 8) return '***';
  return `${phone.slice(0, 4)}***${phone.slice(-2)}`;
}

export function changedFieldsFromDto(dto: Record<string, unknown>): string[] {
  return Object.keys(dto).filter((key) => dto[key] !== undefined);
}

export function permissionDiff(
  before: string[],
  after: string[],
): { permissionsAdded: string[]; permissionsRemoved: string[] } {
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return {
    permissionsAdded: after.filter((p) => !beforeSet.has(p)),
    permissionsRemoved: before.filter((p) => !afterSet.has(p)),
  };
}

export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (AUDIT_METADATA_BLOCKED_KEYS.has(key.toLowerCase())) continue;
    if (SENSITIVE_FIELD_NAMES.has(key)) continue;
    result[key] = sanitizeValue(value, 0);
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 4) return '[truncated]';
  if (value == null || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (AUDIT_METADATA_BLOCKED_KEYS.has(k.toLowerCase())) continue;
      if (SENSITIVE_FIELD_NAMES.has(k)) continue;
      obj[k] = sanitizeValue(v, depth + 1);
    }
    return obj;
  }
  return String(value);
}
