import { createHash } from 'crypto';

/** Stage 6.5 — privacy-safe visitor pseudonymization (no raw userId in business analytics). */

export const VISITOR_ID_MIN_LENGTH = 16;
export const VISITOR_ID_MAX_LENGTH = 64;
export const SESSION_ID_MIN_LENGTH = 16;
export const SESSION_ID_MAX_LENGTH = 64;
export const CLIENT_EVENT_ID_MAX_LENGTH = 64;
export const ANALYTICS_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const VISITOR_ID_PATTERN = /^[a-f0-9-]+$/i;

export function isValidVisitorId(raw?: string | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  return (
    trimmed.length >= VISITOR_ID_MIN_LENGTH &&
    trimmed.length <= VISITOR_ID_MAX_LENGTH &&
    VISITOR_ID_PATTERN.test(trimmed)
  );
}

export function isValidSessionId(raw?: string | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  return (
    trimmed.length >= SESSION_ID_MIN_LENGTH &&
    trimmed.length <= SESSION_ID_MAX_LENGTH &&
    VISITOR_ID_PATTERN.test(trimmed)
  );
}

export function isValidClientEventId(raw?: string | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  return trimmed.length >= 8 && trimmed.length <= CLIENT_EVENT_ID_MAX_LENGTH;
}

/** Pseudonymize first-party visitor id — never store raw value in analytics tables. */
export function hashVisitorId(visitorId: string, pepper = 'qalago-analytics-v1'): string {
  return createHash('sha256').update(`${pepper}:${visitorId.trim().toLowerCase()}`).digest('hex');
}

export type VisitorType = 'NEW' | 'RETURNING';
