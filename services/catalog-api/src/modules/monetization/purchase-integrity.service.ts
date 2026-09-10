import { Injectable, Logger } from '@nestjs/common';
import {
  MonetizationProductType,
  OrderStatus,
  Prisma,
  PromotionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from './availability.service';
import {
  MonetizationErrorCode,
  PurchaseConflictReason,
  PurchaseConflictReasonType,
  monetizationBadRequest,
  monetizationConflict,
} from './errors/monetization.errors';
import { PurchaseScopeService } from './purchase-scope.service';
import {
  PurchaseIntent,
  orderMatchesPurchaseIntent,
  purchaseIntentFingerprint,
} from './utils/purchase-intent.util';

function hashLockKey(parts: string[]): number {
  const str = parts.join(':');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class PurchaseIntegrityService {
  private readonly logger = new Logger(PurchaseIntegrityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly purchaseScope: PurchaseScopeService,
  ) {}

  private client(db?: DbClient): DbClient {
    return db ?? this.prisma;
  }

  async assertCategoryEligibleForBusiness(
    business: { id: string; categoryId: string },
    categoryId: string,
  ) {
    if (categoryId !== business.categoryId) {
      monetizationConflict(
        MonetizationErrorCode.CATEGORY_NOT_ELIGIBLE,
        PurchaseConflictReason.CATEGORY_NOT_ELIGIBLE,
        'categoryId must match business primary category',
      );
    }
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      monetizationBadRequest(
        MonetizationErrorCode.CATEGORY_NOT_ELIGIBLE,
        'Category not found',
      );
    }
  }

  async assertPromotionEligible(
    businessId: string,
    promotionId: string,
  ) {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: promotionId, businessId },
    });
    if (!promotion) {
      monetizationBadRequest(
        MonetizationErrorCode.PROMOTION_NOT_OWNED,
        'Promotion not found or not owned by business',
      );
    }
    if (promotion!.status !== PromotionStatus.ACTIVE) {
      monetizationBadRequest(
        MonetizationErrorCode.PROMOTION_NOT_ELIGIBLE,
        'Promotion must be ACTIVE to purchase promotion placement',
      );
    }
  }

  async acquirePurchaseIntentLock(
    tx: Prisma.TransactionClient,
    intent: PurchaseIntent,
  ) {
    const fingerprint = purchaseIntentFingerprint(intent);
    const lockKey = hashLockKey(['purchase-intent', intent.businessId, fingerprint]);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;
  }

  async findOrderByIdempotencyKey(
    tx: Prisma.TransactionClient,
    idempotencyKey: string,
  ) {
    return tx.payment.findUnique({
      where: { idempotencyKey },
      include: {
        order: {
          include: {
            items: { include: { product: true } },
            payments: true,
          },
        },
      },
    });
  }

  async findReusablePendingOrder(
    tx: Prisma.TransactionClient,
    intent: PurchaseIntent,
  ) {
    const pending = await tx.order.findMany({
      where: {
        businessId: intent.businessId,
        status: OrderStatus.AWAITING_PAYMENT,
      },
      include: {
        items: { include: { product: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return pending.find((order) => orderMatchesPurchaseIntent(order, intent)) ?? null;
  }

  conflictReasonForStatus(status: string): PurchaseConflictReasonType {
    if (status === 'SCHEDULED') {
      return PurchaseConflictReason.ALREADY_SCHEDULED;
    }
    if (status === 'PENDING_MODERATION') {
      return PurchaseConflictReason.ALREADY_SCHEDULED;
    }
    return PurchaseConflictReason.ALREADY_ACTIVE;
  }

  async assertNoScopeOverlap(
    db: DbClient,
    input: {
      productType: MonetizationProductType;
      businessId: string;
      cityId: string;
      categoryId?: string | null;
      promotionId?: string | null;
      desiredStartAt: Date;
      desiredEndAt: Date;
    },
  ) {
    const scope = this.purchaseScope.resolveScope({
      productType: input.productType,
      businessId: input.businessId,
      cityId: input.cityId,
      categoryId: input.categoryId,
      promotionId: input.promotionId,
    });
    if (!scope) return;

    if (
      input.productType === MonetizationProductType.PROMOTED_PROMOTION &&
      !input.promotionId
    ) {
      monetizationBadRequest(
        MonetizationErrorCode.PROMOTION_NOT_OWNED,
        'promotionId required for PROMOTED_PROMOTION',
      );
    }

    const placement = await this.client(db).adPlacement.findUnique({
      where: { code: scope.placementCode },
    });
    if (!placement) return;

    const existing = await this.purchaseScope.findOverlappingScopedCampaign(db, {
      productType: input.productType,
      scope,
      desiredStartAt: input.desiredStartAt,
      desiredEndAt: input.desiredEndAt,
      placementId: placement.id,
    });

    if (existing) {
      const reason =
        input.productType === MonetizationProductType.PROMOTED_PROMOTION
          ? PurchaseConflictReason.TARGET_ALREADY_PROMOTED
          : this.conflictReasonForStatus(existing.status);

      this.logger.warn(
        `Purchase scope conflict product=${input.productType} businessId=${input.businessId} cityId=${input.cityId} reason=${reason}`,
      );

      monetizationConflict(
        MonetizationErrorCode.PURCHASE_CONFLICT,
        reason,
        'An overlapping ad campaign already exists for this purchase scope',
        {
          existingCampaignId: existing.id,
          activeUntil: existing.endAt.toISOString(),
          nextAvailableAt: existing.endAt.toISOString(),
          canRenew: false,
        },
      );
    }
  }

  async assertProductPurchaseAllowed(
    db: DbClient,
    input: {
      productType: MonetizationProductType;
      businessId: string;
      cityId: string;
      categoryId?: string | null;
      promotionId?: string | null;
      desiredStartAt: Date;
      desiredEndAt: Date;
    },
  ) {
    await this.assertNoScopeOverlap(db, input);

    const availability = await this.availability.checkAvailability(
      {
        productType: input.productType,
        cityId: input.cityId,
        categoryId: input.categoryId,
        desiredStartAt: input.desiredStartAt,
        desiredEndAt: input.desiredEndAt,
      },
      db,
    );
    if (!availability.available) {
      monetizationBadRequest(
        MonetizationErrorCode.PLACEMENT_UNAVAILABLE,
        'Placement slot unavailable for selected dates',
      );
    }
  }

}
