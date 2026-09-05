import { Injectable } from '@nestjs/common';
import { BusinessPlanTier, ProductPrice } from '@prisma/client';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LEGACY_PLAN_DISCOUNT_PERCENT,
  PACKAGE_DISCOUNT_PERCENT,
} from './constants/monetization.constants';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
} from './errors/monetization.errors';
import { calcDiscountAmount, calcFinalPrice } from './utils/money.util';

export type PriceLookupParams = {
  productId: string;
  cityId?: string | null;
  categoryId?: string | null;
  placementId?: string | null;
  durationHours?: number | null;
  durationDays?: number | null;
};

export type PricedLine = {
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  currency: string;
  productPriceId: string;
};

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  private isPriceValidNow(price: ProductPrice, now: Date): boolean {
    if (!price.isActive) return false;
    if (price.validFrom && price.validFrom > now) return false;
    if (price.validUntil && price.validUntil < now) return false;
    return true;
  }

  async findProductPrice(params: PriceLookupParams): Promise<ProductPrice> {
    const now = new Date();
    const scopes: Array<{
      cityId: string | null;
      categoryId: string | null;
      placementId: string | null;
    }> = [
      {
        cityId: params.cityId ?? null,
        categoryId: params.categoryId ?? null,
        placementId: params.placementId ?? null,
      },
      {
        cityId: params.cityId ?? null,
        categoryId: params.categoryId ?? null,
        placementId: null,
      },
      { cityId: params.cityId ?? null, categoryId: null, placementId: null },
      { cityId: null, categoryId: params.categoryId ?? null, placementId: null },
      { cityId: null, categoryId: null, placementId: null },
    ];

    for (const scope of scopes) {
      if (scope.placementId != null && params.placementId == null) continue;
      if (scope.cityId != null && params.cityId == null) continue;
      if (scope.categoryId != null && params.categoryId == null) continue;

      const candidates = await this.prisma.productPrice.findMany({
        where: {
          productId: params.productId,
          cityId: scope.cityId,
          categoryId: scope.categoryId,
          placementId: scope.placementId,
          durationHours: params.durationHours ?? null,
          durationDays: params.durationDays ?? null,
        },
      });

      const match = candidates.find((p) => this.isPriceValidNow(p, now));
      if (match) return match;
    }

    monetizationBadRequest(
      MonetizationErrorCode.PRICE_NOT_FOUND,
      'No active price found for product and duration',
    );
  }

  async resolvePlanDiscountPercent(businessId: string): Promise<number> {
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    return LEGACY_PLAN_DISCOUNT_PERCENT[ctx.effectiveTier];
  }

  packageDiscountPercent(): number {
    return PACKAGE_DISCOUNT_PERCENT;
  }

  applyDiscount(
    basePrice: number,
    discountPercent: number,
    currency = 'KZT',
    productPriceId = '',
  ): PricedLine {
    const discountAmount = calcDiscountAmount(basePrice, discountPercent);
    const finalPrice = calcFinalPrice(basePrice, discountPercent);
    return {
      basePrice,
      discountPercent,
      discountAmount,
      finalPrice,
      currency,
      productPriceId,
    };
  }

  async priceProductLine(
    businessId: string,
    params: PriceLookupParams,
    options?: { isPackage?: boolean },
  ): Promise<PricedLine> {
    const price = await this.findProductPrice(params);
    const discountPercent = options?.isPackage
      ? this.packageDiscountPercent()
      : await this.resolvePlanDiscountPercent(businessId);
    return this.applyDiscount(
      price.price,
      discountPercent,
      price.currency,
      price.id,
    );
  }

  resolveEffectiveTier(planTier: BusinessPlanTier, planExpiresAt: Date | null) {
    return this.planLimits.resolveEffectiveTier({ planTier, planExpiresAt });
  }
}
