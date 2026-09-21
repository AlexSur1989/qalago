import { Inject, Injectable, Logger } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PushDevicesService } from '../push-devices.service';
import { isNotificationEligibleForPush } from './notification-push-eligibility';
import { buildPushDisplayCopy } from './notification-push-copy';
import {
  PUSH_DELIVERY_GATEWAY,
  PushDeliveryGateway,
} from './push-delivery-gateway.interface';
import { PushNotificationDeliveryResult } from './push-delivery-result';

@Injectable()
export class PushDeliveryService {
  private readonly logger = new Logger(PushDeliveryService.name);
  private readonly inFlightNotificationIds = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushDevices: PushDevicesService,
    @Inject(PUSH_DELIVERY_GATEWAY) private readonly gateway: PushDeliveryGateway,
  ) {}

  /** Best-effort delivery after DB commit — never throws to callers. */
  deliverAfterCommit(notification: Notification | Pick<Notification, 'id'>): void {
    setImmediate(() => {
      void this.deliverForNotificationId(notification.id);
    });
  }

  deliverAfterCommitMany(notifications: Array<Notification | Pick<Notification, 'id'>>): void {
    if (notifications.length === 0) return;
    setImmediate(() => {
      for (const n of notifications) {
        void this.deliverForNotificationId(n.id);
      }
    });
  }

  async deliverForNotificationId(notificationId: string): Promise<PushNotificationDeliveryResult | null> {
    if (this.inFlightNotificationIds.has(notificationId)) {
      return null;
    }
    this.inFlightNotificationIds.add(notificationId);
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
      });
      if (!notification) {
        return null;
      }
      return await this.deliverForNotification(notification);
    } finally {
      this.inFlightNotificationIds.delete(notificationId);
    }
  }

  async deliverForNotification(notification: Notification): Promise<PushNotificationDeliveryResult> {
    const empty: PushNotificationDeliveryResult = {
      notificationId: notification.id,
      attempted: 0,
      succeeded: 0,
      results: [],
    };

    if (!isNotificationEligibleForPush(notification)) {
      return empty;
    }

    if (!this.gateway.isEnabled) {
      return empty;
    }

    const devices = await this.pushDevices.listActiveTokensForUser(notification.userId);
    if (devices.length === 0) {
      return empty;
    }

    const results = await Promise.all(
      devices.map(async (device) => {
        const copy = buildPushDisplayCopy(notification, device.locale);
        return this.gateway.sendToToken(
          { deviceId: device.id, token: device.token },
          copy,
        );
      }),
    );

    const invalidDeviceIds = results
      .filter((r) => r.failureKind === 'permanent_invalid_token')
      .map((r) => r.deviceId);
    if (invalidDeviceIds.length > 0) {
      await this.pushDevices.deactivateByTokenIds(invalidDeviceIds);
    }

    const succeeded = results.filter((r) => r.success).length;
    if (succeeded < results.length) {
      this.logger.debug(
        `Push delivery for ${notification.id}: ${succeeded}/${results.length} tokens succeeded`,
      );
    }

    return {
      notificationId: notification.id,
      attempted: results.length,
      succeeded,
      results,
    };
  }
}
