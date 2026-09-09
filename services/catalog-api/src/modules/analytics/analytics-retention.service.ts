import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Stage 6.5 — documented retention policy; cleanup is opt-in via explicit call. */

export const RAW_ANALYTICS_EVENT_RETENTION_DAYS = 90;

@Injectable()
export class AnalyticsRetentionService {
  private readonly logger = new Logger(AnalyticsRetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deletes raw analytics events older than retention window.
   * Daily/dimension rollups are preserved. Not scheduled automatically in Stage 6.5.
   */
  async purgeExpiredRawEvents(retentionDays = RAW_ANALYTICS_EVENT_RETENTION_DAYS): Promise<number> {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays);

    const result = await this.prisma.analyticsEvent.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    this.logger.log(`Purged ${result.count} raw analytics events older than ${retentionDays}d`);
    return result.count;
  }
}
