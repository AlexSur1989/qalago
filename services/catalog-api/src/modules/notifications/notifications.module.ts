import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushDevicesService } from './push-devices.service';
import { FirebasePushDeliveryGateway } from './push/firebase-push-delivery.gateway';
import { NoopPushDeliveryGateway } from './push/noop-push-delivery.gateway';
import { pushDeliveryGatewayProvider } from './push/push-delivery-gateway.provider';
import { PushDeliveryService } from './push/push-delivery.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PushDevicesService,
    PushDeliveryService,
    NoopPushDeliveryGateway,
    FirebasePushDeliveryGateway,
    pushDeliveryGatewayProvider,
  ],
  exports: [NotificationsService, PushDevicesService, PushDeliveryService],
})
export class NotificationsModule {}
