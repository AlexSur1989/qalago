import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessPlanTier, NotificationType, PlanPaymentStatus, UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  PlanLimitsService,
  PLAN_CATALOG,
} from '../../common/services/plan-limits.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

const PAID_PERIOD_DAYS = 30;

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly notifications: NotificationsService,
  ) {}

  listCatalog() {
    return PLAN_CATALOG.map((plan) => ({
      tier: plan.tier,
      slug: plan.slug,
      nameRu: plan.nameRu,
      priceKzt: plan.priceKzt,
      periodDays: plan.periodDays,
      features: plan.features,
      limits: plan.limits,
    }));
  }

  async getBusinessPlan(user: AuthUser, businessId: string) {
    await this.assertCanView(user, businessId);
    return this.planLimits.getBusinessPlanContext(businessId);
  }

  async mockCheckout(user: AuthUser, businessId: string, tier: BusinessPlanTier) {
    await this.assertCanManage(user, businessId);
    return this.setBusinessTier(businessId, tier, {
      isMock: true,
      message: 'Тариф подключён (тестовая оплата без списания)',
    });
  }

  async adminSetTier(user: AuthUser, businessId: string, tier: BusinessPlanTier) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { cityId: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.CITY_ADMIN) {
      throw new ForbiddenException('Admin only');
    }

    return this.setBusinessTier(businessId, tier, {
      isMock: false,
      skipPayment: true,
      message: 'Тариф изменён администратором',
    });
  }

  async setBusinessTier(
    businessId: string,
    tier: BusinessPlanTier,
    options: {
      isMock?: boolean;
      skipPayment?: boolean;
      message?: string;
    } = {},
  ) {
    const catalog = this.planLimits.getCatalogItem(tier);

    if (tier === BusinessPlanTier.BASIC) {
      return this.applyTier(businessId, tier, null, 0, options);
    }

    if (!this.planLimits.isPaidTier(tier)) {
      throw new BadRequestException('Unsupported plan tier');
    }

    const expiresAt = this.addDays(new Date(), catalog.periodDays ?? PAID_PERIOD_DAYS);
    return this.applyTier(businessId, tier, expiresAt, catalog.priceKzt, options);
  }

  private async applyTier(
    businessId: string,
    tier: BusinessPlanTier,
    expiresAt: Date | null,
    amountKzt: number,
    options: {
      isMock?: boolean;
      skipPayment?: boolean;
      message?: string;
    } = {},
  ) {
    const featured = await this.resolveFeaturedFields(businessId, tier);

    const updated = await this.prisma.$transaction(async (tx) => {
      const business = await tx.business.update({
        where: { id: businessId },
        data: {
          planTier: tier,
          planExpiresAt: expiresAt,
          isFeatured: featured.isFeatured,
          featuredSlot: featured.featuredSlot,
        },
        select: {
          id: true,
          planTier: true,
          planExpiresAt: true,
          isFeatured: true,
          featuredSlot: true,
        },
      });

      if (this.planLimits.isPaidTier(tier) && !options.skipPayment) {
        await tx.planPayment.create({
          data: {
            businessId,
            tier,
            amountKzt,
            status: PlanPaymentStatus.COMPLETED,
            isMock: options.isMock ?? true,
            expiresAt,
          },
        });
      }

      return business;
    });

    await this.planLimits.archiveExcessPromotions(businessId);

    if (this.planLimits.isPaidTier(tier)) {
      await this.notifyPlanActivated(businessId, tier, expiresAt);
    }

    return {
      success: true,
      mock: options.isMock ?? false,
      message: options.message ?? 'Тариф обновлён',
      business: updated,
      plan: await this.planLimits.getBusinessPlanContext(businessId),
    };
  }

  private async resolveFeaturedFields(businessId: string, tier: BusinessPlanTier) {
    if (tier === BusinessPlanTier.BASIC) {
      return { isFeatured: false, featuredSlot: null };
    }

    if (tier === BusinessPlanTier.PRO) {
      return { isFeatured: true, featuredSlot: null };
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { cityId: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const topSlots = await this.prisma.business.findMany({
      where: {
        cityId: business.cityId,
        planTier: BusinessPlanTier.TOP_CITY,
        featuredSlot: { not: null },
      },
      select: { featuredSlot: true },
      orderBy: { featuredSlot: 'desc' },
      take: 1,
    });

    const nextSlot = (topSlots[0]?.featuredSlot ?? 0) + 1;
    return { isFeatured: true, featuredSlot: nextSlot };
  }

  private async assertCanView(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.CITY_ADMIN ||
      business.ownerId === user.id
    ) {
      return;
    }
    throw new ForbiddenException('Not allowed');
  }

  private async assertCanManage(user: AuthUser, businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (user.role === UserRole.ADMIN || user.role === UserRole.CITY_ADMIN) {
      return;
    }
    if (user.role === UserRole.BUSINESS && business.ownerId === user.id) {
      return;
    }
    throw new ForbiddenException('Not business owner');
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private async notifyPlanActivated(
    businessId: string,
    tier: BusinessPlanTier,
    expiresAt: Date | null,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { title: true, ownerId: true },
    });
    if (!business?.ownerId) return;

    const planName = this.planLimits.getCatalogItem(tier).nameRu;
    const until = expiresAt
      ? expiresAt.toLocaleDateString('ru-RU')
      : '30 дней';

    await this.notifications.create({
      userId: business.ownerId,
      type: NotificationType.PLAN_ACTIVATED,
      title: `Тариф «${planName}» подключён`,
      body: `«${business.title}»: тариф активен до ${until}. VIP и лимиты уже применены.`,
    });
  }
}
