import { Notification, NotificationType } from '@prisma/client';

const SUPPRESSED_TYPES = new Set<NotificationType>([
  NotificationType.GENERAL,
  NotificationType.NEW_PROMOTION,
]);

export function isNotificationEligibleForPush(notification: Pick<Notification, 'type'>): boolean {
  return !SUPPRESSED_TYPES.has(notification.type);
}
