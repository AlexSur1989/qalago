import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BusinessInvitationStatus,
  BusinessMembershipRole,
  BusinessMembershipStatus,
  BusinessPlanTier,
  NotificationType,
  PromotionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import {
  getAnalyticsCapabilitiesForPlan,
} from '../utils/analytics-capabilities.util';
import {
  buildEntitlementSummary,
  isPromotionLiveNow,
  selectPublicPromotions,
  sliceToPublicLimit,
} from '../utils/plan-entitlements.util';
import {
  getPlanDisplayMetadata,
  PlanDisplayMetadata,
} from '../utils/plan-display.util';

export type AnalyticsTier = 'BASIC' | 'EXTENDED' | 'FULL' | 'ANALYTICS_360';
export type SupportPriority = 'STANDARD' | 'PRIORITY' | 'HIGHEST';
export type ModerationPriority = 'STANDARD' | 'PRIORITY' | 'HIGHEST';

export interface PlanLimits {
  maxPhotos: number;
  maxServiceItems: number;
  maxActivePromotions: number;
  maxPromotionDurationDays: number;
  maxPromotionsCreatedPerDay: number;
  maxManagers: number;
  maxAnalyticsDays: number;
  advertisingDiscountPercent: number;
  monthlyAdBonusKzt: number;
  canReplyToReviews: boolean;
  extendedStyling: boolean;
  analyticsTier: AnalyticsTier;
  supportPriority: SupportPriority;
  moderationPriority: ModerationPriority;
  /** Always false — paid plans must not show quality badges to consumers (Stage 6.4). */
  showPlanBadge: boolean;
}

export interface PlanCatalogItem {
  tier: BusinessPlanTier;
  slug: string;
  nameRu: string;
  display: PlanDisplayMetadata;
  priceKzt: number;
  periodDays: number | null;
  features: string[];
  limits: PlanLimits;
}

function catalogEntry(
  tier: BusinessPlanTier,
  slug: string,
  priceKzt: number,
  features: string[],
  limits: Omit<PlanLimits, 'showPlanBadge'> & { showPlanBadge?: boolean },
): PlanCatalogItem {
  const display = getPlanDisplayMetadata(tier);
  return {
    tier,
    slug,
    nameRu: display.nameRu,
    display,
    priceKzt,
    periodDays: tier === BusinessPlanTier.FREE ? null : 30,
    features,
    limits: { ...limits, showPlanBadge: false },
  };
}

