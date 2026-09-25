import { Injectable } from '@nestjs/common';
import {
  AdCampaignStatus,
  AdModerationStatus,
  AnalyticsEventType,
  AnalyticsPlatform,
  BusinessStatus,
  MonetizationProductType,
  Prisma,
} from '@prisma/client';
import { CityScopeService } from '../../common/services/city-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdRotationService } from './ad-rotation.service';
import {
  CATEGORY_SCOPED_PLACEMENTS,
  CREATIVE_REQUIRED_PLACEMENTS,
  SERVING_PLACEMENT_CODES,
  SPONSORED_DISPLAY_LABEL,
  ServingPlacementCode,
} from './constants/monetization.constants';
import { ServeAdsQueryDto } from './dto/monetization.dto';
import {
  MonetizationErrorCode,
  monetizationBadRequest,
  monetizationNotFound,
} from './errors/monetization.errors';
import {
  AdServeLocationContext,
  batchResolveAdServeLocationContexts,
  overlayBusinessCardWithLocation,
} from './utils/ad-serving-location.util';

type OrderItemMeta = {
  promotionId?: string;
};

const businessCardSelect = {
  id: true,
  title: true,
  slug: true,
  shortDesc: true,
  cityId: true,
  phone: true,
  whatsapp: true,
  instagram: true,
  website: true,
  workHours: true,
  coverImageUrl: true,
  categoryId: true,
  category: { select: { id: true, title: true, slug: true, icon: true } },
} satisfies Prisma.BusinessSelect;

const campaignInclude = {
  product: { select: { id: true, code: true, type: true, isActive: true } },
  creative: true,
  business: { select: businessCardSelect },
  orderItem: { select: { metadata: true } },
  campaignPlacements: { include: { placement: true } },
} satisfies Prisma.AdCampaignInclude;

type LoadedCampaign = Prisma.AdCampaignGetPayload<{ include: typeof campaignInclude }>;

