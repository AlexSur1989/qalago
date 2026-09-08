import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto, ReplyReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly businessAccess: BusinessAccessService,
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
      include: { business: { select: { id: true } } },
    });
    if (!review) throw new NotFoundException('Review not found');

    await this.businessAccess.assertCanManageBusiness(user, review.business.id);

    const updated = await this.prisma.review.update({
      where: { id },
      data: { ownerReply: dto.ownerReply },
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
