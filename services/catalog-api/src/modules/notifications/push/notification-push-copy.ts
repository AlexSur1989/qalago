import { Notification } from '@prisma/client';
import { buildPushDataPayload } from './push-payload';

export type PushDisplayCopy = {
  title: string;
  body?: string;
  data: Record<string, string>;
};

/**
 * Uses persisted notification title/body for OS display when push arrives in background.
 * Locale-specific copy uses device locale hint when present; otherwise falls back to stored strings.
 */
export function buildPushDisplayCopy(
  notification: Notification,
  deviceLocale: string | null | undefined,
): PushDisplayCopy {
  void deviceLocale;
  const data = buildPushDataPayload(notification);
  return {
    title: notification.title,
    body: notification.body ?? undefined,
    data,
  };
}
