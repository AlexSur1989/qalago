import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessMembershipRole,
  BusinessPermission,
  BusinessPlanTier,
  NotificationTargetType,
  NotificationType,
  Prisma,
} from '@prisma/client';
import {
  activeUserReviewWhere,
  publicReviewWhere,
} from '../../common/constants/review.constants';
import { publicPlanLabelRu } from '../../common/utils/plan-display.util';
import { normalizeReviewText } from '../../common/utils/review-text.util';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { BusinessMembershipService } from '../../common/services/business-membership.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { toMembershipRole } from '../audit-log/audit-log.util';
import {
  CreateReviewDto,
  ListReviewsQueryDto,
  ReplyReviewDto,
  UpdateReviewDto,
  resolvePublicReviewsPageLimit,
} from './dto/review.dto';
import { ReviewErrorCode } from './review-errors';
import { ReviewRateLimitService } from './review-rate-limit.service';

const reviewAuthorInclude = {
  user: { select: { id: true, name: true, avatarUrl: true } },
} as const;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly businessAccess: BusinessAccessService,
    private readonly membership: BusinessMembershipService,
    private readonly auditLog: AuditLogService,
    private readonly planLimits: PlanLimitsService,
    private readonly reviewRateLimit: ReviewRateLimitService,
  ) {}

  async findByBusiness(query: ListReviewsQueryDto) {
    const { page, limit } = resolvePublicReviewsPageLimit(query);
    const where: Prisma.ReviewWhereInput = {
      businessId: query.businessId,
      ...publicReviewWhere(),
    };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: reviewAuthorInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  findByUser(userId: string) {
    return this.prisma.review.findMany({
      where: activeUserReviewWhere(userId),
      include: {
        business: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: AuthUser, dto: CreateReviewDto) {
    this.reviewRateLimit.assertCanMutateReview(user.id);

    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    await this.assertCanSubmitConsumerReview(user.id, business.id, business.ownerId);

    const text = normalizeReviewText(dto.text);

    const existing = await this.prisma.review.findUnique({
      where: { userId_businessId: { userId: user.id, businessId: dto.businessId } },
    });

    if (existing) {
      if (existing.deletedAt === null) {
        throw new ConflictException({
          message: 'Review already exists',
          code: ReviewErrorCode.REVIEW_ALREADY_EXISTS,
        });
      }

      const restored = await this.prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: dto.rating,
          text: text ?? null,
          deletedAt: null,
        },
        include: reviewAuthorInclude,
      });

      await this.auditLog.record({
        actor: user,
        action: AuditAction.REVIEW_RESTORE,
        resourceType: AuditResourceType.REVIEW,
        resourceId: restored.id,
        businessId: business.id,
        cityId: business.cityId,
        metadata: {
          businessId: business.id,
          rating: dto.rating,
          moderationHidden: restored.moderationHidden,
        },
      });

      if (!restored.moderationHidden && business.ownerId) {
        await this.notifications.create({
          userId: business.ownerId,
          type: NotificationType.NEW_REVIEW,
          title: 'Новый отзыв',
          body: `Новый отзыв (${dto.rating}★) на «${business.title}»`,
          targetType: NotificationTargetType.REVIEW,
          targetId: restored.id,
          payload: { businessId: business.id, reviewId: restored.id },
        });
      }

      return restored;
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          userId: user.id,
          businessId: dto.businessId,
          rating: dto.rating,
          text: text ?? null,
        },
        include: reviewAuthorInclude,
      });

      await this.auditLog.record({
        actor: user,
        action: AuditAction.REVIEW_CREATE,
        resourceType: AuditResourceType.REVIEW,
        resourceId: review.id,
        businessId: business.id,
        cityId: business.cityId,
        metadata: { businessId: business.id, rating: dto.rating },
      });

      if (business.ownerId) {
        await this.notifications.create({
          userId: business.ownerId,
          type: NotificationType.NEW_REVIEW,
          title: 'Новый отзыв',
          body: `Новый отзыв (${dto.rating}★) на «${business.title}»`,
          targetType: NotificationTargetType.REVIEW,
          targetId: review.id,
          payload: { businessId: business.id, reviewId: review.id },
        });
      }

      return review;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          message: 'Review already exists',
          code: ReviewErrorCode.REVIEW_ALREADY_EXISTS,
        });
      }
      throw error;
    }
  }

  async update(user: AuthUser, id: string, dto: UpdateReviewDto) {
    this.reviewRateLimit.assertCanMutateReview(user.id);

    const review = await this.findOwnedActiveReview(user.id, id);
    const text = normalizeReviewText(dto.text);
    const priorRating = review.rating;

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        ...(dto.text !== undefined ? { text: text ?? null } : {}),
      },
      include: reviewAuthorInclude,
    });

    await this.auditLog.record({
      actor: user,
      action: AuditAction.REVIEW_UPDATE,
      resourceType: AuditResourceType.REVIEW,
      resourceId: id,
      businessId: review.businessId,
      metadata: {
        businessId: review.businessId,
        ratingBefore: priorRating,
        ratingAfter: dto.rating,
        moderationHidden: review.moderationHidden,
      },
    });

    return updated;
  }

  async softDelete(user: AuthUser, id: string) {
    this.reviewRateLimit.assertCanMutateReview(user.id);

    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review || review.userId !== user.id) {
      throw new NotFoundException('Review not found');
    }

    if (review.deletedAt !== null) {
      return { success: true, id: review.id, deletedAt: review.deletedAt };
    }

    const deletedAt = new Date();
    await this.prisma.review.update({
      where: { id },
      data: { deletedAt },
    });

    await this.auditLog.record({
      actor: user,
      action: AuditAction.REVIEW_DELETE,
      resourceType: AuditResourceType.REVIEW,
      resourceId: id,
      businessId: review.businessId,
      metadata: { businessId: review.businessId, rating: review.rating },
    });

    return { success: true, id: review.id, deletedAt };
  }

  async reply(user: AuthUser, id: string, dto: ReplyReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { business: { select: { id: true, cityId: true } } },
    });
    if (!review || review.deletedAt !== null) {
      throw new NotFoundException('Review not found');
    }

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
      targetType: NotificationTargetType.REVIEW,
      targetId: review.id,
      payload: { businessId: review.business.id, reviewId: review.id },
    });

    return updated;
  }

  private async assertCanSubmitConsumerReview(
    userId: string,
    businessId: string,
    legacyOwnerId: string | null,
  ) {
    if (await this.membership.hasActiveOwnerAccess(userId, businessId, legacyOwnerId)) {
      throw new ForbiddenException({
        message: 'Cannot review your own business',
        code: ReviewErrorCode.REVIEW_SELF_REVIEW_FORBIDDEN,
      });
    }

    const membership = await this.membership.getActiveMembership(userId, businessId);
    if (membership?.role === BusinessMembershipRole.MANAGER) {
      throw new ForbiddenException({
        message: 'Cannot review a business you manage',
        code: ReviewErrorCode.REVIEW_SELF_REVIEW_FORBIDDEN,
      });
    }
  }

  private async findOwnedActiveReview(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review || review.userId !== userId) {
      throw new NotFoundException('Review not found');
    }
    if (review.deletedAt !== null) {
      throw new BadRequestException({
        message: 'Review is not active',
        code: ReviewErrorCode.REVIEW_NOT_ACTIVE,
      });
    }
    return review;
  }
}
