import { Notification, Prisma } from '@prisma/client';
import { NotificationResponseDto } from './dto/notification.dto';

export function toPublicNotificationPayload(
  value: Prisma.JsonValue | null | undefined,
): Record<string, unknown> | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function toNotificationResponseDto(row: Notification): NotificationResponseDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
    targetType: row.targetType,
    targetId: row.targetId,
    payload: toPublicNotificationPayload(row.payload),
  };
}
