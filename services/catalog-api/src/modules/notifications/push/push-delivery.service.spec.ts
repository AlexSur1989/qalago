import {
  Notification,
  NotificationTargetType,
  NotificationType,
  PushPlatform,
} from '@prisma/client';
import { PushDeliveryService } from './push-delivery.service';
import { PushDevicesService } from '../push-devices.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PushDeliveryGateway } from './push-delivery-gateway.interface';
import { assertPushDataPayloadSafe, buildPushDataPayload } from './push-payload';

describe('PushDeliveryService', () => {
  const baseNotification: Notification = {
    id: 'n1',
    userId: 'u1',
    type: NotificationType.NEW_REVIEW,
    title: 'Новый отзыв',
    body: 'body',
    isRead: false,
    targetType: NotificationTargetType.REVIEW,
    targetId: 'rev-1',
    payload: { businessId: 'b1', reviewId: 'rev-1', rating: 5 },
    createdAt: new Date(),
  };

  function build(gateway: Partial<PushDeliveryGateway>, prisma?: Partial<PrismaService>) {
    const pushDevices = {
      listActiveTokensForUser: jest.fn().mockResolvedValue([
        { id: 'd1', token: 'tok1', locale: 'ru', platform: PushPlatform.ANDROID },
        { id: 'd2', token: 'tok2', locale: null, platform: PushPlatform.IOS },
      ]),
      deactivateByTokenIds: jest.fn(),
    } as unknown as PushDevicesService;

    return {
      service: new PushDeliveryService(
        (prisma ?? {
          notification: {
            findUnique: jest.fn().mockResolvedValue(baseNotification),
          },
        }) as PrismaService,
        pushDevices,
        gateway as PushDeliveryGateway,
      ),
      pushDevices,
    };
  }

  it('disabled push provider performs no external send attempts', async () => {
    const sendToToken = jest.fn();
    const { service } = build({ isEnabled: false, sendToToken });
    const result = await service.deliverForNotification(baseNotification);
    expect(result.attempted).toBe(0);
    expect(sendToToken).not.toHaveBeenCalled();
  });

  it('notification persists if push provider fails', async () => {
    const sendToToken = jest
      .fn()
      .mockResolvedValue({ deviceId: 'd1', success: false, failureKind: 'temporary' });
    const { service } = build({ isEnabled: true, sendToToken });
    await expect(service.deliverForNotification(baseNotification)).resolves.toMatchObject({
      notificationId: 'n1',
      attempted: 2,
      succeeded: 0,
    });
  });

  it('multi-device fan-out and one bad token does not block others', async () => {
    const sendToToken = jest
      .fn()
      .mockResolvedValueOnce({
        deviceId: 'd1',
        success: false,
        failureKind: 'permanent_invalid_token',
      })
      .mockResolvedValueOnce({ deviceId: 'd2', success: true });
    const { service, pushDevices } = build({ isEnabled: true, sendToToken });
    const result = await service.deliverForNotification(baseNotification);
    expect(result.succeeded).toBe(1);
    expect(pushDevices.deactivateByTokenIds).toHaveBeenCalledWith(['d1']);
  });

  it('temporary provider error does not deactivate token', async () => {
    const sendToToken = jest
      .fn()
      .mockResolvedValue({ deviceId: 'd1', success: false, failureKind: 'temporary' });
    const { service, pushDevices } = build({ isEnabled: true, sendToToken });
    await service.deliverForNotification(baseNotification);
    expect(pushDevices.deactivateByTokenIds).not.toHaveBeenCalled();
  });

  it('push payload whitelist and no sensitive fields', () => {
    const data = buildPushDataPayload(baseNotification);
    expect(data).toEqual({
      notificationId: 'n1',
      type: NotificationType.NEW_REVIEW,
      targetType: NotificationTargetType.REVIEW,
      targetId: 'rev-1',
      businessId: 'b1',
    });
    expect(data).not.toHaveProperty('body');
    expect(data).not.toHaveProperty('rating');
    assertPushDataPayloadSafe(data);
  });

  it('does not double-send same notification while in flight', async () => {
    const sendToToken = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ deviceId: 'd1', success: true }), 20);
        }),
    );
    const { service } = build({ isEnabled: true, sendToToken });
    const first = service.deliverForNotificationId('n1');
    const second = service.deliverForNotificationId('n1');
    await Promise.all([first, second]);
    expect(sendToToken.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
