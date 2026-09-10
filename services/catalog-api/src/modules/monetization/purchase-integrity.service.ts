import { Injectable, Logger } from '@nestjs/common';
import {
  MonetizationProductType,
  OrderStatus,
  Prisma,
  PromotionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlacementCapacityService } from './placement-capacity.service';
import { PurchaseSchedulingService, ProjectedPeriodResult } from './purchase-scheduling.service';
import {
  MonetizationErrorCode,
  PurchaseConflictReason,
  monetizationBadRequest,
  monetizationConflict,
} from './errors/monetization.errors';
import {
  PurchaseIntent,
  orderMatchesPurchaseIntent,
  purchaseIntentFingerprint,
} from './utils/purchase-intent.util';
import { PRODUCT_PLACEMENT_MAP } from './constants/monetization.constants';

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
    private readonly scheduling: PurchaseSchedulingService,
    private readonly capacity: PlacementCapacityService,
  ) {}

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

  async assertPromotionEligible(businessId: string, promotionId: string) {
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

  async acquirePlacementScopeLock(
    tx: Prisma.TransactionClient,
    placementCode: string,
    cityId: string,
    categoryId?: string | null,
  ) {
    const lockKey = hashLockKey(['placement-capacity', placementCode, cityId, categoryId ?? '']);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;
  }

  async findOrderByIdempotencyKey(tx: Prisma.TransactionClient, idempotencyKey: string) {
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

  async findReusablePendingOrder(tx: Prisma.TransactionClient, intent: PurchaseIntent) {
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

  async resolveProductSchedule(
    db: DbClient,
    input: {
      productType: MonetizationProductType;
      businessId: string;
      cityId: string;
      categoryId?: string | null;
      promotionId?: string | null;
      desiredStartAt?: Date | null;
      durationHours?: number | null;
      durationDays?: number | null;
      excludeOrderId?: string;
    },
    now = new Date(),
  ): Promise<ProjectedPeriodResult> {
    if (
      input.productType === MonetizationProductType.PROMOTED_PROMOTION &&
      !input.promotionId
    ) {
      monetizationBadRequest(
        MonetizationErrorCode.PROMOTION_NOT_OWNED,
        'promotionId required for PROMOTED_PROMOTION',
      );
    }

    const period = await this.scheduling.resolveProjectedPeriod(db, input, now);
    if (!period) {
      monetizationBadRequest(
        MonetizationErrorCode.PLACEMENT_UNAVAILABLE,
        'Placement is not available',
      );
    }

    const placementCode = PRODUCT_PLACEMENT_MAP[input.productType];
    if (placementCode && this.capacity.usesSharedCapacity(placementCode)) {
      const placement = await db.adPlacement.findUnique({
        where: { code: placementCode },
      });
      if (placement) {
        const ok = await this.capacity.isWindowAvailable(
          db,
          {
            placementId: placement.id,
            placementCode,
            cityId: input.cityId,
            categoryId: input.categoryId,
          },
          period!.projectedStartAt,
          period!.projectedEndAt,
          now,
          input.excludeOrderId,
        );
        if (!ok) {
          monetizationConflict(
            MonetizationErrorCode.PLACEMENT_UNAVAILABLE,
            PurchaseConflictReason.PLACEMENT_SOLD_OUT,
            'Placement sold out for the requested period',
            { nextAvailableAt: period!.projectedEndAt.toISOString() },
          );
        }
      }
    }

    return period!;
  }

  /** @deprecated name kept for callers — schedules instead of blocking overlap. */
  async assertProductPurchaseAllowed(
    db: DbClient,
    input: Parameters<PurchaseIntegrityService['resolveProductSchedule']>[1],
  ): Promise<ProjectedPeriodResult> {
    return this.resolveProductSchedule(db, input);
  }
}
