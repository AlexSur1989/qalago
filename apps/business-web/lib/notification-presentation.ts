import {
  renderNotificationPresentation,
  type NotificationPresentationResult,
} from '@qalago/notification-presentation';
import type { AppLocale } from '@/lib/locale';
import type { NotificationRow } from '@/lib/api';

export function presentBusinessNotification(
  item: Pick<NotificationRow, 'type' | 'title' | 'body' | 'payload'>,
  locale: AppLocale,
): NotificationPresentationResult {
  const payload =
    item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)
      ? (item.payload as Record<string, unknown>)
      : null;

  return renderNotificationPresentation({
    type: item.type,
    locale,
    payload,
    legacyTitle: item.title,
    legacyBody: item.body ?? null,
    forPush: false,
  });
}
