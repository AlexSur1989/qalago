import { AdCampaignStatus, MonetizationProductType } from '@prisma/client';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AvailabilityService', () => {
  const prisma = {
    adPlacement: { findUnique: jest.fn() },
    adCampaign: { count: jest.fn(), findFirst: jest.fn() },
  } as unknown as PrismaService;

  const service = new AvailabilityService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('33. maxActiveCampaigns enforced', async () => {
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
      id: 'pl-1',
      code: 'HOME_VIP_BANNER',
      isActive: true,
      maxActiveCampaigns: 3,
    });
    prisma.adCampaign.count = jest.fn().mockResolvedValue(3);

    const result = await service.checkAvailability({
      productType: MonetizationProductType.VIP_BANNER,
      cityId: 'city-1',
      desiredStartAt: new Date('2026-09-05'),
      desiredEndAt: new Date('2026-09-12'),
    });

    expect(result.available).toBe(false);
    expect(result.activeCount).toBe(3);
  });

  it('34. overlapping dates count as occupied', async () => {
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
      id: 'pl-1',
      code: 'CATEGORY_TOP',
      isActive: true,
      maxActiveCampaigns: 2,
    });
    prisma.adCampaign.count = jest.fn().mockResolvedValue(2);

    const result = await service.checkAvailability({
      productType: MonetizationProductType.TOP_CATEGORY,
      cityId: 'city-1',
      categoryId: 'cat-1',
      desiredStartAt: new Date('2026-09-06'),
      desiredEndAt: new Date('2026-09-10'),
    });

    expect(result.available).toBe(false);
  });

  it('35. non-overlapping dates may be available', async () => {
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
      id: 'pl-1',
      code: 'HOME_FEATURED',
      isActive: true,
      maxActiveCampaigns: 5,
    });
    prisma.adCampaign.count = jest.fn().mockResolvedValue(1);

    const result = await service.checkAvailability({
      productType: MonetizationProductType.FEATURED_BUSINESS,
      cityId: 'city-1',
      desiredStartAt: new Date('2026-10-01'),
      desiredEndAt: new Date('2026-10-08'),
    });

    expect(result.available).toBe(true);
  });

  it('36. cancelled campaigns are not counted (via status filter in query)', async () => {
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
      id: 'pl-1',
      code: 'HOME_VIP_BANNER',
      isActive: true,
      maxActiveCampaigns: 1,
    });
    prisma.adCampaign.count = jest.fn().mockImplementation(({ where }) => {
      expect(where.status.in).toEqual(['ACTIVE', 'SCHEDULED']);
      return Promise.resolve(0);
    });

    const result = await service.checkAvailability({
      productType: MonetizationProductType.VIP_BANNER,
      cityId: 'city-1',
      desiredStartAt: new Date('2026-09-05'),
      desiredEndAt: new Date('2026-09-12'),
    });

    expect(result.available).toBe(true);
  });

  it('37. city/category isolation for CATEGORY_TOP', async () => {
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
      id: 'pl-1',
      code: 'CATEGORY_TOP',
      isActive: true,
      maxActiveCampaigns: 1,
    });
    prisma.adCampaign.count = jest.fn().mockImplementation(({ where }) => {
      expect(where.cityId).toBe('city-1');
      expect(where.categoryId).toBe('cat-1');
      return Promise.resolve(0);
    });

    await service.checkAvailability({
      productType: MonetizationProductType.TOP_CATEGORY,
      cityId: 'city-1',
      categoryId: 'cat-1',
      desiredStartAt: new Date('2026-09-05'),
      desiredEndAt: new Date('2026-09-12'),
    });

    expect(prisma.adCampaign.count).toHaveBeenCalled();
  });

  it('38. advisory lock invoked in transaction', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(undefined),
    };
    prisma.adPlacement.findUnique = jest.fn().mockResolvedValue({
      id: 'pl-1',
      code: 'HOME_VIP_BANNER',
      isActive: true,
      maxActiveCampaigns: 5,
    });
    prisma.adCampaign.count = jest.fn().mockResolvedValue(0);

    await service.assertAvailableInTransaction(tx as never, {
      productType: MonetizationProductType.VIP_BANNER,
      cityId: 'city-1',
      desiredStartAt: new Date('2026-09-05'),
      desiredEndAt: new Date('2026-09-12'),
    });

    expect(tx.$executeRaw).toHaveBeenCalled();
  });

  it('overlaps helper detects intersection', () => {
    expect(
      service.overlaps(
        new Date('2026-09-01'),
        new Date('2026-09-10'),
        new Date('2026-09-05'),
        new Date('2026-09-15'),
      ),
    ).toBe(true);
    expect(
      service.overlaps(
        new Date('2026-09-01'),
        new Date('2026-09-05'),
        new Date('2026-09-06'),
        new Date('2026-09-15'),
      ),
    ).toBe(false);
  });

  it('31. expired dates resolve to COMPLETED effective status', () => {
    const status = service.resolveEffectiveStatus(
      AdCampaignStatus.ACTIVE,
      new Date('2026-08-01'),
      new Date('2026-08-10'),
      new Date('2026-09-05'),
    );
    expect(status).toBe(AdCampaignStatus.COMPLETED);
  });
});
