import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessPlanTier, NotificationType, PromotionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';

export type AnalyticsTier = 'BASIC' | 'EXTENDED' | 'FULL';
export type SupportPriority = 'STANDARD' | 'PRIORITY' | 'HIGHEST';
export type ModerationPriority = 'STANDARD' | 'PRIORITY' | 'HIGHEST';

export interface PlanLimits {
  maxPhotos: number;
  maxServiceItems: number;
  maxActivePromotions: number;
  maxPromotionDurationDays: number;
  maxPromotionsCreatedPerDay: number;
  maxAnalyticsDays: number;
  advertisingDiscountPercent: number;
  analyticsTier: AnalyticsTier;
  supportPriority: SupportPriority;
  moderationPriority: ModerationPriority;
  showPlanBadge: boolean;
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
    tier: BusinessPlanTier.FREE,
    slug: 'free',
    nameRu: 'Free',
    priceKzt: 0,
    periodDays: null,
    features: [
      'Карточка заведения в каталоге',
      'До 5 фото',
      'До 10 товаров и услуг',
      '1 активная акция',
      'Базовая статистика',
    ],
    limits: {
      maxPhotos: 5,
      maxServiceItems: 10,
      maxActivePromotions: 1,
      maxPromotionDurationDays: 14,
      maxPromotionsCreatedPerDay: 1,
      maxAnalyticsDays: 7,
      advertisingDiscountPercent: 0,
      analyticsTier: 'BASIC',
      supportPriority: 'STANDARD',
      moderationPriority: 'STANDARD',
      showPlanBadge: false,
    },
  },
  {
    tier: BusinessPlanTier.BASIC,
    slug: 'basic',
    nameRu: 'Basic',
    priceKzt: 4900,
    periodDays: 30,
    features: [
      'До 15 фото',
      'До 30 товаров и услуг',
      '3 активные акции',
      'Расширенная статистика',
      '5% скидка на рекламу',
    ],
    limits: {
      maxPhotos: 15,
      maxServiceItems: 30,
      maxActivePromotions: 3,
      maxPromotionDurationDays: 30,
      maxPromotionsCreatedPerDay: 2,
      maxAnalyticsDays: 30,
      advertisingDiscountPercent: 5,
      analyticsTier: 'EXTENDED',
      supportPriority: 'STANDARD',
      moderationPriority: 'STANDARD',
      showPlanBadge: true,
    },
  },
  {
    tier: BusinessPlanTier.PREMIUM,
    slug: 'premium',
    nameRu: 'Premium',
    priceKzt: 9900,
    periodDays: 30,
    features: [
      'До 40 фото',
      'До 100 товаров и услуг',
      '10 активных акций',
      'Полная статистика',
      '10% скидка на рекламу',
      'Приоритетная поддержка',
    ],
    limits: {
      maxPhotos: 40,
      maxServiceItems: 100,
      maxActivePromotions: 10,
      maxPromotionDurationDays: 90,
      maxPromotionsCreatedPerDay: 5,
      maxAnalyticsDays: 365,
      advertisingDiscountPercent: 10,
      analyticsTier: 'FULL',
      supportPriority: 'PRIORITY',
      moderationPriority: 'PRIORITY',
      showPlanBadge: true,
    },
  },
  {
    tier: BusinessPlanTier.VIP,
    slug: 'vip',
    nameRu: 'VIP',
    priceKzt: 19900,
    periodDays: 30,
    features: [
      'До 100 фото',
      'До 300 товаров и услуг',
      '25 активных акций',
      'Полная статистика',
      '15% скидка на рекламу',
      'Максимальный приоритет поддержки и модерации',
    ],
    limits: {
      maxPhotos: 100,
      maxServiceItems: 300,
      maxActivePromotions: 25,
      maxPromotionDurationDays: 90,
      maxPromotionsCreatedPerDay: 10,
      maxAnalyticsDays: 365,
      advertisingDiscountPercent: 15,
      analyticsTier: 'FULL',
      supportPriority: 'HIGHEST',
      moderationPriority: 'HIGHEST',
      showPlanBadge: true,
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
    if (business.planTier === BusinessPlanTier.FREE) {
      return BusinessPlanTier.FREE;
    }
    if (business.planExpiresAt && business.planExpiresAt < new Date()) {
      return BusinessPlanTier.FREE;
    }
    return business.planTier;
  }

  getLimits(tier: BusinessPlanTier): PlanLimits {
    return this.getCatalogItem(tier).limits;
  }

  getAdvertisingDiscountPercent(tier: BusinessPlanTier): number {
    return this.getLimits(tier).advertisingDiscountPercent;
  }

  hasFullAnalytics(tier: BusinessPlanTier): boolean {
    return this.getLimits(tier).analyticsTier === 'FULL';
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
            serviceItems: true,
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
        serviceItems: business._count.serviceItems,
        activePromotions: business._count.promotions,
      },
    };
  }

  async assertCanAddPhoto(businessId: string) {
    const ctx = await this.getBusinessPlanContext(businessId);
    const max = ctx.limits.maxPhotos;
    if (ctx.usage.photos >= max) {
      throw new ForbiddenException(
        `Лимит тарифа «${ctx.catalog.nameRu}»: не более ${max} фото. Посмотрите тарифы в кабинете.`,
      );
    }
  }

  async assertCanAddServiceItem(businessId: string) {
    const ctx = await this.getBusinessPlanContext(businessId);
    const max = ctx.limits.maxServiceItems;
    if (ctx.usage.serviceItems >= max) {
      throw new ForbiddenException(
        `Лимит тарифа «${ctx.catalog.nameRu}»: не более ${max} товаров и услуг. Посмотрите тарифы в кабинете.`,
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
        `Лимит тарифа «${plan.catalog.nameRu}»: не более ${plan.limits.maxActivePromotions} активных акций. Посмотрите тарифы в кабинете.`,
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

  getAnalyticsTier(tier: BusinessPlanTier): AnalyticsTier {
    return this.getLimits(tier).analyticsTier;
  }

  getAnalyticsCapabilities(tier: BusinessPlanTier) {
    const analyticsTier = this.getAnalyticsTier(tier);
    const maxDays = this.getLimits(tier).maxAnalyticsDays;
    return {
      tier: analyticsTier,
      maxDays,
      summary: true,
      trends: analyticsTier !== 'BASIC',
    };
  }

  isPaidTier(tier: BusinessPlanTier): boolean {
    return tier !== BusinessPlanTier.FREE;
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
      business.planTier !== BusinessPlanTier.FREE &&
      business.planExpiresAt != null &&
      business.planExpiresAt < new Date();
    if (!expired) return;

    const previousTier = business.planTier;
    const planName = this.getCatalogItem(previousTier).nameRu;

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        planTier: BusinessPlanTier.FREE,
        planExpiresAt: null,
      },
    });

    await this.archiveExcessPromotions(businessId);

    if (business.ownerId) {
      await this.notifications.create({
        userId: business.ownerId,
        type: NotificationType.PLAN_EXPIRED,
        title: 'Тариф истёк',
        body: `Тариф «${planName}» для «${business.title}» завершён. Заведение переведено на Free.`,
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
