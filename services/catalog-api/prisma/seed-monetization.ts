import { MonetizationProductType, PrismaClient } from '@prisma/client';

type SeedCtx = {
  prisma: PrismaClient;
  uralskCityId: string;
};

const PLACEMENTS = [
  {
    code: 'HOME_VIP_BANNER',
    name: 'VIP баннер на главной',
    description: 'Крупный баннер в верхней части главной страницы',
    maxVisible: 1,
    maxActiveCampaigns: 3,
    isActive: true,
  },
  {
    code: 'HOME_FEATURED',
    name: 'Рекомендуем на главной',
    description: 'Блок рекомендуемых заведений на главной',
    maxVisible: 6,
    maxActiveCampaigns: 20,
    isActive: true,
  },
  {
    code: 'HOME_PROMOTIONS',
    name: 'Акции на главной',
    description: 'Лента акций на главной странице',
    maxVisible: 8,
    maxActiveCampaigns: 30,
    isActive: true,
  },
  {
    code: 'CATEGORY_TOP',
    name: 'Топ категории',
    description: 'Закрепление вверху списка категории',
    maxVisible: 3,
    maxActiveCampaigns: 15,
    isActive: true,
  },
  {
    code: 'CATEGORY_BOOST',
    name: 'Boost в категории',
    description: 'Повышенная видимость в категории',
    maxVisible: 10,
    maxActiveCampaigns: 40,
    isActive: true,
  },
  {
    code: 'SEARCH_TOP',
    name: 'Топ поиска',
    description: 'Рекламный блок в результатах поиска (будущее)',
    maxVisible: 2,
    maxActiveCampaigns: 10,
    isActive: false,
  },
  {
    code: 'MAP_FEATURED',
    name: 'Featured на карте',
    description: 'Выделение на карте (будущее)',
    maxVisible: 5,
    maxActiveCampaigns: 20,
    isActive: false,
  },
] as const;

const PRODUCTS: Array<{
  code: string;
  name: string;
  type: MonetizationProductType;
  sortOrder: number;
}> = [
  { code: 'BOOST', name: 'Boost', type: 'BOOST', sortOrder: 10 },
  { code: 'TOP_CATEGORY', name: 'Топ категории', type: 'TOP_CATEGORY', sortOrder: 20 },
  {
    code: 'PROMOTED_PROMOTION',
    name: 'Продвижение акции',
    type: 'PROMOTED_PROMOTION',
    sortOrder: 30,
  },
  {
    code: 'FEATURED_BUSINESS',
    name: 'Featured заведение',
    type: 'FEATURED_BUSINESS',
    sortOrder: 40,
  },
  { code: 'VIP_BANNER', name: 'VIP баннер', type: 'VIP_BANNER', sortOrder: 50 },
  { code: 'PACKAGE', name: 'Пакет', type: 'PACKAGE', sortOrder: 60 },
];

type PriceSeed = {
  productCode: string;
  durationHours?: number;
  durationDays?: number;
  price: number;
};

const URALSK_PRICES: PriceSeed[] = [
  { productCode: 'BOOST', durationHours: 24, price: 700 },
  { productCode: 'BOOST', durationDays: 3, price: 1500 },
  { productCode: 'BOOST', durationDays: 7, price: 2900 },
  { productCode: 'TOP_CATEGORY', durationDays: 3, price: 2900 },
  { productCode: 'TOP_CATEGORY', durationDays: 7, price: 4900 },
  { productCode: 'TOP_CATEGORY', durationDays: 30, price: 12900 },
  { productCode: 'PROMOTED_PROMOTION', durationDays: 3, price: 1900 },
  { productCode: 'PROMOTED_PROMOTION', durationDays: 7, price: 3900 },
  { productCode: 'PROMOTED_PROMOTION', durationDays: 14, price: 6900 },
  { productCode: 'PROMOTED_PROMOTION', durationDays: 30, price: 9900 },
  { productCode: 'FEATURED_BUSINESS', durationDays: 3, price: 3900 },
  { productCode: 'FEATURED_BUSINESS', durationDays: 7, price: 6900 },
  { productCode: 'FEATURED_BUSINESS', durationDays: 30, price: 17900 },
  { productCode: 'VIP_BANNER', durationDays: 3, price: 6900 },
  { productCode: 'VIP_BANNER', durationDays: 7, price: 12900 },
  { productCode: 'VIP_BANNER', durationDays: 14, price: 21900 },
  { productCode: 'VIP_BANNER', durationDays: 30, price: 34900 },
];

