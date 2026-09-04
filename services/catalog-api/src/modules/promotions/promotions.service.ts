import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BusinessPlanTier,
  BusinessStatus,
  Prisma,
  PromotionStatus,
  UserRole,
} from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePromotionDto,
  ListPromotionsQueryDto,
  UpdatePromotionDto,
} from './dto/promotion.dto';

type FeedPromotion = Prisma.PromotionGetPayload<{
  include: {
    business: {
      select: {
        id: true;
        title: true;
        slug: true;
        address: true;
        coverImageUrl: true;
        planTier: true;
        planExpiresAt: true;
        featuredSlot: true;
      };
    };
  };
}>;

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  async findAll(query: ListPromotionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.PromotionWhereInput = {
      business: { status: BusinessStatus.ACTIVE },
    };

    if (query.businessId) {
      where.business = {
        ...(where.business as Prisma.BusinessWhereInput),
        id: query.businessId,
      };
    } else {
      where.business = {
        ...(where.business as Prisma.BusinessWhereInput),
        cityId: await this.cityScope.resolveCityId({
          cityId: query.cityId,
          citySlug: query.citySlug,
        }),
      };
    }

    if (query.activeNow) {
      where.status = PromotionStatus.ACTIVE;
      where.AND = [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ];
      if (!query.businessId) {
        where.business = {
          ...(where.business as Prisma.BusinessWhereInput),
          OR: [
            {
              planTier: BusinessPlanTier.PRO,
              planExpiresAt: { gte: now },
            },
            {
              planTier: BusinessPlanTier.TOP_CITY,
              planExpiresAt: { gte: now },
            },
          ],
        };
      }
    }

    if (query.activeNow && !query.businessId) {
      const rawItems = await this.prisma.promotion.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              title: true,
              slug: true,
              address: true,
              coverImageUrl: true,
              planTier: true,
              planExpiresAt: true,
              featuredSlot: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });

      const filtered = this.applyCityFeedLimits(rawItems, now);
      const items = filtered.slice(skip, skip + limit);

      return {
        items,
        meta: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              title: true,
              slug: true,
              address: true,
              coverImageUrl: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(user: AuthUser, dto: CreatePromotionDto) {
    await this.assertCanManage(user, dto.businessId);

    const status = dto.status ?? PromotionStatus.ACTIVE;
    await this.planLimits.assertCanCreatePromotion(
      dto.businessId,
      status === PromotionStatus.ACTIVE,
    );

    const ctx = await this.planLimits.getBusinessPlanContext(dto.businessId);
    const dates = this.planLimits.resolvePromotionDates(
      ctx.limits,
      dto.startDate,
      dto.endDate,
    );

    return this.prisma.promotion.create({
      data: {
        businessId: dto.businessId,
        title: dto.title,
        description: dto.description,
        discountText: dto.discountText,
        startDate: dates.startDate,
        endDate: dates.endDate,
        status,
      },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdatePromotionDto) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    await this.assertCanManage(user, promo.businessId);

    const ctx = await this.planLimits.getBusinessPlanContext(promo.businessId);
    const nextStatus = dto.status ?? promo.status;

    if (nextStatus === PromotionStatus.ACTIVE && promo.status !== PromotionStatus.ACTIVE) {
      await this.planLimits.assertCanActivatePromotion(promo.businessId, ctx, id);
    }

    const startInput = dto.startDate ?? promo.startDate?.toISOString();
    const endInput = dto.endDate ?? promo.endDate?.toISOString();
    const dates =
      dto.startDate !== undefined || dto.endDate !== undefined || nextStatus === PromotionStatus.ACTIVE
        ? this.planLimits.resolvePromotionDates(ctx.limits, startInput, endInput)
        : null;

    return this.prisma.promotion.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        discountText: dto.discountText,
        status: dto.status,
        startDate: dates?.startDate,
        endDate: dates?.endDate,
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    await this.assertCanManage(user, promo.businessId);
    await this.prisma.promotion.delete({ where: { id } });
    return { success: true };
  }

  private applyCityFeedLimits(items: FeedPromotion[], now: Date) {
    const byBusiness = new Map<string, FeedPromotion[]>();

    for (const item of items) {
      const effectiveTier = this.planLimits.resolveEffectiveTier({
        planTier: item.business.planTier,
        planExpiresAt: item.business.planExpiresAt,
      });
      const feedCap = this.planLimits.getMaxPromotionsInFeed(effectiveTier);
      if (feedCap <= 0) continue;

      const bucket = byBusiness.get(item.businessId) ?? [];
      if (bucket.length < feedCap) {
        bucket.push(item);
        byBusiness.set(item.businessId, bucket);
      }
    }

    const flattened = [...byBusiness.values()].flat();

    return flattened.sort((a, b) => {
      const tierA = this.planLimits.resolveEffectiveTier({
        planTier: a.business.planTier,
        planExpiresAt: a.business.planExpiresAt,
      });
      const tierB = this.planLimits.resolveEffectiveTier({
        planTier: b.business.planTier,
        planExpiresAt: b.business.planExpiresAt,
      });
      const priorityDiff =
        this.planLimits.getFeedPriority(tierB) - this.planLimits.getFeedPriority(tierA);
      if (priorityDiff !== 0) return priorityDiff;

      const slotA = a.business.featuredSlot ?? 999;
      const slotB = b.business.featuredSlot ?? 999;
      if (slotA !== slotB) return slotA - slotB;

      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  private async assertCanManage(user: AuthUser, businessId: string) {
    if (user.role === UserRole.ADMIN || user.role === UserRole.CITY_ADMIN) return;
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!business) throw new NotFoundException('Business not found');
    if (business.ownerId !== user.id) {
      throw new ForbiddenException('Not business owner');
    }
  }
}
