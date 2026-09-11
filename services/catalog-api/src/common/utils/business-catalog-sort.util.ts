export enum BusinessCatalogSort {
  RECOMMENDED = 'recommended',
  NEAREST = 'nearest',
  RATING = 'rating',
  POPULAR = 'popular',
}

export type BusinessSortRow = {
  id: string;
  title: string;
  planTier?: unknown;
  planExpiresAt?: Date | null;
  isFeatured?: boolean;
  featuredSlot?: number | null;
  distanceMeters?: number | null;
  averageRating?: number | null;
  reviewCount?: number;
  organicViews30d?: number;
};

export function compareBusinessBySort(
  a: BusinessSortRow,
  b: BusinessSortRow,
  sort: BusinessCatalogSort,
): number {
  switch (sort) {
    case BusinessCatalogSort.NEAREST: {
      const da = a.distanceMeters ?? Number.MAX_SAFE_INTEGER;
      const db = b.distanceMeters ?? Number.MAX_SAFE_INTEGER;
      if (da !== db) return da - db;
      return tieBreakTitle(a, b);
    }
    case BusinessCatalogSort.RATING: {
      const ra = a.averageRating;
      const rb = b.averageRating;
      const hasA = ra != null && (a.reviewCount ?? 0) > 0;
      const hasB = rb != null && (b.reviewCount ?? 0) > 0;
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;
      if (hasA && hasB && ra !== rb) return rb! - ra!;
      const ca = a.reviewCount ?? 0;
      const cb = b.reviewCount ?? 0;
      if (ca !== cb) return cb - ca;
      return tieBreakTitle(a, b);
    }
    case BusinessCatalogSort.POPULAR: {
      const pa = a.organicViews30d ?? 0;
      const pb = b.organicViews30d ?? 0;
      if (pa !== pb) return pb - pa;
      return tieBreakTitle(a, b);
    }
    case BusinessCatalogSort.RECOMMENDED:
    default:
      return tieBreakTitle(a, b);
  }
}

function tieBreakTitle(a: BusinessSortRow, b: BusinessSortRow): number {
  const byTitle = (a.title ?? '').localeCompare(b.title ?? '', 'ru');
  if (byTitle !== 0) return byTitle;
  return a.id.localeCompare(b.id);
}
