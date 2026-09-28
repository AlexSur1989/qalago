import {
  Notification,
  NotificationTargetType,
  NotificationType,
} from '@prisma/client';
import { buildPushDisplayCopy } from './notification-push-copy';
import { assertPushDataPayloadSafe } from './push-payload';

describe('buildPushDisplayCopy', () => {
  const typed: Notification = {
    id: 'n1',
    userId: 'u1',
    type: NotificationType.NEW_REVIEW,
    title: 'Новый отзыв',
    body: 'Legacy RU body',
    isRead: false,
    targetType: NotificationTargetType.REVIEW,
    targetId: 'rev-1',
    payload: { businessId: 'b1', reviewId: 'rev-1', rating: 5 },
    createdAt: new Date(),
  };

  it('localizes typed notification per device locale', () => {
    const ru = buildPushDisplayCopy(typed, 'ru');
    const kk = buildPushDisplayCopy(typed, 'kk');
    expect(ru.title).toBe('Новый отзыв');
    expect(kk.title).toBe('Жаңа пікір');
    expect(ru.body).not.toBe(kk.body);
  });

  it('null and invalid device locale → kk', () => {
    const nullLocale = buildPushDisplayCopy(typed, null);
    const invalid = buildPushDisplayCopy(typed, 'en-US');
    expect(nullLocale.title).toBe('Жаңа пікір');
    expect(invalid.title).toBe('Жаңа пікір');
  });

  it('GENERAL uses persisted title/body', () => {
    const general: Notification = {
      ...typed,
      type: NotificationType.GENERAL,
      title: 'Custom title',
      body: 'Custom body',
    };
    const out = buildPushDisplayCopy(general, 'kk');
    expect(out.title).toBe('Custom title');
    expect(out.body).toBe('Custom body');
  });

  it('FCM data whitelist unchanged', () => {
    const out = buildPushDisplayCopy(typed, 'ru');
    expect(out.data).toEqual({
      notificationId: 'n1',
      type: NotificationType.NEW_REVIEW,
      targetType: NotificationTargetType.REVIEW,
      targetId: 'rev-1',
      businessId: 'b1',
    });
    assertPushDataPayloadSafe(out.data);
    expect(out.data).not.toHaveProperty('body');
    expect(out.data).not.toHaveProperty('rating');
  });

  it('REVIEW_REPLY push does not use legacy reply body', () => {
    const reply: Notification = {
      ...typed,
      type: NotificationType.REVIEW_REPLY,
      body: 'Owner reply secret text',
    };
    const out = buildPushDisplayCopy(reply, 'ru');
    expect(out.body).not.toContain('secret');
  });
});
