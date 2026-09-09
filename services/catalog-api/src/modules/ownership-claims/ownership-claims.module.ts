import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  BusinessOwnershipClaimsCreateController,
  OwnershipClaimsController,
} from './ownership-claims.controller';
import { OwnershipClaimsAdminController } from './ownership-claims-admin.controller';
import { OwnershipClaimsService } from './ownership-claims.service';

@Module({
  imports: [NotificationsModule],
  controllers: [
    OwnershipClaimsController,
    BusinessOwnershipClaimsCreateController,
    OwnershipClaimsAdminController,
  ],
  providers: [OwnershipClaimsService],
  exports: [OwnershipClaimsService],
})
export class OwnershipClaimsModule {}
