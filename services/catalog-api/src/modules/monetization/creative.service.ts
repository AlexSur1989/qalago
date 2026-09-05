import { Injectable } from '@nestjs/common';
import { AdModerationStatus } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { CreateCreativeDto, UpdateCreativeDto } from './dto/monetization.dto';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
} from './errors/monetization.errors';
import { MonetizationAccessService } from './monetization-access.service';

@Injectable()
export class CreativeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: MonetizationAccessService,
    private readonly provisioning: CampaignProvisioningService,
  ) {}

  async create(user: AuthUser, dto: CreateCreativeDto) {
    await this.access.assertCanManageBusiness(user, dto.businessId);

    const creative = await this.prisma.adCreative.create({
      data: {
        businessId: dto.businessId,
        type: dto.type,
        imageUrl: dto.imageUrl,
        title: dto.title,
        description: dto.description,
        buttonText: dto.buttonText,
        targetType: dto.targetType,
        targetId: dto.targetId,
        targetUrl: dto.targetUrl,
        moderationStatus: AdModerationStatus.DRAFT,
      },
    });

    return this.formatCreative(creative);
  }

  async list(user: AuthUser, businessId: string) {
    await this.access.assertCanManageBusiness(user, businessId);
    const creatives = await this.prisma.adCreative.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    return creatives.map((c) => this.formatCreative(c));
  }

  async get(user: AuthUser, id: string) {
    const creative = await this.access.assertCreativeAccess(user, id);
    return this.formatCreative(creative);
  }

  async update(user: AuthUser, id: string, dto: UpdateCreativeDto) {
    const creative = await this.access.assertCreativeAccess(user, id);

    if (
      creative.moderationStatus !== AdModerationStatus.DRAFT &&
      creative.moderationStatus !== AdModerationStatus.REJECTED
    ) {
      monetizationBadRequest(
        MonetizationErrorCode.CREATIVE_NOT_EDITABLE,
        'Creative can only be edited in DRAFT or REJECTED status',
      );
    }

    const updated = await this.prisma.adCreative.update({
      where: { id },
      data: {
        ...dto,
        moderationStatus: AdModerationStatus.DRAFT,
        moderationComment: null,
      },
    });

    return this.formatCreative(updated);
  }

  async approve(user: AuthUser, id: string) {
    await this.access.assertCreativeAccess(user, id);

    const updated = await this.prisma.adCreative.update({
      where: { id },
      data: {
        moderationStatus: AdModerationStatus.APPROVED,
        moderationComment: null,
      },
    });

    await this.provisioning.activateCampaignsForCreative(id);

    return this.formatCreative(updated);
  }

  async reject(user: AuthUser, id: string, comment?: string) {
    await this.access.assertCreativeAccess(user, id);

    const updated = await this.prisma.adCreative.update({
      where: { id },
      data: {
        moderationStatus: AdModerationStatus.REJECTED,
        moderationComment: comment ?? null,
      },
    });

    await this.provisioning.rejectCampaignsForCreative(id);

    return this.formatCreative(updated);
  }

  private formatCreative(creative: {
    id: string;
    businessId: string;
    type: string;
    imageUrl: string | null;
    title: string;
    description: string | null;
    buttonText: string | null;
    targetType: string;
    targetId: string | null;
    targetUrl: string | null;
    moderationStatus: AdModerationStatus;
    moderationComment: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: creative.id,
      businessId: creative.businessId,
      type: creative.type,
      imageUrl: creative.imageUrl,
      title: creative.title,
      description: creative.description,
      buttonText: creative.buttonText,
      targetType: creative.targetType,
      targetId: creative.targetId,
      targetUrl: creative.targetUrl,
      moderationStatus: creative.moderationStatus,
      moderationComment: creative.moderationComment,
      createdAt: creative.createdAt,
      updatedAt: creative.updatedAt,
    };
  }
}
