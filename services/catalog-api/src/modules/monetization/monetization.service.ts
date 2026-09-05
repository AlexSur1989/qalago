import { Injectable } from '@nestjs/common';
import {
  AdCampaignStatus,
  MonetizationProductType,
  Prisma,
} from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from './availability.service';
import { CampaignStatusService } from './campaign-status.service';
import { QuoteDto } from './dto/monetization.dto';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
  monetizationNotFound,
} from './errors/monetization.errors';
import { MonetizationAccessService } from './monetization-access.service';
import { PricingService } from './pricing.service';

@Injectable()
export class MonetizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly pricing: PricingService,
    private readonly availability: AvailabilityService,
    private readonly access: MonetizationAccessService,
    private readonly campaignStatus: CampaignStatusService,
  ) {}

  async listProducts(
    params: {
      citySlug?: string;
      cityId?: string;
      categoryId?: string;
      businessId?: string;
    },
    user?: AuthUser,
  ) {
    const cityId = await this.cityScope.resolveCityId({
      citySlug: params.citySlug,
      cityId: params.cityId,
    });

    const products = await this.prisma.monetizationProduct.findMany({
      where: {
        isActive: true,
        type: { not: MonetizationProductType.PACKAGE },
      },
      orderBy: { sortOrder: 'asc' },
    });

    let discountPercent: number | undefined;
    if (params.businessId && user) {
      await this.access.assertCanManageBusiness(user, params.businessId);
      discountPercent = await this.pricing.resolvePlanDiscountPercent(
        params.businessId,
      );
    }

    return Promise.all(
      products.map(async (product) =>
        this.formatProductWithPrices(product, cityId, params.categoryId, discountPercent),
      ),
    );
  }

  async getProduct(
    code: string,
    params: {
      citySlug?: string;
      cityId?: string;
      categoryId?: string;
      businessId?: string;
    },
    user?: AuthUser,
  ) {
    const product = await this.prisma.monetizationProduct.findUnique({
      where: { code },
    });
    if (!product || !product.isActive || product.type === MonetizationProductType.PACKAGE) {
      monetizationNotFound(
        MonetizationErrorCode.PRODUCT_NOT_FOUND,
        'Product not found',
      );
    }

    const cityId = await this.cityScope.resolveCityId({
      citySlug: params.citySlug,
      cityId: params.cityId,
    });

    let discountPercent: number | undefined;
    if (params.businessId && user) {
      await this.access.assertCanManageBusiness(user, params.businessId);
      discountPercent = await this.pricing.resolvePlanDiscountPercent(
        params.businessId,
      );
    }

    return this.formatProductWithPrices(
      product!,
      cityId,
      params.categoryId,
      discountPercent,
    );
  }

  async listAdminPlacements(_user: AuthUser) {
    const placements = await this.prisma.adPlacement.findMany({
      orderBy: { code: 'asc' },
    });
    return placements.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      maxVisible: p.maxVisible,
      maxActiveCampaigns: p.maxActiveCampaigns,
      isActive: p.isActive,
    }));
  }

  async listPackages() {
    const packages = await this.prisma.promotionPackage.findMany({
      where: { isActive: true },
      include: {
        items: {
          include: { product: { select: { code: true, name: true, type: true } } },
        },
      },
      orderBy: { code: 'asc' },
    });

    return packages.map((pkg) => ({
      code: pkg.code,
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      currency: pkg.currency,
      durationDays: pkg.durationDays,
      discountPercent: this.pricing.packageDiscountPercent(),
      items: pkg.items.map((item) => ({
        productCode: item.product.code,
        productName: item.product.name,
        productType: item.product.type,
        durationDays: item.durationDays,
        durationHours: item.durationHours,
        quantity: item.quantity,
      })),
    }));
  }

  async quote(user: AuthUser, dto: QuoteDto) {
    const business = await this.access.assertCanManageBusiness(user, dto.businessId);

    if (dto.packageCode) {
      return this.quotePackage(dto);
    }

    if (!dto.productCode) {
      monetizationBadRequest(
        MonetizationErrorCode.PRODUCT_NOT_FOUND,
        'productCode or packageCode required',
      );
    }

    const product = await this.prisma.monetizationProduct.findUnique({
      where: { code: dto.productCode },
    });
    if (!product || !product.isActive) {
      monetizationNotFound(
        MonetizationErrorCode.PRODUCT_NOT_FOUND,
        'Product not found',
      );
    }

    this.assertDuration(dto.durationHours, dto.durationDays);

    const categoryId = dto.categoryId ?? business.categoryId;
    if (dto.categoryId && dto.categoryId !== business.categoryId) {
      monetizationBadRequest(
        MonetizationErrorCode.PRODUCT_NOT_AVAILABLE,
        'categoryId must match business category',
      );
    }

    const priced = await this.pricing.priceProductLine(dto.businessId, {
      productId: product!.id,
      cityId: business.cityId,
      categoryId,
      durationHours: dto.durationHours ?? null,
      durationDays: dto.durationDays ?? null,
    });

    const requestedStartAt = dto.desiredStartAt
      ? new Date(dto.desiredStartAt)
      : new Date();
    const calculatedEndAt = this.availability.addDuration(
      requestedStartAt,
      dto.durationHours,
      dto.durationDays,
    );

    const availability = await this.availability.checkAvailability({
      productType: product!.type,
      cityId: business.cityId,
      categoryId,
      desiredStartAt: requestedStartAt,
      desiredEndAt: calculatedEndAt,
    });

    return {
      product: {
        code: product!.code,
        name: product!.name,
        type: product!.type,
      },
      duration: {
        durationHours: dto.durationHours ?? null,
        durationDays: dto.durationDays ?? null,
      },
      basePrice: priced.basePrice,
      discountPercent: priced.discountPercent,
      discountAmount: priced.discountAmount,
      finalPrice: priced.finalPrice,
      currency: priced.currency,
      requestedStartAt,
      calculatedEndAt,
      availability,
    };
  }

  private async quotePackage(dto: QuoteDto) {
    const pkg = await this.prisma.promotionPackage.findUnique({
      where: { code: dto.packageCode! },
      include: { items: { include: { product: true } } },
    });
    if (!pkg || !pkg.isActive || pkg.price == null) {
      monetizationNotFound(
        MonetizationErrorCode.PACKAGE_NOT_FOUND,
        'Package not found',
      );
    }

    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: dto.businessId },
    });

    const discountPercent = this.pricing.packageDiscountPercent();
    const priced = this.pricing.applyDiscount(pkg!.price!, discountPercent, pkg!.currency);

    const itemAvailability = [];
    for (const item of pkg!.items) {
      const desiredStartAt = dto.desiredStartAt
        ? new Date(dto.desiredStartAt)
        : new Date();
      const calculatedEndAt = this.availability.addDuration(
        desiredStartAt,
        item.durationHours,
        item.durationDays,
      );
      itemAvailability.push({
        productCode: item.product.code,
        availability: await this.availability.checkAvailability({
          productType: item.product.type,
          cityId: business.cityId,
          categoryId: business.categoryId,
          desiredStartAt,
          desiredEndAt: calculatedEndAt,
        }),
      });
    }

    const allAvailable = itemAvailability.every((a) => a.availability.available);

    return {
      package: {
        code: pkg!.code,
        name: pkg!.name,
      },
      basePrice: priced.basePrice,
      discountPercent: priced.discountPercent,
      discountAmount: priced.discountAmount,
      finalPrice: priced.finalPrice,
      currency: priced.currency,
      availability: {
        available: allAvailable,
        items: itemAvailability,
      },
    };
  }

  async listCampaigns(user: AuthUser, businessId: string) {
    await this.access.assertCanManageBusiness(user, businessId);
    const campaigns = await this.prisma.adCampaign.findMany({
      where: { businessId },
      include: {
        product: true,
        creative: true,
        campaignPlacements: { include: { placement: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return campaigns.map((c) => this.formatCampaign(c));
  }

  async getCampaign(user: AuthUser, campaignId: string) {
    const campaign = await this.access.assertCampaignAccess(user, campaignId);
    return this.formatCampaign(campaign);
  }

  async listAdminCampaigns(
    user: AuthUser,
    params: { citySlug?: string; businessId?: string; page?: number; limit?: number },
  ) {
    const cityId = await this.access.resolveAdminCityFilter(user, params.citySlug);
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: Prisma.AdCampaignWhereInput = {};
    if (cityId) where.cityId = cityId;
    if (params.businessId) where.businessId = params.businessId;

    const [items, total] = await Promise.all([
      this.prisma.adCampaign.findMany({
        where,
        include: {
          product: true,
          business: { select: { id: true, title: true } },
          campaignPlacements: { include: { placement: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.adCampaign.count({ where }),
    ]);

    return {
      items: items.map((c) => this.formatCampaign(c)),
      total,
      page,
      limit,
    };
  }

  async getAdminCampaign(user: AuthUser, campaignId: string) {
    const campaign = await this.access.assertCampaignAccess(user, campaignId);
    return this.formatCampaign(campaign);
  }

  async pauseCampaign(user: AuthUser, campaignId: string) {
    await this.access.assertCampaignAccess(user, campaignId);
    const updated = await this.prisma.adCampaign.update({
      where: { id: campaignId },
      data: { status: AdCampaignStatus.PAUSED },
      include: {
        product: true,
        campaignPlacements: { include: { placement: true } },
      },
    });
    return this.formatCampaign(updated);
  }

  async resumeCampaign(user: AuthUser, campaignId: string) {
    const campaign = await this.access.assertCampaignAccess(user, campaignId);
    const effective = this.campaignStatus.getEffectiveStatus(
      campaign.status,
      campaign.startAt,
      campaign.endAt,
    );
    const status =
      effective === AdCampaignStatus.COMPLETED
        ? AdCampaignStatus.COMPLETED
        : campaign.startAt > new Date()
          ? AdCampaignStatus.SCHEDULED
          : AdCampaignStatus.ACTIVE;

    const updated = await this.prisma.adCampaign.update({
      where: { id: campaignId },
      data: { status },
      include: {
        product: true,
        campaignPlacements: { include: { placement: true } },
      },
    });
    return this.formatCampaign(updated);
  }

  async cancelCampaign(user: AuthUser, campaignId: string) {
    await this.access.assertCampaignAccess(user, campaignId);
    const updated = await this.prisma.adCampaign.update({
      where: { id: campaignId },
      data: { status: AdCampaignStatus.CANCELLED },
      include: {
        product: true,
        campaignPlacements: { include: { placement: true } },
      },
    });
    return this.formatCampaign(updated);
  }

  private async formatProductWithPrices(
    product: {
      code: string;
      name: string;
      description: string | null;
      type: MonetizationProductType;
    },
    cityId: string,
    categoryId?: string,
    discountPercent?: number,
  ) {
    const now = new Date();
    const prices = await this.prisma.productPrice.findMany({
      where: {
        productId: (
          await this.prisma.monetizationProduct.findUniqueOrThrow({
            where: { code: product.code },
          })
        ).id,
        cityId,
        isActive: true,
      },
    });

    const validPrices = prices.filter((p) => {
      if (p.validFrom && p.validFrom > now) return false;
      if (p.validUntil && p.validUntil < now) return false;
      return true;
    });

    const durations = await Promise.all(
      validPrices.map(async (price) => {
        let line;
        try {
          line = await this.pricing.findProductPrice({
            productId: price.productId,
            cityId,
            categoryId: categoryId ?? null,
            durationHours: price.durationHours,
            durationDays: price.durationDays,
          });
        } catch {
          return null;
        }

        const pct = discountPercent ?? 0;
        const priced = this.pricing.applyDiscount(line.price, pct, line.currency, line.id);
        return {
          durationHours: price.durationHours,
          durationDays: price.durationDays,
          basePrice: priced.basePrice,
          discountPercent: priced.discountPercent,
          finalPrice: priced.finalPrice,
          currency: priced.currency,
        };
      }),
    );

    return {
      code: product.code,
      name: product.name,
      description: product.description,
      type: product.type,
      durations: durations.filter(Boolean),
    };
  }

  private assertDuration(durationHours?: number, durationDays?: number) {
    if (!durationHours && !durationDays) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_DURATION,
        'durationHours or durationDays required',
      );
    }
  }

  private formatCampaign(campaign: {
    id: string;
    businessId: string;
    status: AdCampaignStatus;
    startAt: Date;
    endAt: Date;
    servedCount: number;
    qualifiedImpressions: number;
    clickCount: number;
    cityId: string;
    categoryId: string | null;
    product: { code: string; name: string; type: MonetizationProductType };
    creative?: { id: string; moderationStatus: string } | null;
    campaignPlacements?: Array<{ placement: { code: string; name: string } }>;
    business?: { id: string; title: string } | { ownerId: string | null; cityId: string };
  }) {
    const effectiveStatus = this.campaignStatus.getEffectiveStatus(
      campaign.status,
      campaign.startAt,
      campaign.endAt,
    );

    return {
      id: campaign.id,
      businessId: campaign.businessId,
      businessTitle:
        campaign.business && 'title' in campaign.business
          ? campaign.business.title
          : undefined,
      status: campaign.status,
      effectiveStatus,
      startAt: campaign.startAt,
      endAt: campaign.endAt,
      product: campaign.product,
      creative: campaign.creative,
      placements: campaign.campaignPlacements?.map((cp) => cp.placement),
      metrics: {
        servedCount: campaign.servedCount,
        qualifiedImpressions: campaign.qualifiedImpressions,
        clickCount: campaign.clickCount,
      },
      cityId: campaign.cityId,
      categoryId: campaign.categoryId,
    };
  }
}
