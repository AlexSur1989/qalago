import { PromotionStatus } from '@prisma/client';

export type PromotionDateFields = {
  status: PromotionStatus | string;
  startDate?: Date | null;
  endDate?: Date | null;
};

/** Active status + within optional start/end window. */
export function isPromotionLiveNow(
  promotion: PromotionDateFields,
  now: Date = new Date(),
): boolean {
  if (promotion.status !== PromotionStatus.ACTIVE) return false;
  if (promotion.startDate && promotion.startDate > now) return false;
  if (promotion.endDate && promotion.endDate < now) return false;
  return true;
}

/** First N items in existing deterministic order — no reordering. */
export function sliceToPublicLimit<T>(items: readonly T[], limit: number): T[] {
  if (limit <= 0) return [];
  return items.slice(0, limit);
}

export function comparePromotionPublicOrder<
  T extends { createdAt: Date | string },
>(a: T, b: T): number {
  const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
  const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
  return bTime - aTime;
}

/** Eligible live promotions, sorted newest first, capped by plan limit. */
export function selectPublicPromotions<T extends PromotionDateFields & { createdAt: Date | string }>(
  promotions: readonly T[],
  limit: number,
  now: Date = new Date(),
): T[] {
  const eligible = promotions
    .filter((p) => isPromotionLiveNow(p, now))
    .sort(comparePromotionPublicOrder);
  return sliceToPublicLimit(eligible, limit);
}

export type ServiceMenuShape = {
  groups: Array<{ id: string; items: Array<{ id: string }> }>;
  ungrouped: Array<{ id: string }>;
};

export function applyPublicServiceMenuLimit<
  T extends { id: string; sortOrder?: number | null; title?: string | null },
>(
  menu: {
    groups: Array<{ id: string; items: T[] } & Record<string, unknown>>;
    ungrouped: T[];
  },
  limit: number,
): typeof menu {
  const allItems = [...menu.groups.flatMap((g) => g.items), ...menu.ungrouped].sort(
    (a, b) => {
      const sortDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (sortDiff !== 0) return sortDiff;
      return (a.title ?? '').localeCompare(b.title ?? '', 'ru');
    },
  );
  const publishedIds = new Set(sliceToPublicLimit(allItems, limit).map((i) => i.id));

  return {
    groups: menu.groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => publishedIds.has(item.id)),
      }))
      .filter((group) => group.items.length > 0),
    ungrouped: menu.ungrouped.filter((item) => publishedIds.has(item.id)),
  };
}

export function buildEntitlementSummary(
  totals: { photos: number; serviceItems: number; activePromotions: number },
  limits: { maxPhotos: number; maxServiceItems: number; maxActivePromotions: number },
  published: { photos: number; serviceItems: number; activePromotions: number },
) {
  const photosOver = totals.photos > limits.maxPhotos;
  const serviceItemsOver = totals.serviceItems > limits.maxServiceItems;
  const promotionsOver = totals.activePromotions > limits.maxActivePromotions;

  const overLimitNotice =
    photosOver || serviceItemsOver || promotionsOver
      ? `На текущем тарифе публикуется до ${limits.maxPhotos} фото, ${limits.maxServiceItems} товаров/услуг и ${limits.maxActivePromotions} активных акций. Остальное сохранено и доступно вам в кабинете.`
      : null;

  return {
    photos: {
      total: totals.photos,
      published: published.photos,
      limit: limits.maxPhotos,
      overLimit: photosOver,
    },
    serviceItems: {
      total: totals.serviceItems,
      published: published.serviceItems,
      limit: limits.maxServiceItems,
      overLimit: serviceItemsOver,
    },
    activePromotions: {
      total: totals.activePromotions,
      published: published.activePromotions,
      limit: limits.maxActivePromotions,
      overLimit: promotionsOver,
    },
    overLimitNotice,
  };
}
