import { CampaignStatusService } from './campaign-status.service';
import { CampaignExpirationScheduler } from './campaign-expiration.scheduler';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from './availability.service';

describe('CampaignExpirationScheduler', () => {
  it('34. calls updateMany with syncExpiredCampaigns args', async () => {
    const campaignStatus = new CampaignStatusService({} as AvailabilityService);
    const prisma = {
      adCampaign: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    } as unknown as PrismaService;

    const scheduler = new CampaignExpirationScheduler(prisma, campaignStatus);
    const result = await scheduler.syncExpiredCampaigns();

    expect(result.count).toBe(2);
    expect(prisma.adCampaign.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['ACTIVE', 'SCHEDULED'] },
          endAt: { lte: expect.any(Date) },
        }),
        data: { status: 'COMPLETED' },
      }),
    );
  });
});