@Injectable()
export class AdServingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cityScope: CityScopeService,
    private readonly rotation: AdRotationService,
  ) {}

  async serveAds(query: ServeAdsQueryDto) {
    this.assertValidPlacementCode(query.placementCode);
    this.assertSessionId(query.sessionId);

    const cityId = await this.cityScope.resolveCityId({
      cityId: query.cityId,
      citySlug: query.citySlug,
    });

    if (
      CATEGORY_SCOPED_PLACEMENTS.has(query.placementCode as ServingPlacementCode) &&
      !query.categoryId
    ) {
      monetizationBadRequest(
        MonetizationErrorCode.CATEGORY_REQUIRED,
        'categoryId is required for this placement',
      );
    }

    const placement = await this.prisma.adPlacement.findUnique({
      where: { code: query.placementCode },
    });
    if (!placement) {
      monetizationNotFound(
        MonetizationErrorCode.PLACEMENT_NOT_FOUND,
        'Placement not found',
      );
    }
    if (!placement.isActive) {
      monetizationBadRequest(
        MonetizationErrorCode.PLACEMENT_NOT_ACTIVE,
        'Placement is not active',
      );
    }

    const maxVisible = Math.min(
      placement.maxVisible,
      query.limit ?? placement.maxVisible,
    );

    const now = new Date();
    const campaigns = await this.loadEligibleCampaigns(
      query.placementCode,
      placement.id,
      cityId,
      query.categoryId,
      now,
    );

    const locationResults = await batchResolveAdServeLocationContexts(
      this.prisma,
      cityId,
      campaigns.map((c) => this.toLocationCampaignInput(c)),
    );

    const branchEligible = campaigns.filter((c) => {
      const ctx = locationResults.get(c.id);
      return ctx != null && !ctx.excluded;
    });

    const selected = this.rotation.selectCampaigns(
      branchEligible.map((c) => ({
        id: c.id,
        qualifiedImpressions: c.qualifiedImpressions,
        weight: c.weight,
        lastTopPositionAt: c.lastTopPositionAt,
      })),
      query.sessionId,
      query.placementCode,
      cityId,
      query.categoryId,
      maxVisible,
    );

    const selectedIds = new Set(selected.map((s) => s.campaign.id));
    const selectedCampaigns = branchEligible.filter((c) => selectedIds.has(c.id));
    const positionById = new Map(
      selected.map((s) => [s.campaign.id, s.position]),
    );

    const promotionPayloadById = await this.loadPromotionPayloadsForSelected(
      selectedCampaigns,
    );

    const items = [];
    for (const campaign of selectedCampaigns) {
      const locationCtx = locationResults.get(campaign.id)! as AdServeLocationContext;
      const position = positionById.get(campaign.id) ?? 1;
      const item = this.buildAdItem(
        campaign,
        query.placementCode,
        placement.id,
        position,
        locationCtx,
        promotionPayloadById,
      );
      await this.recordServe(
        campaign,
        placement.id,
        query.sessionId,
        now,
        locationCtx.destinationLocationId,
        query.platform,
      );
      items.push(item);
    }

    items.sort((a, b) => a.position - b.position);

    return {
      placementCode: query.placementCode,
      cityId,
      categoryId: query.categoryId ?? null,
      items,
    };
  }

  private toLocationCampaignInput(campaign: LoadedCampaign) {
    const meta = this.parseMeta(campaign.orderItem?.metadata ?? null);
    return {
      id: campaign.id,
      businessId: campaign.businessId,
      cityId: campaign.cityId,
      targetBusinessLocationId: campaign.targetBusinessLocationId,
      destinationBusinessLocationId: campaign.destinationBusinessLocationId,
      promotionId: campaign.promotionId,
      productType: campaign.product.type,
      orderItemPromotionId: meta.promotionId ?? null,
    };
  }

  private async loadPromotionPayloadsForSelected(campaigns: LoadedCampaign[]) {
    const ids = [
      ...new Set(
        campaigns
          .filter((c) => c.product.type === MonetizationProductType.PROMOTED_PROMOTION)
          .map((c) => {
            const meta = this.parseMeta(c.orderItem?.metadata ?? null);
            return c.promotionId ?? meta.promotionId;
          })
          .filter((id): id is string => !!id),
      ),
    ];
    if (ids.length === 0) {
      return new Map<
        string,
        {
          id: string;
          title: string;
          description: string | null;
          imageUrl: string | null;
          discountText: string | null;
        startDate: Date | null;
        endDate: Date | null;
      }
    >();
    }
    const rows = await this.prisma.promotion.findMany({
      where: {
        id: { in: ids },
        status: 'ACTIVE',
        moderationHidden: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        discountText: true,
        startDate: true,
        endDate: true,
      },
    });
    return new Map(rows.map((r) => [r.id, r]));
  }

  private assertValidPlacementCode(code: string): asserts code is ServingPlacementCode {
    if (!(SERVING_PLACEMENT_CODES as readonly string[]).includes(code)) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_PLACEMENT,
        `Placement ${code} is not available for serving`,
      );
    }
  }

  private assertSessionId(sessionId: string) {
    if (
      !sessionId ||
      sessionId.length > 128 ||
      !/^[a-zA-Z0-9_-]+$/.test(sessionId)
    ) {
      monetizationBadRequest(
        MonetizationErrorCode.INVALID_SESSION_ID,
        'Invalid sessionId',
      );
    }
  }

  private async loadEligibleCampaigns(
    placementCode: string,
    placementId: string,
    cityId: string,
    categoryId: string | undefined,
    now: Date,
  ): Promise<LoadedCampaign[]> {
    const where: Prisma.AdCampaignWhereInput = {
      status: AdCampaignStatus.ACTIVE,
      startAt: { lte: now },
      endAt: { gt: now },
      cityId,
      business: { status: BusinessStatus.ACTIVE },
      product: { isActive: true },
      campaignPlacements: { some: { placementId } },
    };

    if (CATEGORY_SCOPED_PLACEMENTS.has(placementCode as ServingPlacementCode)) {
      where.categoryId = categoryId;
    }

    const rows = await this.prisma.adCampaign.findMany({
      where,
      include: campaignInclude,
    });

    return rows.filter((campaign) =>
      this.isCampaignEligibleForServe(campaign, placementCode),
    );
  }

  private isCampaignEligibleForServe(
    campaign: LoadedCampaign,
    placementCode: string,
  ): boolean {
    const linked = campaign.campaignPlacements.some(
      (cp) => cp.placement.code === placementCode,
    );
    if (!linked) return false;

    if (
      CREATIVE_REQUIRED_PLACEMENTS.has(placementCode as ServingPlacementCode)
    ) {
      if (!campaign.creative) return false;
      if (campaign.creative.moderationStatus !== AdModerationStatus.APPROVED) {
        return false;
      }
    }

    if (campaign.product.type === MonetizationProductType.PROMOTED_PROMOTION) {
      const meta = this.parseMeta(campaign.orderItem?.metadata ?? null);
      if (!campaign.promotionId && !meta.promotionId) return false;
    }

    return true;
  }

  private parseMeta(metadata: Prisma.JsonValue | null): OrderItemMeta {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {};
    }
    return metadata as OrderItemMeta;
  }

  private async recordServe(
    campaign: LoadedCampaign,
    placementId: string,
    sessionId: string,
    now: Date,
    businessLocationId: string | null,
    platform: AnalyticsPlatform | undefined,
  ) {
    await this.prisma.$transaction([
      this.prisma.adCampaign.update({
        where: { id: campaign.id },
        data: {
          servedCount: { increment: 1 },
          lastShownAt: now,
        },
      }),
      this.prisma.analyticsEvent.create({
        data: {
          businessId: campaign.businessId,
          type: AnalyticsEventType.AD_SERVED,
          campaignId: campaign.id,
          placementId,
          sessionId,
          ...(businessLocationId ? { businessLocationId } : {}),
          ...(platform ? { platform } : {}),
        },
      }),
    ]);
  }

  private buildAdItem(
    campaign: LoadedCampaign,
    placementCode: string,
    placementId: string,
    position: number,
    locationCtx: AdServeLocationContext,
    promotionPayloadById: Map<
      string,
      {
        id: string;
        title: string;
        description: string | null;
        imageUrl: string | null;
        discountText: string | null;
        startDate: Date | null;
        endDate: Date | null;
      }
    >,
  ) {
    const base = {
      campaignId: campaign.id,
      placementCode,
      placementId,
      position,
      sponsored: true as const,
      displayLabel: SPONSORED_DISPLAY_LABEL,
      productType: campaign.product.type,
      destinationLocationId: locationCtx.destinationLocationId,
      contextLocationId: locationCtx.contextLocationId,
    };

    switch (campaign.product.type) {
      case MonetizationProductType.VIP_BANNER:
        return {
          ...base,
          creative: campaign.creative
            ? {
                id: campaign.creative.id,
                type: campaign.creative.type,
                imageUrl: campaign.creative.imageUrl,
                title: campaign.creative.title,
                description: campaign.creative.description,
                buttonText: campaign.creative.buttonText,
                targetType: campaign.creative.targetType,
                targetId: campaign.creative.targetId,
                targetUrl: campaign.creative.targetUrl,
              }
            : null,
          business: {
            id: campaign.business.id,
            slug: campaign.business.slug,
          },
        };

      case MonetizationProductType.PROMOTED_PROMOTION: {
        const meta = this.parseMeta(campaign.orderItem?.metadata ?? null);
        const promotionId = campaign.promotionId ?? meta.promotionId;
        const promotion = promotionId
          ? promotionPayloadById.get(promotionId) ?? null
          : null;
        const businessCard = overlayBusinessCardWithLocation(
          campaign.business,
          locationCtx.cardLocation,
        );

        return {
          ...base,
          promotion,
          business: {
            id: businessCard.id,
            slug: businessCard.slug,
            title: businessCard.title,
            address: businessCard.address,
            latitude: businessCard.latitude,
            longitude: businessCard.longitude,
            phone: businessCard.phone,
          },
        };
      }

      default: {
        const businessCard = overlayBusinessCardWithLocation(
          campaign.business,
          locationCtx.cardLocation,
        );
        return {
          ...base,
          business: businessCard,
        };
      }
    }
  }
}
