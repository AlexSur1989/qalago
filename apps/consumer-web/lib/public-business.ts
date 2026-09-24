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
  /** Discovery branch context for detail navigation (A.9.3.4). */
  contextLocationId: string | null;
};

export function toPublicBusinessCard(
  raw: BusinessSummaryDto & { averageRating?: number | null; reviewCount?: number },
  categoryLabel: string | null = null,
): PublicBusinessCard {
  const ctx = raw.contextLocationId?.trim();
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
    contextLocationId: ctx && ctx.length > 0 ? ctx : null,
  };
}

/** Temporary F.2 rule — final slug URLs wait for F.4. */
export function temporaryBusinessDetailPath(
  businessId: string,
  locationId?: string | null,
): string {
  const base = `/businesses/${encodeURIComponent(businessId)}`;
  const trimmed = locationId?.trim();
  if (!trimmed) return base;
  return `${base}?locationId=${encodeURIComponent(trimmed)}`;
}

/** Discovery card → temporary detail href (Business-grain, optional branch context). */
export function discoveryBusinessDetailHref(card: PublicBusinessCard): string {
  return temporaryBusinessDetailPath(card.id, card.contextLocationId);
}
