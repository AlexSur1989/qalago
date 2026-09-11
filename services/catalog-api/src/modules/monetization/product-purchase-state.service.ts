import { HttpException, Injectable } from '@nestjs/common';
import {
  AdCampaignStatus,
  AdModerationStatus,
  MonetizationProductType,
  OrderStatus,
} from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { MonetizationAccessService } from './monetization-access.service';
import { PurchaseIntegrityService } from './purchase-integrity.service';
import { CampaignStatusService } from './campaign-status.service';
import { PRODUCT_PLACEMENT_MAP } from './constants/monetization.constants';
export type ProductPurchaseUiState =
  | 'AVAILABLE'
  | 'ACTIVE'
  | 'SCHEDULED'
  | 'PENDING_PAYMENT'
  | 'PENDING_APPROVAL'
  | 'SOLD_OUT';

export type ProductPurchaseStateDto = {
  productCode: string;
  productType: MonetizationProductType;
  state: ProductPurchaseUiState;
  activeUntil?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  pendingOrderId?: string | null;
  nextAvailableAt?: string | null;
  projectedStart?: string | null;
  projectedEnd?: string | null;
  canPurchase: boolean;
  canRenew: boolean;
  primaryAction: 'BUY' | 'CONTINUE_PAYMENT' | 'RENEW' | 'NONE';
  reservationExpiresAt?: string | null;
};

