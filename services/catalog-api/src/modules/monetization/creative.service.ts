import { Injectable } from '@nestjs/common';
import {
  AdModerationStatus,
  AuditAction,
  AuditResourceType,
  NotificationTargetType,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { loadPrimaryCityPresentationByBusinessId } from '../../common/utils/business-primary-city-presentation.util';
import { resolveBusinessAuditCityId } from '../../common/utils/business-context-city.util';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { sanitizePublicReasonForPayload } from '@qalago/notification-presentation';
import { NotificationsService } from '../notifications/notifications.service';
import { CampaignProvisioningService } from './campaign-provisioning.service';
import { CreateCreativeDto, UpdateCreativeDto } from './dto/monetization.dto';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
} from './errors/monetization.errors';
import { MonetizationAccessService } from './monetization-access.service';
import { assertCreativeSubmittable } from './utils/creative-submit.util';

@Injectable()
export class CreativeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: MonetizationAccessService,
    private readonly provisioning: CampaignProvisioningService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
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

    await this.auditLog.recordBusinessAction(user, dto.businessId, {
      action: AuditAction.AD_CREATIVE_CREATE,
      resourceType: AuditResourceType.AD_CREATIVE,
      resourceId: creative.id,
      metadata: { title: dto.title },
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

  async listAdminCreatives(
    user: AuthUser,
    params: {
      citySlug?: string;
      moderationStatus?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const cityId = await this.access.resolveAdminCityFilter(user, params.citySlug);
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: Prisma.AdCreativeWhereInput = {};
    if (cityId) {
      where.business = { locations: { some: { cityId } } };
    }
    if (params.moderationStatus) {
      where.moderationStatus = params.moderationStatus as AdModerationStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.adCreative.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.adCreative.count({ where }),
    ]);

    const primaryCityByBusinessId = await loadPrimaryCityPresentationByBusinessId(
      this.prisma,
      items.map((row) => row.business.id),
    );

    return {
      items: items.map((c) => {
        const city = primaryCityByBusinessId.get(c.business.id);
        return {
          ...this.formatCreative(c),
          business: {
            ...c.business,
            city: city ? { slug: city.slug, nameRu: city.nameRu } : null,
          },
        };
      }),
      total,
      page,
      limit,
    };
  }

  async getAdminCreative(user: AuthUser, id: string) {
    const creative = await this.access.assertCreativeAccess(user, id);
    const full = await this.prisma.adCreative.findUniqueOrThrow({
      where: { id: creative.id },
      include: {
        business: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    const primaryCityMap = await loadPrimaryCityPresentationByBusinessId(this.prisma, [
      full.business.id,
    ]);
    const city = primaryCityMap.get(full.business.id);
    return {
      ...this.formatCreative(full),
      business: {
        ...full.business,
        city: city ? { slug: city.slug, nameRu: city.nameRu } : null,
      },
    };
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

  async submit(user: AuthUser, id: string) {
    const creative = await this.access.assertCreativeAccess(user, id);
    await this.access.assertCanManageBusiness(user, creative.businessId);

    if (creative.moderationStatus === AdModerationStatus.PENDING) {
      return this.formatCreative(creative);
    }

    assertCreativeSubmittable(creative);

    const updated = await this.prisma.adCreative.update({
      where: { id },
      data: {
        moderationStatus: AdModerationStatus.PENDING,
        moderationComment: null,
      },
    });

    await this.provisioning.syncCampaignsOnCreativeSubmitted(id);

    return this.formatCreative(updated);
  }

  async approve(user: AuthUser, id: string) {
    const scope = await this.access.assertCreativeAccess(user, id);

    if (scope.moderationStatus !== AdModerationStatus.PENDING) {
      monetizationBadRequest(
        MonetizationErrorCode.CREATIVE_NOT_SUBMITTED,
        'Only creatives pending moderation can be approved',
      );
    }

    const updated = await this.prisma.adCreative.update({
      where: { id },
      data: {
        moderationStatus: AdModerationStatus.APPROVED,
        moderationComment: null,
      },
    });

    await this.provisioning.activateCampaignsForCreative(id);

    const auditCityId = await resolveBusinessAuditCityId(this.prisma, scope.businessId);

    await this.auditLog.record({
      actor: user,
      action: AuditAction.AD_CREATIVE_APPROVE,
      resourceType: AuditResourceType.AD_CREATIVE,
      resourceId: id,
      businessId: scope.businessId,
      cityId: auditCityId,
      metadata: { creativeId: id },
    });

    await this.notifyCreativeModerationOutcome({
      businessId: scope.businessId,
      creativeId: id,
      approved: true,
    });

    return this.formatCreative(updated);
  }

  async reject(user: AuthUser, id: string, comment?: string) {
    const scope = await this.access.assertCreativeAccess(user, id);

    if (scope.moderationStatus !== AdModerationStatus.PENDING) {
      monetizationBadRequest(
        MonetizationErrorCode.CREATIVE_NOT_SUBMITTED,
        'Only creatives pending moderation can be rejected',
      );
    }

    const updated = await this.prisma.adCreative.update({
      where: { id },
      data: {
        moderationStatus: AdModerationStatus.REJECTED,
        moderationComment: comment ?? null,
      },
    });

    await this.provisioning.rejectCampaignsForCreative(id);

    const auditCityId = await resolveBusinessAuditCityId(this.prisma, scope.businessId);

    await this.auditLog.record({
      actor: user,
      action: AuditAction.AD_CREATIVE_REJECT,
      resourceType: AuditResourceType.AD_CREATIVE,
      resourceId: id,
      businessId: scope.businessId,
      cityId: auditCityId,
      metadata: { creativeId: id, hasComment: !!comment },
    });

    await this.notifyCreativeModerationOutcome({
      businessId: scope.businessId,
      creativeId: id,
      approved: false,
      publicComment: comment?.trim() || undefined,
    });

    return this.formatCreative(updated);
  }

  private async notifyCreativeModerationOutcome(params: {
    businessId: string;
    creativeId: string;
    approved: boolean;
    publicComment?: string;
  }) {
    const business = await this.prisma.business.findUnique({
      where: { id: params.businessId },
      select: { ownerId: true, title: true },
    });
    if (!business?.ownerId) return;

    const campaign = await this.prisma.adCampaign.findFirst({
      where: { creativeId: params.creativeId },
      select: { id: true },
    });

    const type = params.approved
      ? NotificationType.AD_CAMPAIGN_APPROVED
      : NotificationType.AD_CAMPAIGN_REJECTED;

    await this.notifications.create({
      userId: business.ownerId,
      type,
      title: params.approved ? 'Рекламный креатив одобрен' : 'Рекламный креатив отклонён',
      body: params.approved
        ? `Креатив для «${business.title}» прошёл модерацию.`
        : params.publicComment
          ? `Креатив для «${business.title}» отклонён: ${params.publicComment}`
          : `Креатив для «${business.title}» отклонён модерацией.`,
      targetType: NotificationTargetType.AD_CAMPAIGN,
      targetId: campaign?.id ?? params.creativeId,
      payload: {
        businessId: params.businessId,
        creativeId: params.creativeId,
        businessName: business.title,
        ...(params.publicComment
          ? { publicReason: sanitizePublicReasonForPayload(params.publicComment) }
          : {}),
        ...(campaign?.id ? { campaignId: campaign.id } : {}),
      },
    });
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
