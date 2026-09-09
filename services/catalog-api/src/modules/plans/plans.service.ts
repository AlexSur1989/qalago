import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isMockPlanCheckoutAllowed } from '../../common/utils/production-config.util';
import { AuditAction, AuditResourceType, BusinessPlanTier, BusinessPermission, NotificationType, PlanPaymentStatus, UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { isGlobalAdmin } from '../../common/utils/system-access.util';
import {
  PlanLimitsService,
  PLAN_CATALOG,
} from '../../common/services/plan-limits.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { toMembershipRole } from '../audit-log/audit-log.util';

const PAID_PERIOD_DAYS = 30;

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly notifications: NotificationsService,
    private readonly businessAccess: BusinessAccessService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
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
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    const mockEnabled = this.config.get<boolean>('app.mockPlanCheckoutEnabled') === true;
    if (!isMockPlanCheckoutAllowed(nodeEnv, mockEnabled)) {
      throw new NotFoundException();
    }

    await this.assertCanManage(user, businessId);
    const access = await this.businessAccess.resolveAccess(user, businessId);
    return this.setBusinessTier(businessId, tier, {
      isMock: true,
      message: 'Тариф подключён (тестовая оплата без списания)',
      audit: {
        actor: user,
        action: AuditAction.PLAN_CHECKOUT,
        cityId: access.business.cityId,
        membershipRole: toMembershipRole(access.accessRole),
      },
    });
  }

  async adminSetTier(user: AuthUser, businessId: string, tier: BusinessPlanTier) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { cityId: true, planTier: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (!isGlobalAdmin(user) && user.role !== UserRole.CITY_ADMIN) {
      throw new ForbiddenException('Admin only');
    }

    return this.setBusinessTier(businessId, tier, {
      isMock: false,
      skipPayment: true,
      message: 'Тариф изменён администратором',
      audit: {
        actor: user,
        action: AuditAction.PLAN_OVERRIDE,
        cityId: business.cityId,
      },
    });
  }

  async setBusinessTier(
    businessId: string,
    tier: BusinessPlanTier,
    options: {
      isMock?: boolean;
      skipPayment?: boolean;
      message?: string;
      audit?: {
        actor: AuthUser;
        action: AuditAction;
        cityId: string;
        membershipRole?: import('@prisma/client').BusinessMembershipRole | null;
      };
    } = {},
  ) {
    const catalog = this.planLimits.getCatalogItem(tier);

    if (tier === BusinessPlanTier.FREE) {
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
      audit?: {
        actor: AuthUser;
        action: AuditAction;
        cityId: string;
        membershipRole?: import('@prisma/client').BusinessMembershipRole | null;
      };
    } = {},
  ) {
    const existing = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { planTier: true },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const business = await tx.business.update({
        where: { id: businessId },
        data: {
          planTier: tier,
          planExpiresAt: expiresAt,
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

      if (options.audit) {
        await this.auditLog.record({
          actor: options.audit.actor,
          action: options.audit.action,
          resourceType: AuditResourceType.PLAN,
          resourceId: businessId,
          businessId,
          cityId: options.audit.cityId,
          membershipRole: options.audit.membershipRole ?? null,
          metadata: {
            planFrom: existing?.planTier ?? null,
            planTo: tier,
            isMock: options.isMock ?? false,
          },
          tx,
        });
      }

      return business;
    });

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

  private async assertCanView(user: AuthUser, businessId: string) {
    await this.businessAccess.assertBusinessPermission(
      user,
      businessId,
      BusinessPermission.PAYMENTS_VIEW,
    );
  }

  private async assertCanManage(user: AuthUser, businessId: string) {
    await this.businessAccess.assertOwner(user, businessId);
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
      body: `«${business.title}»: тариф активен до ${until}. Лимиты и скидка на рекламу применены.`,
    });
  }
}
