import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CampaignStatusService } from './campaign-status.service';

@Injectable()
export class CampaignExpirationScheduler {
  private readonly logger = new Logger(CampaignExpirationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignStatus: CampaignStatusService,
  ) {}

  @Cron('*/5 * * * *')
  async syncExpiredCampaigns() {
    const args = this.campaignStatus.syncExpiredCampaigns();
    const result = await this.prisma.adCampaign.updateMany(args);
    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} campaigns as COMPLETED`);
    }
    return result;
  }
}