const PACKAGES = [
  {
    code: 'START',
    name: 'Start',
    description: 'Стартовый пакет для нового заведения',
    price: 6900,
    durationDays: 7,
  },
  {
    code: 'BUSINESS',
    name: 'Business',
    description: 'Базовый рекламный пакет',
    price: 12900,
    durationDays: 7,
  },
  {
    code: 'MAX',
    name: 'Max',
    description: 'Расширенный пакет продвижения',
    price: 19900,
    durationDays: 7,
  },
  {
    code: 'NEW_PLACE',
    name: 'New Place',
    description: 'Пакет для нового заведения',
    price: 24900,
    durationDays: 14,
  },
] as const;

type PackageItemSeed = {
  productCode: string;
  durationDays?: number;
  durationHours?: number;
};

const PACKAGE_ITEMS: Record<string, PackageItemSeed[]> = {
  START: [
    { productCode: 'TOP_CATEGORY', durationDays: 7 },
    { productCode: 'PROMOTED_PROMOTION', durationDays: 7 },
  ],
  BUSINESS: [
    { productCode: 'TOP_CATEGORY', durationDays: 7 },
    { productCode: 'FEATURED_BUSINESS', durationDays: 7 },
    { productCode: 'PROMOTED_PROMOTION', durationDays: 7 },
  ],
  MAX: [
    { productCode: 'VIP_BANNER', durationDays: 7 },
    { productCode: 'TOP_CATEGORY', durationDays: 7 },
    { productCode: 'FEATURED_BUSINESS', durationDays: 7 },
    { productCode: 'PROMOTED_PROMOTION', durationDays: 7 },
  ],
  NEW_PLACE: [
    { productCode: 'VIP_BANNER', durationDays: 7 },
    { productCode: 'TOP_CATEGORY', durationDays: 14 },
    { productCode: 'FEATURED_BUSINESS', durationDays: 14 },
    { productCode: 'PROMOTED_PROMOTION', durationDays: 14 },
  ],
};

export async function seedMonetizationCatalog(ctx: SeedCtx) {
  const { prisma, uralskCityId } = ctx;

  for (const placement of PLACEMENTS) {
    await prisma.adPlacement.upsert({
      where: { code: placement.code },
      update: {
        name: placement.name,
        description: placement.description,
        maxVisible: placement.maxVisible,
        maxActiveCampaigns: placement.maxActiveCampaigns,
        isActive: placement.isActive,
      },
      create: {
        code: placement.code,
        name: placement.name,
        description: placement.description,
        maxVisible: placement.maxVisible,
        maxActiveCampaigns: placement.maxActiveCampaigns,
        isActive: placement.isActive,
      },
    });
  }

  const productIds = new Map<string, string>();
  for (const product of PRODUCTS) {
    const row = await prisma.monetizationProduct.upsert({
      where: { code: product.code },
      update: {
        name: product.name,
        type: product.type,
        sortOrder: product.sortOrder,
        isActive: true,
      },
      create: {
        code: product.code,
        name: product.name,
        type: product.type,
        sortOrder: product.sortOrder,
        isActive: true,
      },
    });
    productIds.set(product.code, row.id);
  }

  for (const row of URALSK_PRICES) {
    const productId = productIds.get(row.productCode);
    if (!productId) continue;

    const existing = await prisma.productPrice.findFirst({
      where: {
        productId,
        cityId: uralskCityId,
        categoryId: null,
        durationHours: row.durationHours ?? null,
        durationDays: row.durationDays ?? null,
      },
    });

    if (existing) {
      await prisma.productPrice.update({
        where: { id: existing.id },
        data: { price: row.price, currency: 'KZT', isActive: true },
      });
    } else {
      await prisma.productPrice.create({
        data: {
          productId,
          cityId: uralskCityId,
          durationHours: row.durationHours,
          durationDays: row.durationDays,
          price: row.price,
          currency: 'KZT',
          isActive: true,
        },
      });
    }
  }

  for (const pkg of PACKAGES) {
    const packageRow = await prisma.promotionPackage.upsert({
      where: { code: pkg.code },
      update: {
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        durationDays: pkg.durationDays,
        currency: 'KZT',
        isActive: true,
      },
      create: {
        code: pkg.code,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        durationDays: pkg.durationDays,
        currency: 'KZT',
        isActive: true,
      },
    });

    const items = PACKAGE_ITEMS[pkg.code] ?? [];
    for (const item of items) {
      const productId = productIds.get(item.productCode);
      if (!productId) continue;

      const existingItem = await prisma.promotionPackageItem.findFirst({
        where: {
          packageId: packageRow.id,
          productId,
          durationDays: item.durationDays ?? null,
          durationHours: item.durationHours ?? null,
        },
      });

      if (existingItem) {
        await prisma.promotionPackageItem.update({
          where: { id: existingItem.id },
          data: { quantity: 1 },
        });
      } else {
        await prisma.promotionPackageItem.create({
          data: {
            packageId: packageRow.id,
            productId,
            durationDays: item.durationDays,
            durationHours: item.durationHours,
            quantity: 1,
          },
        });
      }
    }
  }
}
