import type { BusinessSummaryDto } from './catalog-api';

/** Fields safe to render on public discovery surfaces (F.2). */
export type PublicBusinessCard = {
  id: string;
  title: string;
  address: string;
  shortDesc: string | null;
  coverImageUrl: string | null;
  categoryLabel: string | null;
  averageRating: number | null;
  reviewCount: number;
};

export function toPublicBusinessCard(
  raw: BusinessSummaryDto & { averageRating?: number | null; reviewCount?: number },
  categoryLabel: string | null = null,
): PublicBusinessCard {
  return {
    id: raw.id,
    title: raw.title,
    address: raw.address,
    shortDesc: raw.shortDesc ?? null,
    coverImageUrl: raw.coverImageUrl ?? null,
    categoryLabel: categoryLabel ?? raw.category?.title ?? null,
    averageRating:
      typeof raw.averageRating === 'number' ? raw.averageRating : null,
    reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 0,
  };
}

/** Temporary F.2 rule — final slug URLs wait for 6.12A / F.4. */
export function temporaryBusinessDetailPath(businessId: string): string {
  return `/businesses/${encodeURIComponent(businessId)}`;
}
