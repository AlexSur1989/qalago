import { Notification, NotificationTargetType, NotificationType } from '@prisma/client';

const ALLOWED_TYPES = new Set<string>(Object.values(NotificationType));
const ALLOWED_TARGET_TYPES = new Set<string>(Object.values(NotificationTargetType));

function readPayloadString(
  payload: unknown,
  key: string,
): string | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;
  const value = (payload as Record<string, unknown>)[key];
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return value;
}

/** Whitelisted FCM data fields for client navigation (E.4). All values are strings. */
export function buildPushDataPayload(notification: Notification): Record<string, string> {
  const data: Record<string, string> = {
    notificationId: notification.id,
    type: notification.type,
  };

  if (notification.targetType && ALLOWED_TARGET_TYPES.has(notification.targetType)) {
    data.targetType = notification.targetType;
  }
  if (notification.targetId) {
    data.targetId = notification.targetId;
  }

  const businessId = readPayloadString(notification.payload, 'businessId');
  if (businessId) {
    data.businessId = businessId;
  }

  if (!ALLOWED_TYPES.has(notification.type)) {
    delete data.type;
  }

  return data;
}

/** Ensures outbound data contains no unexpected keys (tests / safety). */
export function assertPushDataPayloadSafe(data: Record<string, string>): void {
  const allowed = new Set([
    'notificationId',
    'type',
    'targetType',
    'targetId',
    'businessId',
  ]);
  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) {
      throw new Error(`Unexpected push data field: ${key}`);
    }
  }
}
