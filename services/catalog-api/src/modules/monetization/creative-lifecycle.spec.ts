import {
  AdCampaignStatus,
  AdCreativeTargetType,
  AdCreativeType,
  AdModerationStatus,
  MonetizationProductType,
  UserRole,
} from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { CreativeService } from './creative.service';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import {
  assertCampaignCreativeLifecycleInvariant,
  assertCreativeSubmittable,
} from './utils/creative-submit.util';

describe('VIP creative lifecycle', () => {
  const owner = {
    id: 'owner-1',
    sub: 'owner-1',
    role: UserRole.USER,
    phone: '+77000000002',
  } as const;

  const managerNoAds = {
    id: 'mgr-1',
    sub: 'mgr-1',
    role: UserRole.USER,
    phone: '+77000000003',
  } as const;

  const validCreative = {
    id: 'cr-1',
    businessId: 'biz-1',
    type: AdCreativeType.BANNER,
    title: 'AutoDrive Service',
    imageUrl: 'https://cdn.example/banner.jpg',
    buttonText: 'Подробнее',
    targetType: AdCreativeTargetType.BUSINESS,
    targetId: 'biz-1',
    targetUrl: null,
    moderationStatus: AdModerationStatus.DRAFT,
    moderationComment: null,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('assertCreativeSubmittable', () => {
    it('requires image for banner', () => {
      expect(() =>
        assertCreativeSubmittable({ ...validCreative, imageUrl: null }),
      ).toThrow();
    });

    it('allows idempotent pending', () => {
      expect(() =>
        assertCreativeSubmittable({
          ...validCreative,
          moderationStatus: AdModerationStatus.PENDING,
        }),
      ).not.toThrow();
    });
  });

  describe('lifecycle invariant', () => {
    it('forbids PENDING_MODERATION campaign with DRAFT creative', () => {
      expect(() =>
        assertCampaignCreativeLifecycleInvariant({
          campaignStatus: AdCampaignStatus.PENDING_MODERATION,
          creativeStatus: AdModerationStatus.DRAFT,
          requiresCreative: true,
        }),
      ).toThrow(/Invalid lifecycle/);
    });

    it('allows PENDING_MODERATION with PENDING creative', () => {
      expect(() =>
        assertCampaignCreativeLifecycleInvariant({
          campaignStatus: AdCampaignStatus.PENDING_MODERATION,
          creativeStatus: AdModerationStatus.PENDING,
          requiresCreative: true,
        }),
      ).not.toThrow();
    });
  });

  describe('CreativeService.submit', () => {
    const prisma = {
      adCreative: {
        update: jest.fn(),
      },
      business: { findUnique: jest.fn() },
    };
    const access = {
      assertCreativeAccess: jest.fn(),
      assertCanManageBusiness: jest.fn(),
      assertCreativeAccessForAdmin: jest.fn(),
    };
    const provisioning = {
      syncCampaignsOnCreativeSubmitted: jest.fn().mockResolvedValue([]),
      activateCampaignsForCreative: jest.fn(),
      rejectCampaignsForCreative: jest.fn(),
    };
    const auditLog = { record: jest.fn(), recordBusinessAction: jest.fn() };

    const service = new CreativeService(
      prisma as never,
      access as never,
      provisioning as never,
      auditLog as never,
    );

    beforeEach(() => {
      jest.clearAllMocks();
      access.assertCreativeAccess.mockResolvedValue(validCreative);
      access.assertCanManageBusiness.mockResolvedValue(undefined);
      prisma.adCreative.update.mockResolvedValue({
        ...validCreative,
        moderationStatus: AdModerationStatus.PENDING,
      });
    });

    it('OWNER can submit DRAFT', async () => {
      const result = await service.submit(owner, 'cr-1');
      expect(result.moderationStatus).toBe(AdModerationStatus.PENDING);
      expect(provisioning.syncCampaignsOnCreativeSubmitted).toHaveBeenCalledWith('cr-1');
    });

    it('second submit is idempotent', async () => {
      access.assertCreativeAccess.mockResolvedValue({
        ...validCreative,
        moderationStatus: AdModerationStatus.PENDING,
      });
      const result = await service.submit(owner, 'cr-1');
      expect(result.moderationStatus).toBe(AdModerationStatus.PENDING);
      expect(prisma.adCreative.update).not.toHaveBeenCalled();
    });

    it('manager without ADS_MANAGE denied', async () => {
      access.assertCanManageBusiness.mockRejectedValue(new ForbiddenException());
      await expect(service.submit(managerNoAds, 'cr-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('CreativeService.approve/reject guards', () => {
    const prisma = {
      adCreative: { update: jest.fn() },
      business: { findUnique: jest.fn().mockResolvedValue({ cityId: 'city-1' }) },
    };
    const access = {
      assertCreativeAccess: jest.fn(),
    };
    const provisioning = {
      syncCampaignsOnCreativeSubmitted: jest.fn(),
      activateCampaignsForCreative: jest.fn().mockResolvedValue([]),
      rejectCampaignsForCreative: jest.fn(),
    };
    const auditLog = { record: jest.fn(), recordBusinessAction: jest.fn() };

    const service = new CreativeService(
      prisma as never,
      access as never,
      provisioning as never,
      auditLog as never,
    );

    beforeEach(() => {
      jest.clearAllMocks();
      access.assertCreativeAccess.mockResolvedValue({
        ...validCreative,
        moderationStatus: AdModerationStatus.DRAFT,
      });
    });

    it('admin cannot approve DRAFT', async () => {
      await expect(service.approve(owner, 'cr-1')).rejects.toMatchObject({
        response: { code: 'CREATIVE_NOT_SUBMITTED' },
      });
    });

    it('admin cannot reject DRAFT', async () => {
      await expect(service.reject(owner, 'cr-1', 'no')).rejects.toMatchObject({
        response: { code: 'CREATIVE_NOT_SUBMITTED' },
      });
    });
  });

  describe('CampaignProvisioningService.syncCampaignsOnCreativeSubmitted', () => {
    const prisma = {
      adCampaign: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    const service = new CampaignProvisioningService(
      prisma as never,
      {} as never,
      {} as never,
    );

    it('promotes SCHEDULED VIP campaign to PENDING_MODERATION', async () => {
      prisma.adCampaign.findMany.mockResolvedValue([
        { id: 'camp-1', status: AdCampaignStatus.SCHEDULED },
      ]);
      prisma.adCampaign.update.mockResolvedValue({
        id: 'camp-1',
        status: AdCampaignStatus.PENDING_MODERATION,
      });

      const rows = await service.syncCampaignsOnCreativeSubmitted('cr-1');
      expect(rows).toHaveLength(1);
      expect(prisma.adCampaign.update).toHaveBeenCalledWith({
        where: { id: 'camp-1' },
        data: { status: AdCampaignStatus.PENDING_MODERATION },
      });
    });
  });
});
