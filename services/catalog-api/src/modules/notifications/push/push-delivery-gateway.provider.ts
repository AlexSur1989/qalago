import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebasePushDeliveryGateway } from './firebase-push-delivery.gateway';
import { NoopPushDeliveryGateway } from './noop-push-delivery.gateway';
import { PUSH_DELIVERY_GATEWAY } from './push-delivery-gateway.interface';

export const pushDeliveryGatewayProvider: Provider = {
  provide: PUSH_DELIVERY_GATEWAY,
  useFactory: (
    config: ConfigService,
    firebase: FirebasePushDeliveryGateway,
    noop: NoopPushDeliveryGateway,
  ) => (config.get<boolean>('push.enabled') === true ? firebase : noop),
  inject: [ConfigService, FirebasePushDeliveryGateway, NoopPushDeliveryGateway],
};
