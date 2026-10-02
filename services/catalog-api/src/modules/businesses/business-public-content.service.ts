import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessStatus, Prisma } from '@prisma/client';
import {
  PUBLIC_CATALOG_DEFAULT_LIMIT,
  PUBLIC_CATALOG_MAX_LIMIT,
  PUBLIC_CATALOG_PREVIEW_LIMIT,
  PUBLIC_GALLERY_DEFAULT_LIMIT,
  PUBLIC_GALLERY_MAX_LIMIT,
  PUBLIC_GALLERY_PREVIEW_LIMIT,
  PUBLIC_PROMOTIONS_DEFAULT_LIMIT,
  PUBLIC_PROMOTIONS_MAX_LIMIT,
  PUBLIC_PROMOTIONS_PREVIEW_LIMIT,
  PUBLIC_REVIEWS_PREVIEW_LIMIT,
} from '../../common/constants/public-preview.constants';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import {
  selectPublicPromotions,
  sliceToPublicLimit,
} from '../../common/utils/plan-entitlements.util';
import { selectPublishedCatalogServiceItemsForEffectiveTier } from '../../common/utils/public-catalog-service-items.util';
import { publicServiceItemMatchesCatalogSearch } from '../../common/utils/catalog-search-query.util';
import { publicReviewWhere } from '../../common/constants/review.constants';
import { ReviewAggregationService } from '../../common/services/review-aggregation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ListBusinessCatalogQueryDto } from './dto/business-catalog.dto';
import { ListBusinessPhotosQueryDto } from './dto/business-photos.dto';
import { ListBusinessPromotionsQueryDto } from './dto/business-promotions.dto';
import { PUBLIC_BUSINESS_IMAGE_WHERE } from '../uploads/business-image-scope.util';
import {
  buildEffectiveMediaDto,
  selectEligibleVisibleImages,
  toPublicEffectiveMediaItem,
  type EffectiveMediaDto,
} from './business-effective-media.util';
import { resolveActiveBusinessLocationForDetail } from './business-effective-physical.util';
import {
  buildEffectiveCatalogDto,
  isCatalogEntityEligibleAtLocation,
} from './business-effective-catalog.util';
import {
  buildEffectivePromotionsDto,
  filterPromotionsByBranchEligibility,
  serializePublicPromotionItem,
  type PromotionBranchRow,
} from './business-effective-promotions.util';
import { mapPublicReviewsPreviewBlock } from '../../common/dto/public-review.dto.mapper';

const catalogItemSelect = {
  id: true,
  title: true,
  titleKk: true,
  description: true,
  descriptionKk: true,
  price: true,
  imageUrl: true,
  sortOrder: true,
  groupId: true,
  createdAt: true,
  group: {
    select: {
      id: true,
      title: true,
      sortOrder: true,
      isActive: true,
    },
  },
} satisfies Prisma.ServiceItemSelect;

const catalogBranchSelect = {
  branchAvailabilities: { select: { locationId: true } },
} as const;

type CatalogItemRow = Prisma.ServiceItemGetPayload<{
  select: typeof catalogItemSelect & typeof catalogBranchSelect;
}>;

export type PublicCatalogItem = Prisma.ServiceItemGetPayload<{
  select: typeof catalogItemSelect;
}>;

