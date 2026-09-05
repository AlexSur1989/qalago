import { Injectable } from '@nestjs/common';
import {
  AdCampaignStatus,
  AdModerationStatus,
  MonetizationProductType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from './availability.service';
import { CampaignStatusService } from './campaign-status.service';
import { PRODUCT_PLACEMENT_MAP } from './constants/monetization.constants';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
  monetizationNotFound,
} from './errors/monetization.errors';

type OrderItemMeta = {
  desiredStartAt?: string;
  promotionId?: string;
  creativeId?: string;
  packageCode?: string;
  durationHours?: number;
  durationDays?: number;
  categoryId?: string;
};

@Injectable()
export class CampaignProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly campaignStatus: CampaignStatusService,
  ) {}

  private parseMeta(metadata: Prisma.JsonValue | null): OrderItemMeta {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {};
    }
    return metadata as OrderItemMeta;
  }

  async provisionOrderCampaigns(
    tx: Prisma.TransactionClient,
    orderId: string,
    paidAt: Date,
  ) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        business: { select: { cityId: true, categoryId: true } },
      },
    });
    if (!order) {
      monetizationNotFound(MonetizationErrorCode.ORDER_NOT_FOUND, 'Order not found');
    }

    for (const item of order.items) {
      if (item.product.type === MonetizationProductType.PACKAGE) {
        await this.provisionPackageItem(tx, order, item, paidAt);
      } else {
        await this.provisionProductItem(tx, order, item, paidAt);
      }
    }
  }

  private async provisionPackageItem(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      businessId: string;
      business: { cityId: string; categoryId: string };
    },
    item: {
      id: string;
      metadata: Prisma.JsonValue | null;
    },
    paidAt: Date,
  ) {
    const meta = this.parseMeta(item.metadata);
    const packageCode = meta.packageCode;
    if (!packageCode) return;

    const pkg = await tx.promotionPackage.findUnique({
      where: { code: packageCode },
      include: {
        items: { include: { product: true } },
      },
    });
    if (!pkg) {
      monetizationNotFound(
        MonetizationErrorCode.PACKAGE_NOT_FOUND,
        'Package not found',
      );
    }

    for (const pkgItem of pkg.items) {
      await this.createCampaignForProduct(tx, {
        businessId: order.businessId,
        cityId: order.business.cityId,
        categoryId: order.business.categoryId,
        orderItemId: item.id,
        product: pkgItem.product,
        durationHours: pkgItem.durationHours,
        durationDays: pkgItem.durationDays,
        metadata: meta,
        paidAt,
      });
    }
  }

  private async provisionProductItem(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      businessId: string;
      business: { cityId: string; categoryId: string };
    },
    item: {
      id: string;
      product: { id: string; type: MonetizationProductType };
      durationHours: number | null;
      durationDays: number | null;
      metadata: Prisma.JsonValue | null;
    },
    paidAt: Date,
  ) {
    const meta = this.parseMeta(item.metadata);
    const categoryId = meta.categoryId ?? order.business.categoryId;

    if (item.product.type === MonetizationProductType.PROMOTED_PROMOTION) {
      await this.assertPromotionOwned(
        tx,
        order.businessId,
        meta.promotionId,
      );
    }

    await this.createCampaignForProduct(tx, {
      businessId: order.businessId,
      cityId: order.business.cityId,
      categoryId,
      orderItemId: item.id,
      product: item.product,
      durationHours: item.durationHours ?? meta.durationHours,
      durationDays: item.durationDays ?? meta.durationDays,
      metadata: meta,
      paidAt,
    });
  }

  private async assertPromotionOwned(
    tx: Prisma.TransactionClient,
    businessId: string,
    promotionId?: string,
  ) {
    if (!promotionId) {
      monetizationBadRequest(
        MonetizationErrorCode.PROMOTION_NOT_OWNED,
        'promotionId required for PROMOTED_PROMOTION',
      );
    }
    const promotion = await tx.promotion.findFirst({
      where: { id: promotionId, businessId },
    });
    if (!promotion) {
      monetizationBadRequest(
        MonetizationErrorCode.PROMOTION_NOT_OWNED,
        'Promotion not found or not owned by business',
      );
    }
  }

  private async createCampaignForProduct(
    tx: Prisma.TransactionClient,
    ctx: {
      businessId: string;
      cityId: string;
      categoryId: string;
      orderItemId: string;
      product: { id: string; type: MonetizationProductType };
      durationHours?: number | null;
      durationDays?: number | null;
      metadata: OrderItemMeta;
      paidAt: Date;
    },
  ) {
    const placementCode = PRODUCT_PLACEMENT_MAP[ctx.product.type];
    if (!placementCode) return;

    const desiredStartAt = ctx.metadata.desiredStartAt
      ? new Date(ctx.metadata.desiredStartAt)
      : ctx.paidAt;
    const desiredEndAt = this.availability.addDuration(
      desiredStartAt,
      ctx.durationHours,
      ctx.durationDays,
    );

    await this.availability.assertAvailableInTransaction(tx, {
      productType: ctx.product.type,
      cityId: ctx.cityId,
      categoryId: ctx.categoryId,
      desiredStartAt,
      desiredEndAt,
    });

    let creativeModerationStatus: AdModerationStatus | null = null;
    if (ctx.metadata.creativeId) {
      const creative = await tx.adCreative.findFirst({
        where: { id: ctx.metadata.creativeId, businessId: ctx.businessId },
      });
      if (!creative) {
        monetizationBadRequest(
          MonetizationErrorCode.CREATIVE_NOT_OWNED,
          'Creative not found or not owned',
        );
      }
      creativeModerationStatus = creative!.moderationStatus;
    }

    const requiresCreative = this.campaignStatus.requiresCreative(ctx.product.type);
    const schedule = this.campaignStatus.resolveInitialStatus({
      desiredStartAt: ctx.metadata.desiredStartAt
        ? new Date(ctx.metadata.desiredStartAt)
        : null,
      paidAt: ctx.paidAt,
      creativeModerationStatus,
      productType: ctx.product.type,
      durationHours: ctx.durationHours,
      durationDays: ctx.durationDays,
      requiresCreative,
    });

    const placement = await tx.adPlacement.findUnique({
      where: { code: placementCode },
    });
    if (!placement) {
      monetizationNotFound(
        MonetizationErrorCode.PRODUCT_NOT_AVAILABLE,
        `Placement ${placementCode} not found`,
      );
    }

    const campaign = await tx.adCampaign.create({
      data: {
        businessId: ctx.businessId,
        orderItemId: ctx.orderItemId,
        productId: ctx.product.id,
        creativeId: ctx.metadata.creativeId ?? null,
        cityId: ctx.cityId,
        categoryId:
          ctx.product.type === MonetizationProductType.TOP_CATEGORY ||
          ctx.product.type === MonetizationProductType.BOOST
            ? ctx.categoryId
            : null,
        status: schedule.status,
        startAt: schedule.startAt,
        endAt: schedule.endAt,
      },
    });

    await tx.adCampaignPlacement.create({
      data: {
        campaignId: campaign.id,
        placementId: placement!.id,
      },
    });
  }

  async activateCampaignsForCreative(creativeId: string, approvedAt = new Date()) {
    const creative = await this.prisma.adCreative.findUnique({
      where: { id: creativeId },
    });
    if (!creative || creative.moderationStatus !== AdModerationStatus.APPROVED) {
      return [];
    }

    const campaigns = await this.prisma.adCampaign.findMany({
      where: {
        creativeId,
        status: AdCampaignStatus.PENDING_MODERATION,
        orderItem: {
          order: { status: OrderStatus.PAID },
        },
      },
      include: {
        product: true,
        orderItem: true,
      },
    });

    const updated = [];
    for (const campaign of campaigns) {
      const meta = this.parseMeta(campaign.orderItem?.metadata ?? null);
      const schedule = this.campaignStatus.resolveOnCreativeApproved(
        campaign,
        {
          desiredStartAt: meta.desiredStartAt,
          durationHours: campaign.orderItem?.durationHours ?? meta.durationHours,
          durationDays: campaign.orderItem?.durationDays ?? meta.durationDays,
        },
        approvedAt,
      );

      const row = await this.prisma.adCampaign.update({
        where: { id: campaign.id },
        data: {
          status: schedule.status,
          startAt: schedule.startAt,
          endAt: schedule.endAt,
        },
      });
      updated.push(row);
    }
    return updated;
  }

  async rejectCampaignsForCreative(creativeId: string) {
    return this.prisma.adCampaign.updateMany({
      where: {
        creativeId,
        status: AdCampaignStatus.PENDING_MODERATION,
      },
      data: { status: AdCampaignStatus.REJECTED },
    });
  }
}
