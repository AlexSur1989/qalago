/**
 * Dev-only demo ad campaigns for Stage 3A manual testing.
 * NOT invoked from prisma/seed.ts — run: npm run seed:monetization-demo
 */
import {
  AdCampaignStatus,
  AdModerationStatus,
  BusinessStatus,
  MonetizationProductType,
  PrismaClient,
  PromotionStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function findProduct(type: MonetizationProductType) {
  return prisma.monetizationProduct.findFirst({
    where: { type, isActive: true },
  });
}

async function findPlacement(code: string) {
  return prisma.adPlacement.findUnique({ where: { code } });
}

async function main() {
  const city = await prisma.city.findFirst({
    where: { slug: 'uralsk', isActive: true },
  });
  if (!city) {
    throw new Error('Uralsk city not found — run main seed first');
  }

  const businesses = await prisma.business.findMany({
    where: { cityId: city.id, status: BusinessStatus.ACTIVE },
    take: 5,
    orderBy: { createdAt: 'asc' },
  });
  if (businesses.length < 2) {
    throw new Error('Need at least 2 ACTIVE businesses in Uralsk');
  }

  const categoryId = businesses[0]!.categoryId;
  const now = new Date();
  const endAt = new Date(now.getTime() + 14 * 86400000);

  const demos: Array<{
    label: string;
    businessId: string;
    productType: MonetizationProductType;
    placementCode: string;
    categoryId?: string | null;
    weight?: number;
    withCreative?: boolean;
    withPromotion?: boolean;
  }> = [
    {
      label: 'demo-vip',
      businessId: businesses[0]!.id,
      productType: MonetizationProductType.VIP_BANNER,
      placementCode: 'HOME_VIP_BANNER',
      withCreative: true,
    },
    {
      label: 'demo-featured-1',
      businessId: businesses[0]!.id,
      productType: MonetizationProductType.FEATURED_BUSINESS,
      placementCode: 'HOME_FEATURED',
      weight: 1,
    },
    {
      label: 'demo-featured-2',
      businessId: businesses[1]!.id,
      productType: MonetizationProductType.FEATURED_BUSINESS,
      placementCode: 'HOME_FEATURED',
      weight: 2,
    },
    {
      label: 'demo-top',
      businessId: businesses[0]!.id,
      productType: MonetizationProductType.TOP_CATEGORY,
      placementCode: 'CATEGORY_TOP',
      categoryId,
    },
    {
      label: 'demo-boost',
      businessId: businesses[1]!.id,
      productType: MonetizationProductType.BOOST,
      placementCode: 'CATEGORY_BOOST',
      categoryId,
    },
  ];

  if (businesses[2]) {
    demos.push({
      label: 'demo-promotion',
      businessId: businesses[2].id,
      productType: MonetizationProductType.PROMOTED_PROMOTION,
      placementCode: 'HOME_PROMOTIONS',
      withPromotion: true,
    });
  }

  const created: string[] = [];

  for (const demo of demos) {
    const existing = await prisma.adCampaign.findFirst({
      where: {
        businessId: demo.businessId,
        product: { type: demo.productType },
        status: AdCampaignStatus.ACTIVE,
        endAt: { gt: now },
      },
    });
    if (existing) {
      created.push(`${demo.label} (skipped, exists ${existing.id})`);
      continue;
    }

    const product = await findProduct(demo.productType);
    const placement = await findPlacement(demo.placementCode);
    if (!product || !placement) {
      created.push(`${demo.label} (skipped, missing product/placement)`);
      continue;
    }

    let creativeId: string | null = null;
    if (demo.withCreative) {
      const creative = await prisma.adCreative.create({
        data: {
          businessId: demo.businessId,
          title: `Demo ${demo.label}`,
          description: 'Stage 3A demo banner',
          imageUrl: '/uploads/demo-banner.jpg',
          moderationStatus: AdModerationStatus.APPROVED,
        },
      });
      creativeId = creative.id;
    }

    let orderItemId: string | null = null;
    if (demo.withPromotion) {
      const promotion = await prisma.promotion.create({
        data: {
          businessId: demo.businessId,
          title: 'Demo promo -20%',
          discountText: '-20%',
          status: PromotionStatus.ACTIVE,
          startDate: now,
          endDate: endAt,
        },
      });

      const order = await prisma.order.create({
        data: {
          orderNumber: `DEMO-${Date.now()}-${demo.label}`,
          businessId: demo.businessId,
          status: 'PAID',
          subtotal: 0,
          totalAmount: 0,
          paidAt: now,
          items: {
            create: {
              productId: product.id,
              basePrice: 0,
              finalPrice: 0,
              metadata: { promotionId: promotion.id },
            },
          },
        },
        include: { items: true },
      });
      orderItemId = order.items[0]!.id;
    }

    const campaign = await prisma.adCampaign.create({
      data: {
        businessId: demo.businessId,
        productId: product.id,
        creativeId,
        orderItemId,
        cityId: city.id,
        categoryId: demo.categoryId ?? null,
        status: AdCampaignStatus.ACTIVE,
        startAt: now,
        endAt,
        weight: demo.weight ?? 1,
        campaignPlacements: {
          create: { placementId: placement.id },
        },
      },
    });

    created.push(`${demo.label} → ${campaign.id}`);
  }

  console.log(JSON.stringify({ ok: true, campaigns: created }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
