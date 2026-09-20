import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  AuditResourceType,
  BusinessPermission,
  BusinessPlanTier,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { publicReviewWhere } from '../../common/constants/review.constants';
import { publicPlanLabelRu } from '../../common/utils/plan-display.util';
import { BusinessAccessService } from '../../common/services/business-access.service';
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
  resolvePublicReviewsPageLimit,
} from './dto/review.dto';
import { ReviewErrorCode } from './review-errors';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly businessAccess: BusinessAccessService,
    private readonly auditLog: AuditLogService,
    private readonly planLimits: PlanLimitsService,
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
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
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

    try {
      const review = await this.prisma.review.create({
        data: {
          userId: user.id,
          businessId: dto.businessId,
          rating: dto.rating,
          text: dto.text,
        },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
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
