import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AnalyticsRollupService } from './analytics-rollup.service';

@Injectable()
export class AnalyticsRollupScheduler {
  private readonly logger = new Logger(AnalyticsRollupScheduler.name);

  constructor(private readonly rollupService: AnalyticsRollupService) {}

  /** Daily rollup at 02:15 UTC — covers previous local day for all cities. */
  @Cron('15 2 * * *')
  async handleDailyRollup() {
    this.logger.log('Starting daily analytics rollup');
    await this.rollupService.rollupYesterdayForAllBusinesses();
    this.logger.log('Daily analytics rollup completed');
  }
}
