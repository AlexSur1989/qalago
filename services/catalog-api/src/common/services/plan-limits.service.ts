import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessPlanTier, NotificationType, PromotionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
export interface PlanLimits {
  maxPhotos: number | null;
  maxActivePromotions: number;
  maxPromotionsInFeed: number;
  maxPromotionDurationDays: number;
  maxPromotionsCreatedPerDay: number;
  maxAnalyticsDays: number;
  vipBadge: boolean;
  topCitySlot: boolean;
  feedPriority: number;
}

export interface PlanCatalogItem {
  tier: BusinessPlanTier;
  slug: string;
  nameRu: string;
  priceKzt: number;
  periodDays: number | null;
  features: string[];
  limits: PlanLimits;
}

export const PLAN_CATALOG: PlanCatalogItem[] = [
  {
    tier: BusinessPlanTier.BASIC,
    slug: 'basic',
    nameRu: 'Базовый',
    priceKzt: 0,
    periodDays: null,
    features: [
      'Карточка заведения в каталоге',
      'До 5 фото',
      '1 активная акция (до 14 дней)',
      'Акция только на карточке, не в ленте города',
      'Статистика за 7 дней',
    ],
    limits: {
      maxPhotos: 5,
      maxActivePromotions: 1,
      maxPromotionsInFeed: 0,
      maxPromotionDurationDays: 14,
      maxPromotionsCreatedPerDay: 1,
      maxAnalyticsDays: 7,
      vipBadge: false,
      topCitySlot: false,
      feedPriority: 0,
    },
  },
  {
    tier: BusinessPlanTier.PRO,
    slug: 'pro',
    nameRu: 'Pro',
    priceKzt: 9900,
    periodDays: 30,
    features: [
      'VIP-метка в выдаче',
      'Неограниченные фото',
      'До 5 активных акций (до 90 дней)',
      'До 2 акций одновременно в ленте города',
      'Расширенная аналитика (90 дней)',
    ],
    limits: {
      maxPhotos: null,
      maxActivePromotions: 5,
      maxPromotionsInFeed: 2,
      maxPromotionDurationDays: 90,
      maxPromotionsCreatedPerDay: 3,
      maxAnalyticsDays: 90,
      vipBadge: true,
      topCitySlot: false,
      feedPriority: 1,
    },
  },
  {
    tier: BusinessPlanTier.TOP_CITY,
    slug: 'top-city',
    nameRu: 'Топ города',
    priceKzt: 19900,
    periodDays: 30,
    features: [
      'Всё из Pro',
      'Закрепление в топе категории',
      'До 10 активных акций',
      'До 5 акций в ленте города с приоритетом',
      'Приоритет в выдаче города',
    ],
    limits: {
      maxPhotos: null,
      maxActivePromotions: 10,
      maxPromotionsInFeed: 5,
      maxPromotionDurationDays: 90,
      maxPromotionsCreatedPerDay: 5,
      maxAnalyticsDays: 90,
      vipBadge: true,
      topCitySlot: true,
      feedPriority: 2,
    },
  },
];

