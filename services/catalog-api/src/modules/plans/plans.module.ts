import { Global, Module } from '@nestjs/common';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Global()
@Module({
  imports: [NotificationsModule],
  controllers: [PlansController],
  providers: [PlansService, PlanLimitsService],
  exports: [PlansService, PlanLimitsService],
})
export class PlansModule {}