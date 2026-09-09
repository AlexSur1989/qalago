import { Module } from '@nestjs/common';
import { CommonAccessModule } from '../../common/common-access.module';
import { PlansModule } from '../plans/plans.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRetentionService } from './analytics-retention.service';
import { AnalyticsRollupScheduler } from './analytics-rollup.scheduler';
import { AnalyticsRollupService } from './analytics-rollup.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEventsRateLimitGuard } from './guards/analytics-events-rate-limit.guard';

@Module({
  imports: [PlansModule, CommonAccessModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsRollupService,
    AnalyticsRollupScheduler,
    AnalyticsRetentionService,
    AnalyticsEventsRateLimitGuard,
  ],
  exports: [AnalyticsRollupService, AnalyticsRetentionService],
})
export class AnalyticsModule {}