@Injectable()
export class BusinessPublicContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly reviewAggregation: ReviewAggregationService,
  ) {}

  async assertActiveBusiness(businessId: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, status: BusinessStatus.ACTIVE },
      select: { id: true },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
  }

  async getGalleryPreview(businessId: string) {
    await this.assertActiveBusiness(businessId);
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const images = await this.fetchPublicVisibleBusinessImages(businessId);
    const published = this.planLimits.applyPublicPhotoLimit(
      images,
      ctx.limits.maxPhotos,
    );
    return {
      items: sliceToPublicLimit(published, PUBLIC_GALLERY_PREVIEW_LIMIT),
      totalCount: published.length,
    };
  }

  /** Moderation filter → deterministic order → plan cap applied by callers. */
  async fetchPublicVisibleBusinessImages(businessId: string) {
    return this.prisma.businessImage.findMany({
      where: { businessId, ...PUBLIC_BUSINESS_IMAGE_WHERE },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  /**
   * Active-location scoped effective media (detail additive block).
   * Sequence: active location → branch+brand eligibility → moderation (fetch) → order → plan cap → preview slice.
   */
  async getEffectiveMediaForDetail(
    businessId: string,
    activeLocationId: string | null,
    brandCoverImageUrl: string | null,
  ): Promise<EffectiveMediaDto> {
    await this.assertActiveBusiness(businessId);
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const images = await this.fetchPublicVisibleBusinessImages(businessId);
    const eligible = selectEligibleVisibleImages(images, activeLocationId, 'active_location');
    const published = this.planLimits.applyPublicPhotoLimit(
      eligible,
      ctx.limits.maxPhotos,
    );
    const previewItems = sliceToPublicLimit(published, PUBLIC_GALLERY_PREVIEW_LIMIT);
    return buildEffectiveMediaDto(
      eligible,
      activeLocationId,
      brandCoverImageUrl,
      published,
      previewItems,
    );
  }

  async getPublishedCatalogItems(businessId: string) {
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const items = await this.fetchBaseCatalogItemRows(businessId);
    const published = selectPublishedCatalogServiceItemsForEffectiveTier(
      this.toPublicCatalogItems(items),
      ctx.effectiveTier,
    );
    return { items: published, totalCount: published.length };
  }

  /** Branch-aware published catalog: base eligibility → branch filter → tier cap. */
  async getBranchAwarePublishedCatalogItems(
    businessId: string,
    activeLocationId: string | null,
  ) {
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const rows = await this.fetchBaseCatalogItemRows(businessId);
    const branchEligible = rows.filter((row) =>
      isCatalogEntityEligibleAtLocation(row.branchAvailabilities, activeLocationId),
    );
    const published = selectPublishedCatalogServiceItemsForEffectiveTier(
      this.toPublicCatalogItems(branchEligible),
      ctx.effectiveTier,
    );
    return { items: published, totalCount: published.length };
  }

  async getEffectiveCatalogForDetail(businessId: string, activeLocationId: string | null) {
    await this.assertActiveBusiness(businessId);
    const { items: published } = await this.getBranchAwarePublishedCatalogItems(
      businessId,
      activeLocationId,
    );
    const sections = await this.prisma.serviceMenuGroup.findMany({
      where: { businessId },
      select: { id: true, title: true, sortOrder: true, isActive: true },
    });
    return buildEffectiveCatalogDto(
      activeLocationId,
      published,
      sections,
      (item) => this.serializeCatalogItem(item),
    );
  }

  async getPublishedPromotionsItems(businessId: string) {
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const promotions = await this.fetchPromotionBranchRows(businessId);
    const published = this.planLimits.applyPublicPromotionLimit(
      promotions,
      ctx.limits.maxActivePromotions,
    );
    return { items: published, totalCount: published.length };
  }

  /** Branch-aware published promotions: ACTIVE + public rules → branch filter → plan cap. */
  async getBranchAwarePublishedPromotions(
    businessId: string,
    activeLocationId: string | null,
  ) {
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const promotions = await this.fetchPromotionBranchRows(businessId);
    const branchEligible = filterPromotionsByBranchEligibility(promotions, activeLocationId);
    const published = this.planLimits.applyPublicPromotionLimit(
      branchEligible,
      ctx.limits.maxActivePromotions,
    );
    return { items: published, totalCount: published.length };
  }

  async getEffectivePromotionsForDetail(businessId: string, activeLocationId: string | null) {
    await this.assertActiveBusiness(businessId);
    const { items: published } = await this.getBranchAwarePublishedPromotions(
      businessId,
      activeLocationId,
    );
    return buildEffectivePromotionsDto(activeLocationId, published);
  }

  async getCatalogPreview(businessId: string) {
    await this.assertActiveBusiness(businessId);
    const { items, totalCount } = await this.getPublishedCatalogItems(businessId);
    return {
      items: sliceToPublicLimit(items, PUBLIC_CATALOG_PREVIEW_LIMIT),
      totalCount,
    };
  }

  async getPromotionsPreview(businessId: string) {
    await this.assertActiveBusiness(businessId);
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const promotions = await this.prisma.promotion.findMany({
      where: { businessId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    const published = this.planLimits.applyPublicPromotionLimit(
      promotions,
      ctx.limits.maxActivePromotions,
    );
    return {
      items: sliceToPublicLimit(published, PUBLIC_PROMOTIONS_PREVIEW_LIMIT),
      totalCount: published.length,
    };
  }

  async getReviewsPreview(businessId: string) {
    await this.assertActiveBusiness(businessId);
    const publicWhere = { businessId, ...publicReviewWhere() };
    const [items, metrics] = await Promise.all([
      this.prisma.review.findMany({
        where: publicWhere,
        include: { user: { select: { id: true, name: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: PUBLIC_REVIEWS_PREVIEW_LIMIT,
      }),
      this.reviewAggregation.aggregateForBusiness(businessId),
    ]);
    return mapPublicReviewsPreviewBlock({ items, totalCount: metrics.reviewCount });
  }

  async findPublicPromotions(businessId: string, query: ListBusinessPromotionsQueryDto) {
    await this.assertActiveBusiness(businessId);
    const page = query.page ?? 1;
    const limit = Math.min(
      query.limit ?? PUBLIC_PROMOTIONS_DEFAULT_LIMIT,
      PUBLIC_PROMOTIONS_MAX_LIMIT,
    );

    const branchScoped = Boolean(query.locationId?.trim());
    const activeLocationId = branchScoped
      ? await this.resolveDetailAlignedActiveLocationId(businessId, query.locationId)
      : null;

    const { items: published, totalCount } = branchScoped
      ? await this.getBranchAwarePublishedPromotions(businessId, activeLocationId)
      : await this.getPublishedPromotionsItems(businessId);

    const skip = (page - 1) * limit;
    const pageItems = published.slice(skip, skip + limit);

    return {
      ...(branchScoped ? { activeLocationId } : {}),
      items: pageItems.map(serializePublicPromotionItem),
      pagination: {
        page,
        limit,
        total: published.length,
        totalPages: Math.ceil(published.length / limit) || 0,
        publishedTotal: totalCount,
      },
    };
  }

  async findPublicCatalog(businessId: string, query: ListBusinessCatalogQueryDto) {
    await this.assertActiveBusiness(businessId);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? PUBLIC_CATALOG_DEFAULT_LIMIT, PUBLIC_CATALOG_MAX_LIMIT);

    const branchScoped = Boolean(query.locationId?.trim());
    const activeLocationId = branchScoped
      ? await this.resolveDetailAlignedActiveLocationId(businessId, query.locationId)
      : null;

    const { items: published, totalCount } = branchScoped
      ? await this.getBranchAwarePublishedCatalogItems(businessId, activeLocationId)
      : await this.getPublishedCatalogItems(businessId);

    let filtered = published;
    if (query.sectionId) {
      filtered = filtered.filter((item) => item.groupId === query.sectionId);
    }
    if (query.search?.trim()) {
      filtered = filtered.filter((item) =>
        publicServiceItemMatchesCatalogSearch(item, query.search),
      );
    }

    const skip = (page - 1) * limit;
    const pageItems = filtered.slice(skip, skip + limit);

    let sections = await this.prisma.serviceMenuGroup.findMany({
      where: { businessId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true, sortOrder: true },
    });
    if (branchScoped) {
      const sectionIds = new Set(
        filtered.map((item) => item.groupId).filter((id): id is string => Boolean(id)),
      );
      sections = sections.filter((section) => sectionIds.has(section.id));
    }

    return {
      ...(branchScoped ? { activeLocationId } : {}),
      items: pageItems.map((item) => this.serializeCatalogItem(item)),
      sections,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit) || 0,
        publishedTotal: totalCount,
      },
    };
  }

  async findPublicPhotos(businessId: string, query: ListBusinessPhotosQueryDto) {
    await this.assertActiveBusiness(businessId);
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? PUBLIC_GALLERY_DEFAULT_LIMIT, PUBLIC_GALLERY_MAX_LIMIT);

    const trimmedLocationId = query.locationId?.trim();
    let activeLocationId: string | null = null;
    let mode: 'business_wide' | 'active_location' = 'business_wide';

    if (trimmedLocationId) {
      const locations = await this.prisma.businessLocation.findMany({
        where: { businessId },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      });
      const { location } = resolveActiveBusinessLocationForDetail(
        locations,
        trimmedLocationId,
      );
      activeLocationId = location?.id ?? null;
      mode = 'active_location';
    }

    const images = await this.fetchPublicVisibleBusinessImages(businessId);
    const eligible = selectEligibleVisibleImages(images, activeLocationId, mode);
    const published = this.planLimits.applyPublicPhotoLimit(
      eligible,
      ctx.limits.maxPhotos,
    );
    const skip = (page - 1) * limit;
    const pageRows = published.slice(skip, skip + limit);
    const items = pageRows.map((row) =>
      toPublicEffectiveMediaItem(row, activeLocationId, mode),
    );

    return {
      items,
      totalCount: published.length,
      pagination: {
        page,
        limit,
        total: published.length,
        totalPages: Math.ceil(published.length / limit) || 0,
      },
    };
  }

  async resolveCoverImageUrl(
    businessId: string,
    coverImageUrl: string | null,
    publishedImages: Array<{ imageUrl: string }>,
  ) {
    const publishedUrls = new Set(publishedImages.map((image) => image.imageUrl));
    if (coverImageUrl && publishedUrls.has(coverImageUrl)) {
      return coverImageUrl;
    }
    return publishedImages[0]?.imageUrl ?? coverImageUrl;
  }

  async resolveDetailAlignedActiveLocationId(
    businessId: string,
    requestedLocationId?: string | null,
  ): Promise<string | null> {
    const locations = await this.prisma.businessLocation.findMany({
      where: { businessId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    const { location } = resolveActiveBusinessLocationForDetail(
      locations,
      requestedLocationId,
    );
    return location?.id ?? null;
  }

  private async fetchBaseCatalogItemRows(businessId: string): Promise<CatalogItemRow[]> {
    return this.prisma.serviceItem.findMany({
      where: {
        businessId,
        isActive: true,
        OR: [{ groupId: null }, { group: { isActive: true } }],
      },
      select: { ...catalogItemSelect, ...catalogBranchSelect },
    });
  }

  private toPublicCatalogItems(rows: CatalogItemRow[]): PublicCatalogItem[] {
    return rows.map(({ branchAvailabilities: _a, ...item }) => item);
  }

  private async fetchPromotionBranchRows(businessId: string): Promise<PromotionBranchRow[]> {
    return this.prisma.promotion.findMany({
      where: { businessId, status: 'ACTIVE', moderationHidden: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        businessId: true,
        title: true,
        description: true,
        imageUrl: true,
        discountText: true,
        startDate: true,
        endDate: true,
        status: true,
        moderationHidden: true,
        createdAt: true,
        branchAvailabilities: { select: { locationId: true } },
      },
    });
  }

  private serializeCatalogItem(item: PublicCatalogItem) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price != null ? item.price.toString() : null,
      imageUrl: item.imageUrl,
      sortOrder: item.sortOrder,
      sectionId: item.groupId,
      section: item.group
        ? {
            id: item.group.id,
            title: item.group.title,
            sortOrder: item.group.sortOrder,
          }
        : null,
    };
  }
}
