import { NotFoundException } from '@nestjs/common';
import { BusinessPlanTier } from '@prisma/client';
import {
  PUBLIC_CATALOG_PREVIEW_LIMIT,
  PUBLIC_GALLERY_PREVIEW_LIMIT,
  PUBLIC_PROMOTIONS_PREVIEW_LIMIT,
  PUBLIC_REVIEWS_PREVIEW_LIMIT,
} from '../../common/constants/public-preview.constants';
import { PlanLimitsService } from '../../common/services/plan-limits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessPublicContentService } from './business-public-content.service';

function makeItems(count: number, prefix = 'item') {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    title: `${prefix} ${index + 1}`,
    description: null,
    price: null,
    imageUrl: null,
    sortOrder: index,
    groupId: null,
    createdAt: new Date(Date.now() - index * 1000),
    group: null,
    isActive: true,
  }));
}

function makeImages(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `img-${index + 1}`,
    businessId: 'biz-1',
    imageUrl: `https://cdn.example/${index + 1}.jpg`,
    sortOrder: index,
    createdAt: new Date(),
  }));
}

describe('BusinessPublicContentService (Stage 5G)', () => {
  const prisma = {
    business: { findFirst: jest.fn() },
    businessImage: { findMany: jest.fn() },
    serviceItem: { findMany: jest.fn(), count: jest.fn() },
    serviceMenuGroup: { findMany: jest.fn() },
    promotion: { findMany: jest.fn() },
    review: { findMany: jest.fn(), count: jest.fn() },
  } as unknown as PrismaService;

  const planLimits = {
    getBusinessPlanContext: jest.fn(),
    applyPublicPhotoLimit: jest.fn((items: unknown[], limit: number) => items.slice(0, limit)),
    applyPublicPromotionLimit: jest.fn((items: unknown[], limit: number) => items.slice(0, limit)),
  } as unknown as PlanLimitsService;

  const service = new BusinessPublicContentService(prisma, planLimits);

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.business.findFirst as jest.Mock).mockResolvedValue({ id: 'biz-1' });
    (planLimits.getBusinessPlanContext as jest.Mock).mockResolvedValue({
      limits: {
        maxPhotos: 100,
        maxServiceItems: 300,
        maxActivePromotions: 25,
      },
    });
  });

  it('catalog preview <= 6 with totalCount 300', async () => {
    (prisma.serviceItem.findMany as jest.Mock).mockResolvedValue(makeItems(300));

    const preview = await service.getCatalogPreview('biz-1');
    expect(preview.items).toHaveLength(PUBLIC_CATALOG_PREVIEW_LIMIT);
    expect(preview.totalCount).toBe(300);
  });

  it('gallery preview <= 6 with totalCount 100', async () => {
    (prisma.businessImage.findMany as jest.Mock).mockResolvedValue(makeImages(100));

    const preview = await service.getGalleryPreview('biz-1');
    expect(preview.items).toHaveLength(PUBLIC_GALLERY_PREVIEW_LIMIT);
    expect(preview.totalCount).toBe(100);
  });

  it('promotions preview <= 3', async () => {
    (prisma.promotion.findMany as jest.Mock).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        id: `p-${i}`,
        status: 'ACTIVE',
        createdAt: new Date(),
        startDate: null,
        endDate: null,
      })),
    );
    (planLimits.applyPublicPromotionLimit as jest.Mock).mockImplementation(
      (items: unknown[]) => items,
    );

    const preview = await service.getPromotionsPreview('biz-1');
    expect(preview.items.length).toBeLessThanOrEqual(PUBLIC_PROMOTIONS_PREVIEW_LIMIT);
    expect(preview.totalCount).toBe(10);
  });

  it('reviews preview bounded to 3', async () => {
    (prisma.review.findMany as jest.Mock).mockResolvedValue(
      Array.from({ length: PUBLIC_REVIEWS_PREVIEW_LIMIT }, (_, i) => ({ id: `r-${i}` })),
    );
    (prisma.review.count as jest.Mock).mockResolvedValue(42);

    const preview = await service.getReviewsPreview('biz-1');
    expect(preview.items).toHaveLength(PUBLIC_REVIEWS_PREVIEW_LIMIT);
    expect(preview.totalCount).toBe(42);
    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: PUBLIC_REVIEWS_PREVIEW_LIMIT }),
    );
  });

  it('full catalog default page size 20 and max limit enforced', async () => {
    (prisma.serviceItem.findMany as jest.Mock).mockResolvedValue(makeItems(300));
    (prisma.serviceMenuGroup.findMany as jest.Mock).mockResolvedValue([]);

    const page1 = await service.findPublicCatalog('biz-1', { page: 1, limit: 20 });
    expect(page1.items).toHaveLength(20);
    expect(page1.pagination.total).toBe(300);

    const capped = await service.findPublicCatalog('biz-1', { page: 1, limit: 100 });
    expect(capped.items.length).toBeLessThanOrEqual(50);
  });

  it('catalog search filters by title', async () => {
    (prisma.serviceItem.findMany as jest.Mock).mockResolvedValue([
      ...makeItems(5, 'phone'),
      ...makeItems(5, 'case'),
    ]);
    (prisma.serviceMenuGroup.findMany as jest.Mock).mockResolvedValue([]);

    const result = await service.findPublicCatalog('biz-1', { search: 'phone' });
    expect(result.items.every((item) => item.title.toLowerCase().includes('phone'))).toBe(true);
  });

  it('catalog section filter works', async () => {
    const items = makeItems(4).map((item, index) => ({
      ...item,
      groupId: index < 2 ? 'sec-a' : 'sec-b',
      group: {
        id: index < 2 ? 'sec-a' : 'sec-b',
        title: index < 2 ? 'Phones' : 'Cases',
        sortOrder: 0,
        isActive: true,
      },
    }));
    (prisma.serviceItem.findMany as jest.Mock).mockResolvedValue(items);
    (prisma.serviceMenuGroup.findMany as jest.Mock).mockResolvedValue([
      { id: 'sec-a', title: 'Phones', sortOrder: 0 },
    ]);

    const result = await service.findPublicCatalog('biz-1', { sectionId: 'sec-a' });
    expect(result.items).toHaveLength(2);
    expect(result.items.every((item) => item.sectionId === 'sec-a')).toBe(true);
  });

  it('gallery pagination second page works', async () => {
    (prisma.businessImage.findMany as jest.Mock).mockResolvedValue(makeImages(30));
    (planLimits.applyPublicPhotoLimit as jest.Mock).mockImplementation((items: unknown[]) => items);

    const page2 = await service.findPublicPhotos('biz-1', { page: 2, limit: 24 });
    expect(page2.items).toHaveLength(6);
    expect(page2.pagination.page).toBe(2);
  });

  it('public preview independent from FREE plan storage cap', async () => {
    (planLimits.getBusinessPlanContext as jest.Mock).mockResolvedValue({
      limits: {
        maxPhotos: 5,
        maxServiceItems: 10,
        maxActivePromotions: 1,
      },
    });
    (prisma.serviceItem.findMany as jest.Mock).mockResolvedValue(makeItems(10));

    const preview = await service.getCatalogPreview('biz-1');
    expect(preview.items.length).toBeLessThanOrEqual(PUBLIC_CATALOG_PREVIEW_LIMIT);
    expect(preview.totalCount).toBe(10);
  });

  it('throws when business is not active', async () => {
    (prisma.business.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(service.getCatalogPreview('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('VIP published catalog total respects plan cap', async () => {
    (planLimits.getBusinessPlanContext as jest.Mock).mockResolvedValue({
      limits: {
        maxPhotos: 100,
        maxServiceItems: 300,
        maxActivePromotions: 25,
      },
      effectiveTier: BusinessPlanTier.VIP,
    });
    (prisma.serviceItem.findMany as jest.Mock).mockResolvedValue(makeItems(300));

    const preview = await service.getCatalogPreview('biz-1');
    expect(preview.totalCount).toBe(300);
    expect(preview.items.length).toBe(PUBLIC_CATALOG_PREVIEW_LIMIT);
  });
});
