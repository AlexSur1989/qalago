import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SafetyModule } from '../safety/safety.module';
import { BusinessApplicationsController } from './business-applications.controller';
import { BusinessApplicationsAdminController } from './business-applications-admin.controller';
import { BusinessApplicationsService } from './business-applications.service';

@Module({
  imports: [NotificationsModule, SafetyModule],
  controllers: [BusinessApplicationsController, BusinessApplicationsAdminController],
  providers: [BusinessApplicationsService],
  exports: [BusinessApplicationsService],
})
export class BusinessApplicationsModule {}