@Injectable()
export class PlanLimitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  getCatalog(): PlanCatalogItem[] {
    return PLAN_CATALOG;
  }

  getCatalogItem(tier: BusinessPlanTier): PlanCatalogItem {
    const item = PLAN_CATALOG.find((plan) => plan.tier === tier);
    if (!item) {
      throw new NotFoundException('Plan not found');
    }
    return item;
  }

  resolveEffectiveTier(business: {
    planTier: BusinessPlanTier;
    planExpiresAt: Date | null;
  }): BusinessPlanTier {
    if (business.planTier === BusinessPlanTier.BASIC) {
      return BusinessPlanTier.BASIC;
    }
    if (business.planExpiresAt && business.planExpiresAt < new Date()) {
      return BusinessPlanTier.BASIC;
    }
    return business.planTier;
  }

  getLimits(tier: BusinessPlanTier): PlanLimits {
    return this.getCatalogItem(tier).limits;
  }

  async getBusinessPlanContext(businessId: string) {
    await this.syncExpiredPlan(businessId);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        planTier: true,
        planExpiresAt: true,
        isFeatured: true,
        featuredSlot: true,
        _count: {
          select: {
            images: true,
            promotions: {
              where: { status: PromotionStatus.ACTIVE },
            },
          },
        },
      },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const effectiveTier = this.resolveEffectiveTier(business);
    const limits = this.getLimits(effectiveTier);
    const catalogItem = this.getCatalogItem(effectiveTier);

    return {
      businessId,
      tier: business.planTier,
      effectiveTier,
      expiresAt: business.planExpiresAt,
      isFeatured: business.isFeatured,
      featuredSlot: business.featuredSlot,
      catalog: catalogItem,
      limits,
      usage: {
        photos: business._count.images,
        activePromotions: business._count.promotions,
      },
    };
  }

  async assertCanAddPhoto(businessId: string) {
    const ctx = await this.getBusinessPlanContext(businessId);
    const max = ctx.limits.maxPhotos;
    if (max != null && ctx.usage.photos >= max) {
      throw new ForbiddenException(
        `Лимит тарифа «${ctx.catalog.nameRu}»: не более ${max} фото. Улучшите тариф в кабинете.`,
      );
    }
  }

  async assertCanCreatePromotion(businessId: string, activate = true) {
    const ctx = await this.getBusinessPlanContext(businessId);

    const createdToday = await this.countPromotionsCreatedToday(businessId);
    if (createdToday >= ctx.limits.maxPromotionsCreatedPerDay) {
      throw new ForbiddenException(
        `Лимит тарифа «${ctx.catalog.nameRu}»: не более ${ctx.limits.maxPromotionsCreatedPerDay} новых акций в день.`,
      );
    }

    if (activate) {
      await this.assertCanActivatePromotion(businessId, ctx);
    }
  }

  async assertCanActivatePromotion(
    businessId: string,
    ctx?: Awaited<ReturnType<PlanLimitsService['getBusinessPlanContext']>>,
    excludePromotionId?: string,
  ) {
    const plan = ctx ?? (await this.getBusinessPlanContext(businessId));
    const activeCount = await this.prisma.promotion.count({
      where: {
        businessId,
        status: PromotionStatus.ACTIVE,
        ...(excludePromotionId ? { id: { not: excludePromotionId } } : {}),
      },
    });

    if (activeCount >= plan.limits.maxActivePromotions) {
      throw new ForbiddenException(
        `Лимит тарифа «${plan.catalog.nameRu}»: не более ${plan.limits.maxActivePromotions} активных акций. Улучшите тариф в кабинете.`,
      );
    }
  }

  resolvePromotionDates(
    limits: PlanLimits,
    startDate?: string | Date | null,
    endDate?: string | Date | null,
  ): { startDate: Date; endDate: Date } {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : this.addDays(start, limits.maxPromotionDurationDays);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new ForbiddenException('Некорректные даты акции');
    }
    if (end < start) {
      throw new ForbiddenException('Дата окончания акции не может быть раньше начала');
    }

    const spanDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (spanDays > limits.maxPromotionDurationDays) {
      throw new ForbiddenException(
        `Максимальная длительность акции на вашем тарифе: ${limits.maxPromotionDurationDays} дней.`,
      );
    }

    return { startDate: start, endDate: end };
  }

  async archiveExcessPromotions(businessId: string) {
    const ctx = await this.getBusinessPlanContext(businessId);
    const max = ctx.limits.maxActivePromotions;

    const active = await this.prisma.promotion.findMany({
      where: { businessId, status: PromotionStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (active.length <= max) return;

    const excessIds = active.slice(max).map((p) => p.id);
    await this.prisma.promotion.updateMany({
      where: { id: { in: excessIds } },
      data: { status: PromotionStatus.DRAFT },
    });
  }

  async capAnalyticsDays(businessId: string, requestedDays: number): Promise<number> {
    const ctx = await this.getBusinessPlanContext(businessId);
    return Math.min(requestedDays, ctx.limits.maxAnalyticsDays);
  }

  isPaidTier(tier: BusinessPlanTier): boolean {
    return tier === BusinessPlanTier.PRO || tier === BusinessPlanTier.TOP_CITY;
  }

  getFeedPriority(tier: BusinessPlanTier): number {
    return this.getLimits(tier).feedPriority;
  }

  getMaxPromotionsInFeed(tier: BusinessPlanTier): number {
    return this.getLimits(tier).maxPromotionsInFeed;
  }

  async syncExpiredPlan(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        planTier: true,
        planExpiresAt: true,
        title: true,
        ownerId: true,
      },
    });
    if (!business) return;

    const expired =
      business.planTier !== BusinessPlanTier.BASIC &&
      business.planExpiresAt != null &&
      business.planExpiresAt < new Date();
    if (!expired) return;

    const previousTier = business.planTier;
    const planName = this.getCatalogItem(previousTier).nameRu;

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        planTier: BusinessPlanTier.BASIC,
        planExpiresAt: null,
        isFeatured: false,
        featuredSlot: null,
      },
    });

    await this.archiveExcessPromotions(businessId);

    if (business.ownerId) {
      await this.notifications.create({
        userId: business.ownerId,
        type: NotificationType.PLAN_EXPIRED,
        title: 'Тариф истёк',
        body: `Тариф «${planName}» для «${business.title}» завершён. Заведение переведено на Базовый.`,
      });
    }
  }

  private async countPromotionsCreatedToday(businessId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return this.prisma.promotion.count({
      where: { businessId, createdAt: { gte: startOfDay } },
    });
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
}
