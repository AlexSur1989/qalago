import { Global, Module } from '@nestjs/common';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { CommonAccessModule } from '../../common/common-access.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlansAdminController } from './plans-admin.controller';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Global()
@Module({
  imports: [NotificationsModule, CommonAccessModule],
  controllers: [PlansController, PlansAdminController],
  providers: [PlansService, PlanLimitsService],
  exports: [PlansService, PlanLimitsService],
})
export class PlansModule {}