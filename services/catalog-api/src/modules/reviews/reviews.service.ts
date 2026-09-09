import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessPermission,
  BusinessPlanTier,
  NotificationType,
} from '@prisma/client';
import { publicPlanLabelRu } from '../../common/utils/plan-display.util';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { toMembershipRole } from '../audit-log/audit-log.util';
import { CreateReviewDto, ReplyReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly businessAccess: BusinessAccessService,
    private readonly auditLog: AuditLogService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  findByBusiness(businessId: string) {
    return this.prisma.review.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUser(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: {
        business: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: AuthUser, dto: CreateReviewDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const review = await this.prisma.review.create({
      data: {
        userId: user.id,
        businessId: dto.businessId,
        rating: dto.rating,
        text: dto.text,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    if (business.ownerId) {
      await this.notifications.create({
        userId: business.ownerId,
        type: NotificationType.NEW_REVIEW,
        title: 'Новый отзыв',
        body: `Новый отзыв (${dto.rating}★) на «${business.title}»`,
      });
    }

    return review;
  }

  async reply(user: AuthUser, id: string, dto: ReplyReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { business: { select: { id: true, cityId: true } } },
    });
    if (!review) throw new NotFoundException('Review not found');

    const access = await this.businessAccess.resolveAccess(user, review.business.id);
    if (!access.permissions.includes(BusinessPermission.REVIEWS_REPLY)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const planCtx = await this.planLimits.getBusinessPlanContext(review.business.id);
    if (!planCtx.limits.canReplyToReviews) {
      throw new ForbiddenException(
        `Ответы на отзывы доступны с тарифа «${publicPlanLabelRu(BusinessPlanTier.BASIC)}» и выше.`,
      );
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: { ownerReply: dto.ownerReply },
    });

    await this.auditLog.record({
      actor: user,
      action: AuditAction.REVIEW_REPLY_CREATE,
      resourceType: AuditResourceType.REVIEW,
      resourceId: id,
      businessId: review.business.id,
      cityId: review.business.cityId,
      membershipRole: toMembershipRole(access.accessRole),
      metadata: { reviewId: id },
    });

    await this.notifications.create({
      userId: review.userId,
      type: NotificationType.REVIEW_REPLY,
      title: 'Ответ на отзыв',
      body: dto.ownerReply,
    });

    return updated;
  }
}
