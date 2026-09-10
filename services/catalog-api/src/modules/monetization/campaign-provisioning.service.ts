import { Injectable } from '@nestjs/common';
import {
  AdCampaignStatus,
  AdModerationStatus,
  MonetizationProductType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from './availability.service';
import { CampaignStatusService } from './campaign-status.service';
import { PurchaseIntegrityService } from './purchase-integrity.service';
import { PRODUCT_PLACEMENT_MAP } from './constants/monetization.constants';
import { parsePackageSnapshotV1, parseProductLineSnapshotV1 } from './types/package-snapshot.types';
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
    private readonly purchaseIntegrity: PurchaseIntegrityService,
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
      const existingCount = await tx.adCampaign.count({
        where: { orderItemId: item.id },
      });
      if (existingCount > 0) continue;

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
      packageSnapshot: Prisma.JsonValue | null;
    },
    paidAt: Date,
  ) {
    const meta = this.parseMeta(item.metadata);
    const snapshot = parsePackageSnapshotV1(item.packageSnapshot);
    if (!snapshot?.items.length) {
      monetizationBadRequest(
        MonetizationErrorCode.PACKAGE_NOT_FOUND,
        'Package snapshot missing on order item',
      );
    }

    for (const pkgItem of snapshot!.items) {
      if (pkgItem.productType === MonetizationProductType.PROMOTED_PROMOTION) {
        await this.assertPromotionOwned(
          tx,
          order.businessId,
          pkgItem.promotionId ?? meta.promotionId ?? undefined,
        );
      }

      const itemMeta: OrderItemMeta = {
        packageCode: snapshot!.packageCode,
        desiredStartAt: pkgItem.projectedStartAt,
        promotionId: pkgItem.promotionId ?? meta.promotionId,
        creativeId:
          pkgItem.productType === MonetizationProductType.VIP_BANNER
            ? meta.creativeId ?? snapshot!.creativeId ?? undefined
            : undefined,
        categoryId: pkgItem.categoryId ?? order.business.categoryId,
      };

      await this.createCampaignForProduct(tx, {
        businessId: order.businessId,
        cityId: order.business.cityId,
        categoryId: pkgItem.categoryId ?? order.business.categoryId,
        orderItemId: item.id,
        orderId: order.id,
        product: { id: pkgItem.productId, type: pkgItem.productType },
        durationHours: pkgItem.durationHours,
        durationDays: pkgItem.durationDays,
        metadata: itemMeta,
        paidAt,
        promotionId: pkgItem.promotionId ?? meta.promotionId ?? null,
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
      lineSnapshot: Prisma.JsonValue | null;
    },
    paidAt: Date,
  ) {
    const meta = this.parseMeta(item.metadata);
    const lineSnapshot = parseProductLineSnapshotV1(item.lineSnapshot);
    const categoryId =
      lineSnapshot?.categoryId ?? meta.categoryId ?? order.business.categoryId;

    if (item.product.type === MonetizationProductType.PROMOTED_PROMOTION) {
      await this.assertPromotionOwned(
        tx,
        order.businessId,
        meta.promotionId ?? lineSnapshot?.promotionId ?? undefined,
      );
    }

    if (lineSnapshot) {
      meta.desiredStartAt = lineSnapshot.projectedStartAt;
    }

    await this.createCampaignForProduct(tx, {
      businessId: order.businessId,
      cityId: order.business.cityId,
      categoryId,
      orderItemId: item.id,
      orderId: order.id,
      product: item.product,
      durationHours: item.durationHours ?? meta.durationHours,
      durationDays: item.durationDays ?? meta.durationDays,
      metadata: meta,
      paidAt,
      promotionId: meta.promotionId ?? lineSnapshot?.promotionId ?? null,
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
      orderId: string;
      product: { id: string; type: MonetizationProductType };
      durationHours?: number | null;
      durationDays?: number | null;
      metadata: OrderItemMeta;
      paidAt: Date;
      promotionId?: string | null;
    },
  ) {
    const placementCode = PRODUCT_PLACEMENT_MAP[ctx.product.type];
    if (!placementCode) return;

    const requiresCreative = this.campaignStatus.requiresCreative(ctx.product.type);
    const creativeId =
      requiresCreative && ctx.metadata.creativeId ? ctx.metadata.creativeId : null;

    if (requiresCreative && !creativeId) {
      monetizationBadRequest(
        MonetizationErrorCode.CREATIVE_REQUIRED,
        'creativeId required for VIP_BANNER campaign provisioning',
      );
    }

    const desiredStartAt = ctx.metadata.desiredStartAt
      ? new Date(ctx.metadata.desiredStartAt)
      : ctx.paidAt;

    await this.purchaseIntegrity.resolveProductSchedule(tx, {
      productType: ctx.product.type,
      businessId: ctx.businessId,
      cityId: ctx.cityId,
      categoryId: ctx.categoryId,
      promotionId: ctx.promotionId ?? ctx.metadata.promotionId,
      desiredStartAt,
      durationHours: ctx.durationHours,
      durationDays: ctx.durationDays,
      excludeOrderId: ctx.orderId,
    });

    let creativeModerationStatus: AdModerationStatus | null = null;
    if (creativeId) {
      const creative = await tx.adCreative.findFirst({
        where: { id: creativeId, businessId: ctx.businessId },
      });
      if (!creative) {
        monetizationBadRequest(
          MonetizationErrorCode.CREATIVE_NOT_OWNED,
          'Creative not found or not owned',
        );
      }
      creativeModerationStatus = creative!.moderationStatus;
    }

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
        creativeId,
        promotionId:
          ctx.product.type === MonetizationProductType.PROMOTED_PROMOTION
            ? ctx.promotionId ?? ctx.metadata.promotionId ?? null
            : null,
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

  private async resolveCampaignDuration(campaign: {
    productId: string;
    product: { type: MonetizationProductType };
    orderItem: {
      durationDays: number | null;
      durationHours: number | null;
      metadata: Prisma.JsonValue | null;
    } | null;
  }): Promise<{ durationHours?: number | null; durationDays?: number | null }> {
    if (!campaign.orderItem) {
      return { durationDays: null, durationHours: null };
    }

    const pkgSnapshot = parsePackageSnapshotV1(
      (campaign.orderItem as { packageSnapshot?: Prisma.JsonValue }).packageSnapshot ?? null,
    );
    if (pkgSnapshot) {
      const pkgItem = pkgSnapshot.items.find(
        (item) =>
          item.productId === campaign.productId ||
          item.productType === campaign.product.type,
      );
      if (pkgItem) {
        return {
          durationDays: pkgItem.durationDays,
          durationHours: pkgItem.durationHours,
        };
      }
    }
    const meta = this.parseMeta(campaign.orderItem.metadata);
    if (meta.packageCode) {
      const pkg = await this.prisma.promotionPackage.findUnique({
        where: { code: meta.packageCode },
        include: { items: { include: { product: true } } },
      });
      const pkgItem = pkg?.items.find(
        (item) =>
          item.productId === campaign.productId ||
          item.product.type === campaign.product.type,
      );
      if (pkgItem) {
        return {
          durationDays: pkgItem.durationDays,
          durationHours: pkgItem.durationHours,
        };
      }
    }

    return {
      durationDays: campaign.orderItem.durationDays ?? meta.durationDays,
      durationHours: campaign.orderItem.durationHours ?? meta.durationHours,
    };
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
      const duration = await this.resolveCampaignDuration(campaign);
      const schedule = this.campaignStatus.resolveOnCreativeApproved(
        campaign,
        {
          desiredStartAt: meta.desiredStartAt,
          durationHours: duration.durationHours,
          durationDays: duration.durationDays,
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

  /** After creative submit: paid VIP campaigns enter moderation queue. */
  async syncCampaignsOnCreativeSubmitted(creativeId: string) {
    const campaigns = await this.prisma.adCampaign.findMany({
      where: {
        creativeId,
        status: {
          in: [
            AdCampaignStatus.SCHEDULED,
            AdCampaignStatus.PENDING_MODERATION,
            AdCampaignStatus.REJECTED,
          ],
        },
        product: { type: MonetizationProductType.VIP_BANNER },
        orderItem: {
          order: { status: OrderStatus.PAID },
        },
      },
      select: { id: true, status: true },
    });

    const updated = [];
    for (const campaign of campaigns) {
      if (campaign.status === AdCampaignStatus.PENDING_MODERATION) {
        updated.push(campaign);
        continue;
      }
      const row = await this.prisma.adCampaign.update({
        where: { id: campaign.id },
        data: { status: AdCampaignStatus.PENDING_MODERATION },
      });
      updated.push(row);
    }
    return updated;
  }
}
