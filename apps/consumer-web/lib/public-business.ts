import type { BusinessSummaryDto } from './catalog-api';
import { canonicalBusinessPagePath } from './business-page-paths';

/** Fields safe to render on public discovery surfaces (F.2). */
export type PublicBusinessCard = {
  id: string;
  slug: string;
  title: string;
  address: string;
  shortDesc: string | null;
  coverImageUrl: string | null;
  categoryLabel: string | null;
  averageRating: number | null;
  reviewCount: number;
  /** Discovery branch context for detail navigation (A.9.3.4 / F.4). */
  contextLocationId: string | null;
};

export function toPublicBusinessCard(
  raw: BusinessSummaryDto & { averageRating?: number | null; reviewCount?: number },
  categoryLabel: string | null = null,
): PublicBusinessCard {
  const ctx = raw.contextLocationId?.trim();
  return {
    id: raw.id,
    slug: raw.slug,
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

/** Legacy ID detail path (redirects to F.4 canonical). */
export function temporaryBusinessDetailPath(
  businessId: string,
  locationId?: string | null,
): string {
  const base = `/businesses/${encodeURIComponent(businessId)}`;
  const trimmed = locationId?.trim();
  if (!trimmed) return base;
  return `${base}?locationId=${encodeURIComponent(trimmed)}`;
}

/** Discovery card → canonical F.4 business page (city-scoped). */
export function discoveryBusinessDetailHref(
  citySlug: string,
  card: PublicBusinessCard,
): string {
  return canonicalBusinessPagePath(citySlug, card.slug, card.contextLocationId);
}