/** Canonical subscription catalog — Stage 6.4. Internal enum: FREE/BASIC/PREMIUM/VIP. */
export const PLAN_CATALOG: PlanCatalogItem[] = [
  catalogEntry(BusinessPlanTier.FREE, 'free', 0, [
    'Карточка заведения в каталоге',
    'До 5 фото',
    'До 10 товаров и услуг',
    '1 активная акция',
    'Базовая статистика (30 дней)',
    'Без менеджеров и ответов на отзывы',
  ], {
    maxPhotos: 5,
    maxServiceItems: 10,
    maxActivePromotions: 1,
    maxPromotionDurationDays: 14,
    maxPromotionsCreatedPerDay: 1,
    maxManagers: 0,
    maxAnalyticsDays: 30,
    advertisingDiscountPercent: 0,
    monthlyAdBonusKzt: 0,
    canReplyToReviews: false,
    extendedStyling: false,
    analyticsTier: 'BASIC',
    supportPriority: 'STANDARD',
    moderationPriority: 'STANDARD',
  }),
  catalogEntry(BusinessPlanTier.BASIC, 'business', 4900, [
    'До 20 фото',
    'До 50 товаров и услуг',
    '3 активные акции',
    '1 менеджер',
    'Ответы на отзывы',
    'Расширенная статистика',
    'Бонус на рекламу QalaGo: 500 ₸/мес',
    '5% скидка на рекламу',
  ], {
    maxPhotos: 20,
    maxServiceItems: 50,
    maxActivePromotions: 3,
    maxPromotionDurationDays: 30,
    maxPromotionsCreatedPerDay: 2,
    maxManagers: 1,
    maxAnalyticsDays: 30,
    advertisingDiscountPercent: 5,
    monthlyAdBonusKzt: 500,
    canReplyToReviews: true,
    extendedStyling: true,
    analyticsTier: 'EXTENDED',
    supportPriority: 'STANDARD',
    moderationPriority: 'STANDARD',
  }),
  catalogEntry(BusinessPlanTier.PREMIUM, 'pro', 9900, [
    'До 50 фото',
    'До 150 товаров и услуг',
    '10 активных акций',
    '3 менеджера',
    'Полная аналитика привлечения',
    'Бонус на рекламу QalaGo: 1 500 ₸/мес',
    '10% скидка на рекламу',
    'Приоритетная модерация и поддержка',
  ], {
    maxPhotos: 50,
    maxServiceItems: 150,
    maxActivePromotions: 10,
    maxPromotionDurationDays: 90,
    maxPromotionsCreatedPerDay: 5,
    maxManagers: 3,
    maxAnalyticsDays: 90,
    advertisingDiscountPercent: 10,
    monthlyAdBonusKzt: 1500,
    canReplyToReviews: true,
    extendedStyling: true,
    analyticsTier: 'FULL',
    supportPriority: 'PRIORITY',
    moderationPriority: 'PRIORITY',
  }),
  catalogEntry(BusinessPlanTier.VIP, 'vip', 19900, [
    'До 100 фото',
    'До 300 товаров и услуг',
    '25 активных акций',
    '10 менеджеров',
    'Analytics 360 + рекомендации (по мере внедрения)',
    'Бонус на рекламу QalaGo: 3 500 ₸/мес',
    '15% скидка на рекламу',
    'Максимальный приоритет модерации и поддержки',
  ], {
    maxPhotos: 100,
    maxServiceItems: 300,
    maxActivePromotions: 25,
    maxPromotionDurationDays: 90,
    maxPromotionsCreatedPerDay: 10,
    maxManagers: 10,
    maxAnalyticsDays: 365,
    advertisingDiscountPercent: 15,
    monthlyAdBonusKzt: 3500,
    canReplyToReviews: true,
    extendedStyling: true,
    analyticsTier: 'ANALYTICS_360',
    supportPriority: 'HIGHEST',
    moderationPriority: 'HIGHEST',
  }),
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
    const level = this.getLimits(tier).analyticsTier;
    return level === 'FULL' || level === 'ANALYTICS_360';
  }

  canReplyToReviews(tier: BusinessPlanTier): boolean {
    return this.getLimits(tier).canReplyToReviews;
  }

  async countManagerSlotsUsed(
    businessId: string,
    options?: { excludeInvitationId?: string },
  ): Promise<{ activeManagers: number; pendingInvitations: number; total: number }> {
    const now = new Date();
    const [activeManagers, pendingInvitations] = await Promise.all([
      this.prisma.businessMembership.count({
        where: {
          businessId,
          role: BusinessMembershipRole.MANAGER,
          status: BusinessMembershipStatus.ACTIVE,
        },
      }),
      this.prisma.businessInvitation.count({
        where: {
          businessId,
          status: BusinessInvitationStatus.PENDING,
          expiresAt: { gt: now },
          ...(options?.excludeInvitationId
            ? { id: { not: options.excludeInvitationId } }
            : {}),
        },
      }),
    ]);
    return {
      activeManagers,
      pendingInvitations,
      total: activeManagers + pendingInvitations,
    };
  }

  async assertCanAddManager(
    businessId: string,
    options?: { excludeInvitationId?: string },
  ): Promise<void> {
    const ctx = await this.getBusinessPlanContext(businessId);
    const max = ctx.limits.maxManagers;
    if (max <= 0) {
      throw new ForbiddenException(
        `Тариф «${ctx.catalog.nameRu}» не включает менеджеров. Повысьте тариф до «Бизнес» или выше.`,
      );
    }
    const slots = await this.countManagerSlotsUsed(businessId, options);
    if (slots.total >= max) {
      throw new ForbiddenException(
        `Лимит тарифа «${ctx.catalog.nameRu}»: не более ${max} менеджер${max === 1 ? 'а' : 'ов'}. Сначала отзовите приглашение или понизьте состав команды.`,
      );
    }
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

    const totals = {
      photos: business._count.images,
      serviceItems: business._count.serviceItems,
      activePromotions: business._count.promotions,
    };

    const published = {
      photos: Math.min(totals.photos, limits.maxPhotos),
      serviceItems: Math.min(totals.serviceItems, limits.maxServiceItems),
      activePromotions: Math.min(totals.activePromotions, limits.maxActivePromotions),
    };

    const managerSlots = await this.countManagerSlotsUsed(businessId);

    return {
      businessId,
      tier: business.planTier,
      effectiveTier,
      expiresAt: business.planExpiresAt,
      isFeatured: business.isFeatured,
      featuredSlot: business.featuredSlot,
      catalog: catalogItem,
      limits,
      usage: totals,
      entitlements: buildEntitlementSummary(totals, limits, published),
      team: {
        activeManagers: managerSlots.activeManagers,
        pendingInvitations: managerSlots.pendingInvitations,
        limit: limits.maxManagers,
        slotsUsed: managerSlots.total,
        overLimit: managerSlots.activeManagers > limits.maxManagers,
        canAddManager:
          limits.maxManagers > 0 && managerSlots.total < limits.maxManagers,
      },
    };
  }

  applyPublicPhotoLimit<T>(images: readonly T[], maxPhotos: number): T[] {
    return sliceToPublicLimit(images, maxPhotos);
  }

  applyPublicPromotionLimit<
    T extends {
      status: PromotionStatus | string;
      startDate?: Date | null;
      endDate?: Date | null;
      createdAt: Date | string;
    },
  >(promotions: readonly T[], maxActivePromotions: number, now = new Date()): T[] {
    return selectPublicPromotions(promotions, maxActivePromotions, now);
  }

  countLiveActivePromotions(
    promotions: Array<{
      status: PromotionStatus | string;
      startDate?: Date | null;
      endDate?: Date | null;
    }>,
    now = new Date(),
  ) {
    return promotions.filter((p) => isPromotionLiveNow(p, now)).length;
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

  async capAnalyticsDays(businessId: string, requestedDays: number): Promise<number> {
    const ctx = await this.getBusinessPlanContext(businessId);
    return Math.min(requestedDays, ctx.limits.maxAnalyticsDays);
  }

  getAnalyticsTier(tier: BusinessPlanTier): AnalyticsTier {
    return this.getLimits(tier).analyticsTier;
  }

  getAnalyticsCapabilities(tier: BusinessPlanTier) {
    return getAnalyticsCapabilitiesForPlan(tier);
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

    if (business.ownerId) {
      await this.notifications.create({
        userId: business.ownerId,
        type: NotificationType.PLAN_EXPIRED,
        title: 'Тариф истёк',
        body: `Тариф «${planName}» для «${business.title}» завершён. Заведение переведено на «Бесплатный».`,
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
