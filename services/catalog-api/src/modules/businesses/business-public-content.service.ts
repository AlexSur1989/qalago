import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessStatus, Prisma } from '@prisma/client';
import {
  PUBLIC_CATALOG_DEFAULT_LIMIT,
  PUBLIC_CATALOG_MAX_LIMIT,
  PUBLIC_CATALOG_PREVIEW_LIMIT,
  PUBLIC_GALLERY_DEFAULT_LIMIT,
  PUBLIC_GALLERY_MAX_LIMIT,
  PUBLIC_GALLERY_PREVIEW_LIMIT,
  PUBLIC_PROMOTIONS_PREVIEW_LIMIT,
  PUBLIC_REVIEWS_PREVIEW_LIMIT,
} from '../../common/constants/public-preview.constants';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import {
  selectPublicPromotions,
  sliceToPublicLimit,
} from '../../common/utils/plan-entitlements.util';
import { sortCatalogItems } from '../../common/utils/catalog-sort.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ListBusinessCatalogQueryDto } from './dto/business-catalog.dto';
import { ListBusinessPhotosQueryDto } from './dto/business-photos.dto';

const catalogItemSelect = {
  id: true,
  title: true,
  description: true,
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

export type PublicCatalogItem = Prisma.ServiceItemGetPayload<{
  select: typeof catalogItemSelect;
}>;

@Injectable()
export class BusinessPublicContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
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
    const images = await this.prisma.businessImage.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const published = this.planLimits.applyPublicPhotoLimit(
      images,
      ctx.limits.maxPhotos,
    );
    return {
      items: sliceToPublicLimit(published, PUBLIC_GALLERY_PREVIEW_LIMIT),
      totalCount: published.length,
    };
  }

  async getPublishedCatalogItems(businessId: string) {
    const ctx = await this.planLimits.getBusinessPlanContext(businessId);
    const items = await this.prisma.serviceItem.findMany({
      where: {
        businessId,
        isActive: true,
        OR: [{ groupId: null }, { group: { isActive: true } }],
      },
      select: catalogItemSelect,
    });
    const sorted = sortCatalogItems(items);
    const published = sliceToPublicLimit(sorted, ctx.limits.maxServiceItems);
    return { items: published, totalCount: published.length };
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
    const [items, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where: { businessId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: PUBLIC_REVIEWS_PREVIEW_LIMIT,
      }),
      this.prisma.review.count({ where: { businessId } }),
    ]);
    return { items, totalCount };
  }

  async findPublicCatalog(businessId: string, query: ListBusinessCatalogQueryDto) {
    await this.assertActiveBusiness(businessId);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? PUBLIC_CATALOG_DEFAULT_LIMIT, PUBLIC_CATALOG_MAX_LIMIT);
    const { items: published, totalCount } = await this.getPublishedCatalogItems(businessId);

    let filtered = published;
    if (query.sectionId) {
      filtered = filtered.filter((item) => item.groupId === query.sectionId);
    }
    if (query.search?.trim()) {
      const needle = query.search.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        const inTitle = item.title.toLowerCase().includes(needle);
        const inDescription = item.description?.toLowerCase().includes(needle) ?? false;
        return inTitle || inDescription;
      });
    }

    const skip = (page - 1) * limit;
    const pageItems = filtered.slice(skip, skip + limit);

    const sections = await this.prisma.serviceMenuGroup.findMany({
      where: { businessId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true, sortOrder: true },
    });

    return {
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

    const images = await this.prisma.businessImage.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const published = this.planLimits.applyPublicPhotoLimit(
      images,
      ctx.limits.maxPhotos,
    );
    const skip = (page - 1) * limit;
    const items = published.slice(skip, skip + limit);

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
