import { Injectable, Logger } from '@nestjs/common';
import {
  PushDeliveryGateway,
  PushDeliveryTarget,
} from './push-delivery-gateway.interface';
import { PushDisplayCopy } from './notification-push-copy';
import { PushTokenDeliveryResult } from './push-delivery-result';

@Injectable()
export class NoopPushDeliveryGateway implements PushDeliveryGateway {
  private readonly logger = new Logger(NoopPushDeliveryGateway.name);

  readonly isEnabled = false;

  async sendToToken(
    target: PushDeliveryTarget,
    message: PushDisplayCopy,
  ): Promise<PushTokenDeliveryResult> {
    this.logger.debug(
      `Push disabled — skipped delivery to device ${target.deviceId} (${message.data.notificationId})`,
    );
    return { deviceId: target.deviceId, success: true };
  }
}
