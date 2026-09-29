import type { NotificationRow } from '@/lib/api';

function readPayloadBusinessId(payload: NotificationRow['payload']): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }
  const businessId = (payload as Record<string, unknown>).businessId;
  return typeof businessId === 'string' && businessId.trim().length > 0
    ? businessId.trim()
    : null;
}

/**
 * Business Web inbox navigation — uses producer payload businessId (not shell selection).
 * Returns null when no safe in-app target (legacy rows stay read-only).
 */
export function resolveBusinessNotificationHref(item: Pick<NotificationRow, 'type' | 'payload'>): string | null {
  const businessId = readPayloadBusinessId(item.payload);

  switch (item.type) {
    case 'NEW_REVIEW':
    case 'REVIEW_NEW':
      return businessId ? `/business/${businessId}/reviews` : null;
    case 'PLAN_ACTIVATED':
    case 'PLAN_EXPIRED':
    case 'BUSINESS_APPLICATION_APPROVED':
      return businessId ? `/business/${businessId}` : '/dashboard';
    case 'AD_CAMPAIGN_APPROVED':
    case 'AD_CAMPAIGN_REJECTED':
      return businessId ? `/business/${businessId}/ads` : null;
    case 'BUSINESS_INVITATION_RECEIVED':
      return '/dashboard';
    default:
      return businessId ? `/business/${businessId}` : null;
  }
}