@Injectable()
export class ProductPurchaseStateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: MonetizationAccessService,
    private readonly purchaseIntegrity: PurchaseIntegrityService,
    private readonly campaignStatus: CampaignStatusService,
  ) {}

  async listForBusiness(
    user: AuthUser,
    businessId: string,
  ): Promise<ProductPurchaseStateDto[]> {
    await this.access.assertCanManageBusiness(user, businessId);
    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
      select: { id: true, cityId: true, categoryId: true },
    });

    const products = await this.prisma.monetizationProduct.findMany({
      where: {
        isActive: true,
        type: { not: MonetizationProductType.PACKAGE },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const [campaigns, pendingOrders, reservations] = await Promise.all([
      this.prisma.adCampaign.findMany({
        where: {
          businessId,
          status: {
            in: [
              AdCampaignStatus.ACTIVE,
              AdCampaignStatus.SCHEDULED,
              AdCampaignStatus.PENDING_MODERATION,
            ],
          },
        },
        include: {
          product: true,
          creative: true,
          campaignPlacements: { include: { placement: true } },
        },
        orderBy: { endAt: 'desc' },
      }),
      this.prisma.order.findMany({
        where: { businessId, status: OrderStatus.AWAITING_PAYMENT },
        include: { items: { include: { product: true } }, payments: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.adInventoryReservation.findMany({
        where: {
          businessId,
          status: 'HELD',
          expiresAt: { gt: new Date() },
        },
        select: { orderId: true, expiresAt: true },
      }),
    ]);

    const reservationByOrder = new Map(
      reservations.map((r) => [r.orderId, r.expiresAt]),
    );

    const states: ProductPurchaseStateDto[] = [];
    for (const product of products) {
      states.push(
        await this.resolveProductState(
          business,
          product,
          campaigns.filter((c) => c.productId === product.id),
          pendingOrders,
          reservationByOrder,
        ),
      );
    }
    return states;
  }

  private async resolveProductState(
    business: { id: string; cityId: string; categoryId: string },
    product: { id: string; code: string; type: MonetizationProductType },
    productCampaigns: Array<{
      id: string;
      status: AdCampaignStatus;
      startAt: Date;
      endAt: Date;
      creative: { moderationStatus: AdModerationStatus } | null;
    }>,
    pendingOrders: Array<{
      id: string;
      items: Array<{ product: { code: string }; durationDays: number | null; durationHours: number | null; metadata: unknown }>;
    }>,
    reservationByOrder: Map<string, Date>,
  ): Promise<ProductPurchaseStateDto> {
    const now = new Date();
    const base = {
      productCode: product.code,
      productType: product.type,
      canPurchase: false,
      canRenew: false,
      primaryAction: 'NONE' as const,
    };

    const pending = pendingOrders.find((order) =>
      order.items.some((item) => item.product.code === product.code),
    );
    if (pending) {
      return {
        ...base,
        state: 'PENDING_PAYMENT',
        pendingOrderId: pending.id,
        canPurchase: false,
        primaryAction: 'CONTINUE_PAYMENT',
        reservationExpiresAt:
          reservationByOrder.get(pending.id)?.toISOString() ?? null,
      };
    }

    const moderationCampaign = productCampaigns.find(
      (c) =>
        c.status === AdCampaignStatus.PENDING_MODERATION ||
        (this.campaignStatus.requiresCreative(product.type) &&
          c.creative?.moderationStatus !== AdModerationStatus.APPROVED &&
          c.status !== AdCampaignStatus.CANCELLED),
    );
    if (
      moderationCampaign &&
      this.campaignStatus.requiresCreative(product.type)
    ) {
      return {
        ...base,
        state: 'PENDING_APPROVAL',
        scheduledStart: moderationCampaign.startAt.toISOString(),
        scheduledEnd: moderationCampaign.endAt.toISOString(),
        canRenew: false,
        primaryAction: 'NONE',
      };
    }

    const active = productCampaigns.find(
      (c) =>
        c.status === AdCampaignStatus.ACTIVE &&
        c.startAt <= now &&
        c.endAt > now,
    );
    if (active) {
      return {
        ...base,
        state: 'ACTIVE',
        activeUntil: active.endAt.toISOString(),
        canPurchase: false,
        canRenew: true,
        primaryAction: 'RENEW',
      };
    }

    const scheduled = productCampaigns
      .filter(
        (c) =>
          (c.status === AdCampaignStatus.SCHEDULED ||
            (c.status === AdCampaignStatus.ACTIVE && c.startAt > now)) &&
          c.endAt > now,
      )
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0];

    if (scheduled) {
      return {
        ...base,
        state: 'SCHEDULED',
        scheduledStart: scheduled.startAt.toISOString(),
        scheduledEnd: scheduled.endAt.toISOString(),
        canPurchase: false,
        canRenew: true,
        primaryAction: 'RENEW',
      };
    }

    try {
      const schedule = await this.purchaseIntegrity.resolveProductSchedule(
        this.prisma,
        {
          productType: product.type,
          businessId: business.id,
          cityId: business.cityId,
          categoryId: business.categoryId,
          durationDays: 7,
        },
      );

      const placementCode = PRODUCT_PLACEMENT_MAP[product.type];
      if (!placementCode) {
        return {
          ...base,
          state: 'AVAILABLE',
          canPurchase: true,
          primaryAction: 'BUY',
          projectedStart: schedule.projectedStartAt.toISOString(),
          projectedEnd: schedule.projectedEndAt.toISOString(),
        };
      }

      return {
        ...base,
        state: 'AVAILABLE',
        canPurchase: true,
        canRenew: false,
        primaryAction: 'BUY',
        projectedStart: schedule.projectedStartAt.toISOString(),
        projectedEnd: schedule.projectedEndAt.toISOString(),
      };
    } catch (err: unknown) {
      const body =
        err instanceof HttpException
          ? (err.getResponse() as { code?: string; nextAvailableAt?: string })
          : err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { code?: string; nextAvailableAt?: string } })
                .response
            : undefined;
      if (body?.code === 'PLACEMENT_SOLD_OUT' || body?.code === 'PLACEMENT_UNAVAILABLE') {
        return {
          ...base,
          state: 'SOLD_OUT',
          nextAvailableAt: body.nextAvailableAt ?? null,
          canPurchase: false,
          primaryAction: 'NONE',
        };
      }
      return {
        ...base,
        state: 'AVAILABLE',
        canPurchase: true,
        primaryAction: 'BUY',
      };
    }
  }
}
