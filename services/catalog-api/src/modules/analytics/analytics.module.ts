import { Module } from '@nestjs/common';
import { CommonAccessModule } from '../../common/common-access.module';
import { PlansModule } from '../plans/plans.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEventsRateLimitGuard } from './guards/analytics-events-rate-limit.guard';

@Module({
  imports: [PlansModule, CommonAccessModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsEventsRateLimitGuard],
})
export class AnalyticsModule {}
