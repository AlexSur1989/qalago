import { PushDisplayCopy } from './notification-push-copy';
import { PushTokenDeliveryResult } from './push-delivery-result';

export type PushDeliveryTarget = {
  deviceId: string;
  token: string;
};

export interface PushDeliveryGateway {
  readonly isEnabled: boolean;

  sendToToken(
    target: PushDeliveryTarget,
    message: PushDisplayCopy,
  ): Promise<PushTokenDeliveryResult>;
}

export const PUSH_DELIVERY_GATEWAY = Symbol('PUSH_DELIVERY_GATEWAY');
