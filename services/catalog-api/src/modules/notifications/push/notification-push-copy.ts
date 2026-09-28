import { Notification } from '@prisma/client';
import {
  renderNotificationPresentation,
  resolvePresentationLocale,
} from '@qalago/notification-presentation';
import { buildPushDataPayload } from './push-payload';

export type PushDisplayCopy = {
  title: string;
  body?: string;
  data: Record<string, string>;
};

/**
 * OS display copy for FCM/APNs: typed templates per device locale; legacy fallback for GENERAL/unknown.
 */
export function buildPushDisplayCopy(
  notification: Notification,
  deviceLocale: string | null | undefined,
): PushDisplayCopy {
  const locale = resolvePresentationLocale(deviceLocale);
  const payload =
    notification.payload && typeof notification.payload === 'object' && !Array.isArray(notification.payload)
      ? (notification.payload as Record<string, unknown>)
      : null;

  const rendered = renderNotificationPresentation({
    type: notification.type,
    locale,
    payload,
    legacyTitle: notification.title,
    legacyBody: notification.body,
    forPush: true,
  });

  const data = buildPushDataPayload(notification);
  return {
    title: rendered.title,
    body: rendered.body,
    data,
  };
}
