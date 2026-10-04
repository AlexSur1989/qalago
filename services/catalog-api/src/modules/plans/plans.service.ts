import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isMockPlanCheckoutAllowed } from '../../common/utils/production-config.util';
import {
  AuditAction,
  AuditResourceType,
  BusinessPlanTier,
  BusinessPermission,
  NotificationTargetType,
  NotificationType,
  PaymentProvider,
  LegalLocale,
  PlanPaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { StaffPermission } from '@qalago/shared-types';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { isGlobalAdmin } from '../../common/utils/system-access.util';
import {
  PlanLimitsService,
  PLAN_CATALOG,
} from '../../common/services/plan-limits.service';
import { BusinessAccessService } from '../../common/services/business-access.service';
import { CityScopeService } from '../../common/services/city-scope.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { StaffPolicyService } from '../../common/services/staff-policy.service';
import { resolveBusinessPrimaryCityId } from '../../common/utils/business-context-city.util';
import { toMembershipRole } from '../audit-log/audit-log.util';
import { planTierRank } from './plan-tier.util';
import {
  PlanErrorCode,
  planBadRequest,
  planConflict,
  planNotFound,
} from './plans.errors';
import { LegalService } from '../safety/legal.service';

const PAID_PERIOD_DAYS = 30;

export type PlanPaymentDto = {
  id: string;
  businessId: string;
  tier: BusinessPlanTier;
  amountKzt: number;
  periodDays: number | null;
  status: PlanPaymentStatus;
  isMock: boolean;
  provider: PaymentProvider;
  providerReference: string | null;
  paidAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly notifications: NotificationsService,
    private readonly businessAccess: BusinessAccessService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
    private readonly cityScope: CityScopeService,
    private readonly staffPolicy: StaffPolicyService,
    private readonly legal: LegalService,
  ) {}

  listCatalog() {
    return PLAN_CATALOG.map((plan) => ({
      tier: plan.tier,
      slug: plan.slug,
      nameRu: plan.nameRu,
      display: plan.display,
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

  private formatPlanPayment(row: {
    id: string;
    businessId: string;
    tier: BusinessPlanTier;
    amountKzt: number;
    periodDays: number | null;
    status: PlanPaymentStatus;
    isMock: boolean;
    provider: PaymentProvider;
    providerReference: string | null;
    paidAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): PlanPaymentDto {
    return { ...row };
  }

  async listPlanPayments(user: AuthUser, businessId: string) {
    await this.assertCanView(user, businessId);
    const items = await this.prisma.planPayment.findMany({
      where: { businessId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 50,
      select: {
        id: true,
        businessId: true,
        tier: true,
        amountKzt: true,
        periodDays: true,
        status: true,
        isMock: true,
        provider: true,
        providerReference: true,
        paidAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { items: items.map((i) => this.formatPlanPayment(i)) };
  }

  async createPlanPurchase(
    user: AuthUser,
    businessId: string,
    tier: BusinessPlanTier,
    idempotencyKey?: string | null,
    legalLocale: LegalLocale = LegalLocale.RU,
  ) {
    await this.assertCanManage(user, businessId);
    await this.legal.assertCheckoutLegalAcceptance(user.id, legalLocale, 'PLAN_PURCHASE');
    this.assertPurchasableTier(tier);
    await this.assertNoActiveDowngradePurchase(businessId, tier);

    if (idempotencyKey) {
      const existing = await this.prisma.planPayment.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        if (existing.businessId !== businessId) {
          planConflict(
            PlanErrorCode.PLAN_IDEMPOTENCY_CONFLICT,
            'Idempotency key already used for another business',
          );
        }
        return this.formatPlanPayment(existing);
      }
    }

    const catalog = this.planLimits.getCatalogItem(tier);
    const periodDays = catalog.periodDays ?? PAID_PERIOD_DAYS;

    try {
      const created = await this.prisma.planPayment.create({
        data: {
          businessId,
          tier,
          amountKzt: catalog.priceKzt,
          periodDays,
          status: PlanPaymentStatus.PENDING,
          isMock: false,
          provider: PaymentProvider.MANUAL,
          paidAt: null,
          idempotencyKey: idempotencyKey ?? undefined,
        },
      });
      return this.formatPlanPayment(created);
    } catch (err) {
      if (
        idempotencyKey &&
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const existing = await this.prisma.planPayment.findUnique({
          where: { idempotencyKey },
        });
        if (existing?.businessId === businessId) {
          return this.formatPlanPayment(existing);
        }
        planConflict(
          PlanErrorCode.PLAN_IDEMPOTENCY_CONFLICT,
          'Idempotency key already used for another business',
        );
      }
      throw err;
    }
  }

  async mockCheckout(user: AuthUser, businessId: string, tier: BusinessPlanTier) {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    const mockEnabled = this.config.get<boolean>('app.mockPlanCheckoutEnabled') === true;
    if (!isMockPlanCheckoutAllowed(nodeEnv, mockEnabled)) {
      throw new NotFoundException();
    }

    await this.assertCanManage(user, businessId);
    const access = await this.businessAccess.resolveAccess(user, businessId);
    const auditCityId = await resolveBusinessPrimaryCityId(this.prisma, businessId);
    return this.activatePaidTierImmediate(businessId, tier, {
      isMock: true,
      message: 'Тариф подключён (тестовая оплата без списания)',
      audit: {
        actor: user,
        action: AuditAction.PLAN_CHECKOUT,
        cityId: auditCityId ?? '',
        membershipRole: toMembershipRole(access.accessRole),
      },
    });
  }

  async adminSetTier(user: AuthUser, businessId: string, tier: BusinessPlanTier) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { planTier: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (!isGlobalAdmin(user)) {
      throw new ForbiddenException('Admin only');
    }

    const auditCityId = await resolveBusinessPrimaryCityId(this.prisma, businessId);
    if (tier === BusinessPlanTier.FREE) {
      return this.applyFreeTier(businessId, {
        message: 'Тариф изменён администратором',
        audit: {
          actor: user,
          action: AuditAction.PLAN_OVERRIDE,
          cityId: auditCityId ?? '',
        },
      });
    }

    return this.activatePaidTierImmediate(businessId, tier, {
      isMock: false,
      skipPaymentRecord: true,
      message: 'Тариф изменён администратором',
      audit: {
        actor: user,
        action: AuditAction.PLAN_OVERRIDE,
        cityId: auditCityId ?? '',
      },
    });
  }

  async listAdminPlanPayments(
    user: AuthUser,
    params: { citySlug?: string; status?: PlanPaymentStatus; page?: number; limit?: number },
  ) {
    this.staffPolicy.assertPermission(user, StaffPermission.PAYMENT_VIEW);
    const cityId = await this.cityScope.resolveAdminCityId(user, params.citySlug);
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const where: Prisma.PlanPaymentWhereInput = {};
    if (params.status) where.status = params.status;
    if (cityId) {
      where.business = {
        locations: { some: { cityId, isPrimary: true } },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.planPayment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          business: {
            select: {
              id: true,
              title: true,
              locations: {
                where: { isPrimary: true },
                take: 1,
                select: { city: { select: { slug: true, nameRu: true } } },
              },
            },
          },
        },
      }),
      this.prisma.planPayment.count({ where }),
    ]);

    return {
      items: items.map((row) => ({
        ...this.formatPlanPayment(row),
        business: {
          id: row.business.id,
          title: row.business.title,
          city: row.business.locations[0]?.city ?? null,
        },
      })),
      total,
      page,
      limit,
    };
  }

  async confirmPlanPayment(user: AuthUser, planPaymentId: string) {
    this.staffPolicy.assertPermission(user, StaffPermission.PAYMENT_CONFIRM);

    const payment = await this.prisma.planPayment.findUnique({
      where: { id: planPaymentId },
    });
    if (!payment) {
      planNotFound(PlanErrorCode.PLAN_PAYMENT_NOT_FOUND, 'Plan payment not found');
    }

    if (user.role === UserRole.CITY_ADMIN) {
      const auditCityId = await resolveBusinessPrimaryCityId(this.prisma, payment!.businessId);
      await this.cityScope.assertCityInAdminScope(user, auditCityId);
    }

    if (payment!.status === PlanPaymentStatus.COMPLETED) {
      return {
        alreadyCompleted: true,
        payment: this.formatPlanPayment(payment!),
        plan: await this.planLimits.getBusinessPlanContext(payment!.businessId),
      };
    }

    if (payment!.status !== PlanPaymentStatus.PENDING) {
      planBadRequest(
        PlanErrorCode.PLAN_PAYMENT_INVALID_STATUS,
        'Plan payment is not pending confirmation',
      );
    }

    const paidAt = new Date();
    const periodDays = payment!.periodDays ?? PAID_PERIOD_DAYS;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.planPayment.updateMany({
        where: { id: planPaymentId, status: PlanPaymentStatus.PENDING },
        data: {
          status: PlanPaymentStatus.COMPLETED,
          paidAt,
        },
      });

      if (updated.count === 0) {
        const current = await tx.planPayment.findUniqueOrThrow({
          where: { id: planPaymentId },
        });
        if (current.status === PlanPaymentStatus.COMPLETED) {
          return { alreadyCompleted: true as const, notify: false };
        }
        planBadRequest(
          PlanErrorCode.PLAN_PAYMENT_INVALID_STATUS,
          'Plan payment is not pending confirmation',
        );
      }

      const expiresAt = await this.computeEntitlementExpiresAt(
        tx,
        payment!.businessId,
        payment!.tier,
        periodDays,
        paidAt,
      );

      await this.applyTierEntitlement(tx, payment!.businessId, payment!.tier, expiresAt);

      await tx.planPayment.update({
        where: { id: planPaymentId },
        data: { expiresAt },
      });

      const auditCityId = await resolveBusinessPrimaryCityId(tx, payment!.businessId);
      await this.auditLog.record({
        actor: user,
        action: AuditAction.PAYMENT_CONFIRM,
        resourceType: AuditResourceType.PLAN,
        resourceId: planPaymentId,
        businessId: payment!.businessId,
        cityId: auditCityId ?? '',
        metadata: {
          planPaymentId,
          tier: payment!.tier,
          amountKzt: payment!.amountKzt,
        },
        tx,
      });

      return { alreadyCompleted: false as const, notify: true, expiresAt };
    });

    const fresh = await this.prisma.planPayment.findUniqueOrThrow({
      where: { id: planPaymentId },
    });

    if (result.notify) {
      await this.notifyPlanActivated(payment!.businessId, payment!.tier, result.expiresAt!);
    }

    return {
      alreadyCompleted: result.alreadyCompleted,
      payment: this.formatPlanPayment(fresh),
      plan: await this.planLimits.getBusinessPlanContext(payment!.businessId),
    };
  }

  async cancelPlanPayment(user: AuthUser, planPaymentId: string) {
    this.staffPolicy.assertPermission(user, StaffPermission.PAYMENT_CONFIRM);

    const payment = await this.prisma.planPayment.findUnique({
      where: { id: planPaymentId },
    });
    if (!payment) {
      planNotFound(PlanErrorCode.PLAN_PAYMENT_NOT_FOUND, 'Plan payment not found');
    }

    if (payment!.status !== PlanPaymentStatus.PENDING) {
      planBadRequest(
        PlanErrorCode.PLAN_PAYMENT_INVALID_STATUS,
        'Only pending plan payments can be cancelled',
      );
    }

    const updated = await this.prisma.planPayment.updateMany({
      where: { id: planPaymentId, status: PlanPaymentStatus.PENDING },
      data: { status: PlanPaymentStatus.CANCELLED },
    });

    if (updated.count === 0) {
      planBadRequest(
        PlanErrorCode.PLAN_PAYMENT_INVALID_STATUS,
        'Plan payment is not pending',
      );
    }

    const row = await this.prisma.planPayment.findUniqueOrThrow({
      where: { id: planPaymentId },
    });
    return { payment: this.formatPlanPayment(row) };
  }

  /** @deprecated Prefer createPlanPurchase + confirmPlanPayment for production billing. */
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
    if (tier === BusinessPlanTier.FREE) {
      return this.applyFreeTier(businessId, options);
    }
    if (!this.planLimits.isPaidTier(tier)) {
      throw new BadRequestException('Unsupported plan tier');
    }
    return this.activatePaidTierImmediate(businessId, tier, {
      isMock: options.isMock,
      skipPaymentRecord: options.skipPayment,
      message: options.message,
      audit: options.audit,
    });
  }

  private async activatePaidTierImmediate(
    businessId: string,
    tier: BusinessPlanTier,
    options: {
      isMock?: boolean;
      skipPaymentRecord?: boolean;
      message?: string;
      audit?: {
        actor: AuthUser;
        action: AuditAction;
        cityId: string;
        membershipRole?: import('@prisma/client').BusinessMembershipRole | null;
      };
    },
  ) {
    const catalog = this.planLimits.getCatalogItem(tier);
    const periodDays = catalog.periodDays ?? PAID_PERIOD_DAYS;
    const activationTime = new Date();

    const existing = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { planTier: true },
    });

    const expiresAt = await this.computeEntitlementExpiresAt(
      this.prisma,
      businessId,
      tier,
      periodDays,
      activationTime,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const business = await this.applyTierEntitlement(tx, businessId, tier, expiresAt);

      if (!options.skipPaymentRecord) {
        await tx.planPayment.create({
          data: {
            businessId,
            tier,
            amountKzt: catalog.priceKzt,
            periodDays,
            status: PlanPaymentStatus.COMPLETED,
            isMock: options.isMock ?? false,
            provider: PaymentProvider.MANUAL,
            paidAt: activationTime,
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

    await this.notifyPlanActivated(businessId, tier, expiresAt);

    return {
      success: true,
      mock: options.isMock ?? false,
      message: options.message ?? 'Тариф обновлён',
      business: updated,
      plan: await this.planLimits.getBusinessPlanContext(businessId),
    };
  }

  private async applyFreeTier(
    businessId: string,
    options: {
      message?: string;
      audit?: {
        actor: AuthUser;
        action: AuditAction;
        cityId: string;
        membershipRole?: import('@prisma/client').BusinessMembershipRole | null;
      };
    },
  ) {
    const existing = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { planTier: true },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const business = await this.applyTierEntitlement(
        tx,
        businessId,
        BusinessPlanTier.FREE,
        null,
      );
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
            planTo: BusinessPlanTier.FREE,
          },
          tx,
        });
      }
      return business;
    });

    return {
      success: true,
      mock: false,
      message: options.message ?? 'Тариф обновлён',
      business: updated,
      plan: await this.planLimits.getBusinessPlanContext(businessId),
    };
  }

  private async applyTierEntitlement(
    tx: Prisma.TransactionClient,
    businessId: string,
    tier: BusinessPlanTier,
    expiresAt: Date | null,
  ) {
    return tx.business.update({
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
  }

  async computeEntitlementExpiresAt(
    db: Prisma.TransactionClient | PrismaService,
    businessId: string,
    purchasedTier: BusinessPlanTier,
    periodDays: number,
    activationTime: Date,
  ): Promise<Date> {
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { planTier: true, planExpiresAt: true },
    });

    const sameTierRenewal =
      business?.planTier === purchasedTier &&
      business.planExpiresAt != null &&
      business.planExpiresAt > activationTime;

    const base = sameTierRenewal ? business!.planExpiresAt! : activationTime;
    return this.addDays(base, periodDays);
  }

  private assertPurchasableTier(tier: BusinessPlanTier) {
    if (tier === BusinessPlanTier.FREE) {
      planBadRequest(PlanErrorCode.PLAN_FREE_NOT_PURCHASABLE, 'FREE tier is not purchasable');
    }
    if (!this.planLimits.isPaidTier(tier)) {
      planBadRequest(PlanErrorCode.PLAN_UNSUPPORTED_TIER, 'Unsupported plan tier');
    }
  }

  private async assertNoActiveDowngradePurchase(businessId: string, targetTier: BusinessPlanTier) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { planTier: true, planExpiresAt: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const now = new Date();
    const activePaid =
      this.planLimits.isPaidTier(business.planTier) &&
      business.planExpiresAt != null &&
      business.planExpiresAt > now;

    if (
      activePaid &&
      planTierRank(targetTier) < planTierRank(business.planTier)
    ) {
      planBadRequest(
        PlanErrorCode.PLAN_DOWNGRADE_NOT_ALLOWED,
        'Cannot purchase a lower tier while a higher paid plan is still active',
      );
    }
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
      targetType: NotificationTargetType.BUSINESS,
      targetId: businessId,
      payload: {
        businessId,
        planTier: tier,
        businessName: business.title,
      },
    });
  }
}
