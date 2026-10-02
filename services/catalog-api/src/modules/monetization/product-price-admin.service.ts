import { Injectable } from '@nestjs/common';
import { MonetizationProductType, Prisma } from '@prisma/client';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PRODUCT_PLACEMENT_MAP } from './constants/monetization.constants';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
  monetizationNotFound,
} from './errors/monetization.errors';
import { MonetizationAccessService } from './monetization-access.service';

export type AdminProductPriceRow = {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  productType: MonetizationProductType;
  placementCode: string | null;
  cityId: string | null;
  citySlug: string | null;
  cityNameRu: string | null;
  categoryId: string | null;
  placementId: string | null;
  durationHours: number | null;
  durationDays: number | null;
  price: number;
  currency: string;
  isActive: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PriceIdentity = {
  productId: string;
  cityId: string | null;
  categoryId: string | null;
  placementId: string | null;
  durationHours: number | null;
  durationDays: number | null;
};

@Injectable()
export class ProductPriceAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: MonetizationAccessService,
    private readonly cityScope: CityScopeService,
  ) {}

  private formatRow(
    row: Prisma.ProductPriceGetPayload<{
      include: { product: true; city: true; placement: true };
    }>,
  ): AdminProductPriceRow {
    const placementCode =
      row.placement?.code ??
      PRODUCT_PLACEMENT_MAP[row.product.type as MonetizationProductType] ??
      null;
    return {
      id: row.id,
      productId: row.productId,
      productCode: row.product.code,
      productName: row.product.name,
      productType: row.product.type,
      placementCode,
      cityId: row.cityId,
      citySlug: row.city?.slug ?? null,
      cityNameRu: row.city?.nameRu ?? null,
      categoryId: row.categoryId,
      placementId: row.placementId,
      durationHours: row.durationHours,
      durationDays: row.durationDays,
      price: row.price,
      currency: row.currency,
      isActive: row.isActive,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private assertDuration(durationHours?: number | null, durationDays?: number | null) {
    const hasHours = durationHours != null && durationHours > 0;
    const hasDays = durationDays != null && durationDays > 0;
    if (hasHours === hasDays) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_DURATION,
        'Provide exactly one of durationHours or durationDays',
      );
    }
  }

  private async assertPriceCityScope(user: AuthUser, cityId: string | null) {
    await this.cityScope.assertCityInAdminScope(user, cityId);
  }

  private async findDuplicate(identity: PriceIdentity, excludeId?: string) {
    return this.prisma.productPrice.findFirst({
      where: {
        ...identity,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async listAdvertisingProducts(_user: AuthUser) {
    return this.prisma.monetizationProduct.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
    });
  }

  async listProductPrices(
    user: AuthUser,
    params: {
      citySlug?: string;
      productId?: string;
      isActive?: boolean;
    },
  ) {
    const cityId = await this.access.resolveAdminCityFilter(user, params.citySlug);
    const where: Prisma.ProductPriceWhereInput = {};
    if (cityId) {
      where.cityId = cityId;
    }
    if (params.productId) {
      where.productId = params.productId;
    }
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const rows = await this.prisma.productPrice.findMany({
      where,
      include: { product: true, city: true, placement: true },
      orderBy: [
        { product: { sortOrder: 'asc' } },
        { cityId: 'asc' },
        { durationDays: 'asc' },
        { durationHours: 'asc' },
      ],
    });

    return rows.map((row) => this.formatRow(row));
  }

  async createProductPrice(
    user: AuthUser,
    input: {
      productId: string;
      cityId: string | null;
      durationHours?: number | null;
      durationDays?: number | null;
      price: number;
      isActive?: boolean;
    },
  ) {
    if (!Number.isInteger(input.price) || input.price < 1) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_PRICE,
        'Price must be a positive integer KZT amount',
      );
    }

    this.assertDuration(input.durationHours, input.durationDays);
    await this.assertPriceCityScope(user, input.cityId);

    const product = await this.prisma.monetizationProduct.findUnique({
      where: { id: input.productId },
    });
    if (!product || !product.isActive) {
      monetizationNotFound(
        MonetizationErrorCode.PRODUCT_NOT_FOUND,
        'Monetization product not found or inactive',
      );
    }

    if (input.cityId) {
      const city = await this.prisma.city.findUnique({ where: { id: input.cityId } });
      if (!city) {
        monetizationBadRequest(
          MonetizationErrorCode.INVALID_CITY,
          'City not found',
        );
      }
    }

    const identity: PriceIdentity = {
      productId: input.productId,
      cityId: input.cityId,
      categoryId: null,
      placementId: null,
      durationHours: input.durationHours ?? null,
      durationDays: input.durationDays ?? null,
    };

    const duplicate = await this.findDuplicate(identity);
    if (duplicate) {
      monetizationBadRequest(
        MonetizationErrorCode.PRICE_DUPLICATE,
        'A price row already exists for this product, city, and duration',
      );
    }

    const created = await this.prisma.productPrice.create({
      data: {
        productId: identity.productId,
        cityId: identity.cityId,
        categoryId: identity.categoryId,
        placementId: identity.placementId,
        durationHours: identity.durationHours,
        durationDays: identity.durationDays,
        price: input.price,
        currency: 'KZT',
        isActive: input.isActive ?? true,
      },
      include: { product: true, city: true, placement: true },
    });

    return this.formatRow(created);
  }

  async updateProductPrice(
    user: AuthUser,
    id: string,
    input: { price?: number; isActive?: boolean },
  ) {
    const existing = await this.prisma.productPrice.findUnique({
      where: { id },
      include: { product: true, city: true, placement: true },
    });
    if (!existing) {
      monetizationNotFound(MonetizationErrorCode.PRICE_NOT_FOUND, 'Product price not found');
    }

    await this.assertPriceCityScope(user, existing!.cityId);

    if (input.price !== undefined) {
      if (!Number.isInteger(input.price) || input.price < 1) {
        monetizationBadRequest(
          MonetizationErrorCode.INVALID_PRICE,
          'Price must be a positive integer KZT amount',
        );
      }
    }

    if (input.price === undefined && input.isActive === undefined) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_PRICE,
        'Provide price and/or isActive to update',
      );
    }

    const updated = await this.prisma.productPrice.update({
      where: { id },
      data: {
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: { product: true, city: true, placement: true },
    });

    return this.formatRow(updated);
  }
}
